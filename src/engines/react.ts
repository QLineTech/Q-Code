// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { EditorContext, AIPrompt, ChatStates, FrameworkConfig, PromptTemplate } from '../types';
// import { Engine } from './engine';
// import { ExtensionContext } from 'vscode';
// import * as vscode from 'vscode';
// import ignore from 'ignore';
// import { addLineNumbers, getMarkdownLanguage } from '../utils';
// import { QCodeSettings } from '../types';

// export class ReactPromptTemplate implements PromptTemplate {
//     async generatePrompt(
//         prompt: string,
//         context: EditorContext,
//         states: ChatStates,
//         frameworkConfig: FrameworkConfig
//     ): Promise<AIPrompt> {
//         const rootPath = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(context.filePath))?.uri.fsPath || path.dirname(context.filePath);
//         const currentRelativePath = path.relative(rootPath, context.filePath).replace(/\\/g, '/');

//         const systemPrompt = 'You are an expert React/TypeScript developer. Analyze the provided code and implement the user request with clean, modern React practices.';
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

//         const responseFormat = `Return ONLY a JSON array of CodeChange objects as per the specification...`; // Same as Flutter

//         return { systemPrompt, attachments, userRequest: prompt, responseFormat };
//     }

//     private async findRelatedElements(context: EditorContext, rootPath: string): Promise<string> {
//         let result = 'Related Elements:\n';
//         const codeToAnalyze = context.selection?.text || context.content;

//         const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
//         const localImports = new Map<string, string>();
//         let match;
//         while ((match = importRegex.exec(codeToAnalyze)) !== null) {
//             const importPath = match[1];
//             if (!importPath.startsWith('http') && !importPath.startsWith('@')) {
//                 const absolutePath = path.resolve(path.dirname(context.filePath), importPath);
//                 const relativePath = path.relative(rootPath, absolutePath).replace(/\\/g, '/');
//                 try {
//                     const content = await fs.readFile(absolutePath, 'utf8');
//                     localImports.set(relativePath, content);
//                 } catch (error) {
//                     localImports.set(relativePath, `Error: ${error instanceof Error ? error.message : 'Unknown'}`);
//                 }
//             }
//         }

//         if (localImports.size > 0) {
//             result += 'Locally Imported Files:\n';
//             for (const [relativePath, content] of localImports) {
//                 const fileExt = path.extname(relativePath).slice(1) || 'text';
//                 result += `\nfile_relative_path: ${relativePath}\n\`\`\`${getMarkdownLanguage(fileExt)}\n${content}\n\`\`\`\n`;
//             }
//         }

//         return result;
//     }

//     private async getFolderStructure(context: EditorContext, config: FrameworkConfig): Promise<string> {
//         const ig = ignore().add([...config.ignorePatterns, '.git']);
//         // Reuse folder structure logic from FlutterEngine
//         const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(context.filePath));
//         if (!workspaceFolder) {return '<root>No workspace folder found</root>';}

//         const rootPath = workspaceFolder.uri.fsPath;
//         const getDirStructure = async (currentPath: string, level: number = 0): Promise<string> => {
//             const relativeCurrent = path.relative(rootPath, currentPath).replace(/\\/g, '/');
//             if (relativeCurrent && ig.ignores(relativeCurrent)) {return '';}

//             const entries = await fs.readdir(currentPath, { withFileTypes: true });
//             let xml = '';
//             const dirName = path.basename(currentPath);
//             const isRoot = currentPath === rootPath;
//             if (!isRoot) {xml += `${'  '.repeat(level)}<folder name="${dirName}">\n`;}

//             for (const entry of entries) {
//                 const entryPath = path.join(currentPath, entry.name);
//                 const relativeEntry = path.relative(rootPath, entryPath).replace(/\\/g, '/');
//                 if (ig.ignores(relativeEntry)) {continue;}

//                 if (entry.isDirectory()) {
//                     const subDirXml = await getDirStructure(entryPath, level + 1);
//                     if (subDirXml) {xml += subDirXml;}
//                 } else {
//                     xml += `${'  '.repeat(level + 1)}<file name="${entry.name}"/>\n`;
//                 }
//             }

//             if (!isRoot && xml) {xml += `${'  '.repeat(level)}</folder>\n`;}
//             return xml;
//         };

//         const structure = await getDirStructure(rootPath);
//         return structure ? `<root>\n${structure}</root>` : '<root>No structure</root>';
//     }
// }

// export class ReactEngine extends Engine {
//     private promptTemplate: PromptTemplate;

//     constructor(context: ExtensionContext, settings: QCodeSettings, config: FrameworkConfig) {
//         super(context, settings, config);
//         this.promptTemplate = new ReactPromptTemplate();
//     }

//     async processPrompt(prompt: string, editorContext: EditorContext, states: ChatStates): Promise<AIPrompt> {
//         return this.promptTemplate.generatePrompt(prompt, editorContext, states, this.frameworkConfig);
//     }
// }