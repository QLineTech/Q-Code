// engine_react.ts
import { EditorContext, AIPrompt, ChatStates } from '../types';
import { ExtensionContext } from 'vscode';
import { Engine } from './engine_base';

export class ReactEngine extends Engine {
    protected systemPromptBase = 'You are an expert React developer. Implement the user request using functional components, hooks, and modern React patterns. Ensure the code is optimized and type-safe where applicable.';

    static async processPrompt(
        prompt: string,
        context: EditorContext,
        extContext: ExtensionContext,
        states: ChatStates
    ): Promise<AIPrompt> {
        const engine = new ReactEngine();
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
        return ['.git', 'node_modules', 'dist', 'build', 'public'];
    }
}