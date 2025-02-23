import * as vscode from 'vscode';
import * as path from 'path';
import { QCodePanelProvider } from './webview';
import { queryAI } from './ai';
import { readFile, writeFile } from './fileOperations';
import { EditorContext, ChatHistoryEntry, QCodeSettings, ProjectType, ChatStates } from './types';
import { EngineHandler } from './engine';
import { getValidSettings } from './settings';

async function detectProjectType(
    editorContext: EditorContext | null,
    workspaceFolders: typeof vscode.workspace.workspaceFolders
): Promise<ProjectType> {
    const indicators: string[] = [];
    let projectType: ProjectType = { type: 'unknown', confidence: 0, indicators };

    if (!workspaceFolders?.length) {
        return projectType;
    }

    try {
        if (editorContext) {
            const fileType = editorContext.fileType.toLowerCase();
            const fileName = editorContext.fileName.toLowerCase();

            if (fileType === 'dart') {
                projectType = { type: 'flutter', confidence: 0.7, indicators: ['Dart file detected'] };
            } else if (fileType === 'python') {
                projectType = { type: 'python', confidence: 0.6, indicators: ['Python file detected'] };
            } else if (fileType === 'php') {
                projectType = { type: 'laravel', confidence: 0.5, indicators: ['PHP file detected'] };
            } else if (['javascript', 'typescript'].includes(fileType)) {
                projectType = { 
                    type: fileType as 'javascript' | 'typescript', 
                    confidence: 0.6, 
                    indicators: [`${fileType} file detected`] 
                };
            }
        }

        for (const folder of workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            const fileExists = async (filePath: string): Promise<boolean> => {
                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
                    return true;
                } catch {
                    return false;
                }
            };

            if (await fileExists(`${folderPath}/pubspec.yaml`)) {
                indicators.push('pubspec.yaml found');
                if (projectType.type === 'flutter' || projectType.type === 'unknown') {
                    projectType = { type: 'flutter', confidence: 0.95, indicators };
                }
            }

            if (await fileExists(`${folderPath}/composer.json`)) {
                indicators.push('composer.json found');
                const artisanExists = await fileExists(`${folderPath}/artisan`);
                if (artisanExists) {
                    indicators.push('artisan file found');
                    projectType = { type: 'laravel', confidence: 0.98, indicators };
                } else if (projectType.type === 'unknown') {
                    projectType = { type: 'laravel', confidence: 0.7, indicators };
                }
            }

            if (await fileExists(`${folderPath}/requirements.txt`) || 
                await fileExists(`${folderPath}/pyproject.toml`)) {
                indicators.push('Python project files found');
                if (projectType.type === 'python' || projectType.type === 'unknown') {
                    projectType = { type: 'python', confidence: 0.9, indicators };
                }
            }
        }

        return projectType;
    } catch (error) {
        console.error('Project type detection error:', error);
        return { type: 'unknown', confidence: 0, indicators: ['Detection failed'] };
    }
}

export async function sendChatMessage(
    text: string, 
    context: vscode.ExtensionContext, 
    provider: QCodePanelProvider,
    states: ChatStates = {
        attachRelated: false,
        thinking: false,
        webAccess: false,
        autoApply: false,
        folderStructure: false,
        fullRewrite: false,
        extra: []
    }
) {
    try {
        const editor = vscode.window.activeTextEditor;
        let editorContext: EditorContext | null = null;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const projectInfo = workspaceFolders ? workspaceFolders.map(folder => ({ 
            name: folder.name, 
            path: folder.uri.fsPath 
        })) : [];

        if (editor) {
            const document = editor.document;
            const selection = editor.selection;
            editorContext = {
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
                    type: await detectProjectType(editorContext, workspaceFolders)
                }
            };
        }

        provider.sendMessage({ type: 'chatContext', context: editorContext, prompt: text });
        
        const settings = getValidSettings(context.globalState.get('qcode.settings'));
        const activeModels = Object.entries(settings.aiModels)
            .filter(([_, config]) => config.active)
            .map(([model]) => model);
        
        let response = 'No active AI models configured.';
        if (activeModels.length > 0) {
            response = editorContext
                ? await EngineHandler.processPrompt(text, editorContext, context)
                : 'No editor context available.';
        }
            
        provider.sendMessage({ 
            type: 'chatResponse', 
            text: response, 
            prompt: text, 
            context: editorContext 
        });

        const chatHistory: ChatHistoryEntry[] = context.globalState.get('qcode.chatHistory', []);
        const newEntry: ChatHistoryEntry = {
            id: Date.now().toString(),
            prompt: text,
            response,
            timestamp: new Date().toISOString(),
            context: editorContext
        };
        chatHistory.push(newEntry);
        await context.globalState.update('qcode.chatHistory', chatHistory);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        provider.sendMessage({ type: 'chatError', text: `Error: ${message}` });
        console.error('Chat error:', error);
    }
}

export async function getChatHistory(context: vscode.ExtensionContext, provider: QCodePanelProvider) {
    const chatHistory = context.globalState.get('qcode.chatHistory', []);
    provider.sendMessage({ type: 'chatHistory', history: chatHistory });
}

export const commandMap: { [key: string]: () => Promise<void> } = {
    'hello': async () => {
        vscode.window.showInformationMessage('Hello World from QCode!');
    },
    'analyze': async () => {
        // Placeholder for analysis logic
    },
    'modify': async () => {
        // Placeholder for modification logic
    }
};