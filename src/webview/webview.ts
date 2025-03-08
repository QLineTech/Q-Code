import * as vscode from 'vscode';
import * as path from 'path';
import { QCodeSettings, getValidSettings, validateSettings } from '../settings/settings';
import { EditorContext, ChatHistoryEntry } from '../types/types';
import { getWebSocket } from '../websocket/websocket';
import { populateEditorContext } from '../frameworks/editorContext';

// -----------------------------------------------
// Class: QCodePanelProvider
// -----------------------------------------------
/**
 * Provides a webview-based panel for the QCode extension within VS Code.
 * Manages the panel's lifecycle, theme handling, settings, and communication with the webview.
 */
export class QCodePanelProvider implements vscode.WebviewViewProvider {
    private _webviewView?: vscode.WebviewView; // Reference to the webview view instance
    private readonly _context: vscode.ExtensionContext; // VS Code extension context
    private _settings: QCodeSettings; // Current settings for the QCode panel
    private _disposables: vscode.Disposable[] = []; // Array of disposable resources to clean up
    private _themeListener?: vscode.Disposable; // Listener for theme change events
    private _cachedWebviewContent?: string; // Cache the HTML content to restore it
    private _webviewState: any = {}; // Store dynamic state from the webview (e.g., user input, scroll position)


    /**
     * Constructs a new QCodePanelProvider instance.
     * @param context - The VS Code extension context for accessing global state and paths.
     */
    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._settings = getValidSettings(context.globalState.get('qcode.settings')); // Initialize settings from global state
        // Listen for theme changes and update the webview if using system theme
        this._themeListener = vscode.window.onDidChangeActiveColorTheme(() => {
            if (this._settings.theme === 'system' && this._webviewView) {
                const effectiveTheme = this.getEffectiveTheme();
                this._webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
            }
        });
        this._disposables.push(this._themeListener);

