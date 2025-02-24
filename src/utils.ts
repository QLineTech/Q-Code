import * as vscode from 'vscode';
import path from "path";
import { GitDiffChange } from "./types";

export function sanitizeContent(content: string): string {
    return content.replace(/[^\w\s\-\.\/\\\(\)\[\]\{\}]/g, '');
}

export function getMarkdownLanguage(language: string): string {
    const languageMap: { [key: string]: string } = {
        'ts': 'typescript',
        'js': 'javascript',
        'dart': 'dart',
        'py': 'python',
        'md': 'markdown',
        'json': 'json',
        'html': 'html',
        'css': 'css',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',           // Also supports 'c++'
        'cs': 'csharp',         // C#
        'go': 'go',
        'rb': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'kt': 'kotlin',         // Kotlin
        'rs': 'rust',
        'scala': 'scala',
        'sh': 'bash',           // Shell scripts
        'bash': 'bash',
        'sql': 'sql',
        'pl': 'perl',           // Perl
        'r': 'r',
        'lua': 'lua',
        'groovy': 'groovy',
        'hs': 'haskell',        // Haskell
        'erl': 'erlang',        // Erlang
        'clj': 'clojure',       // Clojure
        'fs': 'fsharp',         // F#
        'vb': 'vbnet',          // Visual Basic .NET
        'asm': 'assembly',      // Assembly
        'm': 'matlab',          // MATLAB
        'jl': 'julia',          // Julia
        'pas': 'pascal',        // Pascal
        'd': 'd',               // D language
        'elm': 'elm',           // Elm
        'ex': 'elixir',         // Elixir
        'jsx': 'jsx',           // React JSX
        'tsx': 'tsx',           // TypeScript JSX
        'vue': 'vue',           // Vue.js
        'sass': 'sass',         // Sass
        'scss': 'scss',         // SCSS
        'less': 'less',         // Less
        'yml': 'yaml',          // YAML
        'yaml': 'yaml',
        'xml': 'xml',           // XML
        'toml': 'toml',         // TOML
        'ini': 'ini',           // INI files
        'bat': 'batch',         // Windows Batch
        'ps1': 'powershell',    // PowerShell
        'docker': 'dockerfile', // Dockerfile
        'make': 'makefile',     // Makefile
        'nginx': 'nginx',       // Nginx config
        'graphql': 'graphql',   // GraphQL
        'sol': 'solidity',      // Solidity (Ethereum)
        'tf': 'terraform',      // Terraform (HCL)
    };
    return languageMap[language.toLowerCase()] || language;
}

export function addLineNumbers(code: string, from:number = 0): string {
    return code;
    return code.split('\n').map((line, i) => `${i + 1 + from} | ${line}`).join('\n');
}

