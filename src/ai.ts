import Axios, { AxiosError } from 'axios';
import * as vscode from 'vscode';
import { QCodeSettings, getValidSettings, validateSettings } from './settings';
import { ExtensionContext } from 'vscode';
import { CodeChange, Pricing, RateLimits } from './types';

const API_URLS: { [key: string]: string } = {
    grok3: 'https://api.x.ai/v1/messages',
    openai: 'https://api.openai.com/v1/chat/completions',
    ollama: 'http://localhost:11434/api/chat',
    groq: 'https://api.groq.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    deepseek: 'https://api.deepseek.com/v1/chat/completions'
};

function getRateLimits(provider: string, model: string): RateLimits | null {
    switch (provider) {
        case 'anthropic':
            switch (model) {
                case 'claude-3-5-sonnet-20241022':
                case 'claude-3-5-sonnet-20240620':
                    return { requestsPerMinute: 50, inputTokensPerMinute: 40000, outputTokensPerMinute: 8000 };
                case 'claude-3-5-haiku':
                    return { requestsPerMinute: 50, inputTokensPerMinute: 50000, outputTokensPerMinute: 10000 };
                case 'claude-3-opus':
                    return { requestsPerMinute: 50, inputTokensPerMinute: 20000, outputTokensPerMinute: 4000 };
                default:
                    return null;
            }
        case 'openai':
            // OpenAI limits vary by tier; assuming Tier 1 free tier for gpt-3.5-turbo
            return model === 'gpt-3.5-turbo' 
                ? { requestsPerMinute: 60, inputTokensPerMinute: 40000, outputTokensPerMinute: 40000 } 
                : null;
        case 'groq':
            // Groq limits from docs (approximate for mixtral-8x7b-32768)
            return model === 'mixtral-8x7b-32768' 
                ? { requestsPerMinute: 30, inputTokensPerMinute: 14400, outputTokensPerMinute: 14400 } 
                : null;
        case 'deepseek':
            // DeepSeek limits not public; assuming moderate defaults
            return model === 'deepseek-coder' 
                ? { requestsPerMinute: 60, inputTokensPerMinute: 50000, outputTokensPerMinute: 50000 } 
                : null;
        case 'ollama':
            // Local, no strict limits; set high defaults
            return model === 'nemotron-mini:latest' 
                ? { requestsPerMinute: 1000, inputTokensPerMinute: 1000000, outputTokensPerMinute: 1000000 } 
                : null;
        case 'grok3':
            // xAI limits not fully public; based on context and pricing
            switch (model) {
                case 'grok-2-1212':
                case 'grok-2':
                case 'grok-2-latest':
                    return { requestsPerMinute: 60, inputTokensPerMinute: 60000, outputTokensPerMinute: 60000 };
                case 'grok-beta':
                    return { requestsPerMinute: 60, inputTokensPerMinute: 60000, outputTokensPerMinute: 60000 };
                default:
                    return null;
            }
        default:
            return null;
    }
}

function getPricing(provider: string, model: string): Pricing | null {
    switch (provider) {
        case 'anthropic':
            switch (model) {
                case 'claude-3-5-sonnet-20241022':
                case 'claude-3-5-sonnet-20240620':
                case 'claude-3-5-sonnet-latest':
                    return { inputCostPerMillion: 3, outputCostPerMillion: 15 };
                case 'claude-3-5-haiku':
                    return { inputCostPerMillion: 0.80, outputCostPerMillion: 4 };
                case 'claude-3-opus':
                    return { inputCostPerMillion: 15, outputCostPerMillion: 75 };
                default:
                    return null;
            }
        case 'openai':
            return model === 'gpt-3.5-turbo' 
                ? { inputCostPerMillion: 0.50, outputCostPerMillion: 1.50 } // OpenAI pricing
                : null;
        case 'groq':
            return model === 'mixtral-8x7b-32768' 
                ? { inputCostPerMillion: 0.10, outputCostPerMillion: 0.10 } // Groq pricing (approx)
                : null;
        case 'deepseek':
            return model === 'deepseek-coder' 
                ? { inputCostPerMillion: 0.14, outputCostPerMillion: 0.14 } // DeepSeek pricing (approx)
                : null;
        case 'ollama':
            return model === 'nemotron-mini:latest' 
                ? { inputCostPerMillion: 0, outputCostPerMillion: 0 } // Local, no cost
                : null;
        case 'grok3':
            switch (model) {
                case 'grok-2-1212':
                case 'grok-2':
                case 'grok-2-latest':
                    return { inputCostPerMillion: 2, outputCostPerMillion: 10 };
                case 'grok-beta':
                    return { inputCostPerMillion: 5, outputCostPerMillion: 15 };
                default:
                    return null;
            }
        default:
            return null;
    }
}

