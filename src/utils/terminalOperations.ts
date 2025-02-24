import * as vscode from 'vscode';

export class TerminalOperations {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async runCommandAtProjectRoot(command: string): Promise<void> {
        try {
            if (!command) {throw new Error('Command cannot be empty');}
            const rootPath = vscode.workspace.rootPath || '.';
            const terminal = vscode.window.createTerminal({ cwd: rootPath });
            terminal.sendText(command);
            terminal.show();
            vscode.window.showInformationMessage(`Running command: ${command}`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to run command: ${message}`);
        }
    }
}