// /src/frameworks/trafficSwitch.ts
import * as vscode from 'vscode';
import { QCodePanelProvider } from '../webview/webview';
import { EditorContext, ChatStates, AIModels, QCodeSettings } from '../types/types';
import { logger } from '../utils/logger';
import { MediaGenerator } from './html/media';
import { generateStepper } from './html/stepper';
import { generateToast } from './html/toast';
import { TextGenerator } from './html/typography';
import { generateTableHTML } from './html/table';
import { GitOperations } from '../utils/gitOperations';
import { getValidSettings } from '../settings/settings';
import { queryAI, queryAI2 } from '../ai/ai';
import { ToolUse } from '../ai/toolUse'; 
import { ToolLib } from '../engine/toolLib'; 


async function checkGitUserStatus(context: vscode.ExtensionContext) {
    // Create an instance of GitOperations
    const gitOps = new GitOperations(context);

    try {
        // Check if user is logged in to Git
        const isLoggedIn = await gitOps.isUserLoggedInToGit();
        
        // Variable to store user info (will be undefined if not logged in)
        let gitUserInfo: { username: string; email: string } | undefined;

        if (isLoggedIn) {
            // Get user info if logged in
            gitUserInfo = await gitOps.collectGitUserInfo();
            
            if (gitUserInfo) {
                // console.log(`Git User: ${gitUserInfo.username} <${gitUserInfo.email}>`);
                // vscode.window.showInformationMessage(
                //     `Git User: ${gitUserInfo.username} <${gitUserInfo.email}>`
                // );
            } else {
                // console.log('User is logged in but no credentials found');
                // vscode.window.showWarningMessage('Git credentials not fully configured');
            }
        } else {
            // console.log('No Git user logged in or no Git repository found');
            // vscode.window.showInformationMessage(
            //     'No Git user logged in or no Git repository detected'
            // );
        }

        // Now you can use isLoggedIn and gitUserInfo in your code
        // For example:
        return {
            isLoggedIn,
            user: gitUserInfo
        };

    } catch (error) {
        console.error('Error checking Git user status:', error);
        vscode.window.showErrorMessage('Failed to check Git user status');
        throw error;
    }
}

export class TrafficSwitch {
  private text: string;
  private context: any; // ExtensionContext from VSCode
  private provider: QCodePanelProvider;
  private editorContext: EditorContext | null;
  private states: ChatStates;
  private additionalArgs: any[];
  private toolLib: ToolLib; 

  constructor(
    text: string,
    context: any,
    provider: QCodePanelProvider,
    editorContext: EditorContext | null,
    states: ChatStates,
    ...additionalArgs: any[]
  ) {
    this.text = text;
    this.context = context;
    this.provider = provider;
    this.editorContext = editorContext;
    this.states = states;
    this.additionalArgs = additionalArgs;
    this.toolLib = new ToolLib(); 

    // Register default tools from toolLib.ts
    this.registerDefaultTools();
  }

  
  private registerDefaultTools(): void {
    // Register example tools from toolLib.ts (you can move this to a config file or separate method)
    this.toolLib.registerTool({
        metadata: {
            name: 'git_status',
            title: 'Git Status',
            description: 'Retrieve the status of the current Git repository.',
            parameters: {},
            usage: 'Run this tool to check the status of your Git repository.',
            keywords: ['git', 'status', 'repository'],
            categories: ['git_operations'],
        },
        execute: async () => 'Git status: clean',
    });

    this.toolLib.registerTool({
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
        execute: async (args: { path: string }) => `Contents of ${args.path}`,
    });

      // Add more tools as needed...
  }

