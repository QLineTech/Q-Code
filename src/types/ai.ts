// src/types/ai.ts
import { EditorContext } from './editor';
import { ChatStates } from './chat';
import { FrameworkConfig } from './project';

export interface AIPrompt {
    systemPrompt: string;
    attachments: {
        type: 'code' | 'text' | 'structure' | 'custom';
        title?: string;
        language?: string;
        content: string;
        relativePath?: string;
        metadata?: Record<string, any>;
    }[];
    userRequest: string;
    responseFormat: string;
    extra?: any;
}

export interface PromptTemplate {
    generatePrompt(
        prompt: string,
        context: EditorContext,
        states: ChatStates,
        frameworkConfig: FrameworkConfig
    ): Promise<AIPrompt>;
}

export interface AIModelConfig {
    active: boolean;
    apiKeys: string[];
    models: string[];
    temperature: number; // 0 to 1
    contextSensitivity: number; // 0 to 100
    maxTokens: number; // Max token limit (e.g., 1 to 32768)
}

export interface AIModels {
    grok3: boolean;
    openai: boolean;
    anthropic: boolean;
    groq: boolean;
    ollama: boolean;
    deepseek: boolean;
}

export interface EngineSettings {
    activeAIs: string[];
    temperature: number;
    volumeSensitivity: number; // 0-100 scale
}