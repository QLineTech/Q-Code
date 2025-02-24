// engine_handler.ts
import { FlutterEngine } from './engine_flutter';
import { EditorContext, ProjectType, AIPrompt, CodeChange, QCodeSettings, GitDiffChange } from './types/types';
import { ExtensionContext } from 'vscode';
import { queryAI } from './ai/ai';
import { getValidSettings } from './settings/settings';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getMarkdownLanguage, previewChanges } from './utils';
import { QCodePanelProvider } from './webview/webview';

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
            const gitDiffChanges = aiResult.changes; // Now returns GitDiffChange[]

            response += '\n--------\n';
            response += '| Description  | Amount         |\n';
            response += '|--------------|----------------|\n';
            response += `| Total Cost   | $${aiResult.cost.sum.toFixed(6)} |\n`;
            response += `| Input Cost   | $${aiResult.cost.inputCost.toFixed(6)} |\n`;
            response += `| Output Cost  | $${aiResult.cost.outputCost.toFixed(6)} |\n`;
            response += '\n--------\n';


            // Handle auto-apply if enabled
            if (states.autoApply) {
                // response += '\n[Auto-apply enabled - changes applied automatically] ✅\n';
                // const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(editorContext.filePath));
                // const rootPath = workspaceFolder?.uri.fsPath;
                // if (!rootPath) {
                //     response += '\n[Error: No workspace folder found for the current file] ❌';
                //     return response;
                // }

                // try {
                //     await applyGitDiffChanges(gitDiffChanges, rootPath);
                //     response += '\n[Changes applied successfully] ✅';
                // } catch (error) {
                //     const errorMessage = error instanceof Error ? error.message : String(error);
                //     response += `\n[Failed to apply changes: ${errorMessage}] ❌`;
                // }
            } else {
                await previewChanges(gitDiffChanges);
                response += '\n[Preview of changes generated] 👁️';
            }
            
            response += '\n# Prompt:\n```markdown\n' + fullPrompt + "\n```\n";
            response += '\n# Response:\n```json\n' + JSON.stringify(gitDiffChanges, null, 2) + '\n```';
        } catch (error) {
            response += `\nAI Analysis Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }

        return response;
    }

}