export async function previewChanges(changes: GitDiffChange[]): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
    }

    // const diffEditors: vscode.TextEditor[] = [];

    // Track temporary URIs for cleanup
    const tempUris: vscode.Uri[] = [];

    for (const change of changes) {
        const filePath = path.join(workspaceFolder.uri.fsPath, change.file);
        const originalUri = vscode.Uri.file(filePath);

        // Check if the file is open in the editor
        const openDoc = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filePath);
        if (!openDoc) {
            vscode.window.showWarningMessage(`File ${change.file} is not open in the editor. Opening it...`);
            await vscode.window.showTextDocument(originalUri);
            continue; // Skip to the next change if the file isn’t open
        }

        // Read the original content
        let originalContent = '';
        try {
            const fileContent = await vscode.workspace.fs.readFile(originalUri);
            originalContent = new TextDecoder('utf-8').decode(fileContent);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read file ${change.file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            continue;
        }

        // Apply the diff to create the modified content
        const modifiedContent = applyGitDiff(originalContent, change.diff);

        // Create a temporary URI for the modified version
        const tempUri = vscode.Uri.parse(`untitled:Modified_${path.basename(change.file)}_${Date.now()}`);

        // Write the modified content to a temporary document
        const edit = new vscode.WorkspaceEdit();
        edit.createFile(tempUri, { ignoreIfExists: true });
        edit.insert(tempUri, new vscode.Position(0, 0), modifiedContent);
        await vscode.workspace.applyEdit(edit);

        // Open the temporary document
        const modifiedDoc = await vscode.workspace.openTextDocument(tempUri);

        // Execute the diff command to compare original vs. modified
        await vscode.commands.executeCommand('vscode.diff', originalUri, tempUri, `Diff: ${change.file} (Original vs. Modified)`);

        // Store the temporary URI for cleanup
        tempUris.push(tempUri);

    }

    vscode.window.showInformationMessage(
        'Review the diff preview. Apply or discard the changes?',
        'Apply Diff',
        'Discard Diff'
    ).then(async selection => {
        // Get all diff editors related to these temp URIs before taking action
        const diffEditors = vscode.window.visibleTextEditors.filter(editor =>
            editor.document.uri.scheme === 'diff' && tempUris.some(tempUri => 
                editor.document.uri.toString().includes(tempUri.toString())
            )
        );

        if (selection === 'Apply Diff') {
            await applyAllDiffs(changes, workspaceFolder.uri.fsPath);
            vscode.window.showInformationMessage('Diff changes applied to workspace files.');

            // Close all diff editors
            for (const editor of diffEditors) {
                await vscode.window.showTextDocument(editor.document, { preview: false });
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        } else if (selection === 'Discard Diff') {
            // Clean up temporary files
            for (const uri of tempUris) {
                await vscode.workspace.fs.delete(uri, { recursive: false });
            }
            
            // Close all diff editors
            for (const editor of diffEditors) {
                await vscode.window.showTextDocument(editor.document, { preview: false });
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
            vscode.window.showInformationMessage('Diff changes discarded.');
        }
    });

    // Helper function to apply all diffs to the workspace using VSCode APIs
    async function applyAllDiffs(changes: GitDiffChange[], rootPath: string): Promise<void> {
        for (const change of changes) {
            const filePath = path.join(rootPath, change.file);
            const fileUri = vscode.Uri.file(filePath);
            const diffLines = change.diff.split('\n');

            if (diffLines[0].startsWith('diff --git')) {
                if (diffLines[1].startsWith('deleted file mode')) {
                    try {
                        await vscode.workspace.fs.delete(fileUri, { recursive: false });
                    } catch (error) {
                        if (!(error instanceof vscode.FileSystemError && error.code === 'FileNotFound')) {
                            throw error;
                        }
                    }
                } else {
                    let originalContent = '';
                    try {
                        const fileContent = await vscode.workspace.fs.readFile(fileUri);
                        originalContent = new TextDecoder('utf-8').decode(fileContent);
                    } catch (error) {
                        if (!(error instanceof vscode.FileSystemError && error.code === 'FileNotFound')) {
                            throw error;
                        }
                    }
                    const newContent = applyGitDiff(originalContent, change.diff);
                    await vscode.workspace.fs.writeFile(fileUri, new TextEncoder().encode(newContent));
                }
            }
        }
    }
}

export function parseGitDiffResponse(response: string): GitDiffChange[] {
    let cleanedResponse = response.trim();
    cleanedResponse = cleanedResponse.replace(/```(?:json|diff)?\s*\n?/g, '').replace(/```\s*$/, '');

    const jsonStart = cleanedResponse.indexOf('[');
    const jsonEnd = cleanedResponse.lastIndexOf(']') + 1;
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.slice(jsonStart, jsonEnd);
    } else {
        throw new Error('No valid JSON array found in the response');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleanedResponse);
    } catch (error) {
        throw new Error(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!Array.isArray(parsed)) {
        throw new Error('AI response must be a JSON array');
    }

    return parsed.map((change: unknown, index: number) => {
        if (typeof change !== 'object' || change === null) {
            throw new Error(`Item at index ${index} must be a JSON object`);
        }

        const obj = change as Record<string, unknown>;

        const file = typeof obj.file === 'string' ? obj.file : '';
        if (!file) {
            throw new Error(`"file" at index ${index} must be a non-empty string`);
        }

        const diff = typeof obj.diff === 'string' ? obj.diff : '';
        if (!diff) {
            throw new Error(`"diff" at index ${index} must be a non-empty string`);
        }

        if (!diff.includes('@@')) {
            throw new Error(`"diff" at index ${index} must contain a valid git diff hunk header (e.g., "@@ -1,3 +1,4 @@")`);
        }

        return { file, diff } as GitDiffChange;
    });
}


