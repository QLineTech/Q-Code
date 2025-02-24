// src/types/file.ts

export interface CodeChange {
    file: string;                    // Absolute file path (kept for compatibility)
    relativePath: string | null;     // Relative path from project root
    line: number | null;             // Starting line number (null for create/remove_file)
    position: number | null;         // Starting character position (null for create/remove_file)
    finishLine: number | null;       // Ending line number (null for create/remove_file)
    finishPosition: number | null;   // Ending character position (null for create/remove_file)
    action: 'add' | 'replace' | 'remove' | 'create' | 'remove_file';  // Type of change
    reason: string;                  // Explanation for the change
    newCode: string;                 // New code content (ignored for remove/remove_file)
    applied?: boolean;               // Optional: Whether the change was applied
    timestamp?: string;              // Optional: ISO timestamp of the proposal (e.g., "2025-02-24T12:00:00Z")
}

export interface GitDiffChange {
    file: string;                    // Absolute or relative file path
    diff: string;                    // Git diff content (e.g., unified diff format)
    relativePath?: string;           // Optional: Relative path from project root
    validated?: boolean;             // Optional: Whether the diff has been validated
    action?: 'create' | 'modify' | 'delete' | 'other';  // Optional: Type of change
    timestamp?: string;              // Optional: ISO timestamp of the change (e.g., "2025-02-24T12:00:00Z")
    description?: string;           
}