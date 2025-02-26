import { ExtensionContext } from 'vscode';

// Define parameter metadata
type ParamInfo = {
    type: string;
    description: string;
    required?: boolean;
};

// Define tool metadata
type ToolMetadata = {
    name: string;
    title: string;
    description: string;
    parameters: Record<string, ParamInfo>;
    usage: string;
    keywords: string[];
    categories: string[];
};

// Define the tool structure
type Tool = {
    metadata: ToolMetadata;
    execute: (args: any) => string | Promise<string>;
};

// Define the expected tool format for toolUse.ts
type ToolForUse = {
    name: string;
    description: string;
    parameters: Record<string, { type: string; description: string; required?: boolean }>;
    execute: (args: any) => string | Promise<string>;
};

/**
 * ToolLib class to manage a library of tools for use with toolUse.ts
 */
export class ToolLib {
    private tools: Map<string, Tool> = new Map();

    /**
     * Register a new tool with its metadata and implementation
     * @param tool The tool to register
     * @throws Error if a tool with the same name already exists
     */
    public registerTool(tool: Tool): void {
        if (this.tools.has(tool.metadata.name)) {
            throw new Error(`Tool with name '${tool.metadata.name}' already exists.`);
        }
        this.tools.set(tool.metadata.name, tool);
    }

