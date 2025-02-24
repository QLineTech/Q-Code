import * as vscode from 'vscode';

interface GitExtension {
    getAPI(version: number): GitAPI;
}

interface GitAPI {
    repositories: GitRepository[];
}

interface GitRepository {
    add(paths: string[]): Promise<void>;
    commit(message: string): Promise<void>;
    push(): Promise<void>;
    pull(): Promise<void>;
    reset(value: string): Promise<void>;
}

export class GitOperations {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async gitAddAll(): Promise<void> {
        try {
            const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
            if (!gitExtension) {throw new Error('Git extension not found');}
            const git = gitExtension.getAPI(1);
            const repository = git.repositories[0];
            if (!repository) {throw new Error('No Git repository found');}
            await repository.add(['.']);
            vscode.window.showInformationMessage('Successfully staged all changes');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Git add failed: ${message}`);
        }
    }

    async gitCommit(message: string): Promise<void> {
        try {
            if (!message) {throw new Error('Commit message cannot be empty');}
            const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
            if (!gitExtension) {throw new Error('Git extension not found');}
            const git = gitExtension.getAPI(1);
            const repository = git.repositories[0];
            if (!repository) {throw new Error('No Git repository found');}
            await repository.commit(message);
            vscode.window.showInformationMessage(`Committed with message: "${message}"`);
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Git commit failed: ${messageText}`);
        }
    }

    async gitPush(): Promise<void> {
        try {
            const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
            if (!gitExtension) {throw new Error('Git extension not found');}
            const git = gitExtension.getAPI(1);
            const repository = git.repositories[0];
            if (!repository) {throw new Error('No Git repository found');}
            await repository.push();
            vscode.window.showInformationMessage('Successfully pushed to remote');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Git push failed: ${message}`);
        }
    }

    async gitUndoCommit(): Promise<void> {
        try {
            const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
            if (!gitExtension) {throw new Error('Git extension not found');}
            const git = gitExtension.getAPI(1);
            const repository = git.repositories[0];
            if (!repository) {throw new Error('No Git repository found');}
            await repository.reset('HEAD~1');
            vscode.window.showInformationMessage('Last commit undone');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Git undo commit failed: ${message}`);
        }
    }

    async gitPull(): Promise<void> {
        try {
            const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
            if (!gitExtension) {throw new Error('Git extension not found');}
            const git = gitExtension.getAPI(1);
            const repository = git.repositories[0];
            if (!repository) {throw new Error('No Git repository found');}
            await repository.pull();
            vscode.window.showInformationMessage('Successfully pulled from remote');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Git pull failed: ${message}`);
        }
    }
}