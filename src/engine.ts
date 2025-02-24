// engine_handler.ts
import { FlutterEngine } from './engine_flutter';
import { EditorContext, ProjectType, AIPrompt, CodeChange, QCodeSettings } from './types';
import { ExtensionContext } from 'vscode';
import { queryAI, parseAIResponse } from './ai';
import { readFile, writeFile } from './fileOperations';
import { getValidSettings } from './settings';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getMarkdownLanguage } from './utils';
import { QCodePanelProvider } from './webview';

export class EngineHandler {
    static async processPrompt(
        prompt: string,
        editorContext: EditorContext,
        context: ExtensionContext,
        provider: QCodePanelProvider,
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
                response += `Flutter project detected. \n`;
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
                if(attachment.title) {
                    fullPrompt += `${attachment.title}:\n`;
                }
                fullPrompt += `\`\`\`${markdownLang}\n${attachment.content}\n\`\`\`\n\n`;
            } else {
                fullPrompt += `${attachment.content}\n\n`;
            }
        });
        fullPrompt += `MY REQUEST: \n\`\`\`\n"${aiPrompt.userRequest}"\n\`\`\`\n\n`;
        fullPrompt += aiPrompt.responseFormat;

        // Add context information to response
        response += `\n\n# Context: ${editorContext.fileName} (${editorContext.fileType} file)\n\n`;
        response += '```json\n' + JSON.stringify(editorContext, null, 2) + '\n```\n';

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
            const aiResult = await queryAI(fullPrompt, context, activeAI);
            const aiAnalysis = aiResult.text; // Use the 'text' property from the result
            const codeChanges = parseAIResponse(aiAnalysis);

            response += '\n--------\n';
            response += '| Description  | Amount         |\n';
            response += '|--------------|----------------|\n';
            response += `| Total Cost   | $${aiResult.cost.sum.toFixed(6)} |\n`;
            response += `| Input Cost   | $${aiResult.cost.inputCost.toFixed(6)} |\n`;
            response += `| Output Cost  | $${aiResult.cost.outputCost.toFixed(6)} |\n`;
            response += '\n--------\n';


            // Handle auto-apply if enabled
            if (states.autoApply) {
                response += '\n[Auto-apply enabled - changes applied automatically] ✅\n';
                const edit = new vscode.WorkspaceEdit();

                // Determine the workspace root for relative paths
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(editorContext.filePath));
                const rootPath = workspaceFolder?.uri.fsPath;
                if (!rootPath) {
                    response += '\n[Error: No workspace folder found for the current file] ❌';
                    return response; // Early exit if no workspace context
                }

                for (const change of codeChanges) {
                    try {
                        // Resolve the target file URI
                        let uri: vscode.Uri;
                        if (change.relativePath) {
                            const relPath = change.relativePath.startsWith('./') ? change.relativePath.slice(2) : change.relativePath;
                            uri = vscode.Uri.joinPath(vscode.Uri.file(rootPath), relPath);
                        } else {
                            uri = vscode.Uri.file(editorContext.filePath);
                        }

                        // Apply the change based on action
                        switch (change.action) {
                            case 'create':
                                if (change.line !== null || change.position !== null || change.finish_line !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'create' should not have line or position fields`);
                                }
                                if (!change.relativePath) {
                                    throw new Error(`Action 'create' requires relativePath`);
                                }
                                edit.createFile(uri, { overwrite: true }); // Overwrite if exists
                                edit.replace(uri, new vscode.Range(0, 0, 0, 0), change.newCode);
                                response += `\n[Created file ${change.relativePath}] ✅`;
                                break;

                            case 'remove_file':
                                if (change.line !== null || change.position !== null || change.finish_line !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'remove_file' should not have line or position fields`);
                                }
                                if (!change.relativePath) {
                                    throw new Error(`Action 'remove_file' requires relativePath`);
                                }
                                edit.deleteFile(uri, { ignoreIfNotExists: true }); // Don’t fail if file is missing
                                response += `\n[Removed file ${change.relativePath}] ✅`;
                                break;

                            case 'add':
                                if (change.line === null || change.position !== null || change.finish_line !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'add' requires only 'line' as number, all position fields must be null`);
                                }
                                // Insert at start of specified line
                                edit.insert(uri, new vscode.Position(change.line - 1, 0), change.newCode + '\n');
                                response += `\n[Added lines at ${change.relativePath || path.basename(uri.fsPath)}:${change.line} - ${change.reason}] ✅`;
                                break;
    
                            case 'replace':
                                if (change.line === null || change.finish_line === null || change.position !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'replace' requires 'line' and 'finish_line' as numbers, position fields must be null`);
                                }
                                edit.replace(
                                    uri,
                                    new vscode.Range(change.line - 1, 0, change.finish_line, 0),
                                    change.newCode + '\n'
                                );
                                response += `\n[Replaced lines ${change.line}-${change.finish_line} in ${change.relativePath || path.basename(uri.fsPath)} - ${change.reason}] ✅`;
                                break;
    
                            case 'remove':
                                if (change.line === null || change.finish_line === null || change.position !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'remove' requires 'line' and 'finish_line' as numbers, position fields must be null`);
                                }
                                edit.delete(
                                    uri,
                                    new vscode.Range(change.line - 1, 0, change.finish_line, 0)
                                );
                                response += `\n[Removed lines ${change.line}-${change.finish_line} from ${change.relativePath || path.basename(uri.fsPath)} - ${change.reason}] ✅`;
                                break;

                            default:
                                throw new Error(`Unknown action: ${change.action}`);
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        response += `\n[Failed to process change: ${errorMessage}] ❌`;
                    }
                }

                // Apply all edits in one operation
                try {
                    const success = await vscode.workspace.applyEdit(edit);
                    if (!success) {
                        response += '\n[Warning: Some changes could not be applied] ⚠️';
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    response += `\n[Failed to apply changes: ${errorMessage}] ❌`;
                }
            }
            response += '\n# Prompt:\n```markdown\n' + fullPrompt + "\n```\n";
            response += '\n# Response:\n```json\n' + JSON.stringify(codeChanges, null, 2) + '\n```';
        } catch (error) {
            response += `\nAI Analysis Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        return response;
    }

}

