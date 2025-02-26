import { QCodeAIProvider } from './ai'; // Adjust path based on your project structure
import { ExtensionContext } from 'vscode';
import Axios from 'axios';
import { QCodeSettings } from '../types/types'; // Adjust path as needed

// Define the Message type for conversation history
type Message = {
    role: 'user' | 'assistant' | 'function';
    content: string | Array<{
        type: string;
        text?: string;
        name?: string;
        arguments?: any;
        input?: any; // For Anthropic tool_use
        id?: string; // For Anthropic tool_use id
    }>;
    name?: string; // For function calls/results
    function_call?: { name: string; arguments: any }; // For OpenAI/Groq compatibility
    tool_call_id?: string; // For Anthropic tool result
};

// Define the Tool type for function implementations
type Tool = {
    name: string;
    description: string;
    parameters: Record<string, { type: string; description: string; required?: boolean }>;
    execute: (args: any) => string | Promise<string>;
};

// API URLs replicated from ai.ts
const API_URLS: { [key: string]: string } = {
    grok3: 'https://api.x.ai/v1/messages',
    openai: 'https://api.openai.com/v1/chat/completions',
    ollama: 'http://localhost:11434/api/chat',
    groq: 'https://api.groq.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
};

export class ToolUse {
    private aiProvider: QCodeAIProvider;
    private conversationHistory: Message[] = [];
    private tools: Map<string, Tool>;
    private settings: QCodeSettings;
    private defaultTools(): Tool[] {
        return [];
    }
    constructor(context: ExtensionContext) {
        this.aiProvider = new QCodeAIProvider(context);
        this.settings = this.aiProvider.getCurrentSettings();
        this.tools = new Map<string, Tool>([
            [
                'get_current_time',
                {
                    name: 'get_current_time',
                    description: 'Get the current time, optionally in a specific timezone.',
                    parameters: {
                        time_zone: { type: 'string', description: 'Timezone (e.g., America/New_York)', required: false },
                    },
                    execute: (args) => {
                        const date = new Date();
                        return args.time_zone
                            ? date.toLocaleString('en-US', { timeZone: args.time_zone })
                            : date.toISOString();
                    },
                },
            ],
            [
                'add_numbers',
                {
                    name: 'add_numbers',
                    description: 'Add two numbers together.',
                    parameters: {
                        a: { type: 'number', description: 'First number', required: true },
                        b: { type: 'number', description: 'Second number', required: true },
                    },
                    execute: (args) => (args.a + args.b).toString(),
                },
            ],
        ]);
    }

    public async queryWithTools(
        prompt: string,
        provider: keyof QCodeSettings['aiModels'] = 'grok3'
    ): Promise<{ result: string; raw: any; cost: { sum: number; inputCost: number; outputCost: number } }> {
        this.conversationHistory = [{ role: 'user', content: prompt }];

        while (true) {
            const response = await this.makeApiCall(provider);
            const assistantMessage = this.parseResponse(response.raw, provider);

            this.conversationHistory.push(assistantMessage);

            const toolCall = this.detectToolCall(assistantMessage, provider);
            if (!toolCall) {
                return {
                    result: this.extractText(assistantMessage.content),
                    raw: response.raw,
                    cost: response.cost,
                };
            }

            const toolResult = await this.executeTool(toolCall, provider);
            this.conversationHistory.push(toolResult);
        }
    }

