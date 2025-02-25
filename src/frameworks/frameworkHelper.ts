import * as vscode from 'vscode';

import { EditorContext } from "../types/editorContext";
import { ProjectType } from "../types/project";
import { readFile } from '../utils/file';

export async function detectProjectType(
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