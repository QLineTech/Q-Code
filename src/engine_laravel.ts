// engine_laravel.ts
import { EditorContext, AIPrompt, ChatStates } from './types';
import { ExtensionContext } from 'vscode';
import { Engine } from './engine_base';

export class LaravelEngine extends Engine {
    protected systemPromptBase = 'You are an expert Laravel/PHP developer. Implement the user request following Laravel conventions and PHP best practices. Ensure the code is secure and optimized.';

    static async processPrompt(
        prompt: string,
        context: EditorContext,
        extContext: ExtensionContext,
        states: ChatStates
    ): Promise<AIPrompt> {
        const engine = new LaravelEngine();
        return engine.constructPrompt(prompt, context, extContext, states);
    }

    protected getImportRegex(): RegExp {
        return /use\s+([\\\w]+)(?:\s+as\s+\w+)?;/g;
    }

    protected isExternalImport(importPath: string): boolean {
        return !importPath.startsWith('App\\');
    }

    protected extractPackageName(importPath: string): string | null {
        if (this.isExternalImport(importPath)) {
            return importPath.split('\\')[0];
        }
        return null;
    }

    protected getFoldersToSkip(): string[] {
        return ['.git', 'vendor', 'storage', 'public', 'node_modules'];
    }
}