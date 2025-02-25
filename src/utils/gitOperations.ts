import * as vscode from 'vscode';
import * as path from 'path'; // Added missing import
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

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
    // Properties below are not guaranteed by public typings; we'll handle dynamically
    rootUri?: vscode.Uri; // We'll infer from workspace or filesystem
    state?: { HEAD?: { name?: string } }; // We'll approximate branch info
}

export class GitOperations {
    private context: vscode.ExtensionContext;
    private execPromise = promisify(exec); // Moved into class as a private property

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

    /**
     * Retrieves Git repository information for the current workspace.
     * @param workspaceFolders Optional array of workspace folders to check for Git repo.
     * @returns Git info including whether it’s a Git repo, the repo root, and current branch.
     */
    async getGitInfo(workspaceFolders?: readonly vscode.WorkspaceFolder[]): Promise<{ isGit: boolean; repoRoot?: string; branch?: string } | undefined> {
        try {
            if (!workspaceFolders || workspaceFolders.length === 0) {return { isGit: false };}

            const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
            if (gitExtension && gitExtension.isActive) {
                const git = gitExtension.exports.getAPI(1);
                const repo = git.repositories.find(r => workspaceFolders.some(w => w.uri.fsPath === (r as any).rootUri?.fsPath || w.uri.fsPath.startsWith((r as any).rootUri?.fsPath || '')));
                if (repo) {
                    const repoRoot = (repo as any).rootUri?.fsPath || workspaceFolders[0].uri.fsPath; // Fallback to workspace root
                    const branch = (repo as any).state?.HEAD?.name || await this.getBranchFromGitCommand(repoRoot);
                    return {
                        isGit: true,
                        repoRoot,
                        branch
                    };
                }
            }

            // Fallback: Check for .git directory in workspace root
            const rootPath = workspaceFolders[0].uri.fsPath;
            if (await fs.stat(path.join(rootPath, '.git')).then(() => true).catch(() => false)) {
                const branch = await this.getBranchFromGitCommand(rootPath);
                return { isGit: true, repoRoot: rootPath, branch };
            }

            return { isGit: false };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to get Git info: ${message}`);
            return { isGit: false };
        }
    }

    /**
     * Helper to get the current branch using a Git command if API fails.
     * @param repoRoot Path to the repository root.
     * @returns Current branch name or undefined if not determinable.
     */
    private async getBranchFromGitCommand(repoRoot: string): Promise<string | undefined> {
        try {
            const { stdout } = await this.execPromise('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot });
            return stdout.trim() || undefined;
        } catch (error) {
            return undefined; // Silently fail if Git command fails (e.g., no Git installed)
        }
    }

    /**
     * Checks if the user has Git credentials configured (e.g., a username and email).
     * @returns Promise resolving to true if credentials are set, false otherwise.
     */
    async isUserLoggedInToGit(): Promise<boolean> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return false;
            }
            const repoRoot = workspaceFolders[0].uri.fsPath;

            // Check if Git is initialized and user config exists
            const { stdout: userName } = await this.execPromise('git config --get user.name', { cwd: repoRoot });
            const { stdout: userEmail } = await this.execPromise('git config --get user.email', { cwd: repoRoot });

            return !!(userName.trim() && userEmail.trim());
        } catch (error: unknown) {
            // If Git commands fail (e.g., no Git repo or Git not installed), assume not logged in
            return false;
        }
    }

    /**
     * Collects Git user information if credentials are configured.
     * @returns Promise resolving to an object with username and email, or undefined if not logged in.
     */
    async collectGitUserInfo(): Promise<{ username: string; email: string } | undefined> {
        try {
            const isLoggedIn = await this.isUserLoggedInToGit();
            if (!isLoggedIn) {
                return undefined;
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return undefined;
            }
            const repoRoot = workspaceFolders[0].uri.fsPath;

            const { stdout: username } = await this.execPromise('git config --get user.name', { cwd: repoRoot });
            const { stdout: email } = await this.execPromise('git config --get user.email', { cwd: repoRoot });

            if (username.trim() && email.trim()) {
                return {
                    username: username.trim(),
                    email: email.trim()
                };
            }
            return undefined;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to collect Git user info: ${message}`);
            return undefined;
        }
    }
}