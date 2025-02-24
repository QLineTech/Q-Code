import * as vscode from 'vscode';
import * as path from 'path';
import { QCodeSettings, getValidSettings, validateSettings } from './settings';
import { EditorContext, ChatHistoryEntry } from './types';
import { getWebSocket } from './websocket'; // Import getWebSocket

export class QCodePanelProvider implements vscode.WebviewViewProvider {
    private _webviewView?: vscode.WebviewView;
    private readonly _context: vscode.ExtensionContext;
    private _settings: QCodeSettings;
    private _disposables: vscode.Disposable[] = [];
    private _themeListener?: vscode.Disposable;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._settings = getValidSettings(context.globalState.get('qcode.settings'));
        this._themeListener = vscode.window.onDidChangeActiveColorTheme(() => {
            if (this._settings.theme === 'system' && this._webviewView) {
                const effectiveTheme = this.getEffectiveTheme();
                this._webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
            }
        });
        this._disposables.push(this._themeListener);
    }

    private getThemeColors(): { [key: string]: string } {
        // These are common VS Code CSS variables you can use
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
    
        // We can't directly query these values in TypeScript, but we’ll inject them into the webview
        return themeColors;
    }

    private getEffectiveTheme(): string {
        if (this._settings.theme !== 'system') {
            return this._settings.theme;
        }
        const themeKind = vscode.window.activeColorTheme.kind;
        return themeKind === vscode.ColorThemeKind.Light ? 'light' : 'dark';
    }

    public sendMessage(message: any) {
        if (this._webviewView) { 
            this._webviewView.webview.postMessage(message);
        }
    }

    public async updateSettings(newSettings: QCodeSettings) {
        if (!validateSettings(newSettings)) 
        {
            throw new Error('Invalid settings configuration');
        }
        this._settings = newSettings;
        await this._context.globalState.update('qcode.settings', newSettings);
        if (this._webviewView) {
            const effectiveTheme = this.getEffectiveTheme();
            this._webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
            this._webviewView.webview.postMessage({ type: 'settingsUpdate', settings: this._settings });
        }
    }

    private async handleWebviewMessage(message: any) {
        switch (message.type) {
            case 'sendChatMessage':
                await vscode.commands.executeCommand('qcode.sendChatMessage', message.text);
                break;
            case 'terminalInput':
                await vscode.commands.executeCommand('qcode.terminalInput', message.data);
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

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): void {
        this._webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(this._context.extensionPath)]
        };
        const panelTheme = this._settings.theme;
        getWebviewContentFromFile(JSON.stringify(this._settings), this._context, panelTheme).then(html => {
            if (this._webviewView && !token.isCancellationRequested) {
                this._webviewView.webview.html = html;
                const effectiveTheme = this.getEffectiveTheme();
                this._webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
            }
        }).catch(error => {
            console.error('Failed to load webview content:', error);
            vscode.window.showErrorMessage('Failed to load QCode panel');
        });
        webviewView.webview.onDidReceiveMessage(this.handleWebviewMessage.bind(this), undefined, this._disposables);
        webviewView.onDidDispose(() => this._disposables.forEach(d => d.dispose()), null, this._disposables);
    }

    dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}

export async function getWebviewContentFromFile(
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

        // Try the primary paths first (dist/webview)
        try {
            htmlPath = path.join(context.extensionPath, 'dist', 'webview', 'dashboard.html');
            cssPath = path.join(context.extensionPath, 'dist', 'webview', 'styles.css');
            jsPath = path.join(context.extensionPath, 'dist', 'webview', 'script.js');

            // console.log('Primary HTML path:', htmlPath);
            // console.log('Primary CSS path:', cssPath);
            // console.log('Primary JS path:', jsPath);

            const [htmlBuffer, cssBuffer, jsBuffer] = await Promise.all([
                vscode.workspace.fs.readFile(vscode.Uri.file(htmlPath)),
                vscode.workspace.fs.readFile(vscode.Uri.file(cssPath)),
                vscode.workspace.fs.readFile(vscode.Uri.file(jsPath))
            ]);

            htmlContent = Buffer.from(htmlBuffer).toString('utf8');
            cssContent = Buffer.from(cssBuffer).toString('utf8');
            jsContent = Buffer.from(jsBuffer).toString('utf8');
        } catch (error) {
            // Fallback to context.asAbsolutePath if primary paths fail
            console.warn('Primary path loading failed, attempting fallback:', error);
            htmlPath = context.asAbsolutePath('dist/webview/dashboard.html');
            cssPath = context.asAbsolutePath('dist/webview/styles.css');
            jsPath = context.asAbsolutePath('dist/webview/script.js');

            // console.log('Fallback HTML path:', htmlPath);
            // console.log('Fallback CSS path:', cssPath);
            // console.log('Fallback JS path:', jsPath);

            const [htmlBuffer, cssBuffer, jsBuffer] = await Promise.all([
                vscode.workspace.fs.readFile(vscode.Uri.file(htmlPath)),
                vscode.workspace.fs.readFile(vscode.Uri.file(cssPath)),
                vscode.workspace.fs.readFile(vscode.Uri.file(jsPath))
            ]);

            htmlContent = Buffer.from(htmlBuffer).toString('utf8');
            cssContent = Buffer.from(cssBuffer).toString('utf8');
            jsContent = Buffer.from(jsBuffer).toString('utf8');
        }

        // Log contents to verify
        // console.log('Loaded HTML (first 100 chars):', htmlContent.substring(0, 100));
        // console.log('Loaded CSS (first 100 chars):', cssContent.substring(0, 100));
        // console.log('Loaded JS (first 100 chars):', jsContent.substring(0, 100));

        // Replace placeholders
        const replacedHtml = htmlContent
            .replace('${CSS_CONTENT}', cssContent || '/* CSS not loaded */')
            .replace('${JS_CONTENT}', jsContent || '// JS not loaded')
            .replace('${SETTINGS}', settingsJson || '{}')
            .replace('${THEME}', theme);

        // console.log('HTML after replacement (first 100 chars):', replacedHtml.substring(0, 100));

        return replacedHtml;
    } catch (error) {
        console.error('Error loading webview content:', error);
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