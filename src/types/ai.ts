// src/types/ai.ts
import { EditorContext } from './editorContext';
import { ChatStates } from './chat';
import { FrameworkConfig } from './project';
import { Pricing, RateLimits } from './utils';

// Placeholder for ResponseFormat (to be provided by you)
export type ResponseFormat = string; // E.g., 'text', 'json', etc., defined by you

// Placeholder for ResponseFormatDetails (to be provided by you)
// Structure: { description: string; example: string | Uint8Array } per format
export const ResponseFormatDetails: Record<ResponseFormat, { description: string; example: string | Uint8Array }> = {} as any;

// Represents an AI prompt with chat history
export interface AIPrompt {
    systemPrompt: string;              // Base instructions (e.g., "You are a coding assistant with vision")
    previousMessages: AIMessage[];     // Chat history (user/assistant messages)
    userRequest: string;               // Current user query (e.g., "Analyze this file")
    attachments: AIAttachment[];       // Files or data (e.g., code, PDF, image)
    responseFormat: ResponseFormat;    // Expected response type (defined by you)
    context?: AIContext;               // Optional project/editor context
    extra?: Record<string, unknown>;   // Metadata (e.g., { sessionId: "abc123" })
    providerHint?: string;             // Suggested provider (e.g., "grok3")
}

// A single message in chat history
export interface AIMessage {
    role: 'user' | 'assistant';        // Who sent the message
    content: string;                   // Message text (e.g., "What’s in this file?")
    timestamp?: string;                // ISO 8601 (e.g., "2025-02-24T12:00:00Z")
}

// Attachment with open-ended type (to be provided by you)
export interface AIAttachment {
    type: string;                      // E.g., 'code', 'pdf', etc., defined by you
    title?: string;                    // E.g., "report.pdf"
    language?: string;                 // E.g., "typescript" (for code/text)
    content: string | Uint8Array;      // Text or binary data
    relativePath?: string;             // E.g., "src/main.ts"
    metadata?: Record<string, unknown>; // E.g., { pageCount: 5 }
}

// Context for AI understanding
export interface AIContext {
    editor: EditorContext;             // Editor state
    project?: ProjectContext;          // Project details
    chatHistory?: ChatStates;          // Optional full chat state
}

// Project-specific context
export interface ProjectContext {
    keywords: string[];                // E.g., ["e-commerce", "mobile"]
    instructions: string[];            // E.g., ["Use async/await", "Avoid console.log"]
    folderStructure?: Record<string, string>; // E.g., { "src": "source code" }
    framework?: FrameworkConfig;       // Framework settings
}

// Dynamic prompt generator
export interface PromptTemplate {
    generatePrompt(
        userRequest: string,           // User input
        previousMessages: AIMessage[], // Chat history
        context: AIContext,            // Full context
        frameworkConfig: FrameworkConfig, // Framework settings
        states: ChatStates            // Chat state
    ): Promise<AIPrompt>;             // Returns a constructed prompt
}

// AI model/provider configuration with vision/function support
export interface AIModelConfig {
    active: boolean;                   // Enabled status
    providerName: string;              // E.g., "grok3"
    apiKeys: string[];                 // Multiple keys
    models: string[];                  // E.g., ["grok-3"]
    temperature: number;               // 0 to 1
    contextSensitivity: number;        // 0 to 100
    maxTokens: number;                 // Max output tokens
    supportsVision: boolean;           // Can process images/PDFs?
    supportsFunctions: boolean;        // Can return function calls?
    baseURL?: string;                  // E.g., "https://api.xai.dev"
    rateLimits?: RateLimits;           // Usage limits
    pricing?: Pricing;                 // Cost details
}

// AI response structure
export interface AIResponse {
    content: string | Uint8Array;      // Text or binary output
    format: ResponseFormat;            // Matches request format (defined by you)
    provider: string;                  // E.g., "grok3"
    usage?: AIUsage;                   // Token/cost tracking
    timestamp: string;                 // ISO 8601 (e.g., "2025-02-24T12:00:00Z")
}

// Usage metrics
export interface AIUsage {
    promptTokens: number;              // Input tokens
    completionTokens: number;          // Output tokens
    totalTokens: number;               // Total usage
    cost?: number;                     // Estimated cost (USD)
}

// AI error details
export interface AIError {
    code: string;                      // E.g., "RATE_LIMIT_EXCEEDED"
    message: string;                   // E.g., "Too many requests"
    provider?: string;                 // E.g., "grok3"
    retryAfter?: number;               // Seconds to wait
}