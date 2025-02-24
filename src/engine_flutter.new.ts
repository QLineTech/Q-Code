// engine_flutter.ts
import { EditorContext, AIPrompt, ChatStates } from './types';
import { ExtensionContext } from 'vscode';
import { Engine } from './engine_base';

export class FlutterEngine extends Engine {
    protected systemPromptBase = 'You are an expert Flutter/Dart developer. Learn all given code and implement the user request with stable, correct logic. Double-check the result for bugs or mistakes and regenerate if needed to provide a final, error-free output.';

    static async processPrompt(
        prompt: string,
        context: EditorContext,
        extContext: ExtensionContext,
        states: ChatStates
    ): Promise<AIPrompt> {
        const engine = new FlutterEngine();
        return engine.constructPrompt(prompt, context, extContext, states);
    }

    protected getImportRegex(): RegExp {
        return /import\s+['"]([^'"]+)['"]/g;
    }

    protected isExternalImport(importPath: string): boolean {
        return importPath.startsWith('package:');
    }

    protected extractPackageName(importPath: string): string | null {
        if (this.isExternalImport(importPath)) {
            return importPath.split('/')[0].split(':')[1];
        }
        return null;
    }

    protected getFoldersToSkip(): string[] {
        return ['.git', '.dart_tool', '.idea', 'build', '.gradle'];
    }
}