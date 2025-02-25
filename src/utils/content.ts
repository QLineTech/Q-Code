// src/utils/content.ts
import * as vscode from 'vscode';
import { logger } from '../utils/logger';



/**
 * Sanitizes content by removing all characters except alphanumeric, whitespace, and specific punctuation.
 * @param content The content to sanitize.
 * @returns Sanitized string.
 */
export function sanitizeContent(content: string): string {
    return content.replace(/[^\w\s\-\.\/\\\(\)\[\]\{\}]/g, '');
}

/**
 * Maps file extensions to Markdown language identifiers for syntax highlighting.
 * @param language File extension or language identifier (e.g., 'ts', 'js').
 * @returns Corresponding Markdown language identifier or the input if unmapped.
 */
export function getMarkdownLanguage(language: string): string {
    const languageMap: { [key: string]: string } = {
        'ts': 'typescript',
        'js': 'javascript',
        'dart': 'dart',
        'py': 'python',
        'md': 'markdown',
        'json': 'json',
        'html': 'html',
        'css': 'css',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'cs': 'csharp',
        'go': 'go',
        'rb': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',
        'rs': 'rust',
        'scala': 'scala',
        'sh': 'bash',
        'bash': 'bash',
        'sql': 'sql',
        'pl': 'perl',
        'r': 'r',
        'lua': 'lua',
        'groovy': 'groovy',
        'hs': 'haskell',
        'erl': 'erlang',
        'clj': 'clojure',
        'fs': 'fsharp',
        'vb': 'vbnet',
        'asm': 'assembly',
        'm': 'matlab',
        'jl': 'julia',
        'pas': 'pascal',
        'd': 'd',
        'elm': 'elm',
        'ex': 'elixir',
        'jsx': 'jsx',
        'tsx': 'tsx',
        'vue': 'vue',
        'sass': 'sass',
        'scss': 'scss',
        'less': 'less',
        'yml': 'yaml',
        'yaml': 'yaml',
        'xml': 'xml',
        'toml': 'toml',
        'ini': 'ini',
        'bat': 'batch',
        'ps1': 'powershell',
        'docker': 'dockerfile',
        'make': 'makefile',
        'nginx': 'nginx',
        'graphql': 'graphql',
        'sol': 'solidity',
        'tf': 'terraform',
    };
    return languageMap[language.toLowerCase()] || language;
}

/**
 * Adds line numbers to code content.
 * @param code The code content to number.
 * @param from Starting line number (defaults to 0).
 * @returns Code with line numbers prefixed to each line.
 */
export function addLineNumbers(code: string, from: number = 0): string {
    return code.split('\n').map((line, i) => `${i + 1 + from} | ${line}`).join('\n');
}

/**
 * Formats the active document using VS Code's built-in formatting provider.
 * @returns Promise that resolves when formatting is complete.
 * @throws Error if no active editor is found.
 */
export async function formatDocument(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {throw new Error('No active text editor found');}
        const document = editor.document;
        await vscode.commands.executeCommand('editor.action.formatDocument', document.uri);
        logger.info('Document formatted successfully');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to format document: ${message}`);
        vscode.window.showErrorMessage(`Format Document failed: ${message}`);
    }
}

/**
 * Formats the selected text in the active editor.
 * @returns Promise that resolves when formatting is complete.
 * @throws Error if no active editor or selection is found.
 */
export async function formatSelection(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {throw new Error('No active editor or selection found');}
        await vscode.commands.executeCommand('editor.action.formatSelection');
        logger.info('Selection formatted successfully');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to format selection: ${message}`);
        vscode.window.showErrorMessage(`Format Selection failed: ${message}`);
    }
}

/**
 * Enables or disables auto-formatting on save.
 * @param enable Boolean to enable or disable the setting.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setAutoFormatOnSave(enable: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration('editor').update('formatOnSave', enable, vscode.ConfigurationTarget.Global);
        logger.info(`Auto-format on save set to ${enable}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set auto-format on save: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of auto-format on save setting.
 * @returns Boolean indicating if auto-format on save is enabled.
 */
