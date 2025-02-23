// engine_handler.ts
import { FlutterEngine } from './engine_flutter';
import { PythonEngine } from './engine_python';
import { LaravelEngine } from './engine_laravel';
import { JavascriptEngine } from './engine_javascript';
import { TypescriptEngine } from './engine_typescript';
import { EditorContext, ProjectType } from './types';
import { ExtensionContext } from 'vscode';

export class EngineHandler {
    static async processPrompt(prompt: string, editorContext: EditorContext, extContext: ExtensionContext,
        states: {
            attachRelated: boolean;
            thinking: boolean;
            webAccess: boolean;
            autoApply: boolean;
            folderStructure: boolean;
        },
    ): Promise<string> {        
        const projectType = editorContext.project.type.type;
        

        switch (projectType) {
            case 'flutter':
                return await FlutterEngine.processPrompt(prompt, editorContext, extContext, states);
            // case 'python':
            //     return await PythonEngine.processPrompt(prompt, context);
            // case 'laravel':
            //     return await LaravelEngine.processPrompt(prompt, context);
            // case 'javascript':
            //     return await JavascriptEngine.processPrompt(prompt, context);
            // case 'typescript':
            //     return await TypescriptEngine.processPrompt(prompt, context);
            default:
                return `No specific engine found for project type "${projectType}".\n` +
                       `Processing prompt generically: "${prompt}"\n` +
                       `Context: ${JSON.stringify(editorContext, null, 2)}`;
        }
    }
}