class RateLimiter {
    private usage: { timestamp: number; inputTokens: number; outputTokens: number }[] = [];
    private readonly windowSize = 60000; // 60 seconds in milliseconds

    constructor(private provider: string, private model: string) {}

    private getLimits(): RateLimits | null {
        return getRateLimits(this.provider, this.model);
    }

    public canMakeRequest(estimatedInputTokens: number, maxOutputTokens: number): boolean {
        const limits = this.getLimits();
        if (!limits) {return true;}

        const now = Date.now();
        this.usage = this.usage.filter(entry => now - entry.timestamp < this.windowSize);

        const recentRequests = this.usage.length;
        const recentInputTokens = this.usage.reduce((sum, entry) => sum + entry.inputTokens, 0);
        const recentOutputTokens = this.usage.reduce((sum, entry) => sum + entry.outputTokens, 0);

        return (
            recentRequests + 1 <= limits.requestsPerMinute &&
            recentInputTokens + estimatedInputTokens <= limits.inputTokensPerMinute &&
            recentOutputTokens + maxOutputTokens <= limits.outputTokensPerMinute
        );
    }

    public getWaitTime(estimatedInputTokens: number, maxOutputTokens: number): number {
        const limits = this.getLimits();
        if (!limits) {return 0;}

        const now = Date.now();
        this.usage = this.usage.filter(entry => now - entry.timestamp < this.windowSize);

        const recentRequests = this.usage.length;
        const recentInputTokens = this.usage.reduce((sum, entry) => sum + entry.inputTokens, 0);
        const recentOutputTokens = this.usage.reduce((sum, entry) => sum + entry.outputTokens, 0);

        const exceedsLimits = (
            recentRequests + 1 > limits.requestsPerMinute ||
            recentInputTokens + estimatedInputTokens > limits.inputTokensPerMinute ||
            recentOutputTokens + maxOutputTokens > limits.outputTokensPerMinute
        );

        if (exceedsLimits) {
            if (this.usage.length === 0) {
                // If usage is empty and the request exceeds limits, wait the full window
                return this.windowSize;
            }
            const oldestTimestamp = this.usage[0].timestamp;
            const timeUntilDrop = this.windowSize - (now - oldestTimestamp);
            return timeUntilDrop > 0 ? timeUntilDrop : 100;
        }
        return 0;
    }

    public addUsage(inputTokens: number, outputTokens: number): void {
        const now = Date.now();
        this.usage.push({ timestamp: now, inputTokens, outputTokens });
        this.usage = this.usage.filter(entry => now - entry.timestamp < this.windowSize);
    }
}

export class QCodeAIProvider {
    private _context: ExtensionContext;
    private _settings: QCodeSettings;
    private rateLimiters = new Map<string, RateLimiter>();
    
    constructor(context: ExtensionContext) {
        this._context = context;
        this._settings = getValidSettings(context.globalState.get('qcode.settings'));

        console.log('[QCodeAIProvider] Initialized with settings:', this._settings);

        vscode.workspace.onDidChangeConfiguration(async () => {
            await this.refreshSettings();
        });
    }

    public async refreshSettings(): Promise<void> {
        this._settings = getValidSettings(this._context.globalState.get('qcode.settings'));
    }

    private getApiKeyForProvider(provider: keyof QCodeSettings['aiModels']): string {
        return this._settings.aiModels[provider]?.apiKeys[0] || '';
    }

    public async queryAI(
        prompt: string,
        provider: keyof QCodeSettings['aiModels'] = 'grok3'
    ): Promise<{ text: string; raw: any; cost: { sum: number; inputCost: number; outputCost: number } }> {
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

    
        try {
            let response;
            const model = providerConfig.models[0] || this.getDefaultModel(provider);
            const temperature = providerConfig.temperature || 0;
            const maxTokens = providerConfig.maxTokens || 4096;

            const key = `${provider}-${model}`;
            let rateLimiter = this.rateLimiters.get(key);
            if (!rateLimiter) {
                rateLimiter = new RateLimiter(provider, model);
                this.rateLimiters.set(key, rateLimiter);
            }

            const systemContent = providerConfig.contextSensitivity > 50 ? prompt.slice(0, 100) : '';
            const totalInputText = systemContent + prompt;
            const estimatedInputTokens = Math.ceil(totalInputText.length / 4);

            while (!rateLimiter.canMakeRequest(estimatedInputTokens, maxTokens)) {
                const waitTime = rateLimiter.getWaitTime(estimatedInputTokens, maxTokens);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }            
            
            // Handle provider-specific request formats
            switch (provider) {
                case 'anthropic': {
                    const systemContent = providerConfig.contextSensitivity > 50 ? prompt.slice(0, 100) : null;
                    const payload: any = {
                        model,
                        max_tokens: maxTokens,
                        temperature,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: prompt
                                    }
                                ]
                            }
                        ]
                    };

