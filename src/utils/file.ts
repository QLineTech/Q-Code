// src/utils/file.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import ignore from 'ignore';

/**
 * Reads the content of a file at the specified path.
 * @param filePath Absolute path to the file.
 * @param encoding File encoding, defaults to 'utf8'.
 * @returns File content as a string.
 * @throws Error with detailed message if reading fails.
 */
export async function readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    try {
        const uri = vscode.Uri.file(filePath);
        const content = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(content).toString(encoding);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to read file "${filePath}": ${message}`);
    }
}

/**
 * Writes content to a file at the specified path.
 * @param filePath Absolute path to the file.
 * @param content Content to write.
 * @param encoding File encoding, defaults to 'utf8'.
 * @throws Error with detailed message if writing fails.
 */
export async function writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    try {
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content, encoding));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to write file "${filePath}": ${message}`);
    }
}

/**
 * Generates an XML representation of the folder structure starting from a root path.
 * Respects .gitignore and skips specified folders dynamically.
 * @param rootPath The absolute path to the root directory.
 * @param options Optional configuration for folder structure generation.
 * @param options.currentFilePath Optional path of the current file to determine the workspace.
 * @param options.foldersToSkip Optional array of folder names to skip (defaults to common dev folders).
 * @param options.gitignorePath Optional custom path to .gitignore file (defaults to rootPath/.gitignore).
 * @returns XML string representing the folder structure.
 */
export async function getFolderStructure(
    rootPath: string,
    options: {
        currentFilePath?: string;
        foldersToSkip?: string[];
        gitignorePath?: string;
    } = {}
): Promise<string> {
    const { currentFilePath, foldersToSkip = ['.git', '.dart_tool', '.idea', 'build', '.gradle'], gitignorePath } = options;

    // Determine the workspace folder if currentFilePath is provided
    let effectiveRootPath = rootPath;
    if (currentFilePath) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentFilePath));
        if (!workspaceFolder) {
            return '<root>No workspace folder found</root>';
        }
        effectiveRootPath = workspaceFolder.uri.fsPath;
    }

    // Read .gitignore if a path is provided or use default
    let ignorePatterns: string[] = [];
    const effectiveGitignorePath = gitignorePath || path.join(effectiveRootPath, '.gitignore');
    try {
        const gitignoreContent = await fs.readFile(effectiveGitignorePath, 'utf8');
        ignorePatterns = gitignoreContent
            .split('\n')
            .filter(line => line.trim() && !line.startsWith('#'));
    } catch (error) {
        // .gitignore not found or error reading, proceed without ignoring
    }

    // Combine .gitignore patterns with folders to skip
    const ig = ignore().add([...ignorePatterns, ...foldersToSkip]);

    const getDirStructure = async (currentPath: string, level: number = 0): Promise<string> => {
        const relativeCurrent = path.relative(effectiveRootPath, currentPath).replace(/\\/g, '/');
        if (relativeCurrent && ig.ignores(relativeCurrent)) {
            return '';
        }

        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        let xml = '';
        const dirName = path.basename(currentPath);

        // Skip if this is the root folder (to avoid duplicating root name)
        const isRoot = currentPath === effectiveRootPath;
        if (!isRoot) {
            xml += `${'  '.repeat(level)}<folder name="${dirName}">\n`;
        }

        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);
            const relativeEntry = path.relative(effectiveRootPath, entryPath).replace(/\\/g, '/');
            if (ig.ignores(relativeEntry)) {
                continue;
            }

            if (entry.isDirectory()) {
                const subDirXml = await getDirStructure(entryPath, level + 1);
                if (subDirXml) { // Only include if subdirectory has content
                    xml += subDirXml;
                }
            } else {
                xml += `${'  '.repeat(level + 1)}<file name="${entry.name}"/>\n`;
            }
        }

        if (!isRoot && xml) { // Only close tag if we opened one and have content
            xml += `${'  '.repeat(level)}</folder>\n`;
        }

        return xml;
    };

    const structure = await getDirStructure(effectiveRootPath);
    return structure ? `<root>\n${structure}</root>` : '<root>No folder structure available</root>';
}