export function getAutoFormatOnSave(): boolean {
    const value = vscode.workspace.getConfiguration('editor').get<boolean>('formatOnSave', false);
    logger.info(`Auto-format on save is ${value}`);
    return value;
}

/**
 * Checks if auto-format on save is currently active.
 * @returns Boolean indicating if the setting is enabled.
 */
export function isAutoFormatOnSaveActive(): boolean {
    return getAutoFormatOnSave();
}

/**
 * Enables or disables auto-formatting on type.
 * @param enable Boolean to enable or disable the setting.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setAutoFormatOnType(enable: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration('editor').update('formatOnType', enable, vscode.ConfigurationTarget.Global);
        logger.info(`Auto-format on type set to ${enable}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set auto-format on type: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of auto-format on type setting.
 * @returns Boolean indicating if auto-format on type is enabled.
 */
export function getAutoFormatOnType(): boolean {
    const value = vscode.workspace.getConfiguration('editor').get<boolean>('formatOnType', false);
    logger.info(`Auto-format on type is ${value}`);
    return value;
}

/**
 * Enables or disables auto-formatting on paste.
 * @param enable Boolean to enable or disable the setting.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setAutoFormatOnPaste(enable: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration('editor').update('formatOnPaste', enable, vscode.ConfigurationTarget.Global);
        logger.info(`Auto-format on paste set to ${enable}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set auto-format on paste: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of auto-format on paste setting.
 * @returns Boolean indicating if auto-format on paste is enabled.
 */
export function getAutoFormatOnPaste(): boolean {
    const value = vscode.workspace.getConfiguration('editor').get<boolean>('formatOnPaste', false);
    logger.info(`Auto-format on paste is ${value}`);
    return value;
}

/**
 * Triggers a quick fix (code action) in the active editor.
 * @returns Promise that resolves when the action is applied.
 * @throws Error if no active editor is found.
 */
export async function quickFix(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {throw new Error('No active text editor found');}
        await vscode.commands.executeCommand('editor.action.quickFix');
        logger.info('Quick fix applied');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to apply quick fix: ${message}`);
        vscode.window.showErrorMessage(`Quick Fix failed: ${message}`);
    }
}

/**
 * Trims trailing whitespace in the active document.
 * @returns Promise that resolves when trimming is complete.
 * @throws Error if no active editor is found.
 */
export async function trimTrailingWhitespace(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {throw new Error('No active text editor found');}
        await vscode.commands.executeCommand('editor.action.trimTrailingWhitespace');
        logger.info('Trailing whitespace trimmed');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to trim trailing whitespace: ${message}`);
        vscode.window.showErrorMessage(`Trim Trailing Whitespace failed: ${message}`);
    }
}

/**
 * Enables or disables trimming of trailing whitespace on save.
 * @param enable Boolean to enable or disable the setting.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setTrimTrailingWhitespace(enable: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration('files').update('trimTrailingWhitespace', enable, vscode.ConfigurationTarget.Global);
        logger.info(`Trim trailing whitespace on save set to ${enable}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set trim trailing whitespace: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of trim trailing whitespace setting.
 * @returns Boolean indicating if trim trailing whitespace is enabled.
 */
export function getTrimTrailingWhitespace(): boolean {
    const value = vscode.workspace.getConfiguration('files').get<boolean>('trimTrailingWhitespace', false);
    logger.info(`Trim trailing whitespace is ${value}`);
    return value;
}

/**
 * Trims final newlines in the active document.
 * @returns Promise that resolves when trimming is complete.
 * @throws Error if no active editor is found.
 */
