import * as vscode from 'vscode';

export class CodeFormattingEnhancement {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async formatCode(filePath?: string): Promise<void> {
        try {
            let document: vscode.TextDocument;
            if (filePath) {
                document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            } else if (vscode.window.activeTextEditor) {
                document = vscode.window.activeTextEditor.document;
            } else {
                throw new Error('No active editor or file path provided');
            }
            await vscode.commands.executeCommand('editor.action.formatDocument', document.uri);
            vscode.window.showInformationMessage('Code formatted successfully');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to format code: ${message}`);
        }
    }

    async getHoverInformation(filePath: string, line: number, character: number): Promise<vscode.Hover[]> {
        try {
            if (!filePath) {throw new Error('File path cannot be empty');}
            if (line < 0 || character < 0) {throw new Error('Invalid position');}
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            const position = new vscode.Position(line, character);
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                document.uri,
                position
            );
            return hovers || [];
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to get hover information: ${message}`);
            return [];
        }
    }

    async saveFile(filePath?: string): Promise<void> {
        try {
            let document: vscode.TextDocument;
            if (filePath) {
                document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            } else if (vscode.window.activeTextEditor) {
                document = vscode.window.activeTextEditor.document;
            } else {
                throw new Error('No active editor or file path provided');
            }
            await document.save();
            vscode.window.showInformationMessage('File saved successfully');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to save file: ${message}`);
        }
    }
}