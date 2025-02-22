import Axios, { AxiosError } from 'axios';
import * as vscode from 'vscode';
import { QCodeSettings, getValidSettings, validateSettings } from './settings';
import { ExtensionContext } from 'vscode';

const API_URLS: { [key: string]: string } = {
    grok3AI: 'https://api.x.ai/v1/chat/completions',
    openAI: 'https://api.openai.com/v1/chat/completions',
    ollamaAI: 'http://localhost:11434/api/chat',
    groqAI: 'https://api.groq.com/v1/chat/completions',
    anthropicAI: 'https://api.anthropic.com/v1/complete'
};

interface AIResponse {
    choices: Array<{ message: { content: string } }>;
}

const rateLimiter = new Map<string, number>();

export class QCodeAIProvider {
    private _context: ExtensionContext;
    private _settings: QCodeSettings & {
        grok3Keys: string;
        openaiKeys: string;
        anthropicKeys: string;
        groqKeys: string;
        ollamaKeys: string;
        deepseekKeys: string;
        temperature: string;
        volumeSensitivity: string;
    };

    constructor(context: ExtensionContext) {
        this._context = context;
        
        // Load and type the global state settings
        const rawSettings = this._context.globalState.get('qcode.settings') as Partial<QCodeSettings & {
            grok3Keys: string;
            openaiKeys: string;
            anthropicKeys: string;
            groqKeys: string;
            ollamaKeys: string;
            deepseekKeys: string;
            temperature: string;
            volumeSensitivity: string;
        }> | undefined;

        // Apply the full settings structure
        this._settings = {
            ...getValidSettings(rawSettings),
            grok3Keys: rawSettings?.grok3Keys || '',
            openaiKeys: rawSettings?.openaiKeys || '',
            anthropicKeys: rawSettings?.anthropicKeys || '',
            groqKeys: rawSettings?.groqKeys || '',
            ollamaKeys: rawSettings?.ollamaKeys || '',
            deepseekKeys: rawSettings?.deepseekKeys || '',
            temperature: rawSettings?.temperature || '0.7',
            volumeSensitivity: rawSettings?.volumeSensitivity || '50'
        };

        console.log('[QCodeAIProvider] Initialized with settings:', this._settings);

        // Listen for settings updates
        vscode.workspace.onDidChangeConfiguration(async () => {
            await this.refreshSettings();
        });
    }

    private async refreshSettings(): Promise<void> {
        const rawSettingsUnknown = this._context.globalState.get('qcode.settings');
        const rawSettings = typeof rawSettingsUnknown === 'object' && rawSettingsUnknown !== null 
            ? rawSettingsUnknown as Partial<QCodeSettings & {
                grok3Keys: string;
                openaiKeys: string;
                anthropicKeys: string;
                groqKeys: string;
                ollamaKeys: string;
                deepseekKeys: string;
                temperature: string;
                volumeSensitivity: string;
            }>
            : undefined;

        const newSettings = {
            ...getValidSettings(rawSettings),
            grok3Keys: rawSettings?.grok3Keys || '',
            openaiKeys: rawSettings?.openaiKeys || '',
            anthropicKeys: rawSettings?.anthropicKeys || '',
            groqKeys: rawSettings?.groqKeys || '',
            ollamaKeys: rawSettings?.ollamaKeys || '',
            deepseekKeys: rawSettings?.deepseekKeys || '',
            temperature: rawSettings?.temperature || '0.7',
            volumeSensitivity: rawSettings?.volumeSensitivity || '50'
        };

        if (validateSettings(newSettings)) {
            this._settings = newSettings;
            console.log('[QCodeAIProvider] Settings refreshed:', this._settings);
        } else {
            console.warn('[QCodeAIProvider] Invalid settings detected, keeping previous settings');
        }
    }

    public async updateSettings(newSettings: typeof this._settings): Promise<void> {
        if (!validateSettings(newSettings)) {
            throw new Error('Invalid settings configuration');
        }
        
        this._settings = newSettings;
        await this._context.globalState.update('qcode.settings', newSettings);
        console.log('[QCodeAIProvider] Settings updated:', this._settings);
    }

    private getApiKeyForProvider(provider: keyof QCodeSettings): string {
        switch (provider) {
            case 'grok3AI':
                return this._settings.grok3Keys;
            case 'openAI':
                return this._settings.openaiKeys;
            case 'ollamaAI':
                return this._settings.ollamaKeys;
            case 'groqAI':
                return this._settings.groqKeys;
            case 'anthropicAI':
                return this._settings.anthropicKeys;
            default:
                return '';
        }
    }

    public async queryAI(
        prompt: string,
        provider: keyof QCodeSettings = 'grok3AI'
    ): Promise<string> {
        if (!prompt?.trim()) {
            throw new Error('Empty prompt provided');
        }

        console.log(`[queryAI] Accessing config for provider: ${provider}`);
        console.log(`[queryAI] Current settings:`, this._settings);

        if (!(provider in this._settings)) {
            const errorMsg = `${provider} not found in qcode configuration. Available providers: ${Object.keys(this._settings).join(', ')}`;
            console.error(`[queryAI] ${errorMsg}`);
            vscode.window.showErrorMessage(errorMsg);
            throw new Error(errorMsg);
        }

        const providerConfig = this._settings[provider] as { active: boolean; apiKeys: string[] };

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
                    model: provider === 'grok3AI' ? 'grok-2-1212' : 'default',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: parseFloat(this._settings.temperature) || 0.7,
                    max_tokens: 1000
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

    public getCurrentSettings(): typeof this._settings {
        return { ...this._settings };
    }
}

export async function queryAI(
    prompt: string,
    context: ExtensionContext,
    provider: keyof QCodeSettings = 'grok3AI'
): Promise<string> {
    const aiProvider = new QCodeAIProvider(context);
    return aiProvider.queryAI(prompt, provider);
}