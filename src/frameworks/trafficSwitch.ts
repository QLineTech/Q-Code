// /src/frameworks/trafficSwitch.ts
import { QCodePanelProvider } from '../webview/webview';
import { EditorContext, ChatStates } from '../types/types';
import { logger } from '../utils/logger';

export class TrafficSwitch {
  private text: string;
  private context: any; // ExtensionContext from VSCode
  private provider: QCodePanelProvider;
  private editorContext: EditorContext | null;
  private states: ChatStates;
  private additionalArgs: any[];

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
  }

  // Main method to handle traffic (you can implement your logic here)
  public async handleTraffic(): Promise<void> {
    logger.info(`TrafficSwitch handling message: "${this.text}"`);
    // Add your routing logic here (e.g., to AI models, web search, etc.)
    // For now, we'll just call the test method
    await this.sendTestMessages();
  }

  // Test method to send all supported message types to the UI
private async sendTestMessages(): Promise<void> {
    const sampleContext = this.editorContext || {
      fileName: 'example.ts',
      fileType: 'typescript',
      selection: 'console.log("Hello");',
    };
  
    // 40 sample messages across all supported responseTypes
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
    ];
  
    // Send each test message to the UI with random delay
    for (const msg of testMessages) {
      this.provider.sendMessage({ // Changed from sendMessage to postMessage to match typical VSCode webview API
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