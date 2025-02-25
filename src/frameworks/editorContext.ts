// src/frameworks/editorContext.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { EditorContext } from '../types/editorContext';
import { GitOperations } from '../utils/gitOperations';
import { Diagnostics } from '../utils/diagnostics';
import { logger } from '../utils/logger';
import { ProjectType } from '../types/project';

/**
 * Detects the project type based on workspace indicators.
 * @param context Partial EditorContext for context-aware detection (currently unused).
 * @param workspaceFolders Optional array of workspace folders to analyze.
 * @returns A ProjectType object with type, confidence, indicators, and metadata.
 */
async function detectProjectType(context: Partial<EditorContext>, workspaceFolders?: readonly vscode.WorkspaceFolder[]): Promise<ProjectType> {
    const defaultType: ProjectType = {
        type: 'Unknown',
        confidence: 0.5,
        indicators: [],
        ...(workspaceFolders && workspaceFolders.length > 0 && { rootPath: workspaceFolders[0].uri.fsPath }),
        detectedAt: new Date().toISOString()
    };

    if (workspaceFolders && workspaceFolders.length > 0) {
        const rootPath = workspaceFolders[0].uri.fsPath;
        try {
            if (await fs.stat(path.join(rootPath, 'package.json')).then(() => true).catch(() => false)) {
                logger.info(`Detected React project at ${rootPath} due to package.json`);
                return {
                    type: 'react',
                    confidence: 0.9,
                    indicators: ['package.json'],
                    rootPath,
                    detectedAt: new Date().toISOString()
                };
            }
            if (await fs.stat(path.join(rootPath, 'pubspec.yaml')).then(() => true).catch(() => false)) {
                logger.info(`Detected Flutter project at ${rootPath} due to pubspec.yaml`);
                return {
                    type: 'flutter',
                    confidence: 0.95,
                    indicators: ['pubspec.yaml'],
                    rootPath,
                    detectedAt: new Date().toISOString()
                };
            }
        } catch (error) {
            logger.warning(`Failed to detect project type: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    logger.info('No specific project type detected; defaulting to Unknown');
    return defaultType;
}

/**
 * Populates an EditorContext object with detailed information about the current editor state.
 * @param context The VS Code ExtensionContext for accessing extension-specific data.
 * @returns A Promise resolving to a fully populated EditorContext object.
 * @throws Error if no active editor is found.
 */
export async function populateEditorContext(context: vscode.ExtensionContext): Promise<EditorContext> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        logger.error('No active editor found');
        throw new Error('No active editor');
    }

    const document = editor.document;
    const selection = editor.selection;
    const openEditors = vscode.window.visibleTextEditors;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const projectInfo = workspaceFolders?.map(w => ({ name: w.name, path: w.uri.fsPath })) || [];

    const gitOps = new GitOperations(context);
    const diagnostics = new Diagnostics(context);

    // Pre-fetch all async data and transform into objects
    const fileStats = await fs.stat(document.fileName).catch(() => {
        logger.warning(`Failed to stat file: ${document.fileName}`);
        return null;
    });
    let foldingRangesData: vscode.FoldingRange[] | null = null;
    try {
        foldingRangesData = await vscode.commands.executeCommand<vscode.FoldingRange[]>(
            'vscode.executeFoldingRangeProvider',
            document.uri
        );
    } catch {
        logger.warning(`Failed to fetch folding ranges for ${document.fileName}`);
    }
    const syntaxErrorsData = await diagnostics.getFileErrors(document.fileName).then(errors => {
        if (errors.length > 0) {
            logger.info(`Found ${errors.length} syntax errors in ${document.fileName}`);
            return { syntaxErrors: errors.map(e => ({ message: e.message, line: e.range.start.line + 1 })) };
        }
        return {};
    }).catch((error) => {
        logger.warning(`Failed to fetch syntax errors: ${error instanceof Error ? error.message : String(error)}`);
        return {};
    });
    let clipboardData: { clipboard?: string } = {};
    try {
        const text = await vscode.env.clipboard.readText();
        if (text) {
            logger.info('Clipboard content retrieved');
            clipboardData = { clipboard: text };
        }
    } catch (error) {
        logger.warning(`Failed to read clipboard: ${error instanceof Error ? error.message : String(error)}`);
    }
    const gitInfoData = await gitOps.getGitInfo(workspaceFolders).then(info => info ? { gitInfo: info } : {}).catch((error) => {
        logger.warning(`Failed to fetch Git info: ${error instanceof Error ? error.message : String(error)}`);
        return {};
    });

    const editorContext: EditorContext = {
        fileName: path.basename(document.fileName),
        fileType: document.languageId,
        content: document.getText(),
        selection: selection.isEmpty ? null : {
            text: document.getText(selection),
            startLine: selection.start.line + 1,
            endLine: selection.end.line + 1,
            startCharacter: selection.start.character,
            endCharacter: selection.end.character
        },
        filePath: document.fileName,
        cursorPosition: {
            line: selection.active.line + 1,
            character: selection.active.character
        },
        isDirty: document.isDirty,
        project: {
            workspaceName: vscode.workspace.name || 'Unnamed Workspace',
            directories: projectInfo,
            type: await detectProjectType({}, workspaceFolders),
            ...(vscode.workspace.rootPath && { rootPath: vscode.workspace.rootPath }),
            ...(vscode.workspace.workspaceFile && { workspaceFile: vscode.workspace.workspaceFile.fsPath }),
            ...gitInfoData,
            ...(vscode.workspace.getConfiguration() && { config: vscode.workspace.getConfiguration() })
        },
        openTabs: openEditors.map((editor) => {
            const doc = editor.document;
            return {
                fileName: path.basename(doc.fileName),
                fileType: doc.languageId,
                content: doc.getText(),
                filePath: doc.fileName,
                isDirty: doc.isDirty
            };
        }),

        // Editor-specific optional fields
        ...(editor.viewColumn !== undefined ? { viewColumn: editor.viewColumn } : {}),
        ...(vscode.window.activeTextEditor ? { isActive: vscode.window.activeTextEditor === editor } : {}),
        ...(document.eol ? { eol: document.eol === vscode.EndOfLine.LF ? 'LF' : 'CRLF' } : {}),
        ...(vscode.workspace.getConfiguration('editor').get('wordWrap') ? {
            wordWrap: vscode.workspace.getConfiguration('editor').get('wordWrap') === 'on'
        } : {}),
        ...(editor.options.tabSize !== undefined ? { tabSize: editor.options.tabSize as number } : {}),
        ...(editor.visibleRanges.length > 0 ? {
            visibleRanges: editor.visibleRanges.map(r => ({ startLine: r.start.line + 1, endLine: r.end.line + 1 }))
        } : {}),
        ...(vscode.workspace.getConfiguration('editor').get('fontSize') ? {
            zoomLevel: vscode.workspace.getConfiguration('editor').get('fontSize')
        } : {}),
        ...(vscode.workspace.getConfiguration('files').get('encoding') ? {
            encoding: vscode.workspace.getConfiguration('files').get('encoding') as string
        } : {}),

        // UI and state optional fields
        ...(vscode.window.activeTerminal ? { activeTerminal: vscode.window.activeTerminal.name } : {}),
        ...(vscode.window.activeTextEditor ? { panelLayout: { sidebarVisible: true, panelVisible: false } } : {}),
        ...(vscode.workspace.getConfiguration('workbench').get('colorTheme') ? {
            theme: vscode.workspace.getConfiguration('workbench').get('colorTheme')
        } : {}),
        ...(vscode.window.state ? { windowState: vscode.window.state.focused ? 'focused' : 'minimized' } : {}),

        // File and document optional fields
        ...(fileStats && { fileSize: fileStats.size }),
        ...(fileStats && { lastModified: fileStats.mtime.toISOString() }),
        ...(document.isUntitled !== undefined && { isReadOnly: document.isUntitled }),
        ...syntaxErrorsData,
        ...(foldingRangesData && foldingRangesData.length > 0 && {
            foldingRanges: foldingRangesData.map(r => ({ startLine: r.start + 1, endLine: r.end + 1 }))
        }),

        // Miscellaneous optional fields
        ...(vscode.debug.activeDebugSession && {
            debugSession: { isActive: true, breakpointLine: selection.active.line + 1 }
        }),
        ...(vscode.extensions.all.length > 0 && { extensions: vscode.extensions.all.map(ext => ext.id) }),
        ...clipboardData,
        ...(vscode.env.language && { currentLanguage: vscode.env.language }),
        ...(vscode.env.machineId && { machineId: vscode.env.machineId }),
        ...(vscode.env.sessionId && { sessionId: vscode.env.sessionId })
    };

    logger.info(`EditorContext populated for file: ${editorContext.fileName}`);
    return editorContext;
}

/**
 * Example usage of populateEditorContext to demonstrate its functionality.
 * @param context The VS Code ExtensionContext for accessing extension-specific data.
 */
export async function example(context: vscode.ExtensionContext) {
    try {
        const editorContext = await populateEditorContext(context);
        logger.info('EditorContext example executed successfully');
        console.log(JSON.stringify(editorContext, null, 2));
    } catch (error) {
        logger.error('Failed to populate EditorContext', error instanceof Error ? error : new Error(String(error)));
    }
}