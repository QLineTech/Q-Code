// engine_javascript.ts
import { EditorContext, AIPrompt, ChatStates } from '../types';
import { ExtensionContext } from 'vscode';
import { Engine } from './engine_base';

export class JavascriptEngine extends Engine {
    protected systemPromptBase = 'You are an expert JavaScript developer. Implement the user request with modern ES6+ syntax, ensuring the code is clean, efficient, and error-free.';

    static async processPrompt(
        prompt: string,
        context: EditorContext,
        extContext: ExtensionContext,
        states: ChatStates
    ): Promise<AIPrompt> {
        const engine = new JavascriptEngine();
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