import * as vscode from 'vscode';
import * as path from 'path';
import { QCodePanelProvider } from './webview';
import { queryAI } from './ai';
import { readFile, writeFile } from './fileOperations';
import { EditorContext, ChatHistoryEntry, QCodeSettings } from './types';

export async function sendChatMessage(text: string, context: vscode.ExtensionContext, provider: QCodePanelProvider) {
    try {
        const editor = vscode.window.activeTextEditor;
        let editorContext: EditorContext | null = null;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const projectInfo = workspaceFolders ? workspaceFolders.map(folder => ({ name: folder.name, path: folder.uri.fsPath })) : [];

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
                cursorPosition: { line: selection.active.line + 1, character: selection.active.character },
                isDirty: document.isDirty,
                project: { workspaceName: vscode.workspace.name || 'Unnamed Workspace', directories: projectInfo }
            };
        }

        provider.sendMessage({ type: 'chatContext', context: editorContext, prompt: text });
        const response = editorContext
            ? `Here is the editor context in JSON format:\n\n\`\`\`json\n${JSON.stringify(editorContext, null, 2)}\n\`\`\``
            : 'No editor context available.';
        provider.sendMessage({ type: 'chatResponse', text: response, prompt: text, context: editorContext });

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
        const editor = vscode.window.activeTextEditor;
        if (!editor) throw new Error('No active editor found');
        const content = editor.document.getText();
        const prompt = `Analyze this code and suggest improvements:\n\n${content}`;
        const settings = vscode.workspace.getConfiguration().get('qcode') as QCodeSettings;
        if (!settings.analyzeAIs?.length) throw new Error('No AIs selected for analysis');

        const responses: { [key: string]: string } = {};
        for (const ai of settings.analyzeAIs) {
            responses[ai] = await queryAI(prompt, ai as keyof QCodeSettings);
        }
        const combinedResponse = Object.entries(responses).map(([ai, resp]) => `${ai}:\n${resp}`).join('\n\n');
        const resultPanel = vscode.window.createWebviewPanel('analysisResult', 'Analysis Results', vscode.ViewColumn.Beside, { enableScripts: true });
        resultPanel.webview.html = `<html><body><pre>${combinedResponse}</pre></body></html>`;
    },
    'modify': async () => {
        const files = await vscode.workspace.findFiles('**/*.{ts,js}');
        if (files.length === 0) throw new Error('No TypeScript/JavaScript files found');
        const filePath = files[0].fsPath;
        const content = await readFile(filePath);
        const prompt = `Add a comment at the top of this file:\n\n${content}`;
        const modifiedContent = await queryAI(prompt, 'grok3AI');
        await writeFile(filePath, modifiedContent);
        vscode.window.showInformationMessage(`File modified: ${filePath}`);
    }
};