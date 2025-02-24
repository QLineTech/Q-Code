import * as vscode from 'vscode';

export class Debugging {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async startDebugging(configName: string): Promise<boolean> {
        try {
            if (!configName) {throw new Error('Debug configuration name cannot be empty');}
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {throw new Error('No workspace folder found');}
            const success = await vscode.debug.startDebugging(workspaceFolder, configName);
            if (!success) {throw new Error('Debug session failed to start');}
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to start debugging: ${message}`);
            return false;
        }
    }

    async stopDebugging(): Promise<void> {
        try {
            await vscode.debug.stopDebugging();
            vscode.window.showInformationMessage('Debugging stopped');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to stop debugging: ${message}`);
        }
    }
}