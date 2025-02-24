// src/types/settings.ts
import { AIModelConfig } from './ai';
import { ChatStates } from './chat';
import { FrameworkConfig } from './project';
import { RateLimits, Pricing } from './utils';

// Top-level settings interface for the QCode extension
export interface QCodeSettings {
    // General UI and behavior preferences
    language: string;                  // UI language (e.g., "en", "fr", "es")
    theme: 'system' | 'light' | 'dark'; // UI theme preference

    // AI provider configurations
    aiModels: Record<string, AIModelConfig>; // Keyed by provider name (e.g., "grok3", "openai")
    defaultProviders: {
        codeGeneration: string[];      // List of AIs for code tasks (e.g., ["grok3", "openai"])
        functionCalling: string[];     // List of AIs for function calls (e.g., ["openai", "grok3"])
        thinking: string[];            // List of AIs for reasoning (e.g., ["anthropic"])
        analysis: string[];            // List of AIs for file/content analysis (e.g., ["deepseek"])
        vision: string[];              // List of AIs for image processing (e.g., ["grok3"])
        imageGeneration: string[];     // List of AIs for image generation (e.g., ["dalle"])
    };

    // Chat-related settings
    chat: {
        states: ChatStates;            // Default chat behavior toggles
        maxHistoryEntries: number;     // Max stored chat entries (e.g., 100)
        extra: string[];               // Additional chat options (e.g., ["verbose", "compact"])
    };

    // Voice command settings (Increment 4, Sprint 10)
    voice: {
        active: boolean;               // Enable voice input
        websocket: {
            port: number;              // WebSocket port (e.g., 8080)
            host?: string;             // Optional: WebSocket host (default: "localhost")
            reconnectInterval?: number; // Optional: Reconnect delay in ms (default: 5000)
        };
        language?: string;             // Optional: Voice input language (e.g., "en")
        minConfidence?: number;        // Optional: Minimum transcription confidence (0-1, default: 0.8)
    };

    // Project and framework settings
    project: {
        autoDetectFrameworks: boolean; // Auto-detect project frameworks
        usedFrameworks: Record<string, FrameworkConfig>; // Keyed by framework name (e.g., "flutter")
        defaultInstructions: {
            global: string[];          // Global instructions (e.g., ["Use modern syntax"])
            frameworkSpecific: Record<string, { 
                keywords: string[];    // Framework keywords (e.g., ["mobile", "flutter"])
                instructions: string[]; // Framework instructions (e.g., ["Use Dart null safety"])
            }>;                        // Keyed by framework name (e.g., "flutter")
        };
    };

    // Code change and diff handling (Increment 3, Sprint 8)
    codeChanges: {
        autoApplyThreshold: number;    // Confidence threshold for auto-apply (0-1, e.g., 0.9)
        previewByDefault: boolean;     // Show diff preview before applying
        maxChangesPerRequest: number;  // Max changes per AI response (e.g., 10)
    };

    // Rate limiting and cost management (Increment 2, Sprint 4)
    usage: {
        globalRateLimits?: RateLimits; // Optional: Global limits across all providers
        costBudget?: {
            dailyLimit?: number;       // Optional: Daily cost limit in USD
            monthlyLimit?: number;     // Optional: Monthly cost limit in USD
            currency?: string;         // Optional: Currency (e.g., "USD")
        };
        alertThreshold?: number;       // Optional: Alert when usage reaches % of budget (0-1, e.g., 0.8)
    };

    // Webview customization
    webview: {
        fontSize?: number;             // Optional: Webview font size in px (default: 14)
        showWelcomeScreen?: boolean;   // Optional: Show welcome tutorial (default: true)
    };

    // Debugging and logging
    debug: {
        logLevel: 'info' | 'warn' | 'error' | 'debug'; // Logging verbosity
        outputChannelName?: string;    // Optional: Custom OutputChannel name (default: "QCode")
    };
}

// Default settings for initialization
export const defaultQCodeSettings: QCodeSettings = {
    language: 'en',
    theme: 'system',
    aiModels: {},
    defaultProviders: {
        codeGeneration: ['grok3'],
        functionCalling: ['openai'],
        thinking: ['anthropic'],
        analysis: ['deepseek'],
        vision: ['grok3'],
        imageGeneration: ['dalle'],
    },
    chat: {
        states: {
            attachRelated: true,
            thinking: false,
            webAccess: false,
            autoApply: false,
            folderStructure: true,
            fullRewrite: false,
            extra: [],
            includeOpenTabs: false,
        },
        maxHistoryEntries: 100,
        extra: ['verbose'],            // Default extra chat option
    },
    voice: {
        active: false,
        websocket: {
            port: 8080,
        },
    },
    project: {
        autoDetectFrameworks: true,
        usedFrameworks: {},
        defaultInstructions: {
            global: ['Follow project conventions'],
            frameworkSpecific: {
                flutter: {
                    keywords: ['mobile', 'flutter'],
                    instructions: ['Use Dart null safety'],
                },
                react: {
                    keywords: ['web', 'react'],
                    instructions: ['Use functional components'],
                },
            },
        },
    },
    codeChanges: {
        autoApplyThreshold: 0.9,
        previewByDefault: true,
        maxChangesPerRequest: 10,
    },
    usage: {},
    webview: {
        showWelcomeScreen: true,
    },
    debug: {
        logLevel: 'info',
    },
};