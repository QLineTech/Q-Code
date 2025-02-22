import * as vscode from 'vscode';
import { QCodeSettings } from './types';

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
        grok3AI: { active: true, apiKeys: [] },
        openAI: { active: false, apiKeys: [] },
        ollamaAI: { active: false, apiKeys: [] },
        groqAI: { active: false, apiKeys: [] },
        anthropicAI: { active: false, apiKeys: [] },
        theme: 'system',
        language: 'en',
        websocket: { active: true, address: 'ws://localhost:9001' },
        analyzeAIs: ['grok3AI']
    };
    return { ...defaultSettings, ...partialSettings };
}

export { QCodeSettings };