export async function trimFinalNewlines(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {throw new Error('No active text editor found');}
        const text = editor.document.getText().replace(/\n+$/, '\n');
        await editor.edit(editBuilder => editBuilder.replace(new vscode.Range(0, 0, editor.document.lineCount, 0), text));
        logger.info('Final newlines trimmed');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to trim final newlines: ${message}`);
        vscode.window.showErrorMessage(`Trim Final Newlines failed: ${message}`);
    }
}

/**
 * Enables or disables trimming of final newlines on save.
 * @param enable Boolean to enable or disable the setting.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setTrimFinalNewlines(enable: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration('files').update('trimFinalNewlines', enable, vscode.ConfigurationTarget.Global);
        logger.info(`Trim final newlines on save set to ${enable}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set trim final newlines: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of trim final newlines setting.
 * @returns Boolean indicating if trim final newlines is enabled.
 */
export function getTrimFinalNewlines(): boolean {
    const value = vscode.workspace.getConfiguration('files').get<boolean>('trimFinalNewlines', false);
    logger.info(`Trim final newlines is ${value}`);
    return value;
}

/**
 * Inserts a final newline in the active document if missing.
 * @returns Promise that resolves when insertion is complete.
 * @throws Error if no active editor is found.
 */
export async function insertFinalNewline(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {throw new Error('No active text editor found');}
        const text = editor.document.getText();
        if (!text.endsWith('\n')) {
            await editor.edit(editBuilder => editBuilder.insert(editor.document.positionAt(text.length), '\n'));
        }
        logger.info('Final newline inserted');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to insert final newline: ${message}`);
        vscode.window.showErrorMessage(`Insert Final Newline failed: ${message}`);
    }
}

/**
 * Enables or disables insertion of a final newline on save.
 * @param enable Boolean to enable or disable the setting.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setInsertFinalNewline(enable: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration('files').update('insertFinalNewline', enable, vscode.ConfigurationTarget.Global);
        logger.info(`Insert final newline on save set to ${enable}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set insert final newline: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of insert final newline setting.
 * @returns Boolean indicating if insert final newline is enabled.
 */
export function getInsertFinalNewline(): boolean {
    const value = vscode.workspace.getConfiguration('files').get<boolean>('insertFinalNewline', false);
    logger.info(`Insert final newline is ${value}`);
    return value;
}

/**
 * Inserts a code snippet in the active editor.
 * @param snippetName The name of the snippet to insert.
 * @returns Promise that resolves when the snippet is inserted.
 * @throws Error if no active editor is found.
 */
export async function insertCodeSnippet(snippetName: string): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {throw new Error('No active text editor found');}
        await vscode.commands.executeCommand('editor.action.insertSnippet', { name: snippetName });
        logger.info(`Snippet '${snippetName}' inserted`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to insert snippet: ${message}`);
        vscode.window.showErrorMessage(`Insert Snippet failed: ${message}`);
    }
}

/**
 * Transforms selected text to uppercase.
 * @returns Promise that resolves when transformation is complete.
 * @throws Error if no active editor or selection is found.
 */
export async function transformToUppercase(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {throw new Error('No active editor or selection found');}
        await vscode.commands.executeCommand('editor.action.transformToUppercase');
        logger.info('Text transformed to uppercase');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to transform to uppercase: ${message}`);
        vscode.window.showErrorMessage(`Transform to Uppercase failed: ${message}`);
    }
}

/**
 * Transforms selected text to lowercase.
 * @returns Promise that resolves when transformation is complete.
 * @throws Error if no active editor or selection is found.
 */
export async function transformToLowercase(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {throw new Error('No active editor or selection found');}
        await vscode.commands.executeCommand('editor.action.transformToLowercase');
        logger.info('Text transformed to lowercase');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to transform to lowercase: ${message}`);
        vscode.window.showErrorMessage(`Transform to Lowercase failed: ${message}`);
    }
}

/**
 * Sorts lines in the active document in ascending order.
 * @returns Promise that resolves when sorting is complete.
 * @throws Error if no active editor is found.
 */
export async function sortLines(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {throw new Error('No active text editor found');}
        await vscode.commands.executeCommand('editor.action.sortLinesAscending');
        logger.info('Lines sorted in ascending order');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to sort lines: ${message}`);
        vscode.window.showErrorMessage(`Sort Lines failed: ${message}`);
    }
}

