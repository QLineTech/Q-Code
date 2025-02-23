import { parseAIResponse, queryAI } from "./ai";
import { readFile, writeFile } from "./fileOperations";
import { EditorContext, EngineSettings } from "./types";
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode'; // Add this import

// engine_flutter.ts
export class FlutterEngine {

    
    static async processPrompt(prompt: string, context: EditorContext, extContext: ExtensionContext,states: {
        attachRelated: boolean;
        thinking: boolean;
        webAccess: boolean;
        autoApply: boolean;
        folderStructure: boolean;
    }): Promise<string> { 

        let response = `Flutter project detected. Processing prompt: "${prompt}"\n`;
        
        let aiPrompt = '';

        // Handle web access
        if (states.webAccess) {
            // This is a placeholder - you'd need to implement actual web search
            response += '[Web access enabled - search results would be included here]\n';
        }

        // Handle thinking (verbose processing)
        if (states.thinking) {
            response += `[Processing thoughts: Analyzing "${prompt}" with context]\n`;
        }

        // Handle cases based on whether there's a selection
        if (context.selection) {
            // Selection-specific handling
            aiPrompt = 'Please learn all given codes and then start to implement MY_REQUEST which given in best stable and correct logic, double check after result and regenerate if it has bugs and mistakes and give final output.\n\n';
            aiPrompt += `**Selected code to modify (\`${context.fileName}\`)**:\n\`\`\`${context.fileType}\n${context.selection.text}\n\`\`\`\n\n`;
            
            if (states.attachRelated) {
                // Placeholder for linting analysis
                const relatedInfo = await this.findRelatedElements(context);
                aiPrompt += `Related elements:\n\`\`\`dart\n${relatedInfo}\n\`\`\`\n\n`;
            }

            if (states.folderStructure) {
                const folderStructure = this.getFolderStructure(context);
                aiPrompt += `Project folder structure (./lib/*):\n\`\`\`\n${folderStructure}\n\`\`\`\n\n`;
            }

            aiPrompt += `MY REQUEST: \n\`\`\`\n"${prompt}"\n\`\`\`\n`;
            aiPrompt += 'Return ONLY a JSON array of objects in this exact format, with no additional text before or after:\n' +
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
        } else {
                // Whole file handling
                aiPrompt = 'Please learn all given codes and then start to implement user request which given in best stable and correct logic, double check after result and regenerate if it has bugs and mistakes and give final output.\n\n';            
                aiPrompt += `**Full file content to modify (\`${context.fileName}\`)**:\n\`\`\`${context.fileType}\n${context.content}\n\`\`\`\n\n`;

                if (states.attachRelated) {
                    const relatedInfo = await this.findRelatedElements(context);
                    aiPrompt += `Related elements:\n\`\`\`dart\n${relatedInfo}\n\`\`\`\n\n`;
                }

                if (states.folderStructure) {
                    const folderStructure = this.getFolderStructure(context);
                    aiPrompt += `Project folder structure (./lib/*):\n\`\`\`\n${folderStructure}\n\`\`\`\n\n`;
                }

                aiPrompt += `MY REQUEST: \n\`\`\`\n"${prompt}"\n\`\`\`\n`;
                aiPrompt += 'Return ONLY a JSON array of objects in this exact format, with no additional text before or after:\n' +
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
        }



        
        // Add context information
        response += `Context: ${context.fileName} (${context.fileType} file)\n\n`;
        response += '```json\n' + JSON.stringify(context, null, 2) + '\n```\n';

        
        response += 'Prompt:\n\n```markdown\n' + aiPrompt + '\n```\n';

        // Thinking process
        // Get File Structure
        // Get Relations
        // Get Standards
        // Examples
        // Docs
        // Rules
        // Output
        // Add AI analysis
        // Query AI
        try {
            const aiAnalysis = await queryAI(aiPrompt, extContext, 'grok3');
            // response += '\nResponse:\n```json\n' + aiAnalysis + '\n```';
            const codeChanges = parseAIResponse(aiAnalysis);
            if (true || states.autoApply) {
                response += '\n[Auto-apply enabled - changes would be applied automatically]';
                
                // Auto-apply implementation
                for (const change of codeChanges) {
                    try {
                        // Read the file content (assuming you have a file system access method)
                        let fileContent = await readFile(context.filePath, 'utf8');
                        let lines = fileContent.split('\n');
    
                        // Validate line numbers
                        if (change.line < 1 || change.finish_line > lines.length) {
                            throw new Error(`Invalid line range: ${change.line}-${change.finish_line}`);
                        }
    
                        switch (change.action) {
                            case 'add': {
                                // Add new code at specified position
                                let targetLine = lines[change.line - 1];
                                let newLine = targetLine.slice(0, change.position) + 
                                            change.newCode + 
                                            targetLine.slice(change.position);
                                lines[change.line - 1] = newLine;
                                break;
                            }
                            
                            case 'replace': {
                                if (change.line === change.finish_line) {
                                    // Single line replacement
                                    let targetLine = lines[change.line - 1];
                                    let newLine = targetLine.slice(0, change.position) + 
                                                change.newCode + 
                                                targetLine.slice(change.finish_position);
                                    lines[change.line - 1] = newLine;
                                } else {
                                    // Multi-line replacement
                                    let before = lines[change.line - 1].slice(0, change.position);
                                    let after = lines[change.finish_line - 1].slice(change.finish_position);
                                    // Replace the range with new code
                                    lines.splice(
                                        change.line - 1,
                                        change.finish_line - change.line + 1,
                                        before + change.newCode + after
                                    );
                                }
                                break;
                            }
                            
                            case 'remove': {
                                if (change.line === change.finish_line) {
                                    // Single line removal
                                    let targetLine = lines[change.line - 1];
                                    let newLine = targetLine.slice(0, change.position) + 
                                                targetLine.slice(change.finish_position);
                                    lines[change.line - 1] = newLine;
                                } else {
                                    // Multi-line removal
                                    let before = lines[change.line - 1].slice(0, change.position);
                                    let after = lines[change.finish_line - 1].slice(change.finish_position);
                                    lines.splice(
                                        change.line - 1,
                                        change.finish_line - change.line + 1,
                                        before + after
                                    );
                                }
                                break;
                            }
                        }
    
                        // Write the modified content back to the file
                        let newContent = lines.join('\n');
                        await writeFile(context.filePath, newContent, 'utf8');
                        
                        response += `\n[Applied ${change.action} to ${change.file}:${change.line} - ${change.reason}]`;
    
                    } catch (error) {
                        response += `\n[Failed to apply change to ${change.file}:${change.line} - ${
                            error instanceof Error ? error.message : 'Unknown error'
                        }]`;
                    }
                }
            }
            
            response += '\nResponse:\n```json\n' + JSON.stringify(codeChanges, null, 2) + '\n```';
        } catch (error) {
            response += `\nAI Analysis Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

       
        
        return response;
    }

    private static async findRelatedElements(context: EditorContext): Promise<string> {
        let result = 'Related Elements:\n';
        const codeToAnalyze = context.selection?.text || context.content;
        
        try {
            // 1. Get document symbols using VSCode API
            const uri = vscode.Uri.file(context.filePath);
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeDocumentSymbolProvider',
                uri
            );

            // 2. Extract packages from imports
            const importRegex = /import\s+['"]([^'"]+)['"]/g;
            const packages = new Set<string>();
            let match;
            while ((match = importRegex.exec(codeToAnalyze)) !== null) {
                const packagePath = match[1];
                if (packagePath.startsWith('package:')) {
                    packages.add(packagePath.split('/')[0]); // Get base package name
                }
            }

            // 3. Find related symbols based on selection or whole file
            const relatedSymbols = new Set<string>();
            const variableRegex = /\b(var|final|const)?\s*(\w+)\s*=/g;
            const functionRegex = /(void|Future|[A-Z]\w*)\s+(\w+)\s*\(/g;

            // Analyze variables
            while ((match = variableRegex.exec(codeToAnalyze)) !== null) {
                relatedSymbols.add(match[2]);
            }

            // Analyze functions
            while ((match = functionRegex.exec(codeToAnalyze)) !== null) {
                relatedSymbols.add(match[2]);
            }

            // 4. If there's a selection, find specific references
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

            // 5. Format the results
            if (packages.size > 0) {
                result += 'Packages:\n';
                packages.forEach(pkg => {
                    result += `- ${pkg}\n`;
                });
            }

            if (relatedSymbols.size > 0) {
                result += '\nSymbols (Functions/Variables):\n';
                relatedSymbols.forEach(symbol => {
                    result += `- ${symbol}\n`;
                });
            }

            // 6. Add file references from project structure
            if (context.project.directories.length > 0) {
                result += '\nRelated Files:\n';
                context.project.directories
                    .filter(dir => dir.path.includes('/lib/'))
                    .forEach(dir => {
                        result += `- ${dir.name} (${dir.path})\n`;
                    });
            }

            // If no elements found
            if (packages.size === 0 && relatedSymbols.size === 0) {
                result += 'No related elements found in the analyzed code.\n';
            }

        } catch (error) {
            result += `Error analyzing related elements: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
        }

        return result;
    }

    private static getFolderStructure(context: EditorContext): string {
        // Build folder structure from context.project.directories
        let structure = '';
        const libDirs = context.project.directories
            .filter(dir => dir.path.includes('/lib/'))
            .map(dir => dir.path);
        
        structure = libDirs.join('\n');
        return structure || 'No lib directory structure available';
    }

}