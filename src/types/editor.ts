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
        type: ProjectType;
        // Optional project-related fields
        /** Absolute path to the workspace root directory, useful for relative path calculations. */
        rootPath?: string;
        /** Path to the `.code-workspace` file if this is a multi-root workspace. */
        workspaceFile?: string;
        /** Git repository details for the project/workspace, indicating if it’s a Git repo and its status. */
        gitInfo?: { 
            isGit: boolean; 
            /** Root path of the Git repository, if detected. */
            repoRoot?: string; 
            /** Current branch name, if available. */
            branch?: string 
        };
        /** Workspace-specific configuration settings (e.g., `files.exclude`, `editor.formatOnSave`). */
        config?: { [key: string]: any };
    };
    openTabs: {
        fileName: string;
        fileType: string;
        content: string;
        filePath: string;
        isDirty: boolean;
    }[];

    // Optional editor-specific fields
    /** The column (1-based index) where the editor is displayed in a split view, undefined if not in a group. */
    viewColumn?: number;
    /** Indicates if this editor is the currently active/visible one in the window. */
    isActive?: boolean;
    /** End-of-line sequence used in the file ('LF' for \n, 'CRLF' for \r\n). */
    eol?: 'LF' | 'CRLF';
    /** Whether word wrap is enabled for this editor, affecting text display. */
    wordWrap?: boolean;
    /** Number of spaces a tab character represents in the editor. */
    tabSize?: number;
    /** Visible ranges of the document in the editor viewport (line numbers are 1-based). */
    visibleRanges?: { startLine: number; endLine: number }[];
    /** Editor zoom level or font size, reflecting UI scaling (approximated via configuration). */
    zoomLevel?: number;
    /** File encoding (e.g., 'utf-8', 'iso-8859-1'), crucial for text processing. */
    encoding?: string;

    // Optional UI and state fields
    /** Name of the currently active terminal, if any, for debugging or scripting context. */
    activeTerminal?: string;
    /** Basic layout info, e.g., visibility of sidebar or panel, for UI context. */
    panelLayout?: { sidebarVisible: boolean; panelVisible: boolean };
    /** Name of the current color theme (e.g., 'Dark+'), useful for UI customization. */
    theme?: string;
    /** Current state of the VS Code window (e.g., focused, maximized). */
    windowState?: 'focused' | 'maximized' | 'minimized';

    // Optional file and document fields
    /** Size of the file in bytes, useful for performance or metadata tracking. */
    fileSize?: number;
    /** ISO timestamp of the file's last modification on disk. */
    lastModified?: string;
    /** Whether the file is read-only (e.g., untitled or locked files). */
    isReadOnly?: boolean;
    /** List of syntax errors or warnings from diagnostics, with line numbers (1-based). */
    syntaxErrors?: { message: string; line: number }[];
    /** Collapsible folding ranges in the document (1-based line numbers), for code structure. */
    foldingRanges?: { startLine: number; endLine: number }[];

    // Optional miscellaneous fields
    /** Details about an active debug session, if debugging is ongoing. */
    debugSession?: { isActive: boolean; breakpointLine?: number };
    /** List of active extension IDs, useful for compatibility or feature detection. */
    extensions?: string[];
    /** Recent command history, useful for workflow analysis (requires custom tracking). */
    commandHistory?: string[];
    /** Current clipboard content, handy for paste-related operations. */
    clipboard?: string;
    /** UI language of VS Code (e.g., 'en', 'fr'), for localization context. */
    currentLanguage?: string;
    /** Unique machine ID for this VS Code instance, for tracking across sessions. */
    machineId?: string;
    /** Session ID for the current VS Code instance, for session-specific context. */
    sessionId?: string;
}