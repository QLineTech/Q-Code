// engine_flutter.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { EditorContext, AIPrompt } from "./types";
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import ignore from 'ignore';
import { addLineNumbers, getMarkdownLanguage } from './utils';
import { format_git_diff_response, examples_git_diff_response } from './utils';


export class FlutterEngine {

    static async processPrompt(
        prompt: string,
        context: EditorContext,
        extContext: ExtensionContext,
        states: {
            attachRelated: boolean;
            thinking: boolean;
            webAccess: boolean;
            autoApply: boolean;
            folderStructure: boolean;
            includeOpenTabs: boolean;
        }
    ): Promise<AIPrompt> {

        // Get workspace root
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(context.filePath));
        const rootPath = workspaceFolder ? workspaceFolder.uri.fsPath : path.dirname(context.filePath);
        const currentRelativePath = path.relative(rootPath, context.filePath).replace(/\\/g, '/'); // Normalize to forward slashes

        // Enhanced system prompt with relative path instruction
        let systemPrompt = 'You are an expert Flutter/Dart developer. Learn all given code and implement the user request with stable, correct logic. Double-check the result for bugs or mistakes and regenerate if needed to provide a final, error-free output.\n\n' +
                           'When generating git diffs, ensure maximum accuracy in line numbers. Double and triple check all line numbers against the provided code (including line-numbered attachments) to match the exact positions. Verify that hunk headers (e.g., "@@ -1,3 +1,4 @@") precisely reflect the original and modified line ranges. Any inaccuracy in line numbers is unacceptable—recompute and validate until perfect.\n\n';
        const attachments: AIPrompt['attachments'] = [];

        // Handle web access (placeholder for now)
        if (states.webAccess) {
            attachments.push({
                type: 'text',
                content: '[Web access enabled - search results would be included here]'
            });
        }

        // Handle thinking (verbose processing)
        if (states.thinking) {
            attachments.push({
                type: 'text',
                content: `[Processing thoughts: Analyzing "${prompt}" with context]`
            });
        }



        // Handle cases based on whether there's a selection
        if (context.selection) {
            // Selection-specific handling
            const contentWithLines = addLineNumbers(context.selection.text, context.selection.startLine);
           
            attachments.push({
                type: 'code',
                language: context.fileType,
                title: `**Selected code to modify (\`${currentRelativePath}\`)**`,
                content: `${contentWithLines}`,
                relativePath: currentRelativePath 
            });

            if (states.attachRelated) {
                const relatedInfo = await this.findRelatedElements(context, rootPath);
                attachments.push({
                    type: 'text', // Changed from 'code' to 'text'
                    content: `Related elements:\n${relatedInfo}`
                });
            }

            if (states.folderStructure) {
                const folderStructure = this.getFolderStructure(context);
                attachments.push({
                    type: 'structure',
                    content: `Project folder structure:\n\`\`\`xml\n${folderStructure}\n\`\`\``
                });
            }
        } else {
            // Whole file handling
            attachments.push({
                type: 'code',
                language: context.fileType,
                title: `**Full file content to modify (\`${currentRelativePath}\`)**`,
                content: `${addLineNumbers(context.content)}`,
                relativePath: currentRelativePath 
            });

            if (states.attachRelated) {
                const relatedInfo = await this.findRelatedElements(context, rootPath);
                attachments.push({
                    type: 'text', // Changed from 'code' to 'text'
                    content: `Related elements:\n${relatedInfo}`
                });
            }

            if (states.folderStructure) {
                const folderStructure = await this.getFolderStructure(context);
                attachments.push({
                    type: 'structure',
                    content: `Project folder structure:\n\`\`\`xml\n${folderStructure}\n\`\`\``
                });
            }
        }

        if (states.includeOpenTabs && context.openTabs && context.openTabs.length > 0) {
            context.openTabs.forEach((tab) => {
                if (tab.filePath !== context.filePath) {
                    const tabRelativePath = path.relative(rootPath, tab.filePath).replace(/\\/g, '/');
                    attachments.push({
                        type: 'code',
                        language: tab.fileType,
                        title: `**Open tab content (\`${tabRelativePath}\`)**`,
                        content: `${addLineNumbers(tab.content)}`,
                        relativePath: tabRelativePath
                    });
                }
            });
        }

        // User request
        const userRequest = prompt;

