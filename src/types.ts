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
    models: string[];
    temperature: number; // 0 to 1
    volumeSensitivity: number;
}

export interface ChatStates {
    attachRelated: boolean;
    thinking: boolean;
    webAccess: boolean;
    autoApply: boolean;
    folderStructure: boolean;
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
    action: 'add' | 'replace' | 'remove';
    reason: string;
    newCode: string;
}


export interface QCodeSettings {
    aiModels: {
        grok3: AIModelConfig;
        openai: AIModelConfig;
        anthropic: AIModelConfig;
        groq: AIModelConfig;
        ollama: AIModelConfig;
        deepseek: AIModelConfig;
    };
    grok3AI: { active: boolean; apiKeys: string[] };
    openAI: { active: boolean; apiKeys: string[] };
    ollamaAI: { active: boolean; apiKeys: string[] };
    groqAI: { active: boolean; apiKeys: string[] };
    anthropicAI: { active: boolean; apiKeys: string[] };
    theme: string;
    language: string;
    websocket: { active: boolean; address: string };
    analyzeAIs: string[];
    chatStates: ChatStates; 
}


export interface ProjectType {
    type: 'flutter' | 'python' | 'laravel' | 'javascript' | 'typescript' | 'unknown';
    confidence: number; // 0-1 scale
    indicators: string[];
}