  // Main method to handle traffic (you can implement your logic here)
  public async handleTraffic(): Promise<void> {
    logger.info(`TrafficSwitch handling message: "${this.text}"`);
    const settings = getValidSettings(this.context.globalState.get('qcode.settings'));

    const userGitAccount = await checkGitUserStatus(this.context);
    const resultJson = JSON.stringify(userGitAccount, null, 2); 

    this.provider.sendMessage({
      type: 'chatResponse',
      text: "```json\n" + resultJson + "\n```",
      responseType: 'markdown',
      prompt: "USER GIT INFO",
      context: {
        fileName: 'account',
        fileType: 'git',
        selection: 'git account',
      },
      progress: 100, // Mark as complete
      complete: true,
    });
    

    switch(this.states.qmode) {
      case("QCode"):

      break;
      case("QResearcher"):

      break;
      case("QFunc"):
        await this.handleQFuncMode(settings);
      break;
      case("QDesign"):

      break;
      case("QCyber"):

      break;
      case("QAnalyzer"):

      break;
      case("QLawyer"):

      break;
      default: 
        logger.warning(`Unknown qmode: ${this.states.qmode}`);
        this.provider.sendMessage({
            type: 'chatResponse',
            text: 'Unknown mode selected.',
            responseType: 'plain',
            prompt: this.text,
            context: this.editorContext,
            progress: 100,
            complete: true,
        });
        return;
    }

    const activeModels = Object.entries(settings.aiModels)
        .filter(([_, config]) => config.active)
        .map(([model]) => model);
    
    let responseText = 'No active AI models configured.';
    let rawResponse: any = null;
    let providerUsed: string | undefined;


    this.provider.sendMessage({ type: 'chatContext', context: this.editorContext, prompt: this.text });

    let response = '';
    if (activeModels.length > 0 && this.editorContext) {
        const activeAI = activeModels[0]; 
        const aiResult = await queryAI2(this.text, this.context, activeAI as keyof AIModels);
        
        response += '\n--------\n';
        response += '| Description  | Amount         |\n';
        response += '|--------------|----------------|\n';
        response += `| Total Cost   | $${aiResult.cost.sum.toFixed(6)} |\n`;
        response += `| Input Cost   | $${aiResult.cost.inputCost.toFixed(6)} |\n`;
        response += `| Output Cost  | $${aiResult.cost.outputCost.toFixed(6)} |\n`;
        response += '\n--------\n';

        this.provider.sendMessage({
          type: 'chatResponse',
          text: response,
          responseType: "markdown",
          prompt: "Cost Report",
          context: "Demo",
          progress: 100, // Mark as complete
          complete: true,
        });
        this.provider.sendMessage({
          type: 'chatResponse',
          text: aiResult.result,
          responseType: "markdown",
          prompt: this.text,
          context: "Demo",
          progress: 100, // Mark as complete
          complete: true,
        });

    } else if (!this.editorContext) {
      responseText = 'No editor context available.';
      this.provider.sendMessage({
          type: 'chatResponse',
          text: responseText,
          responseType: 'plain',
          prompt: this.text,
          context: this.editorContext,
          progress: 100,
          complete: true,
      });
    }    
    // await this.sendTestMessages();
  }

