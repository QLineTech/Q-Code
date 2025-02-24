// src/types/chat.ts
import { EditorContext } from './editor';

export interface ChatStates {
    attachRelated: boolean;          // Attach related context
    thinking: boolean;               // Use thinking AI
    webAccess: boolean;              // Enable web search
    autoApply: boolean;              // Auto-apply code changes
    folderStructure: boolean;        // Include folder structure
    fullRewrite: boolean;            // Rewrite entire file
    extra: string[];                 // Additional user options
    includeOpenTabs: boolean;        // Include open tab contents
    skipResponse?: boolean;          // Optional: Skip parts of AI response
    markFavorite?: boolean;          // Optional: Mark response as favorite
}

export interface ChatHistoryEntry {
    id: string;                      // Unique identifier
    prompt: string;                  // User input
    response: string[];                // Processed AI response
    rawResponse: any[];                // Full, unprocessed AI response
    timestamp: string;               // ISO timestamp (e.g., "2025-02-24T12:00:00Z")
    context: EditorContext | null;   // Editor context at time of prompt
    provider?: string;               // Optional: AI provider used
    favorite?: boolean;              // Optional: Marked as favorite
    exported?: boolean;              // Optional: Exported to JSON
    category?: string;               // Optional: Chat Category
}