                    // Only include system if we have non-empty content
                    if (systemContent) {
                        payload.system = [
                            {
                                type: 'text',
                                text: systemContent
                            }
                        ];
                    }

                                
                    response = await Axios.post(
                        API_URLS[provider],
                        payload,
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json',
                                'x-api-key': apiKey,
                                'anthropic-version': '2023-06-01'
                            },
                            timeout: 60000
                        }
                    );

                    const inputTokens = response.data.usage.input_tokens || estimatedInputTokens;
                    const outputTokens = response.data.usage.output_tokens || Math.ceil(response.data.content[0].text.length / 4);
                    rateLimiter.addUsage(inputTokens, outputTokens);
                    const pricing = getPricing(provider, model);
                    const cost = pricing ? {
                        inputCost: (inputTokens / 1e6) * pricing.inputCostPerMillion,
                        outputCost: (outputTokens / 1e6) * pricing.outputCostPerMillion,
                        sum: 0
                    } : { sum: 0, inputCost: 0, outputCost: 0 };
                    cost.sum = cost.inputCost + cost.outputCost;
                    return { text: response.data.content[0].text, raw: response.data, cost };
                }
                case 'groq': {
                    response = await Axios.post(
                        API_URLS[provider],
                        {
                            model,
                            messages: [
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            temperature,
                            max_tokens: maxTokens
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 60000
                        }
                    );
                    const inputTokens = response.data.usage?.prompt_tokens || estimatedInputTokens;
                    const outputTokens = response.data.usage?.completion_tokens || Math.ceil(response.data.content[0].text.length / 4);
                    rateLimiter.addUsage(inputTokens, outputTokens);
                    const pricing = getPricing(provider, model);
                    const cost = pricing ? {
                        inputCost: (inputTokens / 1e6) * pricing.inputCostPerMillion,
                        outputCost: (outputTokens / 1e6) * pricing.outputCostPerMillion,
                        sum: 0
                    } : { sum: 0, inputCost: 0, outputCost: 0 };
                    cost.sum = cost.inputCost + cost.outputCost;
                    return { text: response.data.choices[0].message.content, raw: response.data, cost }; // Adjusted response structure
                }

                case 'ollama': {
                    response = await Axios.post(
                        API_URLS[provider],
                        {
                            model,
                            messages: [
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            options: {
                                temperature,
                                num_predict: maxTokens
                            },
                            stream: false
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            timeout: 60000
                        }
                    );
                    const inputTokens = response.data.eval_count ? Math.ceil(response.data.prompt_eval_count / 4) : estimatedInputTokens; // Ollama-specific
                    const outputTokens = response.data.eval_count || Math.ceil(response.data.message.content.length / 4);
                    rateLimiter.addUsage(inputTokens, outputTokens);
                    const pricing = getPricing(provider, model);
                    const cost = pricing ? {
                        inputCost: (inputTokens / 1e6) * pricing.inputCostPerMillion,
                        outputCost: (outputTokens / 1e6) * pricing.outputCostPerMillion,
                        sum: 0
                    } : { sum: 0, inputCost: 0, outputCost: 0 };
                    cost.sum = cost.inputCost + cost.outputCost;
                    return { text: response.data.message.content, raw: response.data, cost };
                }

                case 'deepseek':
                case 'openai': {
                    response = await Axios.post(
                        API_URLS[provider],
                        {
                            model,
                            messages: [
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            temperature,
                            max_tokens: maxTokens
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 60000
                        }
                    );
                    const inputTokens = response.data.usage?.prompt_tokens || estimatedInputTokens;
                    const outputTokens = response.data.usage?.completion_tokens || Math.ceil(response.data.choices[0].message.content.length / 4);
                    rateLimiter.addUsage(inputTokens, outputTokens);
                    const pricing = getPricing(provider, model);
                    const cost = pricing ? {
                        inputCost: (inputTokens / 1e6) * pricing.inputCostPerMillion,
                        outputCost: (outputTokens / 1e6) * pricing.outputCostPerMillion,
                        sum: 0
                    } : { sum: 0, inputCost: 0, outputCost: 0 };
                    cost.sum = cost.inputCost + cost.outputCost;
                    return { text: response.data.choices[0].message.content, raw: response.data, cost };
                }
                case 'grok3': {
                    const systemContent = providerConfig.contextSensitivity > 50 ? prompt.slice(0, 100) : null;
                    const payload: any = {
                        model,
                        max_tokens: maxTokens,
                        temperature,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'text',
                                        text: prompt
                                    }
                                ]
                            }
                        ]
                    };

                    // Only include system if we have non-empty content
                    if (systemContent) {
                        payload.system = [
                            {
                                type: 'text',
                                text: systemContent
                            }
                        ];
                    }

                    response = await Axios.post(
                        API_URLS[provider],
                        payload,
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json',
                                // 'x-api-key': apiKey,
                                // 'anthropic-version': '2023-06-01'
                            },
                            timeout: 60000
                        }
                    );
                    const inputTokens = response.data.usage?.input_tokens || estimatedInputTokens; // Assuming Grok3 provides usage
                    const outputTokens = response.data.usage?.output_tokens || Math.ceil(response.data.content[0].text.length / 4);
                    rateLimiter.addUsage(inputTokens, outputTokens);
                    const pricing = getPricing(provider, model);
                    const cost = pricing ? {
                        inputCost: (inputTokens / 1e6) * pricing.inputCostPerMillion,
                        outputCost: (outputTokens / 1e6) * pricing.outputCostPerMillion,
                        sum: 0
                    } : { sum: 0, inputCost: 0, outputCost: 0 };
                    cost.sum = cost.inputCost + cost.outputCost;
                    return { text: response.data.content[0].text, raw: response.data, cost };
                }

                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 429) {
                console.warn(`[queryAI] Rate limit exceeded for ${provider}, retrying after 1s`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.queryAI(prompt, provider); // Retry once
            }
            const errorDetail = error instanceof AxiosError ? (error.response?.data?.error || error.message) : String(error);
            console.error(`[queryAI] ${provider} API Error:`, errorDetail);
            throw new Error(`${provider} API Error: ${JSON.stringify(errorDetail)}`);
        }
    }

    private getDefaultModel(provider: keyof QCodeSettings['aiModels']): string {
        switch (provider) {
            case 'anthropic': return 'claude-3-5-sonnet-latest';
            case 'groq': return 'mixtral-8x7b-32768';
            case 'ollama': return 'nemotron-mini:latest';
            case 'deepseek': return 'deepseek-coder';
            case 'openai': return 'gpt-3.5-turbo';
            case 'grok3': return 'default';
            default: return 'default';
        }
    }

    public getCurrentSettings(): QCodeSettings {
        return { ...this._settings };
    }
}

