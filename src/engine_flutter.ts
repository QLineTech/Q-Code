// engine_flutter.ts
import { EditorContext, AIPrompt } from "./types";
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';

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
                content: `**Selected code to modify (\`${context.fileName}\`)**:\n${context.selection.text}`
            });

            if (states.attachRelated) {
                const relatedInfo = await this.findRelatedElements(context);
                attachments.push({
                    type: 'code',
                    language: 'dart',
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
                content: `**Full file content to modify (\`${context.fileName}\`)**:\n${context.content}`
            });

            if (states.attachRelated) {
                const relatedInfo = await this.findRelatedElements(context);
                attachments.push({
                    type: 'code',
                    language: 'dart',
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
            '    "line": <start-line>,\n' +
            '    "position": <start-position>,\n' +
            '    "finish_line": <finish-line>,\n' +
            '    "finish_position": <finish-position>,\n' +
            '    "action": "add|replace|remove",\n' +
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

    private static async findRelatedElements(context: EditorContext): Promise<string> {
        let result = 'Related Elements:\n';
        const codeToAnalyze = context.selection?.text || context.content;

        try {
            const uri = vscode.Uri.file(context.filePath);
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeDocumentSymbolProvider',
                uri
            );

            const importRegex = /import\s+['"]([^'"]+)['"]/g;
            const packages = new Set<string>();
            let match;
            while ((match = importRegex.exec(codeToAnalyze)) !== null) {
                const packagePath = match[1];
                if (packagePath.startsWith('package:')) {
                    packages.add(packagePath.split('/')[0]);
                }
            }

            const relatedSymbols = new Set<string>();
            const variableRegex = /\b(var|final|const)?\s*(\w+)\s*=/g;
            const functionRegex = /(void|Future|[A-Z]\w*)\s+(\w+)\s*\(/g;

            while ((match = variableRegex.exec(codeToAnalyze)) !== null) {
                relatedSymbols.add(match[2]);
            }
            while ((match = functionRegex.exec(codeToAnalyze)) !== null) {
                relatedSymbols.add(match[2]);
            }

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

            if (packages.size > 0) {
                result += 'Packages:\n';
                packages.forEach(pkg => result += `- ${pkg}\n`);
            }

            if (relatedSymbols.size > 0) {
                result += '\nSymbols (Functions/Variables):\n';
                relatedSymbols.forEach(symbol => result += `- ${symbol}\n`);
            }

            if (context.project.directories.length > 0) {
                result += '\nRelated Files:\n';
                context.project.directories
                    .filter(dir => dir.path.includes('/lib/'))
                    .forEach(dir => result += `- ${dir.name} (${dir.path})\n`);
            }

            if (packages.size === 0 && relatedSymbols.size === 0) {
                result += 'No related elements found in the analyzed code.\n';
            }
        } catch (error) {
            result += `Error analyzing related elements: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
        }

        return result;
    }

    private static getFolderStructure(context: EditorContext): string {
        const libDirs = context.project.directories
            .filter(dir => dir.path.includes('/lib/'))
            .map(dir => dir.path);
        return libDirs.join('\n') || 'No lib directory structure available';
    }

}