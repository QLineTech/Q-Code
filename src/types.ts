import * as vscode from 'vscode';

export interface EditorContext {
    fileName: string;
    fileType: string;
    content: string;
    selection: {
        text: string;
        startLine: number;
        endLine: number;
        startCharacter: number;
        endCharacter: number;
    } | null;
    filePath: string;
    cursorPosition: { 
        line: number; 
        character: number 
    };
    isDirty: boolean;
    project: {
        workspaceName: string;
        directories: { 
            name: string; 
            path: string 
        }[];
        type: ProjectType;  // Added project type detection result
    };
}

export interface AIModelConfig {
    active: boolean;
    apiKeys: string[];
    models: string[]; // Array of model names (e.g., ["grok3", "custom-grok"])
    temperature: number; // 0 to 1
    contextSensitivity: number; // 0 to 100
    maxTokens: number; // Max token limit (e.g., 1 to 32768)
}

export interface ChatStates {
    attachRelated: boolean;
    thinking: boolean;
    webAccess: boolean;
    autoApply: boolean;
    folderStructure: boolean;
    fullRewrite: boolean; // Added for "Full Rewrite Code" option
    extra: string[];
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

export interface ChatHistoryEntry {
    id: string;
    prompt: string;
    response: string;
    timestamp: string;
    context: EditorContext | null;
}

export interface TranscriptionData {
    status: string;
    transcription: string;
}

export interface ServerMessage {
    status: string;
    message: string;
    transcription: TranscriptionData;
}

export interface CodeChange {
    file: string;
    line: number;
    position: number;
    finish_line: number;
    finish_position: number;
    action: 'add' | 'replace' | 'remove' | 'create';
    reason: string;
    newCode: string;
}


export interface QCodeSettings {
    language: string; // e.g., "en", "fr"
    theme: string; // e.g., "system", "light", "dark"
    websocket: {
        active: boolean;
        port: number; // Updated to port instead of address for simplicity
    };
    aiModels: {
        grok3: AIModelConfig;
        openai: AIModelConfig;
        anthropic: AIModelConfig;
        groq: AIModelConfig;
        ollama: AIModelConfig;
        deepseek: AIModelConfig;
    };
    functionCallingAIs: AIModels; // New field for Function Calling AIs
    thinkingAIs: AIModels; // New field for Thinking AIs
    chatStates: ChatStates; // Updated to include all chat options
    // Legacy fields (kept for backward compatibility, but could be deprecated)
    grok3AI: { active: boolean; apiKeys: string[] };
    openAI: { active: boolean; apiKeys: string[] };
    ollamaAI: { active: boolean; apiKeys: string[] };
    groqAI: { active: boolean; apiKeys: string[] };
    anthropicAI: { active: boolean; apiKeys: string[] };
    analyzeAIs: string[];
}


export interface ProjectType {
    type: 'flutter' | 'python' | 'laravel' | 'javascript' | 'typescript' | 'unknown';
    confidence: number; // 0-1 scale
    indicators: string[];
}