        this._disposables.push(
            vscode.workspace.onDidChangeWorkspaceFolders(async () => {
              const editorContext = await populateEditorContext(this._context);
              this.sendMessage({ type: 'projectInfo', project: editorContext.project });
            })
          );
    }

    /**
     * Retrieves a set of theme-related CSS variables for styling the webview.
     * Note: Actual values are injected at runtime in the webview, not queried here.
     * @returns An object mapping CSS variable names to empty strings (placeholders).
     */
    private getThemeColors(): { [key: string]: string } {
        const themeColors: { [key: string]: string } = {
            '--vscode-foreground': '',
            '--vscode-editor-background': '',
            '--vscode-editor-foreground': '',
            '--vscode-sideBar-background': '',
            '--vscode-sideBar-foreground': '',
            '--vscode-button-background': '',
            '--vscode-button-foreground': '',
            '--vscode-input-background': '',
            '--vscode-input-foreground': '',
            '--vscode-scrollbarSlider-background': ''
        };
        return themeColors;
    }

    /**
     * Determines the effective theme based on settings or system preference.
     * @returns The theme string ('light' or 'dark') to apply to the webview.
     */
    private getEffectiveTheme(): string {
        if (this._settings.theme !== 'system') {
            return this._settings.theme;
        }
        const themeKind = vscode.window.activeColorTheme.kind;
        return themeKind === vscode.ColorThemeKind.Light ? 'light' : 'dark';
    }

    /**
     * Sends a message to the webview if it exists.
     * @param message - The message object to send to the webview.
     */
    public sendMessage(message: any) {
        if (this._webviewView) {
            this._webviewView.webview.postMessage(message);
        }
    }

    /**
     * Updates the panel settings and persists them to global state.
     * @param newSettings - The new settings to apply.
     * @throws Error if the settings are invalid.
     */
    public async updateSettings(newSettings: QCodeSettings) {
        if (!validateSettings(newSettings)) {
            throw new Error('Invalid settings configuration');
        }
        this._settings = newSettings;
        await this._context.globalState.update('qcode.settings', newSettings); // Persist settings
        if (this._webviewView) {
            const effectiveTheme = this.getEffectiveTheme();
            this._webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
            this._webviewView.webview.postMessage({ type: 'settingsUpdate', settings: this._settings });
        }
    }

    /**
     * Handles incoming messages from the webview and triggers corresponding commands.
     * @param message - The message received from the webview.
     */
    private async handleWebviewMessage(message: any) {
        switch (message.type) {
            case 'sendChatMessage':
                await vscode.commands.executeCommand('qcode.sendChatMessage', message);
                break;
            case 'terminalInput':
                await vscode.commands.executeCommand('qcode.terminalInput', message.data);
                break;
            case 'getProjectInfo':
                const editorContext = await populateEditorContext(this._context);
                if (this._webviewView) {
                    this._webviewView.webview.postMessage({
                    type: 'projectInfo',
                    project: editorContext.project,
                    });
                }
                break;
            case 'getEditorContext': // New case to handle getEditorContext
              try {
                const editorContext = await populateEditorContext(this._context);
                if (this._webviewView) {
                  this._webviewView.webview.postMessage({
                    type: 'editorContext',
                    context: editorContext,
                  });
                }
              } catch (error) {
                console.error('Failed to get editor context:', error);
                this.sendMessage({
                  type: 'error',
                  error: (error as Error).message,
                });
              }
              break;
            case 'getFileTree':
              try {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders) {
                  const fileTree: FileNode[] = await Promise.all(
                    workspaceFolders.map(async (folder) => {
                      const rootUri = folder.uri;
                      const entries = await vscode.workspace.fs.readDirectory(rootUri);
                      return {
                        id: rootUri.fsPath,
                        name: folder.name,
                        type: 'folder' as const,
                        isOpen: false,
                        path: rootUri.fsPath,
                        children: entries.map(([name, type]) => ({
                          id: `${rootUri.fsPath}/${name}`,
                          name,
                          type: type === vscode.FileType.Directory ? 'folder' : 'file',
                          isOpen: false,
                          path: `${rootUri.fsPath}/${name}`,
                        })),
                      };
                    })
                  );
                  this.sendMessage({ type: 'fileTree', tree: fileTree });
                }
              } catch (error) {
                this.sendMessage({ type: 'error', error: (error as Error).message });
              }
              break;
            case 'getFolderContents':
              try {
                const folderUri = vscode.Uri.file(message.path);
                const entries = await vscode.workspace.fs.readDirectory(folderUri);
                const children: FileNode[] = entries.map(([name, type]) => ({
                  id: `${message.path}/${name}`,
                  name,
                  type: type === vscode.FileType.Directory ? 'folder' : 'file',
                  isOpen: false,
                  path: `${message.path}/${name}`,
                }));
                this.sendMessage({
                  type: 'folderContents',
                  folderId: message.folderId,
                  children,
                });
              } catch (error) {
                this.sendMessage({ type: 'error', error: (error as Error).message });
              }
              break;
            case 'fileSelected':
              const uri = vscode.Uri.file(message.path);
              vscode.window.showTextDocument(uri);
              break;
          
            case 'getChatHistory':
                await vscode.commands.executeCommand('qcode.getChatHistory');
                break;
            case 'removeChatEntry':
                await vscode.commands.executeCommand('qcode.removeChatEntry', message.id);
                break;
            case 'clearChatHistory':
                await vscode.commands.executeCommand('qcode.clearChatHistory');
                break;
            case 'exportChatHistory':
                await vscode.commands.executeCommand('qcode.exportChatHistory');
                break;
            case 'saveSettings':
                const settings = getValidSettings(message.settings);
                await this.updateSettings(settings);
                if (settings.theme !== 'system' && this._webviewView) {
                    this._webviewView.webview.postMessage({ type: 'setTheme', theme: settings.theme });
                }
                vscode.window.showInformationMessage('Settings saved successfully');
                break;
            case 'getSettings':
                if (this._webviewView) {
                    this._webviewView.webview.postMessage({ type: 'settings', settings: this._settings });
                }
                break;
            case 'startRecording':
                await vscode.commands.executeCommand('qcode.startRecording');
                break;
            case 'stopRecording':
                await vscode.commands.executeCommand('qcode.stopRecording');
                break;
            case 'getWebSocketStatus':
                const ws = getWebSocket();
                const connected = ws?.readyState === 1; // WebSocket.OPEN is 1
                this.sendMessage({ type: 'websocketStatus', connected });
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    /**
     * Resolves and initializes the webview view for the panel.
     * @param webviewView - The webview view to configure.
     * @param context - Context for resolving the webview view.
     * @param token - Cancellation token to handle operation cancellation.
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        this._webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(this._context.extensionPath)] // Restrict resource access
        };
        
        if (this._cachedWebviewContent && !token.isCancellationRequested) {
            webviewView.webview.html = this._cachedWebviewContent;
            const effectiveTheme = this.getEffectiveTheme();
            webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
            webviewView.webview.postMessage({ type: 'restoreState', state: this._webviewState });
        } else {
            const panelTheme = this._settings.theme;
            getWebviewContentFromFile(JSON.stringify(this._settings), this._context, panelTheme)
                .then(html => {
                    if (this._webviewView && !token.isCancellationRequested) {
                        this._webviewView.webview.html = html;
                        const effectiveTheme = this.getEffectiveTheme();
                        this._webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
                    }
                })
                .catch(error => {
                    console.error('Failed to load webview content:', error);
                    vscode.window.showErrorMessage('Failed to load QCode panel');
                });

        }

        // Handle messages from the webview
        const messageListener = webviewView.webview.onDidReceiveMessage(
            this.handleWebviewMessage.bind(this),
            undefined,
            this._disposables
        );

        // When the view is about to be disposed (e.g., Activity Bar closed), save its state
        // When the view is about to be disposed (e.g., Activity Bar closed), save its state
        webviewView.onDidDispose(() => {
            this._webviewView = undefined; // Clear reference but keep cached content
            this._disposables.filter(d => d !== messageListener).forEach(d => d.dispose());
        }, null, this._disposables);

        this._disposables.push(messageListener);

        
    }

    /**
     * Disposes of all resources held by the provider.
     */
    dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}

