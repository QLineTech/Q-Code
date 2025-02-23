// engine_handler.ts
import { FlutterEngine } from './engine_flutter';
import { PythonEngine } from './engine_python';
import { LaravelEngine } from './engine_laravel';
import { JavascriptEngine } from './engine_javascript';
import { TypescriptEngine } from './engine_typescript';
import { EditorContext, ProjectType, AIPrompt, CodeChange } from './types';
import { ExtensionContext } from 'vscode';
import { queryAI, parseAIResponse } from './ai';
import { readFile, writeFile } from './fileOperations';

export class EngineHandler {
    static async processPrompt(
        prompt: string,
        editorContext: EditorContext,
        extContext: ExtensionContext,
        states: {
            attachRelated: boolean;
            thinking: boolean;
            webAccess: boolean;
            autoApply: boolean;
            folderStructure: boolean;
        }
    ): Promise<string> {
        const projectType = editorContext.project.type.type;
        let response = '';

        // Process based on project type
        let aiPrompt: AIPrompt;
        switch (projectType) {
            case 'flutter':
                aiPrompt = await FlutterEngine.processPrompt(prompt, editorContext, extContext, states);
                response += `Flutter project detected. Processing prompt: "${prompt}"\n`;
                break;
            default:
                return `No specific engine found for project type "${projectType}".\n` +
                       `Processing prompt generically: "${prompt}"\n` +
                       `Context: ${JSON.stringify(editorContext, null, 2)}`;
        }

        // Construct the full AI prompt string from AIPrompt object
        let fullPrompt = aiPrompt.systemPrompt + '\n';
        aiPrompt.attachments.forEach(attachment => {
            if (attachment.type === 'code' && attachment.language) {
                fullPrompt += `\`\`\`${attachment.language}\n${attachment.content}\n\`\`\`\n\n`;
            } else {
                fullPrompt += `${attachment.content}\n\n`;
            }
        });
        fullPrompt += `MY REQUEST: \n\`\`\`\n"${aiPrompt.userRequest}"\n\`\`\`\n\n`;
        fullPrompt += aiPrompt.responseFormat;

        // Add context information to response
        response += `Context: ${editorContext.fileName} (${editorContext.fileType} file)\n\n`;
        response += '```json\n' + JSON.stringify(editorContext, null, 2) + '\n```\n';
        response += 'Prompt:\n\n```markdown\n' + fullPrompt + '\n```\n';

        // Query AI and process response
        try {
            const aiAnalysis = await queryAI(fullPrompt, extContext, 'grok3');
            const codeChanges = parseAIResponse(aiAnalysis);

            // Handle auto-apply if enabled
            if (states.autoApply) {
                response += '\n[Auto-apply enabled - changes applied automatically]\n';
                for (const change of codeChanges) {
                    try {
                        let fileContent = await readFile(editorContext.filePath, 'utf8');
                        let lines = fileContent.split('\n');

                        if (change.line < 1 || change.finish_line > lines.length) {
                            throw new Error(`Invalid line range: ${change.line}-${change.finish_line}`);
                        }

                        switch (change.action) {
                            case 'add': {
                                let targetLine = lines[change.line - 1];
                                let newLine = targetLine.slice(0, change.position) +
                                            change.newCode +
                                            targetLine.slice(change.position);
                                lines[change.line - 1] = newLine;
                                break;
                            }
                            case 'replace': {
                                if (change.line === change.finish_line) {
                                    let targetLine = lines[change.line - 1];
                                    let newLine = targetLine.slice(0, change.position) +
                                                change.newCode +
                                                targetLine.slice(change.finish_position);
                                    lines[change.line - 1] = newLine;
                                } else {
                                    let before = lines[change.line - 1].slice(0, change.position);
                                    let after = lines[change.finish_line - 1].slice(change.finish_position);
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
                                    let targetLine = lines[change.line - 1];
                                    let newLine = targetLine.slice(0, change.position) +
                                                targetLine.slice(change.finish_position);
                                    lines[change.line - 1] = newLine;
                                } else {
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

                        let newContent = lines.join('\n');
                        await writeFile(editorContext.filePath, newContent, 'utf8');
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
}