    private async makeApiCall(provider: keyof QCodeSettings['aiModels']) {
        const providerConfig = this.settings.aiModels[provider];
        // Use non-null assertion or provide a default since we validate elsewhere
        const apiKey = this.aiProvider['getApiKeyForProvider'](provider) as string; 
        const model = providerConfig.models[0] || this.aiProvider['getDefaultModel'](provider);
        const maxTokens = providerConfig.maxTokens || 4096;
        const temperature = providerConfig.temperature || 0;

        const payload = this.constructPayload(provider, model, maxTokens, temperature);
        const headers = this.getHeaders(provider, apiKey);

        try {
            const response = await Axios.post(API_URLS[provider], payload, { headers, timeout: 60000 });
            const inputTokens = response.data.usage?.input_tokens || response.data.usage?.prompt_tokens || Math.ceil(JSON.stringify(payload).length / 4);
            const outputTokens = response.data.usage?.output_tokens || response.data.usage?.completion_tokens || Math.ceil(JSON.stringify(response.data).length / 4);
            const pricing = this.getPricing(provider, model);
            const cost = pricing ? {
                inputCost: (inputTokens / 1e6) * pricing.inputCostPerMillion,
                outputCost: (outputTokens / 1e6) * pricing.outputCostPerMillion,
                sum: 0,
            } : { sum: 0, inputCost: 0, outputCost: 0 };
            cost.sum = cost.inputCost + cost.outputCost;

            return { text: '', raw: response.data, cost };
        } catch (error) {
            throw new Error(`${provider} API Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private constructPayload(provider: string, model: string, maxTokens: number, temperature: number) {
        const toolsArray = Array.from(this.tools.values()).map(t => ({
            name: t.name,
            description: t.description,
            input_schema: { type: 'object', properties: t.parameters },
        }));

        switch (provider) {
            case 'anthropic':
                return {
                    model,
                    max_tokens: maxTokens,
                    temperature,
                    messages: this.conversationHistory,
                    tools: toolsArray,
                };
            case 'grok3':
                return {
                    model,
                    max_tokens: maxTokens,
                    temperature,
                    messages: this.conversationHistory,
                    tools: toolsArray,
                };
            case 'openai':
            case 'groq':
                return {
                    model,
                    messages: this.conversationHistory,
                    temperature,
                    max_tokens: maxTokens,
                    tools: toolsArray.map(t => ({ type: 'function', function: t })),
                };
            case 'ollama':
                return {
                    model,
                    messages: this.conversationHistory,
                    options: { temperature, num_predict: maxTokens },
                    tools: toolsArray.map(t => ({ type: 'function', function: t })),
                };
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    private getHeaders(provider: string, apiKey: string) {
        const baseHeaders = { 'Content-Type': 'application/json' };
        switch (provider) {
            case 'anthropic':
                return {
                    ...baseHeaders,
                    'Authorization': `Bearer ${apiKey}`,
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                };
            case 'grok3':
            case 'openai':
            case 'groq':
                return { ...baseHeaders, 'Authorization': `Bearer ${apiKey}` };
            case 'ollama':
                return baseHeaders;
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    private parseResponse(raw: any, provider: string): Message {
        switch (provider) {
            case 'anthropic':
                return { role: 'assistant', content: raw.content };
            case 'grok3':
                return { role: 'assistant', content: raw.content };
            case 'openai':
            case 'groq':
                return {
                    role: 'assistant',
                    content: raw.choices[0].message.content || '',
                    function_call: raw.choices[0].message.function_call,
                };
            case 'ollama':
                return { role: 'assistant', content: raw.message.content };
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    private detectToolCall(message: Message, provider: string): { name: string; args: any; id?: string } | null {
        switch (provider) {
            case 'anthropic':
                if (Array.isArray(message.content)) {
                    const toolUse = message.content.find(c => c.type === 'tool_use');
                    if (toolUse && toolUse.name) {
                        return { name: toolUse.name, args: toolUse.input || {}, id: toolUse.id };
                    }
                }
                return null;
            case 'grok3':
                if (Array.isArray(message.content)) {
                    const toolCall = message.content.find(c => c.type === 'function_call');
                    if (toolCall && toolCall.name) {
                        return { name: toolCall.name, args: JSON.parse(toolCall.arguments || '{}') };
                    }
                }
                return null;
            case 'openai':
            case 'groq':
                if (message.function_call?.name) {
                    return {
                        name: message.function_call.name,
                        args: JSON.parse(message.function_call.arguments || '{}'),
                    };
                }
                return null;
            case 'ollama':
                if (typeof message.content === 'string' && message.content.includes('function_call')) {
                    const match = message.content.match(/function_call: (\w+)\(([^)]*)\)/);
                    if (match) {
                        return { name: match[1], args: match[2] ? JSON.parse(`{${match[2]}}`) : {} };
                    }
                }
                return null;
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    private async executeTool(toolCall: { name: string; args: any; id?: string }, provider: string): Promise<Message> {
        const tool = this.tools.get(toolCall.name);
        if (!tool) {
            throw new Error(`Tool ${toolCall.name} not found`);
        }

        try {
            const result = await tool.execute(toolCall.args);
            switch (provider) {
                case 'anthropic':
                    return {
                        role: 'function',
                        content: [{ type: 'tool_result', text: result }],
                        name: toolCall.name,
                        tool_call_id: toolCall.id,
                    };
                case 'grok3':
                case 'openai':
                case 'groq':
                case 'ollama':
                    return {
                        role: 'function',
                        content: result,
                        name: toolCall.name,
                    };
                default:
                    throw new Error(`Unsupported provider for tool result`);
            }
        } catch (error) {
            return {
                role: 'function',
                content: `Error executing ${toolCall.name}: ${error instanceof Error ? error.message : String(error)}`,
                name: toolCall.name,
                ...(toolCall.id ? { tool_call_id: toolCall.id } : {}),
            };
        }
    }

    private extractText(content: Message['content']): string {
        if (typeof content === 'string') {
            return content;
        }
        if (Array.isArray(content)) {
            return content.map(c => c.text || '').join(' ');
        }
        return '';
    }

    // Placeholder for getPricing, replace with actual implementation from ai.ts
    private getPricing(provider: string, model: string): { inputCostPerMillion: number; outputCostPerMillion: number } | null {
        return { inputCostPerMillion: 1, outputCostPerMillion: 1 }; // Placeholder
    }
}

// Usage example
async function example(context: ExtensionContext) {
    const toolUse = new ToolUse(context);
    const result = await toolUse.queryWithTools('What time is it?', 'grok3');
    console.log(result.result);
}