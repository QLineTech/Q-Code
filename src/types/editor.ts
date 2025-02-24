// src/types/editor.ts
import * as vscode from 'vscode';
import { ProjectType } from './project';

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
        type: ProjectType; // Imported from project.ts
    };
    openTabs: {
        fileName: string;
        fileType: string;
        content: string;
        filePath: string;
        isDirty: boolean;
    }[];
}