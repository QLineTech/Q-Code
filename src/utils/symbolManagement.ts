import * as vscode from 'vscode';

export class SymbolManagement {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async getCustomClasses(): Promise<vscode.SymbolInformation[]> {
        try {
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider', ''
            );
            return symbols ? symbols.filter(s => s.kind === vscode.SymbolKind.Class) : [];
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to get custom classes: ${message}`);
            return [];
        }
    }

    async getCustomVariables(): Promise<vscode.SymbolInformation[]> {
        try {
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider', ''
            );
            return symbols ? symbols.filter(s => s.kind === vscode.SymbolKind.Variable) : [];
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to get custom variables: ${message}`);
            return [];
        }
    }

    async renameSymbol(filePath: string, line: number, character: number, newName: string): Promise<void> {
        try {
            if (!filePath) {throw new Error('File path cannot be empty');}
            if (!newName) {throw new Error('New name cannot be empty');}
            if (line < 0 || character < 0) {throw new Error('Invalid position');}
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            const position = new vscode.Position(line, character);
            const workspaceEdit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                'vscode.executeRenameProvider',
                document.uri,
                position,
                newName
            );
            if (workspaceEdit) {
                await vscode.workspace.applyEdit(workspaceEdit);
                vscode.window.showInformationMessage(`Symbol renamed to "${newName}"`);
            } else {
                throw new Error('No symbol found at position');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to rename symbol: ${message}`);
        }
    }

    async goToDefinition(filePath: string, line: number, character: number): Promise<void> {
        try {
            if (!filePath) {throw new Error('File path cannot be empty');}
            if (line < 0 || character < 0) {throw new Error('Invalid position');}
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            const position = new vscode.Position(line, character);
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                document.uri,
                position
            );
            if (locations && locations.length > 0) {
                await vscode.window.showTextDocument(locations[0].uri, { selection: locations[0].range });
            } else {
                throw new Error('No definition found');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to go to definition: ${message}`);
        }
    }
}