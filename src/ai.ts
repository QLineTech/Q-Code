import Axios, { AxiosError } from 'axios';
import * as vscode from 'vscode';
import { QCodeSettings, getValidSettings, validateSettings } from './settings';
import { ExtensionContext } from 'vscode';
import { CodeChange } from './types';

const API_URLS: { [key: string]: string } = {
    grok3: 'https://api.x.ai/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    ollama: 'http://localhost:11434/api/chat',
    groq: 'https://api.groq.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/complete'
};

const rateLimiter = new Map<string, number>();

export class QCodeAIProvider {
    private _context: ExtensionContext;
    private _settings: QCodeSettings;

    constructor(context: ExtensionContext) {
        this._context = context;

        // Load and type the global state settings
        const rawSettings = this._context.globalState.get('qcode.settings') as Partial<QCodeSettings> & {
            grok3Keys?: string;
            openaiKeys?: string;
            anthropicKeys?: string;
            groqKeys?: string;
            ollamaKeys?: string;
            deepseekKeys?: string;
            temperature?: string;
            volumeSensitivity?: string;
        } | undefined;

        // Initialize with valid defaults
        this._settings = getValidSettings(rawSettings);

        // Migrate legacy API keys to new structure if present
        if (rawSettings?.grok3Keys) this._settings.aiModels.grok3.apiKeys = [rawSettings.grok3Keys];
        if (rawSettings?.openaiKeys) this._settings.aiModels.openai.apiKeys = [rawSettings.openaiKeys];
        if (rawSettings?.anthropicKeys) this._settings.aiModels.anthropic.apiKeys = [rawSettings.anthropicKeys];
        if (rawSettings?.groqKeys) this._settings.aiModels.groq.apiKeys = [rawSettings.groqKeys];
        if (rawSettings?.ollamaKeys) this._settings.aiModels.ollama.apiKeys = [rawSettings.ollamaKeys];
        if (rawSettings?.deepseekKeys) this._settings.aiModels.deepseek.apiKeys = [rawSettings.deepseekKeys];

        // Migrate legacy temperature and volumeSensitivity to grok3
        if (rawSettings?.temperature) {
            const temp = parseFloat(rawSettings.temperature);
            if (!isNaN(temp)) this._settings.aiModels.grok3.temperature = temp;
        }
        if (rawSettings?.volumeSensitivity) {
            const sensitivity = parseFloat(rawSettings.volumeSensitivity);
            if (!isNaN(sensitivity)) this._settings.aiModels.grok3.contextSensitivity = sensitivity;
        }

        console.log('[QCodeAIProvider] Initialized with settings:', this._settings);

        vscode.workspace.onDidChangeConfiguration(async () => {
            await this.refreshSettings();
        });
    }

    public async refreshSettings(): Promise<void> {
        const rawSettings = this._context.globalState.get('qcode.settings') as Partial<QCodeSettings> & {
            grok3Keys?: string;
            openaiKeys?: string;
            anthropicKeys?: string;
            groqKeys?: string;
            ollamaKeys?: string;
            deepseekKeys?: string;
            temperature?: string;
            volumeSensitivity?: string;
        } | undefined;

        const newSettings = getValidSettings(rawSettings);

        // Migrate legacy fields
        if (rawSettings?.grok3Keys) newSettings.aiModels.grok3.apiKeys = [rawSettings.grok3Keys];
        if (rawSettings?.openaiKeys) newSettings.aiModels.openai.apiKeys = [rawSettings.openaiKeys];
        if (rawSettings?.anthropicKeys) newSettings.aiModels.anthropic.apiKeys = [rawSettings.anthropicKeys];
        if (rawSettings?.groqKeys) newSettings.aiModels.groq.apiKeys = [rawSettings.groqKeys];
        if (rawSettings?.ollamaKeys) newSettings.aiModels.ollama.apiKeys = [rawSettings.ollamaKeys];
        if (rawSettings?.deepseekKeys) newSettings.aiModels.deepseek.apiKeys = [rawSettings.deepseekKeys];
        if (rawSettings?.temperature) {
            const temp = parseFloat(rawSettings.temperature);
            if (!isNaN(temp)) newSettings.aiModels.grok3.temperature = temp;
        }
        if (rawSettings?.volumeSensitivity) {
            const sensitivity = parseFloat(rawSettings.volumeSensitivity);
            if (!isNaN(sensitivity)) newSettings.aiModels.grok3.contextSensitivity = sensitivity;
        }

        if (validateSettings(newSettings)) {
            this._settings = newSettings;
            console.log('[QCodeAIProvider] Settings refreshed:', this._settings);
        } else {
            console.warn('[QCodeAIProvider] Invalid settings detected, keeping previous settings');
        }
    }

    public async updateSettings(newSettings: QCodeSettings): Promise<void> {
        if (!validateSettings(newSettings)) {
            throw new Error('Invalid settings configuration');
        }
        
        this._settings = newSettings;
        await this._context.globalState.update('qcode.settings', newSettings);
        console.log('[QCodeAIProvider] Settings updated:', this._settings);
    }