// In your VSCode extension (e.g., src/webview.ts)
export async function getWebviewContentFromFile(
    settingsJson: string,
    context: vscode.ExtensionContext,
    theme: string
  ): Promise<string> {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QCode Panel</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe id="react-app" src="http://localhost:5173/q/welcome?vscode=1"></iframe>
        <script>
          const vscode = acquireVsCodeApi();
          const iframe = document.getElementById('react-app');
  
          // Forward messages from extension to iframe
          window.addEventListener('message', event => {
            const message = event.data;
            iframe.contentWindow.postMessage(message, '*');
          });
  
          // Handle messages from iframe to extension
          window.addEventListener('message', event => {
            if (event.source === iframe.contentWindow) {
              const message = event.data;
              if (message.type === 'vscodeCommand') {
                try {
                  vscode.postMessage(message.payload);
                  if (message.command === 'getEditorContext') {
                    vscode.postMessage({ type: 'getEditorContext' });
                  }
                } catch (error) {
                  iframe.contentWindow.postMessage(
                    { type: 'vscodeCommandError', command: message.command, error: error.message },
                    '*'
                  );
                }
              } else {
                vscode.postMessage(message); // Forward all other messages, including 'getProjectInfo'
              }
            }
          });
  
          // Notify extension and iframe when loaded, and request project info
          iframe.addEventListener('load', () => {
            vscode.postMessage({ type: 'ready' });
            iframe.contentWindow.postMessage({ type: 'setState', state: 'vscode' }, '*');
            vscode.postMessage({ type: 'getProjectInfo' }); // Explicitly request project info on load
          });
        </script>
      </body>
      </html>
    `;
  
    return htmlContent.replace('${SETTINGS}', settingsJson || '{}').replace('${THEME}', theme);
  }

export async function getWebviewContentFromFile2(
    settingsJson: string,
    context: vscode.ExtensionContext,
    theme: string
  ): Promise<string> {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QCode Panel</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe id="react-app" src="http://localhost:5173/q/welcome?vscode=1"></iframe>
        <script>
          const vscode = acquireVsCodeApi();
          const iframe = document.getElementById('react-app');
  
          // Forward messages from extension to iframe
          window.addEventListener('message', event => {
            const message = event.data;
            iframe.contentWindow.postMessage(message, '*');
          });
  
          // Handle messages from iframe to extension
          window.addEventListener('message', event => {
            if (event.source === iframe.contentWindow) {
              const message = event.data;
              if (message.type === 'vscodeCommand') {
                // Execute VSCode command and send result back
                try {
                  vscode.postMessage(message.payload);
                  if (message.command === 'getEditorContext') {
                    // Special handling for context request
                    vscode.postMessage({ type: 'getEditorContext' });
                  }
                } catch (error) {
                  iframe.contentWindow.postMessage(
                    { type: 'vscodeCommandError', command: message.command, error: error.message },
                    '*'
                  );
                }
              } else {
                vscode.postMessage(message); // Forward other messages
              }
            }
          });
  
          // Notify extension and iframe when loaded
          iframe.addEventListener('load', () => {
            vscode.postMessage({ type: 'ready' });
            iframe.contentWindow.postMessage({ type: 'setState', state: 'vscode' }, '*');
          });
        </script>
      </body>
      </html>
    `;
  
    return htmlContent.replace('${SETTINGS}', settingsJson || '{}').replace('${THEME}', theme);
  }

