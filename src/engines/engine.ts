// // engine.ts
// import * as vscode from 'vscode';
// import { ExtensionContext } from 'vscode';
// import { EditorContext, AIPrompt, CodeChange, QCodeSettings, FrameworkConfig, ChatStates } from '../types';
// import { queryAI, parseAIResponse } from '../ai';
// import { getValidSettings } from '../settings';
// import { FlutterEngine } from './flutter';
// import { ReactEngine } from './react';
// import { getMarkdownLanguage } from '../utils';
// import { QCodePanelProvider } from '../webview';

// export abstract class Engine {
//     constructor(
//         protected context: ExtensionContext,
//         protected settings: QCodeSettings,
//         protected frameworkConfig: FrameworkConfig
//     ) {}

//     abstract processPrompt(
//         prompt: string,
//         editorContext: EditorContext,
//         states: ChatStates
//     ): Promise<AIPrompt>;

//     // Changed from protected to public
//     public async applyCodeChanges(
//         changes: CodeChange[],
//         editorContext: EditorContext,
//         response: string
//     ): Promise<string> {
//         let result = response;
//         if (this.settings.chatStates.autoApply) {
//             result += '\n[Auto-apply enabled - changes applied automatically] ✅\n';
//             const edit = new vscode.WorkspaceEdit();
//             const rootPath = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(editorContext.filePath))?.uri.fsPath;

//             if (!rootPath) {
//                 result += '\n[Error: No workspace folder found] ❌';
//                 return result;
//             }

//             for (const change of changes) {
//                 try {
//                     const uri = change.relativePath
//                         ? vscode.Uri.joinPath(vscode.Uri.file(rootPath), change.relativePath)
//                         : vscode.Uri.file(editorContext.filePath);

//                     switch (change.action) {
//                         case 'create':
//                             edit.createFile(uri, { overwrite: true });
//                             edit.replace(uri, new vscode.Range(0, 0, 0, 0), change.newCode);
//                             result += `\n[Created file ${change.relativePath}] ✅`;
//                             break;
//                         case 'remove_file':
//                             edit.deleteFile(uri, { ignoreIfNotExists: true });
//                             result += `\n[Removed file ${change.relativePath}] ✅`;
//                             break;
//                         case 'add':
//                             edit.insert(uri, new vscode.Position(change.line! - 1, change.position!), change.newCode);
//                             result += `\n[Applied add to ${change.relativePath || uri.fsPath}:${change.line}] ✅`;
//                             break;
//                         case 'replace':
//                             edit.replace(
//                                 uri,
//                                 new vscode.Range(change.line! - 1, change.position!, change.finish_line! - 1, change.finish_position!),
//                                 change.newCode
//                             );
//                             result += `\n[Applied replace to ${change.relativePath || uri.fsPath}:${change.line}-${change.finish_line}] ✅`;
//                             break;
//                         case 'remove':
//                             edit.delete(
//                                 uri,
//                                 new vscode.Range(change.line! - 1, change.position!, change.finish_line! - 1, change.finish_position!)
//                             );
//                             result += `\n[Applied remove to ${change.relativePath || uri.fsPath}:${change.line}-${change.finish_line}] ✅`;
//                             break;
//                     }
//                 } catch (error) {
//                     result += `\n[Failed to process change: ${error instanceof Error ? error.message : 'Unknown error'}] ❌`;
//                 }
//             }

//             const applyPromise = Promise.resolve(vscode.workspace.applyEdit(edit));
//             await applyPromise.catch(err => {
//                 result += `\n[Failed to apply changes: ${err.message}] ❌`;
//             });
//         }
//         return result;
//     }
// }

// export class EngineRegistry {
//     private static engines: Map<string, new (context: ExtensionContext, settings: QCodeSettings, config: FrameworkConfig) => Engine> = new Map();

//     static registerFramework(
//         type: string,
//         engineClass: new (context: ExtensionContext, settings: QCodeSettings, config: FrameworkConfig) => Engine,
//         config: FrameworkConfig
//     ) {
//         this.engines.set(type, engineClass);
//     }

