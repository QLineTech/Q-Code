// src/types/chat.ts
import { EditorContext } from './editor';

export interface ChatStates {
    attachRelated: boolean;
    thinking: boolean;
    webAccess: boolean;
    autoApply: boolean;
    folderStructure: boolean;
    fullRewrite: boolean;
    extra: string[];
    includeOpenTabs: boolean;
}

export interface ChatHistoryEntry {
    id: string;
    prompt: string;
    response: string;
    rawResponse: any;
    timestamp: string;
    context: EditorContext | null;
    provider?: string;
}