// engine_handler.ts
import { FlutterEngine } from './engine_flutter';
import { PythonEngine } from './engine_python';
import { LaravelEngine } from './engine_laravel';
import { JavascriptEngine } from './engine_javascript';
import { TypescriptEngine } from './engine_typescript';
import { EditorContext, ProjectType } from './types';
import { ExtensionContext } from 'vscode';
import { QCodeAIProvider } from './ai';  // Import QCodeAIProvider

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
        const aiProvider = new QCodeAIProvider(extContext);
        const settings = aiProvider.getCurrentSettings();

        // Extract relevant settings
        const activeAIs = settings.analyzeAIs; // List of active AI providers
        // const temperature = parseFloat(settings.temperature) || 0.7; // Default to 0.7 if invalid
        // const volumeSensitivity = parseInt(settings.volumeSensitivity) || 50; // Default to 50 if invalid

        // TODO (change later)
        const temperature = 0;
        const volumeSensitivity = 0;
        console.log(`[EngineHandler] Loaded settings - Active AIs: ${activeAIs}, Temperature: ${temperature}, Volume Sensitivity: ${volumeSensitivity}`);

        switch (projectType) {
            case 'flutter':
                return await FlutterEngine.processPrompt(prompt, editorContext, extContext, states,{ activeAIs, temperature, volumeSensitivity });
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