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
        type: ProjectType;
    };
    openTabs: {
        fileName: string;
        fileType: string;
        content: string;
        filePath: string;
        isDirty: boolean;
    }[];
}

export interface RateLimits {
    requestsPerMinute: number;
    inputTokensPerMinute: number;
    outputTokensPerMinute: number;
}

export interface Pricing {
    inputCostPerMillion: number;
    outputCostPerMillion: number;
}

export interface Cost {
    sum: number;
    inputCost: number;
    outputCost: number;
}

export interface AIPrompt {
    systemPrompt: string;
    attachments: {
        type: 'code' | 'text' | 'structure' | 'custom';
        title?: string;
        language?: string;
        content: string;
        relativePath?: string;
        metadata?: Record<string, any>; // For custom data
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

export interface FrameworkConfig {
    name: string;
    fileExtensions: string[]; // e.g., ['dart'] for Flutter
    ignorePatterns: string[]; // Additional ignore patterns
    detectIndicators: string[]; // e.g., ['pubspec.yaml'] for Flutter
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
    fullRewrite: boolean;
    extra: string[];
    qmode: string;
    includeOpenTabs: boolean;
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
    response: string; // The processed response text
    rawResponse: any; // New field to store the full, raw response from the AI provider
    timestamp: string;
    context: EditorContext | null;
    provider?: string; // Optional: Store which AI provider was used
}

export interface TranscriptionData {
    status: string;
    transcription: string;
}

export interface ServerMessage {
    status: string;
    message: string;
    transcription?: TranscriptionData;
    data?: any;
}

export interface CodeChange {
    file: string; // Kept for backward compatibility
    relativePath: string | null; // Relative path from project root, e.g., "./lib/main.dart"
    line: number | null; // Nullable for 'create' and 'remove_file'
    position: number | null; // Nullable
    finish_line: number | null; // Nullable
    finish_position: number | null; // Nullable
    action: 'add' | 'replace' | 'remove' | 'create' | 'remove_file'; // Added 'remove_file'
    reason: string; // Explanation for the change
    newCode: string; // // Full lines only, ignored for 'remove' and 'remove_file'
}

export interface GitDiffChange {
    file: string;
    diff: string;
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
    analyzeAIs: string[];
}


// export interface ProjectType {
//     type: 'flutter' | 'python' | 'laravel' | 'javascript' | 'typescript' | 'php' | 'react' | 'vscode-extension' | 'unknown';
//     confidence: number; // 0-1 scale
//     indicators: string[];
// }

export interface ProjectType {
    type: string; // e.g., "flutter", "react", "custom-framework"
    confidence: number; // 0-1 scale
    indicators: string[];
}
