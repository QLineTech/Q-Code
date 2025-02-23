// engine_flutter.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { EditorContext, AIPrompt } from "./types";
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';
import ignore from 'ignore';

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
        }
    ): Promise<AIPrompt> {

        // Get workspace root
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(context.filePath));
        const rootPath = workspaceFolder ? workspaceFolder.uri.fsPath : path.dirname(context.filePath);
        const currentRelativePath = path.relative(rootPath, context.filePath).replace(/\\/g, '/'); // Normalize to forward slashes

        // Enhanced system prompt with relative path instruction
        let systemPrompt = 'You are an expert Flutter/Dart developer. Learn all given code and implement the user request with stable, correct logic. Double-check the result for bugs or mistakes and regenerate if needed to provide a final, error-free output.\n\n';

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
            attachments.push({
                type: 'code',
                language: context.fileType,
                content: `**Selected code to modify (\`${context.fileName}\`)**:\n${context.selection.text}`,
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
                    content: `Project folder structure (./lib/*):\n${folderStructure}`
                });
            }
        } else {
            // Whole file handling
            attachments.push({
                type: 'code',
                language: context.fileType,
                content: `**Full file content to modify (\`${context.fileName}\`)**:\n${context.content}`,
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
                    content: `Project folder structure (./lib/*):\n${folderStructure}`
                });
            }
        }

        // User request
        const userRequest = prompt;

        // Response format instructions
        const responseFormat = 'Return ONLY a JSON array of objects in this exact format, with no additional text before or after:\n' +
        '```json\n' +
        '[\n' +
        '  {\n' +
        '    "file": "<file-name>",\n' +
        '    "relativePath": "<relative-path>",\n' +
        '    "line": <start-line>,\n' +
        '    "position": <start-position>,\n' +
        '    "finish_line": <finish-line>,\n' +
        '    "finish_position": <finish-position>,\n' +
        '    "action": "add|replace|remove|create|remove_file",\n' +
        '    "reason": "<reason>",\n' +
        '    "newCode": "<new code>"\n' +
        '  }\n' +
        ']\n' +
        '```\n' +
        'Include only the JSON array with the specified structure. Do not add any explanatory text, prefixes, or postfixes.';
        
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
            // Collect local imports
            const importRegex = /import\s+['"]([^'"]+)['"]/g;
            const localImports = new Set<string>();
            let match;
            while ((match = importRegex.exec(codeToAnalyze)) !== null) {
                const importPath = match[1];
                if (!importPath.startsWith('package:')) {
                    // Relative import
                    const absolutePath = path.resolve(path.dirname(context.filePath), importPath);
                    const relativePath = path.relative(rootPath, absolutePath).replace(/\\/g, '/');
                    localImports.add(relativePath);
                }
            }
    
            if (localImports.size > 0) {
                result += 'Locally Imported Files:\n';
                localImports.forEach(imp => result += `- ${imp}\n`);
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
    
            // Handle selected symbols using VSCode symbol provider
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
            return 'No workspace folder found';
        }
        const rootPath = workspaceFolder.uri.fsPath;
    
        // Read .gitignore
        const gitignorePath = path.join(rootPath, '.gitignore');
        let ignorePatterns: string[] = [];
        try {
            const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
            ignorePatterns = gitignoreContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        } catch (error) {
            // .gitignore not found or error reading, proceed without ignoring
        }
    
        const ig = ignore().add(ignorePatterns);
    
        const getDirStructure = async (currentPath: string, indent: string = ''): Promise<string> => {
            let result = '';
            const relativeCurrent = path.relative(rootPath, currentPath).replace(/\\/g, '/');
            if (relativeCurrent && ig.ignores(relativeCurrent)) {
                return '';
            }
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                const entryPath = path.join(currentPath, entry.name);
                const relativeEntry = path.relative(rootPath, entryPath).replace(/\\/g, '/');
                if (ig.ignores(relativeEntry)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    result += `${indent}- ${entry.name}/\n`;
                    result += await getDirStructure(entryPath, indent + '  ');
                } else {
                    result += `${indent}- ${entry.name}\n`;
                }
            }
            return result;
        };
    
        const structure = await getDirStructure(rootPath);
        return structure || 'No folder structure available';
    }

}