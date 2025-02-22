import Axios, { AxiosError } from 'axios';
import * as vscode from 'vscode';
import { QCodeSettings } from './types';

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

export async function queryAI(prompt: string, provider: keyof QCodeSettings = 'grok3AI'): Promise<string> {
    if (!prompt?.trim()) throw new Error('Empty prompt provided');
    const config = vscode.workspace.getConfiguration().get(`qcode.${provider}`) as { active: boolean; apiKeys: string[] };
    if (!config?.active || !config?.apiKeys?.[0]) throw new Error(`${provider} is not properly configured`);

    const now = Date.now();
    const lastCall = rateLimiter.get(provider) || 0;
    if (now - lastCall < 1000) throw new Error('Rate limit exceeded');
    rateLimiter.set(provider, now);

    try {
        const response = await Axios.post(
            API_URLS[provider],
            {
                model: provider === 'grok3AI' ? 'grok-3' : 'default',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            },
            {
                headers: { 'Authorization': `Bearer ${config.apiKeys[0]}`, 'Content-Type': 'application/json' },
                timeout: 30000
            }
        );
        await validateAIResponse(response);
        return response.data.choices[0].message.content;
    } catch (error) {
        if (error instanceof AxiosError) throw new Error(`${provider} API Error: ${error.response?.data?.error || error.message}`);
        throw error;
    }
}

async function validateAIResponse(response: any): Promise<boolean> {
    if (!response?.data?.choices?.[0]?.message?.content) throw new Error('Invalid AI response format');
    return true;
}