// -----------------------------------------------
// Function: getWebviewContentFromFile
// -----------------------------------------------
/**
 * Loads and assembles the webview content (HTML, CSS, JS) from files.
 * @param settingsJson - JSON string of the current settings.
 * @param context - The VS Code extension context for file path resolution.
 * @param theme - The theme to apply to the webview.
 * @returns A promise resolving to the fully assembled HTML content.
 */
export async function getWebviewContentFromFileStatic(
    settingsJson: string,
    context: vscode.ExtensionContext,
    theme: string
): Promise<string> {
    try {
        let htmlContent: string;
        let cssContent: string;
        let jsContent: string;
        let htmlPath: string;
        let cssPath: string;
        let jsPath: string;
        
        // Attempt to load from primary paths (dist/webview)
        try {

            if (context.extensionMode === vscode.ExtensionMode.Development) {
                htmlPath = path.join(context.extensionPath, 'src', 'webview', 'dashboard.html');
                cssPath = path.join(context.extensionPath, 'src', 'webview', 'styles.css');
                jsPath = path.join(context.extensionPath, 'src', 'webview', 'script.js');
            } else {
                htmlPath = path.join(context.extensionPath, 'dist', 'webview', 'dashboard.html');
                cssPath = path.join(context.extensionPath, 'dist', 'webview', 'styles.css');
                jsPath = path.join(context.extensionPath, 'dist', 'webview', 'script.js');
            }
            
            const [htmlBuffer, cssBuffer, jsBuffer] = await Promise.all([
                vscode.workspace.fs.readFile(vscode.Uri.file(htmlPath)),
                vscode.workspace.fs.readFile(vscode.Uri.file(cssPath)),
                vscode.workspace.fs.readFile(vscode.Uri.file(jsPath))
            ]);

            htmlContent = Buffer.from(htmlBuffer).toString('utf8');
            cssContent = Buffer.from(cssBuffer).toString('utf8');
            jsContent = Buffer.from(jsBuffer).toString('utf8');
        } catch (error) {
            // Fallback to alternative paths if primary fails
            console.warn('Primary path loading failed, attempting fallback:', error);
            htmlPath = context.asAbsolutePath('dist/webview/dashboard.html');
            cssPath = context.asAbsolutePath('dist/webview/styles.css');
            jsPath = context.asAbsolutePath('dist/webview/script.js');

            const [htmlBuffer, cssBuffer, jsBuffer] = await Promise.all([
                vscode.workspace.fs.readFile(vscode.Uri.file(htmlPath)),
                vscode.workspace.fs.readFile(vscode.Uri.file(cssPath)),
                vscode.workspace.fs.readFile(vscode.Uri.file(jsPath))
            ]);

            htmlContent = Buffer.from(htmlBuffer).toString('utf8');
            cssContent = Buffer.from(cssBuffer).toString('utf8');
            jsContent = Buffer.from(jsBuffer).toString('utf8');
        }

        // Replace placeholders in the HTML with loaded content
        const replacedHtml = htmlContent
            .replace('${CSS_CONTENT}', cssContent || '/* CSS not loaded */')
            .replace('${JS_CONTENT}', jsContent || '// JS not loaded')
            .replace('${SETTINGS}', settingsJson || '{}')
            .replace('${THEME}', theme);

        return replacedHtml;
    } catch (error) {
        console.error('Error loading webview content:', error);
        // Return fallback error HTML if content loading fails
        return `
            <html>
                <body>
                    <h1>Error loading panel</h1>
                    <p>Could not load the panel content. Please check the extension logs.</p>
                </body>
            </html>
        `;
    }
}