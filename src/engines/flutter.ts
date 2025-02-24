// // engine_flutter.ts
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { EditorContext, AIPrompt, ChatStates, FrameworkConfig, PromptTemplate, QCodeSettings } from '../types';
// import { Engine } from './engine';
// import { ExtensionContext } from 'vscode';
// import * as vscode from 'vscode';
// import ignore from 'ignore';
// import { addLineNumbers, getMarkdownLanguage } from '../utils';

// export class FlutterPromptTemplate implements PromptTemplate {
//     async generatePrompt(
//         prompt: string,
//         context: EditorContext,
//         states: ChatStates,
//         frameworkConfig: FrameworkConfig
//     ): Promise<AIPrompt> {
//         const rootPath = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(context.filePath))?.uri.fsPath || path.dirname(context.filePath);
//         const currentRelativePath = path.relative(rootPath, context.filePath).replace(/\\/g, '/');

//         const systemPrompt = 'You are an expert Flutter/Dart developer. Learn all given code and implement the user request with stable, correct logic.';
//         const attachments: AIPrompt['attachments'] = [];

//         if (states.webAccess) {
//             attachments.push({ type: 'text', content: '[Web access enabled]' });
//         }
//         if (states.thinking) {
//             attachments.push({ type: 'text', content: `[Processing thoughts: Analyzing "${prompt}"]` });
//         }

//         const content = context.selection ? context.selection.text : context.content;
//         attachments.push({
//             type: 'code',
//             language: context.fileType,
//             title: `**${context.selection ? 'Selected' : 'Full'} code (\`${currentRelativePath}\`)**`,
//             content: addLineNumbers(content),
//             relativePath: currentRelativePath
//         });

//         if (states.attachRelated) {
//             const relatedInfo = await this.findRelatedElements(context, rootPath);
//             attachments.push({ type: 'text', content: `Related elements:\n${relatedInfo}` });
//         }
//         if (states.folderStructure) {
//             const folderStructure = await this.getFolderStructure(context, frameworkConfig);
//             attachments.push({ type: 'structure', content: `Project folder structure:\n\`\`\`xml\n${folderStructure}\n\`\`\`` });
//         }

//         const responseFormat = `Return ONLY a JSON array of CodeChange objects as per the specification...`; // Same as before

//         return { systemPrompt, attachments, userRequest: prompt, responseFormat };
//     }

//     private async findRelatedElements(context: EditorContext, rootPath: string): Promise<string> {
//         // Same logic as before, abstracted for reuse
//         return 'Related Elements:\n...'; // Placeholder
//     }

//     private async getFolderStructure(context: EditorContext, config: FrameworkConfig): Promise<string> {
//         const ig = ignore().add([...config.ignorePatterns, '.git']);
//         // Same logic as before, using config.ignorePatterns
//         return '<root>Folder structure</root>'; // Placeholder
//     }
// }

// export class FlutterEngine extends Engine {
//     private promptTemplate: PromptTemplate;

//     constructor(context: ExtensionContext, settings: QCodeSettings, config: FrameworkConfig) {
//         super(context, settings, config);
//         this.promptTemplate = new FlutterPromptTemplate();
//     }

//     async processPrompt(prompt: string, editorContext: EditorContext, states: ChatStates): Promise<AIPrompt> {
//         return this.promptTemplate.generatePrompt(prompt, editorContext, states, this.frameworkConfig);
//     }
// }