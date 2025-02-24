import * as vscode from 'vscode';

export class UserInputDialogs {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async inputString(prompt: string, defaultValue?: string): Promise<string | undefined> {
        try {
            return await vscode.window.showInputBox({ prompt, value: defaultValue });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Input string failed: ${message}`);
            return undefined;
        }
    }

    async inputNumber(prompt: string): Promise<number | undefined> {
        try {
            const input = await vscode.window.showInputBox({
                prompt,
                validateInput: value => isNaN(Number(value)) ? 'Please enter a number' : null
            });
            return input ? Number(input) : undefined;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Input number failed: ${message}`);
            return undefined;
        }
    }

    async inputMultilineText(prompt: string): Promise<string | undefined> {
        try {
            return await vscode.window.showInputBox({ prompt });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Input multiline text failed: ${message}`);
            return undefined;
        }
    }

    async pickBox(options: string[], placeHolder: string): Promise<string | undefined> {
        try {
            if (!options.length) {throw new Error('Options list cannot be empty');}
            return await vscode.window.showQuickPick(options, { placeHolder });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Pick box failed: ${message}`);
            return undefined;
        }
    }

    async multiSelect(options: string[], placeHolder: string): Promise<string[] | undefined> {
        try {
            if (!options.length) {throw new Error('Options list cannot be empty');}
            return await vscode.window.showQuickPick(options, { canPickMany: true, placeHolder });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Multi-select failed: ${message}`);
            return undefined;
        }
    }

    async radioSelection(options: string[], placeHolder: string): Promise<string | undefined> {
        try {
            if (!options.length) {throw new Error('Options list cannot be empty');}
            return await vscode.window.showQuickPick(options, { placeHolder });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Radio selection failed: ${message}`);
            return undefined;
        }
    }

    async pickFile(): Promise<vscode.Uri | undefined> {
        try {
            const uris = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false
            });
            return uris?.[0];
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Pick file failed: ${message}`);
            return undefined;
        }
    }

    async pickMultipleFiles(): Promise<vscode.Uri[] | undefined> {
        try {
            return await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: true
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Pick multiple files failed: ${message}`);
            return undefined;
        }
    }
}