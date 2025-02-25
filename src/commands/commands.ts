import * as vscode from 'vscode';
import * as path from 'path';
import { QCodePanelProvider } from '../webview/webview';
import { readFile } from '../utils/file';
import { EditorContext, ChatHistoryEntry, QCodeSettings, ProjectType, ChatStates } from '../types/types';
import { EngineHandler } from '../engine';
import { getValidSettings } from '../settings/settings';
import { logger } from '../utils/logger';
import { populateEditorContext } from '../frameworks/editorContext';
import { TrafficSwitch } from '../frameworks/trafficSwitch';
import { GitOperations } from '../utils/gitOperations';

async function detectProjectType(
    editorContext: EditorContext | null,
    workspaceFolders: typeof vscode.workspace.workspaceFolders
): Promise<ProjectType> {
    const indicators: string[] = [];
    let projectType: ProjectType = { type: 'unknown', confidence: 0, indicators };

    if (!workspaceFolders?.length) {
        return projectType;
    }

    try {
        // Initial detection based on active editor
        if (editorContext) {
            const fileType = editorContext.fileType.toLowerCase();
            const fileName = editorContext.fileName.toLowerCase();

            switch (fileType) {
                case 'dart':
                    projectType = { type: 'flutter', confidence: 0.7, indicators: ['Dart file detected'] };
                    break;
                case 'python':
                    projectType = { type: 'python', confidence: 0.6, indicators: ['Python file detected'] };
                    break;
                case 'php':
                    projectType = { type: 'php', confidence: 0.5, indicators: ['PHP file detected'] };
                    break;
                case 'typescript':
                    projectType = { type: 'typescript', confidence: 0.6, indicators: ['TypeScript file detected'] };
                    break;
                case 'javascript':
                    if (fileName.includes('.tsx') || fileName.includes('.jsx')) {
                        projectType = { type: 'react', confidence: 0.7, indicators: ['React file detected'] };
                    } else {
                        projectType = { type: 'javascript', confidence: 0.6, indicators: ['JavaScript file detected'] };
                    }
                    break;
                case 'json':
                    if (fileName === 'package.json') {
                        projectType = { type: 'javascript', confidence: 0.5, indicators: ['package.json detected'] };
                    }
                    break;
            }
        }

        // Workspace-level detection
        for (const folder of workspaceFolders) {
            const folderPath = folder.uri.fsPath;
            const fileExists = async (filePath: string): Promise<boolean> => {
                try {
                    await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
                    return true;
                } catch {
                    return false;
                }
            };

            // Flutter detection
            if (await fileExists(`${folderPath}/pubspec.yaml`)) {
                indicators.push('pubspec.yaml found');
                const flutterConfig = await fileExists(`${folderPath}/lib/main.dart`);
                if (flutterConfig) {indicators.push('main.dart found');}
                if (projectType.type === 'flutter' || projectType.type === 'unknown') {
                    projectType = { 
                        type: 'flutter', 
                        confidence: flutterConfig ? 0.98 : 0.95, 
                        indicators 
                    };
                }
            }

            // Laravel/PHP detection
            if (await fileExists(`${folderPath}/composer.json`)) {
                indicators.push('composer.json found');
                const artisanExists = await fileExists(`${folderPath}/artisan`);
                const phpConfigExists = await fileExists(`${folderPath}/php.ini`);
                if (artisanExists) {
                    indicators.push('artisan file found');
                    projectType = { type: 'laravel', confidence: 0.98, indicators };
                } else if (phpConfigExists) {
                    indicators.push('php.ini found');
                    projectType = { type: 'php', confidence: 0.85, indicators };
                } else if (projectType.type === 'php' || projectType.type === 'unknown') {
                    projectType = { type: 'php', confidence: 0.7, indicators };
                }
            }

            // Python detection
            if (await fileExists(`${folderPath}/requirements.txt`) || 
                await fileExists(`${folderPath}/pyproject.toml`) ||
                await fileExists(`${folderPath}/Pipfile`)) {
                indicators.push('Python project files found');
                const pyMainExists = await fileExists(`${folderPath}/main.py`);
                if (pyMainExists) {indicators.push('main.py found');}
                if (projectType.type === 'python' || projectType.type === 'unknown') {
                    projectType = { 
                        type: 'python', 
                        confidence: pyMainExists ? 0.95 : 0.9, 
                        indicators 
                    };
                }
            }

            // TypeScript/JavaScript/React/VSCode Extension detection
            if (await fileExists(`${folderPath}/package.json`)) {
                indicators.push('package.json found');
                const packageJsonContent = await readFile(`${folderPath}/package.json`);
                const packageJson = JSON.parse(packageJsonContent);
                const tsConfigExists = await fileExists(`${folderPath}/tsconfig.json`);
                const hasReact = packageJson.dependencies?.react || packageJson.devDependencies?.react;
                const hasJsConfig = await fileExists(`${folderPath}/jsconfig.json`);
                const isVsCodeExtension = packageJson.engines?.vscode && 
                                        (packageJson.contributes || packageJson.activationEvents);

                if (isVsCodeExtension) {
                    indicators.push('VS Code extension indicators found');
                    const hasDist = await fileExists(`${folderPath}/dist/extension.js`);
                    if (hasDist) {indicators.push('dist/extension.js found');}
                    projectType = { 
                        type: 'vscode-extension', 
                        confidence: hasDist ? 0.98 : 0.95, 
                        indicators 
                    };
                } else if (hasReact) {
                    indicators.push('React detected in dependencies');
                    const reactAppExists = await fileExists(`${folderPath}/src/index.js`) || 
                                        await fileExists(`${folderPath}/src/index.tsx`);
                    if (reactAppExists) {indicators.push('React entry point found');}
                    projectType = { 
                        type: 'react', 
                        confidence: reactAppExists ? 0.98 : 0.95, 
                        indicators 
                    };
                } else if (tsConfigExists) {
                    indicators.push('tsconfig.json found');
                    projectType = { type: 'typescript', confidence: 0.9, indicators };
                } else if (hasJsConfig) {
                    indicators.push('jsconfig.json found');
                    projectType = { type: 'javascript', confidence: 0.85, indicators };
                } else if (projectType.type === 'javascript' || projectType.type === 'unknown') {
                    projectType = { type: 'javascript', confidence: 0.8, indicators };
                }
            }
        }

        return projectType;
    } catch (error) {
        console.error('Project type detection error:', error);
        return { type: 'unknown', confidence: 0, indicators: ['Detection failed'] };
    }
}


