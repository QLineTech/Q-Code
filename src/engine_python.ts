// engine_python.ts
import { EditorContext, AIPrompt, ChatStates } from './types';
import { ExtensionContext } from 'vscode';
import { Engine } from './engine_base';

export class PythonEngine extends Engine {
    protected systemPromptBase = 'You are an expert Python developer. Analyze the provided code and implement the user request with clean, idiomatic Python. Ensure the code follows PEP 8 and is free of errors.';

    static async processPrompt(
        prompt: string,
        context: EditorContext,
        extContext: ExtensionContext,
        states: ChatStates
    ): Promise<AIPrompt> {
        const engine = new PythonEngine();
        return engine.constructPrompt(prompt, context, extContext, states);
    }

    protected getImportRegex(): RegExp {
        return /(?:import\s+([\w.]+(?:\s+as\s+\w+)?)|from\s+([\w.]+)\s+import\s+[\w,\s*]+)/g;
    }

    protected isExternalImport(importPath: string): boolean {
        return !importPath.startsWith('.');
    }

    protected extractPackageName(importPath: string): string | null {
        if (this.isExternalImport(importPath)) {
            return importPath.split('.')[0];
        }
        return null;
    }

    protected getFoldersToSkip(): string[] {
        return ['.git', '__pycache__', '.venv', 'venv', 'build', 'dist'];
    }
}