// engine_handler.ts
import { PythonEngine } from './engine_python';
import { LaravelEngine } from './engine_laravel';
import { JavascriptEngine } from './engine_javascript';
import { TypescriptEngine } from './engine_typescript';
import { PhpEngine } from './engine_php';
import { ReactEngine } from './engine_react';
import { VsCodeExtensionEngine } from './engine_vscode_extension';
import { EditorContext, ProjectType, AIPrompt, CodeChange, QCodeSettings } from './types';
import { ExtensionContext } from 'vscode';
import { queryAI, parseAIResponse } from './ai';
import { getValidSettings } from './settings';
import * as vscode from 'vscode';
import { QCodePanelProvider } from './webview';
import { getMarkdownLanguage } from './utils';
import path from 'path';
import { FlutterEngine } from './engine_flutter.new';

export class EngineHandler {
    static async processPrompt(
        prompt: string,
        editorContext: EditorContext,
        context: ExtensionContext,
        provider: QCodePanelProvider
    ): Promise<string> {
        const projectType = editorContext.project.type; // Fixed from .type.type
        let response = '';
        const settings: QCodeSettings = getValidSettings(context.globalState.get('qcode.settings'));
        const states = settings.chatStates;

        let aiPrompt: AIPrompt;
        switch (projectType.type) { // Fixed: Use projectType.type (string) instead of projectType (ProjectType)
            case 'flutter':
                aiPrompt = await FlutterEngine.processPrompt(prompt, editorContext, context, states);
                response += `Flutter project detected.\n`;
                break;
            case 'python':
                aiPrompt = await PythonEngine.processPrompt(prompt, editorContext, context, states);
                response += `Python project detected.\n`;
                break;
            case 'laravel':
                aiPrompt = await LaravelEngine.processPrompt(prompt, editorContext, context, states);
                response += `Laravel project detected.\n`;
                break;
            case 'javascript':
                aiPrompt = await JavascriptEngine.processPrompt(prompt, editorContext, context, states);
                response += `JavaScript project detected.\n`;
                break;
            case 'typescript':
                aiPrompt = await TypescriptEngine.processPrompt(prompt, editorContext, context, states);
                response += `TypeScript project detected.\n`;
                break;
            case 'php':
                aiPrompt = await PhpEngine.processPrompt(prompt, editorContext, context, states);
                response += `PHP project detected.\n`;
                break;
            case 'react':
                aiPrompt = await ReactEngine.processPrompt(prompt, editorContext, context, states);
                response += `React project detected.\n`;
                break;
            case 'vscode-extension':
                aiPrompt = await VsCodeExtensionEngine.processPrompt(prompt, editorContext, context, states);
                response += `VS Code Extension project detected.\n`;
                break;
            default:
                return `No specific engine found for project type "${projectType.type}".\n` +
                       `Processing prompt generically: "${prompt}"\n` +
                       `Context: ${JSON.stringify(editorContext, null, 2)}`;
        }

        let fullPrompt = aiPrompt.systemPrompt + '\n';
        aiPrompt.attachments.forEach(attachment => {
            if (attachment.type === 'code' && attachment.language) {
                const markdownLang = getMarkdownLanguage(attachment.language);
                if (attachment.title) {fullPrompt += `${attachment.title}:\n`;}
                fullPrompt += `\`\`\`${markdownLang}\n${attachment.content}\n\`\`\`\n\n`;
            } else {
                fullPrompt += `${attachment.content}\n\n`;
            }
        });
        fullPrompt += `MY REQUEST: \n\`\`\`\n"${aiPrompt.userRequest}"\n\`\`\`\n\n`;
        fullPrompt += aiPrompt.responseFormat;

        response += `\n\n# Context: ${editorContext.fileName} (${editorContext.fileType} file)\n\n`;
        response += '```json\n' + JSON.stringify(editorContext, null, 2) + '\n```\n';

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

        try {
            const aiResult = await queryAI(fullPrompt, context, activeAI);
            const aiAnalysis = aiResult.text;
            const codeChanges = parseAIResponse(aiAnalysis);

            response += '\n--------\n';
            response += '| Description  | Amount         |\n';
            response += '|--------------|----------------|\n';
            response += `| Total Cost   | $${aiResult.cost.sum.toFixed(6)} |\n`;
            response += `| Input Cost   | $${aiResult.cost.inputCost.toFixed(6)} |\n`;
            response += `| Output Cost  | $${aiResult.cost.outputCost.toFixed(6)} |\n`;
            response += '\n--------\n';

            if (states.autoApply) {
                response += '\n[Auto-apply enabled - changes applied automatically] ✅\n';
                const edit = new vscode.WorkspaceEdit();
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(editorContext.filePath));
                const rootPath = workspaceFolder?.uri.fsPath;
                if (!rootPath) {
                    response += '\n[Error: No workspace folder found for the current file] ❌';
                    return response;
                }

                for (const change of codeChanges) {
                    try {
                        let uri: vscode.Uri;
                        if (change.relativePath) {
                            const relPath = change.relativePath.startsWith('./') ? change.relativePath.slice(2) : change.relativePath;
                            uri = vscode.Uri.joinPath(vscode.Uri.file(rootPath), relPath);
                        } else {
                            uri = vscode.Uri.file(editorContext.filePath);
                        }

                        switch (change.action) {
                            case 'create':
                                if (change.line !== null || change.position !== null || change.finish_line !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'create' should not have line or position fields`);
                                }
                                if (!change.relativePath) {throw new Error(`Action 'create' requires relativePath`);}
                                edit.createFile(uri, { overwrite: true });
                                edit.replace(uri, new vscode.Range(0, 0, 0, 0), change.newCode);
                                response += `\n[Created file ${change.relativePath}] ✅`;
                                break;

                            case 'remove_file':
                                if (change.line !== null || change.position !== null || change.finish_line !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'remove_file' should not have line or position fields`);
                                }
                                if (!change.relativePath) {throw new Error(`Action 'remove_file' requires relativePath`);}
                                edit.deleteFile(uri, { ignoreIfNotExists: true });
                                response += `\n[Removed file ${change.relativePath}] ✅`;
                                break;

                            case 'add':
                                if (change.line === null || change.position === null) {
                                    throw new Error(`Action 'add' requires line and position`);
                                }
                                if (change.finish_line !== null || change.finish_position !== null) {
                                    throw new Error(`Action 'add' should not have finish_line or finish_position`);
                                }
                                edit.insert(uri, new vscode.Position(change.line - 1, change.position), change.newCode);
                                response += `\n[Applied add to ${change.relativePath || path.basename(uri.fsPath)}:${change.line} - ${change.reason}] ✅`;
                                break;

                            case 'replace':
                                if (change.line === null || change.position === null || change.finish_line === null || change.finish_position === null) {
                                    throw new Error(`Action 'replace' requires line, position, finish_line, finish_position`);
                                }
                                edit.replace(
                                    uri,
                                    new vscode.Range(change.line - 1, change.position, change.finish_line - 1, change.finish_position),
                                    change.newCode
                                );
                                response += `\n[Applied replace to ${change.relativePath || path.basename(uri.fsPath)}:${change.line}-${change.finish_line} - ${change.reason}] ✅`;
                                break;

                            case 'remove':
                                if (change.line === null || change.position === null || change.finish_line === null || change.finish_position === null) {
                                    throw new Error(`Action 'remove' requires line, position, finish_line, finish_position`);
                                }
                                edit.delete(
                                    uri,
                                    new vscode.Range(change.line - 1, change.position, change.finish_line - 1, change.finish_position)
                                );
                                response += `\n[Applied remove to ${change.relativePath || path.basename(uri.fsPath)}:${change.line}-${change.finish_line} - ${change.reason}] ✅`;
                                break;

                            default:
                                throw new Error(`Unknown action: ${change.action}`);
                        }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        response += `\n[Failed to process change: ${errorMessage}] ❌`;
                    }
                }

                try {
                    const success = await vscode.workspace.applyEdit(edit);
                    if (!success) {response += '\n[Warning: Some changes could not be applied] ⚠️';}
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