    private getApiKeyForProvider(provider: keyof QCodeSettings['aiModels']): string {
        return this._settings.aiModels[provider]?.apiKeys[0] || '';
    }

    public async queryAI(
        prompt: string,
        provider: keyof QCodeSettings['aiModels'] = 'grok3'
    ): Promise<string> {
        if (!prompt?.trim()) {
            throw new Error('Empty prompt provided');
        }

        console.log(`[queryAI] Accessing config for provider: ${provider}`);
        console.log(`[queryAI] Current settings:`, this._settings);

        if (!(provider in this._settings.aiModels)) {
            const errorMsg = `${provider} not found in qcode configuration. Available providers: ${Object.keys(this._settings.aiModels).join(', ')}`;
            console.error(`[queryAI] ${errorMsg}`);
            vscode.window.showErrorMessage(errorMsg);
            throw new Error(errorMsg);
        }

        const providerConfig = this._settings.aiModels[provider];
        console.log(`[queryAI] Provider config:`, providerConfig);

        if (!providerConfig.active) {
            const errorMsg = `${provider} is not active in qcode configuration.`;
            console.error(`[queryAI] ${errorMsg}`);
            throw new Error(errorMsg);
        }

        const apiKey = this.getApiKeyForProvider(provider);
        if (!apiKey) {
            const errorMsg = `${provider} has no valid API key configured.`;
            console.error(`[queryAI] ${errorMsg}`);
            vscode.window.showErrorMessage(`${errorMsg} Please add an API key via the QCode panel or settings.json`);
            throw new Error(errorMsg);
        }

        const now = Date.now();
        const lastCall = rateLimiter.get(provider) || 0;
        if (now - lastCall < 1000) {
            throw new Error('Rate limit exceeded');
        }
        rateLimiter.set(provider, now);

        try {
            const response = await Axios.post(
                API_URLS[provider],
                {
                    model: providerConfig.models[0] || 'default',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0, // providerConfig.temperature,
                    max_tokens: 4096, // providerConfig.maxTokens
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            await this.validateAIResponse(response);
            console.log(`[queryAI] Response from ${provider}:`, response.data.choices[0].message.content);
            return response.data.choices[0].message.content;
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorDetail = error.response?.data?.error || error.message;
                console.error(`[queryAI] ${provider} API Error:`, errorDetail);
                throw new Error(`${provider} API Error: ${errorDetail}`);
            }
            console.error(`[queryAI] Unexpected error for ${provider}:`, error);
            throw error;
        }
    }

    private async validateAIResponse(response: any): Promise<boolean> {
        if (!response?.data?.choices?.[0]?.message?.content) {
            console.error('[queryAI] Invalid response format:', response?.data);
            throw new Error('Invalid AI response format');
        }
        return true;
    }

    public getCurrentSettings(): QCodeSettings {
        return { ...this._settings };
    }
}

export async function queryAI(
    prompt: string,
    context: ExtensionContext,
    provider: keyof QCodeSettings['aiModels'] = 'grok3'
): Promise<string> {
    const aiProvider = new QCodeAIProvider(context);
    return aiProvider.queryAI(prompt, provider);
}

// Function to clean and parse the response (unchanged)
export const parseAIResponse = (rawResponse: string): CodeChange[] => {
    let cleanedResponse = rawResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleanedResponse);
    } catch (e) {
        throw new Error('Invalid JSON format in AI response');
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Response must be a JSON array');
    }

    const validatedChanges = parsed.map((item: unknown, index: number) => {
        if (typeof item !== 'object' || item === null) {
            throw new Error(`Item at index ${index} is not an object`);
        }

        const obj = item as Record<string, unknown>;

        const requiredFields: (keyof CodeChange)[] = [
            'file', 'line', 'position', 'finish_line', 
            'finish_position', 'action', 'reason', 'newCode'
        ];
        
        for (const field of requiredFields) {
            if (!(field in obj)) {
                throw new Error(`Missing required field "${field}" at index ${index}`);
            }
        }

        if (typeof obj.file !== 'string') {
            throw new Error(`Invalid "file" type at index ${index}: must be string`);
        }
        if (typeof obj.line !== 'number') {
            throw new Error(`Invalid "line" type at index ${index}: must be number`);
        }
        if (typeof obj.position !== 'number') {
            throw new Error(`Invalid "position" type at index ${index}: must be number`);
        }
        if (typeof obj.finish_line !== 'number') {
            throw new Error(`Invalid "finish_line" type at index ${index}: must be number`);
        }
        if (typeof obj.finish_position !== 'number') {
            throw new Error(`Invalid "finish_position" type at index ${index}: must be number`);
        }
        if (!['add', 'replace', 'remove'].includes(obj.action as string)) {
            throw new Error(`Invalid "action" value at index ${index}: must be "add", "replace", or "remove"`);
        }
        if (typeof obj.reason !== 'string') {
            throw new Error(`Invalid "reason" type at index ${index}: must be string`);
        }
        if (typeof obj.newCode !== 'string') {
            throw new Error(`Invalid "newCode" type at index ${index}: must be string`);
        }

        return obj as unknown as CodeChange;
    });

    return validatedChanges;
};