import * as vscode from 'vscode';
import { QCodeSettings, AIModelConfig } from '../types/types';

export function validateSettings(settings: QCodeSettings): boolean {
    if (!settings || typeof settings !== 'object') { return false; }
    const requiredFields = ['language', 'theme', 'websocket', 'aiModels', 'functionCallingAIs', 'thinkingAIs', 'chatStates'];
    for (const field of requiredFields) {
        if (!(field in settings)) { return false; }
    }
    return true;
}

export function getValidSettings(partialSettings: Partial<QCodeSettings> | undefined): QCodeSettings {
    const defaultAIModelConfig: AIModelConfig = {
        active: false,
        apiKeys: [],
        models: [],
        temperature: 0,
        contextSensitivity: 0,
        maxTokens: 4096
    };

    const defaultSettings: QCodeSettings = {
        language: 'en',
        theme: 'system',
        websocket: { active: false, port: 9001 },
        aiModels: {
            grok3: { ...defaultAIModelConfig, models: ['grok3'] },
            openai: { ...defaultAIModelConfig, models: ['gpt-3.5-turbo'] },
            anthropic: { ...defaultAIModelConfig, models: ['claude-3'] },
            groq: { ...defaultAIModelConfig, models: ['mixtral-8x7b'] },
            ollama: { ...defaultAIModelConfig, models: ['llama2'] },
            deepseek: { ...defaultAIModelConfig, models: ['deepseek-coder'] }
        },
        functionCallingAIs: {
            grok3: false,
            openai: false,
            anthropic: false,
            groq: false,
            ollama: false,
            deepseek: false
        },
        thinkingAIs: {
            grok3: false,
            openai: false,
            anthropic: false,
            groq: false,
            ollama: false,
            deepseek: false
        },
        chatStates: {
            attachRelated: false,
            thinking: false,
            webAccess: false,
            autoApply: false,
            folderStructure: false,
            fullRewrite: false,
            includeOpenTabs: false,
            qmode: "QCode",
            extra: []
        },
        analyzeAIs: ['grok3']
    };
    return { ...defaultSettings, ...partialSettings };
}

export { QCodeSettings };