export async function sendChatMessage(
    text: string, 
    context: vscode.ExtensionContext, 
    provider: QCodePanelProvider,
    ...additionalArgs: any[] // Optional additional arguments like states, files, etc.
) {
    try {
        const editor = vscode.window.activeTextEditor;
        let editorContext: EditorContext | null = null;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const projectInfo = workspaceFolders ? workspaceFolders.map(folder => ({ 
            name: folder.name, 
            path: folder.uri.fsPath 
        })) : [];
        console.log('here in back');
        logger.info('QCode Prompt came');

        let messageParams: {
            type?: string;
            states?: Partial<ChatStates>;
            history?: any[];
            [key: string]: any; // Allow for additional properties
        } = {};

        // Check if additionalArgs exists and has content
        if (additionalArgs.length > 0) {
            // Loop through all additional arguments
            additionalArgs.forEach((arg, index) => {
                if (arg && typeof arg === 'object') {
                    // Merge the argument into messageParams
                    messageParams = { ...messageParams, ...arg };
                    console.log(`Argument ${index}:`, arg);
                } else {
                    console.log(`Argument ${index} is not an object or is undefined:`, arg);
                }
            });
        }

        // Extract states (if present) with defaults
        // Ensure states matches ChatStates with defaults for missing properties
        const states: ChatStates = {
            attachRelated: messageParams.states?.attachRelated ?? false,
            thinking: messageParams.states?.thinking ?? false,
            webAccess: messageParams.states?.webAccess ?? false,
            autoApply: messageParams.states?.autoApply ?? false,
            folderStructure: messageParams.states?.folderStructure ?? false,
            fullRewrite: messageParams.states?.fullRewrite ?? false,
            qmode: messageParams.states?.qmode ?? 'default',
            extra: messageParams.states?.extra ?? [], // Default for extra (adjust type if needed)
            includeOpenTabs: messageParams.states?.includeOpenTabs ?? false, // Default for includeOpenTabs
        };


        // TODO 
        // to-do
        // todo
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!   
        // define different detail levels 
        // for editor context population

        if (workspaceFolders || editor) {
            try {
                // Using populateEditorContext from src/frameworks/editorContext.ts
                editorContext = await populateEditorContext(context);
                logger.info('EditorContext successfully populated for sendChatMessage');
                
                // Enhance project type detection using frameworkHelper if needed
                if (editorContext && workspaceFolders) {
                    const enhancedProjectType = await detectProjectType(editorContext, workspaceFolders);
                    editorContext.project.type = enhancedProjectType;
                    logger.info(`Project type refined to ${enhancedProjectType.type} with confidence ${enhancedProjectType.confidence}`);
                }
            } catch (error) {
                logger.error(`Failed to populate EditorContext: ${error instanceof Error ? error.message : String(error)}`);
                // Fallback to minimal context if full population fails
                editorContext = {
                    fileName: editor?.document.fileName ? path.basename(editor.document.fileName) : '',
                    fileType: editor?.document.languageId || 'unknown',
                    content: editor?.document.getText() || '',
                    selection: null,
                    filePath: editor?.document.fileName || '',
                    cursorPosition: editor ? { 
                        line: editor.selection.active.line + 1, 
                        character: editor.selection.active.character 
                    } : { line: 1, character: 0 },
                    isDirty: editor?.document.isDirty || false,
                    project: {
                        workspaceName: vscode.workspace.name || 'Unnamed Workspace',
                        directories: projectInfo,
                        type: { type: 'unknown', confidence: 0, indicators: [] }
                    },
                    openTabs: []
                };
            }
        } else {
            logger.info('No workspace or editor open, proceeding with null EditorContext');
        }

        if (editorContext) {
            console.log(`Sending message with context from file: ${editorContext.fileName}`);
            // Add your provider-specific logic here using editorContext
        }



        // MAIN SWITCH
        const trafficSwitch = new TrafficSwitch(
            text,
            context,
            provider,
            editorContext,
            states,
            ...additionalArgs
          );
          await trafficSwitch.handleTraffic();
        return;

        // const activeModels = Object.entries(settings.aiModels)
        //     .filter(([_, config]) => config.active)
        //     .map(([model]) => model);
        
        // let responseText = 'No active AI models configured.';
        // let rawResponse: any = null;
        // let providerUsed: string | undefined;


        // provider.sendMessage({ type: 'chatContext', context: editorContext, prompt: text });


        // if (activeModels.length > 0 && editorContext) {
        //     const result = await EngineHandler.processPrompt(text, editorContext, context, provider);
        //     responseText = result;
        //     console.log(responseText);
        // } else if (!editorContext) {
        //     responseText = 'No editor context available.';
        // }

        // provider.sendMessage({
        //     type: 'chatResponse',
        //     text: responseText,
        //     responseType: 'markdown',
        //     progress: 100,
        //     complete: true,
        //     context: editorContext,
        //     prompt: text
        
        // });

        // const chatHistory: ChatHistoryEntry[] = context.globalState.get('qcode.chatHistory', []);

        // const newEntry: ChatHistoryEntry = {
        //     id: Date.now().toString(),
        //     prompt: text,
        //     response: responseText,
        //     rawResponse, // Store the raw response
        //     timestamp: new Date().toISOString(),
        //     context: editorContext,
        //     provider: providerUsed // Store the provider used
        // };
        // chatHistory.push(newEntry);
        // await context.globalState.update('qcode.chatHistory', chatHistory);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        provider.sendMessage({ type: 'chatError', text: `Error: ${message}` });
        console.error('Chat error:', error);
    }
}