export function applyGitDiff(original: string, diff: string): string {
    let lines = original.split('\n');
    const diffLines = diff.split('\n');
    let currentOriginalLine = 0; // 0-based index in original content
    let currentNewLine = 0;      // 0-based index in modified content
    let inHunk = false;

    for (let i = 0; i < diffLines.length; i++) {
        const diffLine = diffLines[i];

        // Skip metadata lines
        if (diffLine.startsWith('diff --git') || diffLine.startsWith('index') || 
            diffLine.startsWith('---') || diffLine.startsWith('+++')) {
            continue;
        }

        // Parse hunk header
        if (diffLine.startsWith('@@')) {
            const match = diffLine.match(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
            if (!match) {
                throw new Error(`Invalid hunk header: ${diffLine}`);
            }
            const oldStart = parseInt(match[1]) - 1; // Convert to 0-based index
            const oldCount = parseInt(match[2]);
            const newStart = parseInt(match[3]) - 1;
            const newCount = parseInt(match[4]);

            currentOriginalLine = oldStart;
            currentNewLine = newStart;
            inHunk = true;

            // Validate that the hunk applies to the current content
            let contextCheckIndex = i + 1;
            let originalLineCheck = oldStart;
            while (contextCheckIndex < diffLines.length && diffLines[contextCheckIndex].startsWith(' ')) {
                const contextLine = diffLines[contextCheckIndex].substr(1);
                if (originalLineCheck >= lines.length) {
                    throw new Error(`Hunk context exceeds file length at line ${originalLineCheck + 1}`);
                }
                if (lines[originalLineCheck] !== contextLine) {
                    throw new Error(`Context mismatch at line ${originalLineCheck + 1}: expected "${contextLine}", got "${lines[originalLineCheck]}"`);
                }
                originalLineCheck++;
                contextCheckIndex++;
            }
        } else if (inHunk) {
            if (diffLine.startsWith('+')) {
                // Add new line
                console.log(`Adding at ${currentNewLine + 1}: ${diffLine.substr(1)}`);
                lines.splice(currentNewLine, 0, diffLine.substr(1));
                currentNewLine++;
            } else if (diffLine.startsWith('-')) {
                // Remove line and validate
                if (currentOriginalLine >= lines.length) {
                    throw new Error(`Cannot remove line ${currentOriginalLine + 1}: exceeds file length`);
                }
                const expectedLine = diffLine.substr(1);
                if (lines[currentOriginalLine] !== expectedLine) {
                    throw new Error(`Line ${currentOriginalLine + 1} mismatch: expected "${expectedLine}", got "${lines[currentOriginalLine]}"`);
                }
                console.log(`Removing line ${currentOriginalLine + 1}: ${lines[currentOriginalLine]}`);
                lines.splice(currentOriginalLine, 1);
                // Do not increment currentOriginalLine since we removed it
            } else if (diffLine.startsWith(' ')) {
                // Context line, validate and move forward
                if (currentOriginalLine >= lines.length) {
                    throw new Error(`Context line exceeds file at ${currentOriginalLine + 1}`);
                }
                if (lines[currentOriginalLine] !== diffLine.substr(1)) {
                    throw new Error(`Context mismatch at ${currentOriginalLine + 1}: expected "${diffLine.substr(1)}", got "${lines[currentOriginalLine]}"`);
                }
                currentOriginalLine++;
                currentNewLine++;
            }
        }
    }

    return lines.join('\n');
}

export const format_git_diff_response = `Respond with a JSON array where each item is an object with "file" (string, relative path to the file) and "diff" (string, the git diff hunk for that file). Ensure that the diff is correctly formatted and can be applied using git apply or similar tools.`;
export const examples_git_diff_response = [
    {
      "file": "src/newfile.ts",
      "diff": "diff --git a/src/newfile.ts b/src/newfile.ts\nnew file mode 100644\nindex 0000000..e69de29\n--- /dev/null\n+++ b/src/newfile.ts\n@@ -0,0 +1,2 @@\n+console.log('Hello');\n+export {};"
    },
    {
      "file": "src/oldfile.ts",
      "diff": "diff --git a/src/oldfile.ts b/src/oldfile.ts\ndeleted file mode 100644\nindex e69de29..0000000\n--- a/src/oldfile.ts\n+++ /dev/null\n@@ -1,2 +0,0 @@\n-console.log('Goodbye');\n-export {};"
    },
    {
      "file": "src/main.ts",
      "diff": "diff --git a/src/main.ts b/src/main.ts\nindex abc1234..def5678 100644\n--- a/src/main.ts\n+++ b/src/main.ts\n@@ -1,3 +1,4 @@\n console.log('Start');\n+console.log('Modified');\n console.log('End');\n"
    }
  ];

