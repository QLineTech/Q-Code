// engine_typescript.ts
import { EditorContext, AIPrompt, ChatStates } from '../types';
import { ExtensionContext } from 'vscode';
import { Engine } from './engine_base';

export class TypescriptEngine extends Engine {
    protected systemPromptBase = 'You are an expert TypeScript developer. Implement the user request with strict typing, modern TS features, and ensure the code is robust and maintainable.';

    static async processPrompt(
        prompt: string,
        context: EditorContext,
        extContext: ExtensionContext,
        states: ChatStates
    ): Promise<AIPrompt> {
        const engine = new TypescriptEngine();
        return engine.constructPrompt(prompt, context, extContext, states);
    }

    protected getImportRegex(): RegExp {
        return /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    }

    protected isExternalImport(importPath: string): boolean {
        return !importPath.startsWith('.') && !importPath.startsWith('/');
    }

    protected extractPackageName(importPath: string): string | null {
        if (this.isExternalImport(importPath)) {
            return importPath.split('/')[0].replace(/^@/, '');
        }
        return null;
    }

    protected getFoldersToSkip(): string[] {
        return ['.git', 'node_modules', 'dist', 'build'];
    }
}