export async function removeChatEntry(
    context: vscode.ExtensionContext,
    provider: QCodePanelProvider,
    id: string
) {
    let chatHistory: ChatHistoryEntry[] = context.globalState.get('qcode.chatHistory', []);
    chatHistory = chatHistory.filter(entry => entry.id !== id);
    await context.globalState.update('qcode.chatHistory', chatHistory);
    provider.sendMessage({ type: 'chatHistory', history: chatHistory });
}

export async function clearChatHistory(
    context: vscode.ExtensionContext,
    provider: QCodePanelProvider
) {
    await context.globalState.update('qcode.chatHistory', []);
    provider.sendMessage({ type: 'chatHistory', history: [] });
}

export async function exportChatHistory(
    context: vscode.ExtensionContext,
    provider: QCodePanelProvider
) {
    const chatHistory: ChatHistoryEntry[] = context.globalState.get('qcode.chatHistory', []);
    const jsonContent = JSON.stringify(chatHistory, null, 2);
    
    const uri = await vscode.window.showSaveDialog({
        filters: { 'JSON': ['json'] },
        defaultUri: vscode.Uri.file('qcode_chat_history.json')
    });

    if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(jsonContent, 'utf8'));
        vscode.window.showInformationMessage('Chat history exported successfully!');
    }
}

export async function getChatHistory(context: vscode.ExtensionContext, provider: QCodePanelProvider) {
    const chatHistory = context.globalState.get('qcode.chatHistory', []);
    provider.sendMessage({ type: 'chatHistory', history: chatHistory });
}

export const commandMap: { [key: string]: () => Promise<void> } = {
    'hello': async () => {
        vscode.window.showInformationMessage('Hello World from QCode!');
    },
    'analyze': async () => {
        // Placeholder for analysis logic
    },
    'modify': async () => {
        // Placeholder for modification logic
    }
};