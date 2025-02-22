import * as vscode from 'vscode';
import { QCodeSettings, AIModelConfig } from './types';

export function validateSettings(settings: QCodeSettings): boolean {
    if (!settings || typeof settings !== 'object') return false;
    const requiredFields = ['grok3AI', 'openAI', 'ollamaAI', 'groqAI', 'anthropicAI', 'theme', 'language', 'websocket', 'analyzeAIs'];
    for (const field of requiredFields) {
        if (!(field in settings)) return false;
    }
    return Array.isArray(settings.analyzeAIs);
}

export function getValidSettings(partialSettings: Partial<QCodeSettings> | undefined): QCodeSettings {
    const defaultSettings: QCodeSettings = {
        theme: 'system',
        language: 'en',
        websocket: { active: true, address: 'ws://localhost:9001' },
        analyzeAIs: ['grok3AI'],
        aiModels: {
            grok3: { active: false, apiKeys: [], models: [], temperature: 0, volumeSensitivity: 0 },
            openai: { active: false, apiKeys: [], models: [], temperature: 0, volumeSensitivity: 0 },
            anthropic: { active: false, apiKeys: [], models: [], temperature: 0, volumeSensitivity: 0 },
            groq: { active: false, apiKeys: [], models: [], temperature: 0, volumeSensitivity: 0 },
            ollama: { active: false, apiKeys: [], models: [], temperature: 0, volumeSensitivity: 0 },
            deepseek: { active: false, apiKeys: [], models: [], temperature: 0, volumeSensitivity: 0 }
        },
        chatStates: {
            attachRelated: false,
            thinking: false,
            webAccess: false,
            autoApply: false,
            folderStructure: false,
            extra: [],
        },
        grok3AI: {
            active: false,
            apiKeys: []
        },
        openAI: {
            active: false,
            apiKeys: []
        },
        ollamaAI: {
            active: false,
            apiKeys: []
        },
        groqAI: {
            active: false,
            apiKeys: []
        },
        anthropicAI: {
            active: false,
            apiKeys: []
        }
    };
    return { ...defaultSettings, ...partialSettings };
}

export { QCodeSettings };