//     static getEngine(type: string, context: ExtensionContext, settings: QCodeSettings, config: FrameworkConfig): Engine {
//         const EngineClass = this.engines.get(type) || GenericEngine;
//         return new EngineClass(context, settings, config);
//     }
// }

// export class GenericEngine extends Engine {
//     constructor(context: ExtensionContext, settings: QCodeSettings, config: FrameworkConfig) {
//         super(context, settings, config);
//     }

//     async processPrompt(prompt: string, editorContext: EditorContext, states: ChatStates): Promise<AIPrompt> {
//         return {
//             systemPrompt: `Generic engine for ${this.frameworkConfig.name}.`,
//             attachments: [
//                 {
//                     type: 'code',
//                     language: editorContext.fileType,
//                     content: editorContext.content,
//                     relativePath: editorContext.filePath
//                 }
//             ],
//             userRequest: prompt,
//             responseFormat: 'Return a JSON array of CodeChange objects.'
//         };
//     }
// }

// export class EngineHandler {
//     static async processPrompt(
//         prompt: string,
//         editorContext: EditorContext,
//         context: ExtensionContext,
//         provider: QCodePanelProvider
//     ): Promise<string> {
//         const settings: QCodeSettings = getValidSettings(context.globalState.get('qcode.settings'));
//         const states = settings.chatStates;
//         const projectType = editorContext.project.type.type;

//         const frameworkConfig: FrameworkConfig = {
//             name: projectType,
//             fileExtensions: ['ts', 'js'], // Default, override per framework
//             ignorePatterns: [],
//             detectIndicators: []
//         };

//         const engine = EngineRegistry.getEngine(projectType, context, settings, frameworkConfig);
//         const aiPrompt = await engine.processPrompt(prompt, editorContext, states);

//         let response = `${projectType} project detected.\n`;
//         let fullPrompt = aiPrompt.systemPrompt + '\n';
//         aiPrompt.attachments.forEach(att => {
//             fullPrompt += att.type === 'code' && att.language
//                 ? `\`\`\`${getMarkdownLanguage(att.language)}\n${att.content}\n\`\`\`\n`
//                 : `${att.content}\n`;
//         });
//         fullPrompt += `MY REQUEST: \n\`\`\`\n"${aiPrompt.userRequest}"\n\`\`\`\n${aiPrompt.responseFormat}`;

//         response += `\n\n# Context: ${editorContext.fileName} (${editorContext.fileType} file)\n\n`;
//         response += '```json\n' + JSON.stringify(editorContext, null, 2) + '\n```\n';

//         const activeAI = Object.keys(settings.aiModels).find(
//             key => settings.aiModels[key as keyof QCodeSettings['aiModels']].active
//         ) as keyof QCodeSettings['aiModels'] | undefined;

//         if (!activeAI) {
//             response += '\nNo active AI model found.';
//             return response;
//         }

//         try {
//             const aiResult = await queryAI(fullPrompt, context, activeAI);
//             const codeChanges = parseAIResponse(aiResult.text);
//             response += `\nCost: $${aiResult.cost.sum.toFixed(6)} (Input: $${aiResult.cost.inputCost.toFixed(6)}, Output: $${aiResult.cost.outputCost.toFixed(6)})\n`;
//             response = await engine.applyCodeChanges(codeChanges, editorContext, response); // Now accessible
//             response += '\n# Prompt:\n```markdown\n' + fullPrompt + '\n```\n';
//             response += '\n# Response:\n```json\n' + JSON.stringify(codeChanges, null, 2) + '\n```';
//         } catch (error) {
//             response += `\nAI Analysis Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
//         }

//         return response;
//     }
// }

// // Register engines
// EngineRegistry.registerFramework('flutter', FlutterEngine, {
//     name: 'flutter',
//     fileExtensions: ['dart'],
//     ignorePatterns: ['.dart_tool', 'build'],
//     detectIndicators: ['pubspec.yaml']
// });

// EngineRegistry.registerFramework('react', ReactEngine, {
//     name: 'react',
//     fileExtensions: ['jsx', 'tsx'],
//     ignorePatterns: ['node_modules', 'dist'],
//     detectIndicators: ['package.json', 'React']
// });