import * as vscode from 'vscode';

// Interface for Git Extension API (simplified for this example)
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
    reset(value: string): Promise<void>;
}

/**
 * A comprehensive class providing code editing features for a VS Code extension.
 * Includes diagnostics, symbol search, Git operations, debugging, terminal commands, dialogs, and additional utilities.
 */
export class CodeEditingFeatures {
    private context: vscode.ExtensionContext;

    /**
     * Constructs an instance of CodeEditingFeatures.
     * @param context The VS Code extension context, used for managing subscriptions and state.
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    // Diagnostics
    /**
     * Retrieves errors for a specific file from the Problems tab.
     * @param filePath Absolute path to the file to analyze.
     * @returns Array of error diagnostics filtered by severity.
     * @throws Displays an error message in VS Code if the file path is invalid or retrieval fails.
     */
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

    /**
     * Retrieves warnings for a specific file from the Problems tab.
     * @param filePath Absolute path to the file to analyze.
     * @returns Array of warning diagnostics filtered by severity.
     * @throws Displays an error message in VS Code if the file path is invalid or retrieval fails.
     */
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

    // Symbol Search
    /**
     * Retrieves custom classes defined across the project.
     * Uses the workspace symbol provider to fetch all symbols and filters for classes.
     * @returns Array of class symbols or empty array if none found.
     * @throws Displays an error message in VS Code if symbol retrieval fails.
     */
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

    /**
     * Retrieves custom variables defined across the project.
     * Uses the workspace symbol provider to fetch all symbols and filters for variables.
     * @returns Array of variable symbols or empty array if none found.
     * @throws Displays an error message in VS Code if symbol retrieval fails.
     */
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

    // Git Operations
    /**
     * Executes `git add .` to stage all changes in the current repository.
     * @throws Displays an error message in VS Code if Git extension or repository is unavailable.
     */
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

    /**
     * Commits staged changes with a given message.
     * @param message The commit message to use.
     * @throws Displays an error message in VS Code if the message is empty or Git operation fails.
     */
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

    /**
     * Pushes committed changes to the remote repository.
     * @throws Displays an error message in VS Code if Git operation fails.
     */
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

    /**
     * Undoes the last commit, keeping changes staged (soft reset to HEAD~1).
     * @throws Displays an error message in VS Code if Git operation fails.
     */
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

    // Debugging
    /**
     * Starts a debugging session with the specified configuration.
     * @param configName Name of the debug configuration from launch.json.
     * @returns True if debugging started successfully, false otherwise.
     * @throws Displays an error message in VS Code if debugging fails to start.
     */
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

    /**
     * Stops the current debugging session.
     * @throws Displays an error message in VS Code if stopping fails.
     */
    async stopDebugging(): Promise<void> {
        try {
            await vscode.debug.stopDebugging();
            vscode.window.showInformationMessage('Debugging stopped');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Failed to stop debugging: ${message}`);
        }
    }

    // Terminal
    /**
     * Runs a command in the terminal at the project root.
     * Creates a new terminal instance if needed and executes the command.
     * @param command The command to execute in the terminal.
     * @throws Displays an error message in VS Code if terminal creation or execution fails.
     */
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

    // Dialogs
    /**
     * Prompts for a single-line text input with an optional default value.
     * @param prompt The prompt text to display to the user.
     * @param defaultValue Optional default value for the input field.
     * @returns User-entered string or undefined if cancelled.
     * @throws Displays an error message in VS Code if input fails.
     */
    async inputString(prompt: string, defaultValue?: string): Promise<string | undefined> {
        try {
            return await vscode.window.showInputBox({ prompt, value: defaultValue });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Input string failed: ${message}`);
            return undefined;
        }
    }

    /**
     * Prompts for a numeric input with validation to ensure numeric values.
     * @param prompt The prompt text to display to the user.
     * @returns Number entered by the user or undefined if cancelled.
     * @throws Displays an error message in VS Code if input fails.
     */
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

    /**
     * Prompts for a multiline text input (Shift+Enter for new lines in VS Code 1.82+).
     * @param prompt The prompt text to display to the user.
     * @returns Multiline text entered by the user or undefined if cancelled.
     * @throws Displays an error message in VS Code if input fails.
     */
    async inputMultilineText(prompt: string): Promise<string | undefined> {
        try {
            return await vscode.window.showInputBox({ prompt });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Input multiline text failed: ${message}`);
            return undefined;
        }
    }
    
    /**
     * Shows a dropdown (single-select) from a list of options.
     * @param options Array of options to display in the dropdown.
     * @param placeHolder Placeholder text for the quick pick.
     * @returns Selected option or undefined if cancelled.
     * @throws Displays an error message in VS Code if options are empty or selection fails.
     */
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

    /**
     * Shows a checkbox list for multiple selections.
     * @param options Array of options to display in the checkbox list.
     * @param placeHolder Placeholder text for the quick pick.
     * @returns Array of selected options or undefined if cancelled.
     * @throws Displays an error message in VS Code if options are empty or selection fails.
     */
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

    /**
     * Shows a single-select quick pick styled as radio-like.
     * @param options Array of options to display in the quick pick.
     * @param placeHolder Placeholder text for the quick pick.
     * @returns Selected option or undefined if cancelled.
     * @throws Displays an error message in VS Code if options are empty or selection fails.
     */
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

    /**
     * Opens a file picker dialog for selecting a single file.
     * @returns Selected file URI or undefined if cancelled.
     * @throws Displays an error message in VS Code if file picking fails.
     */
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

    /**
     * Opens a file picker dialog for selecting multiple files.
     * @returns Array of selected file URIs or undefined if cancelled.
     * @throws Displays an error message in VS Code if file picking fails.
     */
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

    // Additional Features
    /**
     * Formats the code in a specific file or the active editor.
     * Uses the built-in formatting command for the document.
     * @param filePath Optional path to the file; uses active editor if not provided.
     * @throws Displays an error message in VS Code if formatting fails or no editor/file is available.
     */
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

    /**
     * Retrieves hover information at a specific position in a file.
     * Useful for getting documentation or type info at a cursor position.
     * @param filePath Absolute path to the file.
     * @param line Line number (0-based).
     * @param character Character position (0-based).
     * @returns Array of hover contents or empty array if none found.
     * @throws Displays an error message in VS Code if hover retrieval fails.
     */
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

    /**
     * Renames a symbol at a specific position in a file across the project.
     * Applies the rename operation workspace-wide.
     * @param filePath Absolute path to the file.
     * @param line Line number (0-based).
     * @param character Character position (0-based).
     * @param newName New name for the symbol.
     * @throws Displays an error message in VS Code if rename fails or no symbol is found.
     */
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
}