// engine_handler.ts
import { FlutterEngine } from './engine_flutter';
import { PythonEngine } from './engine_python';
import { LaravelEngine } from './engine_laravel';
import { JavascriptEngine } from './engine_javascript';
import { TypescriptEngine } from './engine_typescript';
import { EditorContext, ProjectType, AIPrompt, CodeChange, QCodeSettings } from './types';
import { ExtensionContext } from 'vscode';
import { queryAI, parseAIResponse } from './ai';
import { readFile, writeFile } from './fileOperations';
import { getValidSettings } from './settings';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getMarkdownLanguage } from './utils';

export class EngineHandler {
    static async processPrompt(
        prompt: string,
        editorContext: EditorContext,
        context: ExtensionContext
    ): Promise<string> {
        const projectType = editorContext.project.type.type;
        let response = '';
        const settings: QCodeSettings = getValidSettings(context.globalState.get('qcode.settings'));
        const states = settings.chatStates;

        // Process based on project type
        let aiPrompt: AIPrompt;
        switch (projectType) {
            case 'flutter':
                aiPrompt = await FlutterEngine.processPrompt(prompt, editorContext, context, states);
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
                const markdownLang = getMarkdownLanguage(attachment.language);
                fullPrompt += `\`\`\`${markdownLang}\n${attachment.content}\n\`\`\`\n\n`;
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

        // Determine the first active AI model
        const aiModels = settings.aiModels;
        const activeAI = Object.keys(aiModels).find(
            (provider) => aiModels[provider as keyof QCodeSettings['aiModels']].active
        ) as keyof QCodeSettings['aiModels'] | undefined;

        if (!activeAI) {
            const errorMessage = 'No active AI model found. Please configure an active AI model in QCode settings.';
            await vscode.window.showErrorMessage(errorMessage, 'Open Settings').then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'qcode');
                }
            });
            response += `\n${errorMessage}`;
            return response;
        }

        // Query AI and process response
        try {
            const aiAnalysis = await queryAI(fullPrompt, context, activeAI);
            const codeChanges = parseAIResponse(aiAnalysis);

            // Handle auto-apply if enabled
            if (states.autoApply) {
                response += '\n[Auto-apply enabled - changes applied automatically]\n';
                
                
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(editorContext.filePath));
                if (!workspaceFolder) {
                    throw new Error('No workspace folder found for the current file');
                }
                const rootPath = workspaceFolder.uri.fsPath;


                for (const change of codeChanges) {
                    try {

                        // Validate relativePath for 'create' and 'remove_file'
                        if ((change.action === 'create' || change.action === 'remove_file') && !change.relativePath) {
                            throw new Error(`Action '${change.action}' requires relativePath`);
                        }
                        
                        // Determine target file path

                        let targetPath: string;
                        if (change.relativePath) {
                            const relPath = change.relativePath.startsWith('./') ? change.relativePath.slice(2) : change.relativePath;
                            targetPath = path.resolve(rootPath, relPath);
                            if (!targetPath.startsWith(rootPath)) {
                                throw new Error(`Target path ${targetPath} is outside the workspace root`);
                            }
                        } else {
                            targetPath = editorContext.filePath;
                        }
            
                        switch (change.action) {
                            case 'create':
                                if (change.line !== null || change.position !== null || change.finish_line !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'create' should not have line or position fields`);
                                }
                                await fs.writeFile(targetPath, change.newCode, 'utf8');
                                response += `\n[Created file ${change.relativePath || path.basename(targetPath)}]`;
                                break;
            
                            case 'remove_file':
                                if (change.line !== null || change.position !== null || change.finish_line !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'remove_file' should not have line or position fields`);
                                }
                                try {
                                    await fs.unlink(targetPath);
                                    response += `\n[Removed file ${change.relativePath || path.basename(targetPath)}]`;
                                } catch (err) {
                                    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
                                        response += `\n[File ${change.relativePath || path.basename(targetPath)} does not exist, skipping removal]`;
                                    } else {
                                        throw err; // Re-throw other errors to be caught by the outer catch
                                    }
                                }
                                break;
            
                            case 'add':
                                if (change.line === null || change.position === null) {
                                    throw new Error(`Action 'add' requires line and position`);
                                }
                                let contentAdd = await fs.readFile(targetPath, 'utf8');
                                let linesAdd = contentAdd.split('\n');
                                if (change.line < 1 || change.line > linesAdd.length + 1) {
                                    throw new Error(`Invalid line number: ${change.line}`);
                                }
                                if (change.line > linesAdd.length) {
                                    while (linesAdd.length < change.line - 1) {
                                        linesAdd.push('');
                                    }
                                    linesAdd.push(change.newCode);
                                } else {
                                    let targetLine = linesAdd[change.line - 1];
                                    if (change.position < 0 || change.position > targetLine.length) {
                                        throw new Error(`Invalid position: ${change.position}`);
                                    }
                                    linesAdd[change.line - 1] = targetLine.slice(0, change.position) + change.newCode + targetLine.slice(change.position);
                                }
                                await fs.writeFile(targetPath, linesAdd.join('\n'), 'utf8');
                                response += `\n[Applied add to ${change.relativePath || path.basename(targetPath)}:${change.line} - ${change.reason}]`;
                                break;
            
                            case 'replace':
                                if (change.line === null || change.position === null || change.finish_line === null || change.finish_position === null) {
                                    throw new Error(`Action 'replace' requires line, position, finish_line, finish_position`);
                                }
                                let contentReplace = await fs.readFile(targetPath, 'utf8');
                                let linesReplace = contentReplace.split('\n');
                                if (change.line < 1 || change.finish_line > linesReplace.length || change.line > change.finish_line) {
                                    throw new Error(`Invalid line range: ${change.line}-${change.finish_line}`);
                                }
                                if (change.line === change.finish_line) {
                                    let line = linesReplace[change.line - 1];
                                    if (change.position < 0 || change.finish_position > line.length || change.position > change.finish_position) {
                                        throw new Error(`Invalid position range: ${change.position}-${change.finish_position}`);
                                    }
                                    linesReplace[change.line - 1] = line.slice(0, change.position) + change.newCode + line.slice(change.finish_position);
                                } else {
                                    let before = linesReplace[change.line - 1].slice(0, change.position);
                                    let after = linesReplace[change.finish_line - 1].slice(change.finish_position);
                                    let middle = change.newCode.split('\n');
                                    linesReplace.splice(change.line - 1, change.finish_line - change.line + 1, ...[before + middle[0], ...middle.slice(1), after]);
                                }
                                await fs.writeFile(targetPath, linesReplace.join('\n'), 'utf8');
                                response += `\n[Applied replace to ${change.relativePath || path.basename(targetPath)}:${change.line}-${change.finish_line} - ${change.reason}]`;
                                break;
            
                            case 'remove':
                                if (change.line === null || change.position === null || change.finish_line === null || change.finish_position === null) {
                                    throw new Error(`Action 'remove' requires line, position, finish_line, finish_position`);
                                }
                                let contentRemove = await fs.readFile(targetPath, 'utf8');
                                let linesRemove = contentRemove.split('\n');
                                if (change.line < 1 || change.finish_line > linesRemove.length || change.line > change.finish_line) {
                                    throw new Error(`Invalid line range: ${change.line}-${change.finish_line}`);
                                }
                                if (change.line === change.finish_line) {
                                    let line = linesRemove[change.line - 1];
                                    if (change.position < 0 || change.finish_position > line.length || change.position > change.finish_position) {
                                        throw new Error(`Invalid position range: ${change.position}-${change.finish_position}`);
                                    }
                                    linesRemove[change.line - 1] = line.slice(0, change.position) + line.slice(change.finish_position);
                                } else {
                                    let before = linesRemove[change.line - 1].slice(0, change.position);
                                    let after = linesRemove[change.finish_line - 1].slice(change.finish_position);
                                    linesRemove.splice(change.line - 1, change.finish_line - change.line + 1, before + after);
                                }
                                await fs.writeFile(targetPath, linesRemove.join('\n'), 'utf8');
                                response += `\n[Applied remove to ${change.relativePath || path.basename(targetPath)}:${change.line}-${change.finish_line} - ${change.reason}]`;
                                break;
            
                            default:
                                throw new Error(`Unknown action: ${change.action}`);
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        response += `\n[Failed to apply change: ${errorMessage}]`;
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

