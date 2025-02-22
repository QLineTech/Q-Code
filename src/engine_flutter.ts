import { queryAI } from "./ai";
import { EditorContext } from "./types";
import { ExtensionContext } from 'vscode'; // Add this import

// engine_flutter.ts
export class FlutterEngine {
    static async processPrompt(prompt: string, context: EditorContext, extContext: ExtensionContext): Promise<string> { 
        let response = `Flutter project detected. Processing prompt: "${prompt}"\n`;
        
        // Add Flutter-specific logic here
        if (prompt.toLowerCase().includes('widget')) {
            response += 'This appears to be a widget-related query.\n';
            // Add more Flutter-specific processing
        }
        
        response += `Context: ${context.fileName} (${context.fileType} file)`;

        response += `\r\n\r\n`;
        const jsonContext = JSON.stringify(context, null, 2); // The '2' adds indentation for readability
        response += "```json\r\n"+ jsonContext + "\r\n```";


        // Thinking process
        // Get File Structure
        // Get Relations
        // Get Standards
        // Examples
        // Docs
        // Rules
        // Output
        // Add AI analysis
        try {
            const aiPrompt = `
                Analyze this Flutter-related prompt and context:
                Prompt: "${prompt}"
                Context: ${JSON.stringify(context)}
                Provide suggestions or insights about the code structure or potential improvements.
            `;
            
            const aiAnalysis = await queryAI(aiPrompt, extContext, 'grok3AI'); // Pass extContext            response += `\n\nAI Analysis:\n${aiAnalysis}`;
            
            response += "\n\nResponse:\n\n```markdown\r\n" + aiAnalysis + "\r\n```";
        } catch (error) {
            response += `\n\nAI Analysis Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        
        return response;
    }
}