  private async handleQFuncMode(settings: QCodeSettings): Promise<void> {
    logger.info('Handling QFunc mode for tool use.');

    // Get active models that support function calling
    const functionCallingModels = Object.entries(settings.aiModels)
        .filter(([_, config]) => config.active && settings.functionCallingAIs?.[_[0] as keyof AIModels])
        .map(([model]) => model as keyof QCodeSettings['aiModels']);

      if (functionCallingModels.length === 0) {
          this.provider.sendMessage({
              type: 'chatResponse',
              text: 'No AI models configured for function calling.',
              responseType: 'plain',
              prompt: this.text,
              context: this.editorContext,
              progress: 100,
              complete: true,
          });
          return;
      }

      // Use the first available function-calling model
      const provider = functionCallingModels[0];
      logger.info(`Using AI provider: ${provider} for QFunc mode.`);

      // Initialize ToolUse with tools from ToolLib
      const toolsForUse = this.toolLib.getToolsForUse();
      const toolUse = new ToolUse(this.context);
      // Note: We'll need to modify ToolUse constructor to accept tools or add a setter
      // For now, we'll assume ToolUse uses its default tools; adjust as needed

      try {
          const result = await toolUse.queryWithTools(this.text, provider);

          // Send the tool use result to the UI
          let responseText = `**Tool Use Result**:\n${result.result}`;
          if (result.cost.sum > 0) {
              responseText += '\n\n**Cost Breakdown**:\n';
              responseText += '| Description  | Amount         |\n';
              responseText += '|--------------|----------------|\n';
              responseText += `| Total Cost   | $${result.cost.sum.toFixed(6)} |\n`;
              responseText += `| Input Cost   | $${result.cost.inputCost.toFixed(6)} |\n`;
              responseText += `| Output Cost  | $${result.cost.outputCost.toFixed(6)} |\n`;
          }

          this.provider.sendMessage({
              type: 'chatResponse',
              text: responseText,
              responseType: 'markdown',
              prompt: this.text,
              context: this.editorContext,
              progress: 100,
              complete: true,
          });

          // Log raw response for debugging
          // logger.info('Tool use raw response:', JSON.stringify(result.raw, null, 2));
      } catch (error) {
          logger.error(`Error in QFunc mode with provider ${provider}: ` +  error);
          this.provider.sendMessage({
              type: 'chatResponse',
              text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
              responseType: 'plain',
              prompt: this.text,
              context: this.editorContext,
              progress: 100,
              complete: true,
          });
      }
  }

  
  // Test method to send all supported message types to the UI
  private async sendTestMessages(): Promise<void> {
    const sampleContext = this.editorContext || {
      fileName: 'example.ts',
      fileType: 'typescript',
      selection: 'console.log("Hello");',
    };
  
    const testMessages = [
      // Markdown (10 examples)
      {
        responseType: 'markdown',
        text: '# Title\nA **bold** statement with a [link](https://example.com).\n```python\nprint("Hello, world!")\n```',
        prompt: 'Show a Python example in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '## List Example\n- Item 1\n- Item 2\n- Item 3\n> Quoted text here.',
        prompt: 'Display a list in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '# Code Heavy\n```javascript\nfunction greet() {\n  return "Hi!";\n}\n```',
        prompt: 'Show a JS function in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '### Table\n| Name | Age |\n|------|-----|\n| John | 30  |\n| Jane | 25  |',
        prompt: 'Render a table in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '# Emphasis\n*Italic* and **bold** and ***both***.',
        prompt: 'Test emphasis in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '## Poem\nRoses are red,  \nViolets are blue,  \n```bash\necho "Code runs too!"\n```',
        prompt: 'Mix prose and code in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '# Long Text\nThis is a longer paragraph to test wrapping and readability in the UI.',
        prompt: 'Test paragraph in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '## Nested Code\n```html\n<div>\n  <p>Hello</p>\n</div>\n```',
        prompt: 'Show HTML in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '# Image\n![Alt text](https://via.placeholder.com/150)',
        prompt: 'Test image link in Markdown',
        context: sampleContext,
      },
      {
        responseType: 'markdown',
        text: '## Multi-line Code\n```java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hi");\n  }\n}\n```',
        prompt: 'Show Java code in Markdown',
        context: sampleContext,
      },
  
      // HTML (10 examples)
      {
        responseType: 'html',
        text: '<h1 style="color: green;">Big Header</h1><p>A styled paragraph.</p>',
        prompt: 'Show styled HTML',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<ul><li>First</li><li>Second</li></ul>',
        prompt: 'Display an HTML list',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<div style="background: #f0f0f0; padding: 10px;">Boxed content</div>',
        prompt: 'Test a styled div in HTML',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<table border="1"><tr><th>ID</th><th>Name</th></tr><tr><td>1</td><td>Alice</td></tr></table>',
        prompt: 'Show an HTML table',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<p><strong>Bold</strong> and <em>italic</em> text.</p>',
        prompt: 'Test HTML emphasis',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<h2>Header</h2><pre>Preformatted\ntext here</pre>',
        prompt: 'Mix headings and pre in HTML',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<p style="font-family: monospace;">Monospace text</p>',
        prompt: 'Test monospace font in HTML',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<a href="https://example.com" target="_blank">Click me</a>',
        prompt: 'Show a link in HTML',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<div><img src="https://via.placeholder.com/100" alt="Sample image"></div>',
        prompt: 'Test an image in HTML',
        context: sampleContext,
      },
      {
        responseType: 'html',
        text: '<p style="color: red; font-size: 20px;">Large red text</p>',
        prompt: 'Test large colored text in HTML',
        context: sampleContext,
      },
  
      // Plain (10 examples)
      {
        responseType: 'plain',
        text: 'Simple text with no formatting.',
        prompt: 'Show basic plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: 'Line 1\nLine 2\nLine 3',
        prompt: 'Test multi-line plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: 'ERROR: Something went wrong!',
        prompt: 'Show an error in plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: 'name: John\nage: 28\ncity: New York',
        prompt: 'Display key-value pairs in plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: 'This is a very long line of text to see how it wraps or overflows in the UI without any formatting applied.',
        prompt: 'Test long plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: '12345\n67890',
        prompt: 'Show numbers in plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: 'Special chars: @#$%^&*()',
        prompt: 'Test special characters in plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: 'Short message',
        prompt: 'Show a short plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: 'Log entry: 2025-02-24 10:00:00 - User logged in',
        prompt: 'Test log format in plain text',
        context: sampleContext,
      },
      {
        responseType: 'plain',
        text: 'TODO:\n- Fix bug\n- Add feature',
        prompt: 'Show a TODO list in plain text',
        context: sampleContext,
      },
  
      // Xterm (10 examples)
      {
        responseType: 'xterm',
        text: 'ls -la\ndir output here',
        prompt: 'Show terminal-style ls output',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'npm install\nInstalling dependencies...',
        prompt: 'Simulate npm install in terminal',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'git status\nOn branch main',
        prompt: 'Show git status in terminal',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'python script.py\nOutput: Success',
        prompt: 'Run a Python script in terminal',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'make build\nCompiling...',
        prompt: 'Simulate make command in terminal',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'curl https://api.example.com\n{"status": "ok"}',
        prompt: 'Show curl output in terminal',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'ps aux\nuser pid %cpu',
        prompt: 'List processes in terminal',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'docker ps\nCONTAINER ID   IMAGE',
        prompt: 'Show docker containers in terminal',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'cat file.txt\nFile contents here',
        prompt: 'Display file contents in terminal',
        context: sampleContext,
      },
      {
        responseType: 'xterm',
        text: 'whoami\nuser123',
        prompt: 'Show user in terminal',
        context: sampleContext,
      },
      // rawHTML media
      {
        responseType: 'rawHTML',
        text: '<video src="/docs/videos/flowbite.mp4" class="w-full" controls></video>',
        prompt: 'Show a basic video using MediaGenerator',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: '<video src="/docs/videos/demo.mp4" class="w-full h-auto" autoplay muted controls></video>',
        prompt: 'Display an autoplay muted video with MediaGenerator',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: '<figure><img src="/docs/images/example.jpg" alt="image description" class="h-auto max-w-full rounded-lg"><figcaption>Beautiful scenery</figcaption></figure>',
        prompt: 'Show an image with caption using MediaGenerator',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: '<a href="#" class="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow"><img src="/docs/images/card.jpg" alt="image description" class="h-auto max-w-full"><div class="pt-2 text-gray-900">Click to learn more</div></a>',
        prompt: 'Render an image card with link using MediaGenerator',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: '<img src="/docs/images/art.jpg" alt="image description" class="h-auto max-w-full rounded-lg grayscale hover:grayscale-0 transition-all duration-300">',
        prompt: 'Display a grayscale image with hover effect using MediaGenerator',
        context: sampleContext,
      },

      // New HTML examples from Tabs Generator (5 examples)
      {
        responseType: 'rawHTML',
        text: '<div class="border-b border-gray-200"><ul class="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500"><li class="me-2"><a href="#" class="inline-block p-4 text-blue-600 border-b-2 border-blue-600 rounded-t-lg active">Profile</a></li><li class="me-2"><a href="#" class="inline-block p-4 rounded-t-lg hover:text-gray-600 hover:border-gray-300">Dashboard</a></li><li class="me-2"><a href="#" class="inline-block p-4 rounded-t-lg hover:text-gray-600 hover:border-gray-300">Settings</a></li></ul></div>',
        prompt: 'Show underline tabs using Tabs Generator',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: '<div><ul class="flex flex-wrap text-sm font-medium text-center text-gray-500"><li class="me-4"><a href="#" class="inline-flex items-center p-2"><svg class="w-4 h-4 me-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 0a10 10 0 1 0 10 10..."/></svg>Profile</a></li><li class="me-4"><a href="#" class="inline-flex items-center p-2 text-gray-900 bg-gray-100 rounded-lg active">Dashboard</a></li></ul></div>',
        prompt: 'Display tabs with icons using Tabs Generator',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: '<div><ul class="flex flex-wrap text-sm font-medium text-center text-gray-500"><li class="me-2"><a href="#" class="inline-block px-4 py-2 text-white bg-gray-900 rounded-full active">Tab 1</a></li><li class="me-2"><a href="#" class="inline-block px-4 py-2 rounded-full hover:text-gray-600 hover:bg-gray-50">Tab 2</a></li><li class="me-2"><a href="#" class="inline-block px-4 py-2 rounded-full hover:text-gray-600 hover:bg-gray-50">Tab 3</a></li></ul></div>',
        prompt: 'Show pill-style tabs using Tabs Generator',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: '<div class="flex"><div class="me-4"><ul class="flex flex-col text-lg font-medium text-gray-500"><li><a href="#" class="inline-flex items-center p-4 text-blue-600 bg-gray-100 border-e-2 border-blue-500 active"><svg class="w-4 h-4 me-2" fill="currentColor" viewBox="0 0 20 20"><path d="M10 0a10 10 0 1 0 10 10..."/></svg>Profile</a></li><li><a href="#" class="inline-flex items-center p-4 hover:text-gray-600 hover:bg-gray-50">Settings</a></li></ul></div><div class="flex-1 p-4 bg-gray-50">Content goes here</div></div>',
        prompt: 'Render vertical tabs with icons using Tabs Generator',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: '<div><ul class="flex flex-wrap text-sm font-medium text-center text-gray-500 md:flex-nowrap"><li class="flex-1 me-2"><a href="#" class="inline-block w-full p-4 text-gray-900 bg-gray-100 active">Profile</a></li><li class="flex-1 me-2"><a href="#" class="inline-block w-full p-4 hover:text-gray-600 hover:bg-gray-50">Dashboard</a></li></ul></div>',
        prompt: 'Show full-width tabs using Tabs Generator',
        context: sampleContext,
      },
      // rawHTML media
      // MediaGenerator Samples (10 examples)
      {
        responseType: 'rawHTML',
        text: MediaGenerator.video({ src: "/videos/sample.mp4" }),
        prompt: 'Show a basic video player',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.video({ src: "/videos/demo.mp4", autoplay: true, muted: true, className: "w-full h-auto" }),
        prompt: 'Display an autoplaying muted video',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.image({ src: "/images/sample.jpg" }),
        prompt: 'Show a basic image',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.image({ src: "/images/scenery.jpg", caption: "Nature view", rounded: true }),
        prompt: 'Display an image with caption and rounded corners',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.image({ src: "/images/profile.jpg", rounded: "full", width: 128, height: 128 }),
        prompt: 'Show a circular profile image',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.image({ src: "/images/card.jpg", link: "https://example.com", caption: "Learn more" }),
        prompt: 'Display an image card with a link',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.image({ src: "/images/art.jpg", grayscale: true, rounded: "lg" }),
        prompt: 'Show a grayscale image with hover effect',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.image({ src: "/images/blur.jpg", blur: true, width: 300 }),
        prompt: 'Display a blurred image with hover removal',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.video({ src: "/videos/promo.mp4", controls: false, width: 400, height: 225 }),
        prompt: 'Show a video without controls',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: MediaGenerator.image({ src: "/images/team.jpg", caption: "Our Team", className: "max-w-md" }),
        prompt: 'Display a team image with custom width and caption',
        context: sampleContext,
      },

      // Stepper Samples (10 examples)
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Step 1" }, { title: "Step 2", isActive: true }], type: "vertical-listed" }),
        prompt: 'Show a basic vertical listed stepper',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Start", isCompleted: true }, { title: "Middle" }, { title: "End" }], type: "linear" }),
        prompt: 'Display a linear stepper with completed step',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Plan", description: "Choose a plan" }, { title: "Pay", isActive: true }], type: "detailed-linear" }),
        prompt: 'Show a detailed linear stepper',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Home" }, { title: "About", isActive: true }], type: "linear-breadcrumb" }),
        prompt: 'Display a breadcrumb-style stepper',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Event 1", isCompleted: true }, { title: "Event 2" }], type: "vertical-timeline" }),
        prompt: 'Show a vertical timeline stepper',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Task 1", isCompleted: true }, { title: "Task 2", isActive: true }, { title: "Task 3" }], type: "vertical-listed", darkMode: true }),
        prompt: 'Display a dark mode vertical stepper',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Step A" }, { title: "Step B" }], type: "linear", maxWidth: "max-w-full" }),
        prompt: 'Show a full-width linear stepper',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Process 1", description: "Details" }, { title: "Process 2" }], type: "detailed-linear", activeColor: "text-red-600" }),
        prompt: 'Display a detailed stepper with custom active color',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Done", isCompleted: true }, { title: "Next" }], type: "vertical-listed", spacing: "space-y-6" }),
        prompt: 'Show a vertical stepper with custom spacing',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateStepper({ steps: [{ title: "Begin" }, { title: "End", isActive: true }], type: "linear-breadcrumb", textColor: "text-purple-500" }),
        prompt: 'Display a breadcrumb stepper with custom text color',
        context: sampleContext,
      },

      // Toast Samples (10 examples)
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'default', message: 'Hello, world!' }),
        prompt: 'Show a default toast',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'success', message: 'Operation completed!', color: 'green', position: 'top-right' }),
        prompt: 'Display a green success toast',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'danger', message: 'Error occurred', position: 'bottom-left' }),
        prompt: 'Show an error toast at bottom-left',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'warning', message: 'Check your input', color: 'orange' }),
        prompt: 'Display an orange warning toast',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'undo', message: 'Item deleted', undoLink: '#undo' }),
        prompt: 'Show an undo toast',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'message', message: 'New message received', sender: 'Alex' }),
        prompt: 'Display a message toast',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'notification', message: 'liked your post', sender: 'Sam', imageUrl: '/images/sam.jpg', timestamp: 'just now' }),
        prompt: 'Show a notification toast with avatar',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'interactive', message: 'Update available', buttonText: 'Install', color: 'blue' }),
        prompt: 'Display an interactive toast with button',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'success', message: 'Saved successfully', position: 'top-left', id: 'save-toast' }),
        prompt: 'Show a success toast with custom ID',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateToast({ type: 'warning', message: 'Low battery', color: 'red', position: 'bottom-right' }),
        prompt: 'Display a red warning toast at bottom-right',
        context: sampleContext,
      },

      // Typography (TextGenerator) Samples (10 examples)
      {
        responseType: 'rawHTML',
        text: TextGenerator.headingMark({ text: "Take control today", markText: "control" }),
        prompt: 'Show a heading with marked text',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.highlightedHeading({ text: "Boost your growth", highlightText: "growth" }),
        prompt: 'Display a heading with highlighted text',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.secondLevelHeading({ text: "Team Tools", linkText: "Explore" }),
        prompt: 'Show a second-level heading with link',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.heading({ text: "Start your journey", linkText: "Begin" }),
        prompt: 'Display a basic heading with button link',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.headingGradient({ text: "Smart Tools Ahead", gradientText: "Smart Tools" }),
        prompt: 'Show a heading with gradient text',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.headingUnderline({ text: "Grow your future", underlineText: "future" }),
        prompt: 'Display a heading with underlined text',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.paragraph({ text: "Work together", content: "Achieve more" }),
        prompt: 'Show a two-paragraph section',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.paragraphLeading({ text: "Lead the way" }),
        prompt: 'Display a paragraph with leading text',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.paragraphFirstLetter({ text: "Journey begins here" }),
        prompt: 'Show a paragraph with styled first letter',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: TextGenerator.blockquote({ quoteText: "Amazing experience!" }),
        prompt: 'Display a paragraph with blockquote',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'default',
          columns: [
            { header: 'Item', key: 'item' },
            { header: 'Quantity', key: 'quantity' },
            { header: 'Price', key: 'price' },
          ],
          data: [
            { item: 'Pen', quantity: 10, price: '$5' },
            { item: 'Notebook', quantity: 5, price: '$10' },
          ],
        }),
        prompt: 'Show a basic default table',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'stripped-row',
          columns: [
            { header: 'Name', key: 'name' },
            { header: 'Status', key: 'status' },
          ],
          data: [
            { name: 'Task 1', status: 'Completed' },
            { name: 'Task 2', status: 'Pending' },
          ],
          hasShadow: true,
        }),
        prompt: 'Display a stripped-row table with shadow',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'sortable',
          columns: [
            { header: 'Product', key: 'product', sortable: true },
            { header: 'Price', key: 'price', sortable: true },
          ],
          data: [
            { product: 'Laptop', price: '$999' },
            { product: 'Phone', price: '$499' },
          ],
          rounded: true,
        }),
        prompt: 'Show a sortable table with rounded corners',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'foot-included',
          columns: [
            { header: 'Expense', key: 'expense' },
            { header: 'Amount', key: 'amount' },
          ],
          data: [
            { expense: 'Travel', amount: '$200' },
            { expense: 'Food', amount: '$50' },
          ],
          footer: { expense: 'Total', amount: '$250' },
        }),
        prompt: 'Display a table with footer',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'checkbox-list',
          columns: [
            { header: 'Task', key: 'task' },
            { header: 'Due Date', key: 'due' },
          ],
          data: [
            { task: 'Design', due: '2025-03-01' },
            { task: 'Code', due: '2025-03-05' },
          ],
          checkboxes: true,
          hasShadow: true,
        }),
        prompt: 'Show a checkbox-list table with shadow',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'users',
          columns: [
            { header: 'User', key: 'user' },
            { header: 'Role', key: 'role' },
          ],
          data: [
            { user: { image: '/img/user1.jpg', text: 'Alice', email: 'alice@example.com' }, role: 'Developer' },
            { user: { image: '/img/user2.jpg', text: 'Bob', email: 'bob@example.com' }, role: 'Designer' },
          ],
          search: true,
          actions: [{ label: 'Edit', href: '#' }],
        }),
        prompt: 'Display a users table with search and actions',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'horizontal-overflow',
          columns: [
            { header: 'Col1', key: 'c1' },
            { header: 'Col2', key: 'c2' },
            { header: 'Col3', key: 'c3' },
            { header: 'Col4', key: 'c4' },
            { header: 'Col5', key: 'c5' },
          ],
          data: [
            { c1: 'A', c2: 'B', c3: 'C', c4: 'D', c5: 'E' },
          ],
          overflowX: true,
        }),
        prompt: 'Show a table with horizontal overflow',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'comparison',
          columns: [
            { header: 'Feature', key: 'feature' },
            { header: 'Basic', key: 'basic' },
            { header: 'Pro', key: 'pro' },
          ],
          data: [
            { feature: 'Support', basic: true, pro: true },
            { feature: 'Analytics', basic: false, pro: true },
          ],
        }),
        prompt: 'Display a comparison table',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'modal',
          columns: [
            { header: 'Item', key: 'item' },
            { header: 'Stock', key: 'stock' },
          ],
          data: [
            { item: 'Chair', stock: 15 },
            { item: 'Table', stock: 8 },
          ],
          actions: [{ label: 'Edit', href: '#modal' }],
          search: true,
          rounded: true,
        }),
        prompt: 'Show a table with modal action and search',
        context: sampleContext,
      },
      {
        responseType: 'rawHTML',
        text: generateTableHTML({
          type: 'stripped-column',
          columns: [
            { header: 'Project', key: 'project' },
            { header: 'Progress', key: 'progress' },
          ],
          data: [
            { project: 'App', progress: '80%' },
            { project: 'Website', progress: '60%' },
          ],
          hasShadow: true,
          checkboxes: true,
        }),
        prompt: 'Display a stripped-column table with checkboxes',
        context: sampleContext,
      },
    ];
    // Randomly determine how many messages to send (between 5 and 10)
    const messageCount = Math.floor(Math.random() * (10 - 5 + 1)) + 5;

    // Send random messages
    for (let i = 0; i < messageCount; i++) {
      // Pick a random message from testMessages
      const randomIndex = Math.floor(Math.random() * testMessages.length);
      const msg = testMessages[randomIndex];

      // Send the randomly selected message to the UI
      this.provider.sendMessage({
        type: 'chatResponse',
        text: msg.text,
        responseType: msg.responseType,
        prompt: msg.prompt,
        context: msg.context,
        progress: 100, // Mark as complete
        complete: true,
      });
      logger.info(`Sent test message with responseType: ${msg.responseType}`);

      // Random delay between 0.2s (200ms) and 2s (2000ms)
      const delay = Math.floor(Math.random() * (2000 - 200) + 200);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}