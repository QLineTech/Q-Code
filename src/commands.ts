import * as vscode from 'vscode';
import * as path from 'path';
import { QCodePanelProvider } from './webview';
import { queryAI } from './ai';
import { readFile, writeFile } from './fileOperations';
import { EditorContext, ChatHistoryEntry, QCodeSettings, ProjectType } from './types';
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
        // Check editor context first if available
        if (editorContext) {
            const fileType = editorContext.fileType.toLowerCase();
            const fileName = editorContext.fileName.toLowerCase();

            // Language-specific checks
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

        // Analyze workspace files for stronger evidence
        for (const folder of workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            
            // Helper function to check file existence
            const fileExists = async (filePath: string): Promise<boolean> => {
                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
                    return true;
                } catch {
                    return false;
                }
            };

            // Flutter detection
            if (await fileExists(`${folderPath}/pubspec.yaml`)) {
                indicators.push('pubspec.yaml found');
                if (projectType.type === 'flutter' || projectType.type === 'unknown') {
                    projectType = { type: 'flutter', confidence: 0.95, indicators };
                }
            }

            // Laravel detection
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

            // Python detection
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
    states: {
        attachRelated: boolean;
        thinking: boolean;
        webAccess: boolean;
        autoApply: boolean;
        folderStructure: boolean;
    }
) {
    try {
        if(states  === undefined) {
            states = {
                attachRelated: false,
                thinking: false,
                webAccess: false,
                autoApply: false,
                folderStructure: false,
            };
        }
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
        
        const response = editorContext
            ? await EngineHandler.processPrompt(text, editorContext, context, states)
            : 'No editor context available.';
            
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
        // const editor = vscode.window.activeTextEditor;
        // if (!editor) {
        //     throw new Error('No active editor found');
        // }
        // const content = editor.document.getText();
        // const prompt = `Analyze this code and suggest improvements:\n\n${content}`;
        // const settings = getValidSettings(context.globalState.get('qcode.settings')); // Use globalState
        // if (!settings.analyzeAIs?.length) throw new Error('No AIs selected for analysis');

        // const responses: { [key: string]: string } = {};
        // for (const ai of settings.analyzeAIs) {
        //     responses[ai] = await queryAI(prompt, context, ai as keyof QCodeSettings); // Pass context
        // }
        // const combinedResponse = Object.entries(responses).map(([ai, resp]) => `${ai}:\n${resp}`).join('\n\n');
        // const resultPanel = vscode.window.createWebviewPanel('analysisResult', 'Analysis Results', vscode.ViewColumn.Beside, { enableScripts: true });
        // resultPanel.webview.html = `<html><body><pre>${combinedResponse}</pre></body></html>`;
    },
    'modify': async () => {
        // const files = await vscode.workspace.findFiles('**/*.{ts,js}');
        // if (files.length === 0) throw new Error('No TypeScript/JavaScript files found');
        // const filePath = files[0].fsPath;
        // const content = await readFile(filePath);
        // const prompt = `Add a comment at the top of this file:\n\n${content}`;
        // const modifiedContent = await queryAI(prompt, context, 'grok3AI'); // Pass context
        // await writeFile(filePath, modifiedContent);
        // vscode.window.showInformationMessage(`File modified: ${filePath}`);
    }
};