/**
 * Reindents lines in the active document.
 * @returns Promise that resolves when indentation is adjusted.
 * @throws Error if no active editor is found.
 */
export async function adjustIndentation(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {throw new Error('No active text editor found');}
        await vscode.commands.executeCommand('editor.action.reindentLines');
        logger.info('Indentation adjusted');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to adjust indentation: ${message}`);
        vscode.window.showErrorMessage(`Adjust Indentation failed: ${message}`);
    }
}

/**
 * Enables or disables word wrap.
 * @param enable Boolean to enable ('on') or disable ('off') word wrap.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setWordWrap(enable: boolean): Promise<void> {
    try {
        const value = enable ? 'on' : 'off';
        await vscode.workspace.getConfiguration('editor').update('wordWrap', value, vscode.ConfigurationTarget.Global);
        logger.info(`Word wrap set to ${value}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set word wrap: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of word wrap setting.
 * @returns Boolean indicating if word wrap is enabled.
 */
export function getWordWrap(): boolean {
    const value = vscode.workspace.getConfiguration('editor').get<string>('wordWrap', 'off');
    const isEnabled = value === 'on';
    logger.info(`Word wrap is ${isEnabled ? 'enabled' : 'disabled'}`);
    return isEnabled;
}

/**
 * Opens the find and replace widget with regex enabled.
 * @returns Promise that resolves when the widget is opened.
 */
export async function findAndReplaceWithRegex(): Promise<void> {
    try {
        await vscode.commands.executeCommand('editor.action.startFindReplaceAction');
        logger.info('Find and replace with regex opened');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to open find and replace: ${message}`);
        vscode.window.showErrorMessage(`Find and Replace failed: ${message}`);
    }
}

/**
 * Opens a preview for the active Markdown document.
 * @returns Promise that resolves when the preview is opened.
 * @throws Error if no active editor or non-Markdown file is found.
 */
export async function markdownPreview(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            throw new Error('No active Markdown editor found');
        }
        await vscode.commands.executeCommand('markdown.showPreview');
        logger.info('Markdown preview opened');
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to open Markdown preview: ${message}`);
        vscode.window.showErrorMessage(`Markdown Preview failed: ${message}`);
    }
}

/**
 * Enables or disables semantic highlighting.
 * @param enable Boolean to enable or disable the setting.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setSemanticHighlighting(enable: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration('editor').update('semanticHighlighting.enabled', enable, vscode.ConfigurationTarget.Global);
        logger.info(`Semantic highlighting set to ${enable}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set semantic highlighting: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of semantic highlighting setting.
 * @returns Boolean indicating if semantic highlighting is enabled.
 */
export function getSemanticHighlighting(): boolean {
    const value = vscode.workspace.getConfiguration('editor').get<boolean>('semanticHighlighting.enabled', true);
    logger.info(`Semantic highlighting is ${value}`);
    return value;
}

/**
 * Enables or disables inlay hints.
 * @param enable Boolean to enable or disable the setting.
 * @returns Promise that resolves when the setting is updated.
 */
export async function setInlayHints(enable: boolean): Promise<void> {
    try {
        await vscode.workspace.getConfiguration('editor').update('inlayHints.enabled', enable, vscode.ConfigurationTarget.Global);
        logger.info(`Inlay hints set to ${enable}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to set inlay hints: ${message}`);
        throw new Error(message);
    }
}

/**
 * Gets the current value of inlay hints setting.
 * @returns Boolean indicating if inlay hints is enabled.
 */
export function getInlayHints(): boolean {
    const value = vscode.workspace.getConfiguration('editor').get<boolean>('inlayHints.enabled', true);
    logger.info(`Inlay hints is ${value}`);
    return value;
}