export async function queryAI(
    prompt: string,
    context: ExtensionContext,
    provider: keyof QCodeSettings['aiModels'] = 'grok3'
): Promise<{ text: string; raw: any; cost: { sum: number; inputCost: number; outputCost: number } }> {
    const aiProvider = new QCodeAIProvider(context);
    return aiProvider.queryAI(prompt, provider);
}

// Parse and validate the AI's JSON response into an array of CodeChange objects
export function parseAIResponse(response: string): CodeChange[] {
    // Step 1: Parse the JSON response
    let cleanedResponse = response.trim();
    // Remove Markdown code block markers (```json, ```typescript, ```, etc.)
    cleanedResponse = cleanedResponse.replace(/```(?:json|typescript)?\s*\n?/g, '').replace(/```\s*$/, '');

    // Remove any trailing or leading non-JSON content (basic heuristic)
    const jsonStart = cleanedResponse.indexOf('[');
    const jsonEnd = cleanedResponse.lastIndexOf(']') + 1;
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.slice(jsonStart, jsonEnd);
    } else {
        throw new Error('No valid JSON array found in the response');
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(cleanedResponse);
    } catch (error) {
        throw new Error(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 2: Ensure the response is an array
    if (!Array.isArray(parsed)) {
        throw new Error('AI response must be a JSON array');
    }

    // Step 3: Validate and coerce each change object
    return parsed.map((change: unknown, index: number) => {
        // Ensure the change is an object
        if (typeof change !== 'object' || change === null) {
            throw new Error(`Item at index ${index} must be a JSON object`);
        }

        const obj = change as Record<string, unknown>;

        // Helper function to coerce a value to number | null
        const coerceToNumberOrNull = (value: unknown, field: string): number | null => {
            if (value === null || value === undefined) return null;
            if (typeof value === 'number' && !isNaN(value)) return value;
            if (typeof value === 'string') {
                const num = Number(value);
                if (!isNaN(num)) return num;
            }
            throw new Error(`Invalid "${field}" type at index ${index}: must be a number or null, got ${typeof value}`);
        };

        // Helper function to coerce a value to string
        const coerceToString = (value: unknown, field: string): string => {
            if (typeof value === 'string') return value;
            if (value === null || value === undefined) {
                throw new Error(`"${field}" at index ${index} must be a string, got null/undefined`);
            }
            return String(value); // Fallback coercion
        };

        // Helper function to coerce a value to string | null
        const coerceToStringOrNull = (value: unknown, field: string): string | null => {
            if (value === null || value === undefined) return null;
            if (typeof value === 'string') return value;
            return String(value); // Fallback coercion
        };

        // Extract and validate fields
        const action = coerceToString(obj.action, 'action') as CodeChange['action'];
        if (!['add', 'replace', 'remove', 'create', 'remove_file'].includes(action)) {
            throw new Error(`Invalid "action" at index ${index}: must be one of "add", "replace", "remove", "create", "remove_file", got "${action}"`);
        }

        const file = coerceToString(obj.file, 'file');
        const relativePath = coerceToStringOrNull(obj.relativePath, 'relativePath');
        const line = coerceToNumberOrNull(obj.line, 'line');
        const position = coerceToNumberOrNull(obj.position, 'position');
        const finish_line = coerceToNumberOrNull(obj.finish_line, 'finish_line');
        const finish_position = coerceToNumberOrNull(obj.finish_position, 'finish_position');
        const reason = coerceToString(obj.reason, 'reason');
        const newCode = coerceToStringOrNull(obj.newCode, 'newCode');

        // Step 4: Validate fields based on action
        switch (action) {
            case 'add':
                if (line === null || position === null) {
                    throw new Error(`"add" at index ${index} requires "line" and "position" to be numbers`);
                }
                if (finish_line !== null || finish_position !== null) {
                    throw new Error(`"add" at index ${index} requires "finish_line" and "finish_position" to be null`);
                }
                if (newCode === null) {
                    throw new Error(`"add" at index ${index} requires "newCode" to be a string`);
                }
                break;

            case 'replace':
                if (line === null || position === null || finish_line === null || finish_position === null) {
                    throw new Error(`"replace" at index ${index} requires "line", "position", "finish_line", and "finish_position" to be numbers`);
                }
                if (newCode === null) {
                    throw new Error(`"replace" at index ${index} requires "newCode" to be a string`);
                }
                break;

            case 'remove':
                if (line === null || position === null || finish_line === null || finish_position === null) {
                    throw new Error(`"remove" at index ${index} requires "line", "position", "finish_line", and "finish_position" to be numbers`);
                }
                if (newCode !== null) {
                    throw new Error(`"remove" at index ${index} requires "newCode" to be null`);
                }
                break;

            case 'create':
                if (relativePath === null) {
                    throw new Error(`"create" at index ${index} requires "relativePath" to be a string`);
                }
                if (line !== null || position !== null || finish_line !== null || finish_position !== null) {
                    throw new Error(`"create" at index ${index} requires "line", "position", "finish_line", and "finish_position" to be null`);
                }
                if (newCode === null) {
                    throw new Error(`"create" at index ${index} requires "newCode" to be a string`);
                }
                break;

            case 'remove_file':
                if (relativePath === null) {
                    throw new Error(`"remove_file" at index ${index} requires "relativePath" to be a string`);
                }
                if (line !== null || position !== null || finish_line !== null || finish_position !== null) {
                    throw new Error(`"remove_file" at index ${index} requires "line", "position", "finish_line", and "finish_position" to be null`);
                }
                if (newCode !== null) {
                    throw new Error(`"remove_file" at index ${index} requires "newCode" to be null`);
                }
                break;

            default:
                throw new Error(`Unexpected action at index ${index}: ${action}`); // Type narrowing should prevent this
        }

        // Step 5: Construct the validated CodeChange object
        return {
            file,
            relativePath,
            line,
            position,
            finish_line,
            finish_position,
            action,
            reason,
            newCode,
        } as CodeChange;
    });
}