    /**
     * Retrieve a tool by its name
     * @param name The name of the tool
     * @returns The tool if found, undefined otherwise
     */
    public getTool(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    /**
     * List metadata for all registered tools
     * @returns An array of tool metadata
     */
    public listTools(): ToolMetadata[] {
        return Array.from(this.tools.values()).map(tool => tool.metadata);
    }

    /**
     * Search tools by query string (matches name, title, description, keywords, or categories)
     * @param query The search query
     * @returns An array of matching tool metadata
     */
    public searchTools(query: string): ToolMetadata[] {
        const lowerQuery = query.toLowerCase();
        return this.listTools().filter(tool =>
            tool.name.toLowerCase().includes(lowerQuery) ||
            tool.title.toLowerCase().includes(lowerQuery) ||
            tool.description.toLowerCase().includes(lowerQuery) ||
            tool.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery)) ||
            tool.categories.some(category => category.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Get tools in the format expected by toolUse.ts
     * @returns An array of tools compatible with toolUse.ts
     */
    public getToolsForUse(): ToolForUse[] {
        return Array.from(this.tools.values()).map(tool => ({
            name: tool.metadata.name,
            description: tool.metadata.description,
            parameters: tool.metadata.parameters,
            execute: tool.execute,
        }));
    }

    /**
     * Generate markdown documentation for all registered tools
     * @returns A string containing the documentation in markdown format
     */
    public generateDocumentation(): string {
        const docs: string[] = [];
        this.tools.forEach(tool => {
            const { metadata } = tool;
            docs.push(`### ${metadata.title} (\`${metadata.name}\`)`);
            docs.push(`**Description**: ${metadata.description}`);
            docs.push(`**Categories**: ${metadata.categories.join(', ')}`);
            docs.push(`**Keywords**: ${metadata.keywords.join(', ')}`);
            docs.push(`**Parameters**:`);
            if (Object.keys(metadata.parameters).length === 0) {
                docs.push('- None');
            } else {
                for (const [paramName, paramInfo] of Object.entries(metadata.parameters)) {
                    const required = paramInfo.required ? 'required' : 'optional';
                    docs.push(`- \`${paramName}\` (${paramInfo.type}, ${required}): ${paramInfo.description}`);
                }
            }
            docs.push(`**Usage**: ${metadata.usage}`);
            docs.push(`**Return Type**: string | Promise<string>`);
            docs.push('');
        });
        return docs.join('\n');
    }
}

// Example usage with various tools
const toolLib = new ToolLib();

// Git operation tool
const gitStatusTool: Tool = {
    metadata: {
        name: 'git_status',
        title: 'Git Status',
        description: 'Retrieve the status of the current Git repository.',
        parameters: {},
        usage: 'Run this tool to check the status of your Git repository.',
        keywords: ['git', 'status', 'repository'],
        categories: ['git_operations'],
    },
    execute: async () => {
        return 'Git status: clean';
    },
};

// File operation tool
const readFileTool: Tool = {
    metadata: {
        name: 'read_file',
        title: 'Read File',
        description: 'Read the contents of a specified file.',
        parameters: {
            path: { type: 'string', description: 'The file path', required: true },
        },
        usage: 'Provide the file path to read its contents.',
        keywords: ['file', 'read', 'contents'],
        categories: ['file_operations'],
    },
    execute: async (args: { path: string }) => {
        return `Contents of ${args.path}`;
    },
};

// Browse operation tool
const browseUrlTool: Tool = {
    metadata: {
        name: 'browse_url',
        title: 'Browse URL',
        description: 'Open a URL in the default browser.',
        parameters: {
            url: { type: 'string', description: 'The URL to open', required: true },
        },
        usage: 'Provide a URL to open it in your browser.',
        keywords: ['browse', 'url', 'web'],
        categories: ['browse_operations'],
    },
    execute: async (args: { url: string }) => {
        return `Browsing ${args.url}`;
    },
};

// Mail operation tool
const sendEmailTool: Tool = {
    metadata: {
        name: 'send_email',
        title: 'Send Email',
        description: 'Send an email to a recipient.',
        parameters: {
            to: { type: 'string', description: 'Recipient email address', required: true },
            subject: { type: 'string', description: 'Email subject', required: true },
            body: { type: 'string', description: 'Email body', required: true },
        },
        usage: 'Provide recipient, subject, and body to send an email.',
        keywords: ['email', 'send', 'mail'],
        categories: ['mail_operations'],
    },
    execute: async (args: { to: string; subject: string; body: string }) => {
        return `Email sent to ${args.to}`;
    },
};

// Computer use tool
const shutdownTool: Tool = {
    metadata: {
        name: 'shutdown',
        title: 'Shutdown Computer',
        description: 'Shut down the computer.',
        parameters: {},
        usage: 'Run this tool to shut down your computer.',
        keywords: ['computer', 'shutdown', 'power'],
        categories: ['computer_use'],
    },
    execute: async () => {
        return 'Shutting down...';
    },
};

// Flutter coding tool
const flutterBuildTool: Tool = {
    metadata: {
        name: 'flutter_build',
        title: 'Flutter Build',
        description: 'Build a Flutter project.',
        parameters: {
            projectPath: { type: 'string', description: 'Path to Flutter project', required: true },
            target: { type: 'string', description: 'Build target (e.g., apk)', required: false },
        },
        usage: 'Provide the project path and optionally a target to build.',
        keywords: ['flutter', 'build', 'mobile'],
        categories: ['flutter_coding'],
    },
    execute: async (args: { projectPath: string; target?: string }) => {
        return `Built Flutter project at ${args.projectPath}`;
    },
};

// JavaScript coding tool
const jsEvaluateTool: Tool = {
    metadata: {
        name: 'js_evaluate',
        title: 'Evaluate JavaScript',
        description: 'Evaluate a JavaScript expression.',
        parameters: {
            expression: { type: 'string', description: 'JS expression to evaluate', required: true },
        },
        usage: 'Provide a JavaScript expression to evaluate.',
        keywords: ['javascript', 'evaluate', 'code'],
        categories: ['js_coding'],
    },
    execute: async (args: { expression: string }) => {
        try {
            const result = eval(args.expression);
            return String(result);
        } catch (error) {
            return `Error: ${(error as Error).message}`;
        }
    },
};

// Register all example tools
toolLib.registerTool(gitStatusTool);
toolLib.registerTool(readFileTool);
toolLib.registerTool(browseUrlTool);
toolLib.registerTool(sendEmailTool);
toolLib.registerTool(shutdownTool);
toolLib.registerTool(flutterBuildTool);
toolLib.registerTool(jsEvaluateTool);

// Example of how to integrate with toolUse.ts
const toolsForUse = toolLib.getToolsForUse();
// Pass toolsForUse to toolUse.ts constructor or setter method