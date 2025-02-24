// src/types/settings.ts
import { AIModelConfig, AIModels } from './ai';
import { ChatStates } from './chat';

export interface QCodeSettings {
    language: string; // e.g., "en", "fr"
    theme: string; // e.g., "system", "light", "dark"
    websocket: {
        active: boolean;
        port: number;
    };
    aiModels: {
        grok3: AIModelConfig;
        openai: AIModelConfig;
        anthropic: AIModelConfig;
        groq: AIModelConfig;
        ollama: AIModelConfig;
        deepseek: AIModelConfig;
    };
    functionCallingAIs: AIModels;
    thinkingAIs: AIModels;
    chatStates: ChatStates;
    analyzeAIs: string[];
}