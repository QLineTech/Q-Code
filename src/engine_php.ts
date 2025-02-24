// engine_php.ts
import { EditorContext, AIPrompt, ChatStates } from './types';
import { ExtensionContext } from 'vscode';
import { Engine } from './engine_base';

export class PhpEngine extends Engine {
    protected systemPromptBase = 'You are an expert PHP developer. Implement the user request following PHP best practices, ensuring security and performance.';

    static async processPrompt(
        prompt: string,
        context: EditorContext,
        extContext: ExtensionContext,
        states: ChatStates
    ): Promise<AIPrompt> {
        const engine = new PhpEngine();
        return engine.constructPrompt(prompt, context, extContext, states);
    }

    protected getImportRegex(): RegExp {
        return /use\s+([\\\w]+)(?:\s+as\s+\w+)?;/g;
    }

    protected isExternalImport(importPath: string): boolean {
        return importPath.includes('\\') && !importPath.startsWith('App\\');
    }

    protected extractPackageName(importPath: string): string | null {
        if (this.isExternalImport(importPath)) {
            return importPath.split('\\')[0];
        }
        return null;
    }

    protected getFoldersToSkip(): string[] {
        return ['.git', 'vendor', 'public'];
    }
}