        // Response format instructions
        // Response format instructions
        const responseFormat = `${format_git_diff_response}\n\n` +
    'Example:\n' +
    '```json\n' +
    JSON.stringify(examples_git_diff_response, null, 2) + '\n' +
    '```\n' +
    'Return ONLY the JSON array, with no text before or after.';

    
        // Construct and return the AIPrompt object
        return {
            systemPrompt,
            attachments,
            userRequest,
            responseFormat
        };
    }

    private static async findRelatedElements(context: EditorContext, rootPath: string): Promise<string> {
        let result = 'Related Elements:\n';
        const codeToAnalyze = context.selection?.text || context.content;
    
        try {
            // Collect local imports and their content
            const importRegex = /import\s+['"]([^'"]+)['"]/g;
            const localImports = new Map<string, string>(); // Map to store path -> content
            let match;
            while ((match = importRegex.exec(codeToAnalyze)) !== null) {
                const importPath = match[1];
                if (!importPath.startsWith('package:')) {
                    // Relative import
                    const absolutePath = path.resolve(path.dirname(context.filePath), importPath);
                    const relativePath = path.relative(rootPath, absolutePath).replace(/\\/g, '/');
                    try {
                        const fileContent = await fs.readFile(absolutePath, 'utf8');
                        const fileExt = path.extname(relativePath).slice(1); // e.g., 'dart', 'ts'
                        localImports.set(relativePath, fileContent);
                    } catch (error) {
                        localImports.set(relativePath, `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }
    
            if (localImports.size > 0) {
                result += 'Locally Imported Files:\n';
                for (const [relativePath, content] of localImports) {
                    const fileExt = path.extname(relativePath).slice(1) || 'text';
                    const markdownLang = getMarkdownLanguage(fileExt);
                    
                    result += `\nfile_relative_path: ${relativePath}\n\`\`\`${markdownLang}\n${content}\n\`\`\`\n`;
                }
            }
    
            // Collect packages (unchanged)
            const packages = new Set<string>();
            importRegex.lastIndex = 0;
            while ((match = importRegex.exec(codeToAnalyze)) !== null) {
                const packagePath = match[1];
                if (packagePath.startsWith('package:')) {
                    packages.add(packagePath.split('/')[0].split(':')[1]);
                }
            }
    
            if (packages.size > 0) {
                result += '\nPackages:\n';
                packages.forEach(pkg => result += `- ${pkg}\n`);
            }
    
            // Collect symbols (unchanged)
            const relatedSymbols = new Set<string>();
            const variableRegex = /\b(var|final|const)?\s*(\w+)\s*=/g;
            const functionRegex = /(void|Future|[A-Z]\w*)\s+(\w+)\s*\(/g;
    
            while ((match = variableRegex.exec(codeToAnalyze)) !== null) {
                relatedSymbols.add(match[2]);
            }
            while ((match = functionRegex.exec(codeToAnalyze)) !== null) {
                relatedSymbols.add(match[2]);
            }
    
            const uri = vscode.Uri.file(context.filePath);
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeDocumentSymbolProvider',
                uri
            );
    
            if (context.selection && symbols) {
                const selectionRange = new vscode.Range(
                    context.selection.startLine,
                    context.selection.startCharacter,
                    context.selection.endLine,
                    context.selection.endCharacter
                );
    
                symbols.forEach(symbol => {
                    if (selectionRange.intersection(new vscode.Range(
                        symbol.location.range.start,
                        symbol.location.range.end
                    ))) {
                        relatedSymbols.add(symbol.name);
                    }
                });
            }
    
            if (relatedSymbols.size > 0) {
                result += '\nSymbols (Functions/Variables):\n';
                relatedSymbols.forEach(symbol => result += `- ${symbol}\n`);
            }
    
            if (localImports.size === 0 && packages.size === 0 && relatedSymbols.size === 0) {
                result += 'No related elements found in the analyzed code.\n';
            }
        } catch (error) {
            result += `Error analyzing related elements: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
        }
    
        return result;
    }

    private static async getFolderStructure(context: EditorContext): Promise<string> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(context.filePath));
        if (!workspaceFolder) {
            return '<root>No workspace folder found</root>';
        }
        const rootPath = workspaceFolder.uri.fsPath;
    
        // Read .gitignore
        const gitignorePath = path.join(rootPath, '.gitignore');
        let ignorePatterns: string[] = [];
        try {
            const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
            ignorePatterns = gitignoreContent.split('\n')
                .filter(line => line.trim() && !line.startsWith('#'));
        } catch (error) {
            // .gitignore not found or error reading, proceed without ignoring
        }
    
        // Add additional patterns to skip
        const foldersToSkip = ['.git', '.dart_tool', '.idea', 'build', '.gradle'];
        const ig = ignore().add([...ignorePatterns, ...foldersToSkip]);
    
        const getDirStructure = async (currentPath: string, level: number = 0): Promise<string> => {
            const relativeCurrent = path.relative(rootPath, currentPath).replace(/\\/g, '/');
            if (relativeCurrent && ig.ignores(relativeCurrent)) {
                return '';
            }
    
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            let xml = '';
            const dirName = path.basename(currentPath);
    
            // Skip if this is the root folder (to avoid duplicating root name)
            const isRoot = currentPath === rootPath;
            if (!isRoot) {
                xml += `${'  '.repeat(level)}<folder name="${dirName}">\n`;
            }
    
            for (const entry of entries) {
                const entryPath = path.join(currentPath, entry.name);
                const relativeEntry = path.relative(rootPath, entryPath).replace(/\\/g, '/');
                if (ig.ignores(relativeEntry)) {
                    continue;
                }
    
                if (entry.isDirectory()) {
                    const subDirXml = await getDirStructure(entryPath, level + 1);
                    if (subDirXml) {  // Only include if subdirectory has content
                        xml += subDirXml;
                    }
                } else {
                    xml += `${'  '.repeat(level + 1)}<file name="${entry.name}"/>\n`;
                }
            }
    
            if (!isRoot && xml) {  // Only close tag if we opened one and have content
                xml += `${'  '.repeat(level)}</folder>\n`;
            }
    
            return xml;
        };
    
        const structure = await getDirStructure(rootPath);
        return structure ? `<root>\n${structure}</root>` : '<root>No folder structure available</root>';
    }

}