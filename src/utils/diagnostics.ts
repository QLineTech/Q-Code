import * as vscode from 'vscode';

export class Diagnostics {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async getFileErrors(filePath: string): Promise<vscode.Diagnostic[]> {
        try {
            if (!filePath) {throw new Error('File path cannot be empty');}
            const uri = vscode.Uri.file(filePath);
            const diagnostics = vscode.languages.getDiagnostics(uri);
            return diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to get errors: ${message}`);
            return [];
        }
    }

    async getFileWarnings(filePath: string): Promise<vscode.Diagnostic[]> {
        try {
            if (!filePath) {throw new Error('File path cannot be empty');}
            const uri = vscode.Uri.file(filePath);
            const diagnostics = vscode.languages.getDiagnostics(uri);
            return diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to get warnings: ${message}`);
            return [];
        }
    }
}