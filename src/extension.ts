import * as vscode from 'vscode';
import Axios, { AxiosError } from 'axios';
import * as path from 'path';
import WebSocket from 'ws';

let ws: WebSocket | undefined;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const API_URLS: { [key: string]: string } = {
    grok3AI: 'https://api.x.ai/v1/chat/completions',
    openAI: 'https://api.openai.com/v1/chat/completions',
    ollamaAI: 'http://localhost:11434/api/chat',
    groqAI: 'https://api.groq.com/v1/chat/completions',
    anthropicAI: 'https://api.anthropic.com/v1/complete'
};

interface QCodeSettings {
    grok3AI: { active: boolean; apiKeys: string[] };
    openAI: { active: boolean; apiKeys: string[] };
    ollamaAI: { active: boolean; apiKeys: string[] };
    groqAI: { active: boolean; apiKeys: string[] };
    anthropicAI: { active: boolean; apiKeys: string[] };
    theme: string;
    language: string;
    websocket: { active: boolean; address: string };
    analyzeAIs: string[];
}

class QCodePanelProvider implements vscode.WebviewViewProvider {
    private _webviewView?: vscode.WebviewView;
    private readonly _context: vscode.ExtensionContext;
    private _settings: QCodeSettings;
    private _disposables: vscode.Disposable[] = [];
    private _themeListener?: vscode.Disposable;

    private cleanup() {
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }

    private getEffectiveTheme(): string {
        if (this._settings.theme !== 'system') {
            return this._settings.theme;
        }
        const themeKind = vscode.window.activeColorTheme.kind;
        return themeKind === vscode.ColorThemeKind.Light ? 'light' : 'dark';
    }

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
        this._settings = getValidSettings(context.globalState.get('qcode.settings'));
    
        // Listen for VSCode theme changes
        this._themeListener = vscode.window.onDidChangeActiveColorTheme(() => {
            if (this._settings.theme === 'system' && this._webviewView) {
                const effectiveTheme = this.getEffectiveTheme();
                this._webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
            }
        });
        this._disposables.push(this._themeListener);
    }

    public get settings(): QCodeSettings {
        return this._settings;
    }

    public async updateSettings(newSettings: QCodeSettings) {
        if (!validateSettings(newSettings)) {
            throw new Error('Invalid settings configuration');
        }
        
        this._settings = newSettings;
        await this._context.globalState.update('qcode.settings', newSettings);
        
        if (this._webviewView) {
            // Send the effective theme
            const effectiveTheme = this.getEffectiveTheme();
            this._webviewView.webview.postMessage({ 
                type: 'setTheme', 
                theme: effectiveTheme 
            });
            this._webviewView.webview.postMessage({ 
                type: 'settingsUpdate',
                settings: this._settings
            });
        }
    
        // Reconnect WebSocket if settings changed
        if (newSettings.websocket.active !== this._settings.websocket.active ||
            newSettings.websocket.address !== this._settings.websocket.address) {
            connectWebSocket(newSettings);
        }
    }

    private async handleWebviewMessage(message: any) {
        switch (message.type) {
            case 'saveSettings':
                const settings = getValidSettings(message.settings);
                await this.updateSettings(settings);
                if (settings.theme !== 'system' && this._webviewView) {
                    this._webviewView.webview.postMessage({ 
                        type: 'setTheme', 
                        theme: settings.theme 
                    });
                }
                vscode.window.showInformationMessage('Settings saved successfully');
                break;

            case 'getSettings':
                if (this._webviewView) {
                    this._webviewView.webview.postMessage({ 
                        type: 'settings', 
                        settings: this._settings 
                    });
                }
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        try {
            this._webviewView = webviewView;
            
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(this._context.extensionPath)]
            };
    
            const panelTheme = this._settings.theme;
    
            getWebviewContentFromFile(
                JSON.stringify(this._settings),
                this._context,
                panelTheme
            ).then(html => {
                if (this._webviewView && !token.isCancellationRequested) {
                    this._webviewView.webview.html = html;
                    // Send the effective theme
                    const effectiveTheme = this.getEffectiveTheme();
                    this._webviewView.webview.postMessage({ type: 'setTheme', theme: effectiveTheme });
                }
            }).catch(error => {
                console.error('Failed to load webview content:', error);
                vscode.window.showErrorMessage('Failed to load QCode panel');
            });
    
            webviewView.webview.onDidReceiveMessage(
                async (message) => {
                    try {
                        await this.handleWebviewMessage(message);
                    } catch (error) {
                        console.error('Webview message handling error:', error);
                        vscode.window.showErrorMessage('Failed to process webview message');
                    }
                },
                undefined,
                this._disposables
            );
    
            webviewView.onDidDispose(() => {
                this.cleanup();
            });
        } catch (error) {
            console.error('Failed to resolve webview:', error);
            throw error;
        }
    }

    dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}

// 6. Improve settings validation
function validateSettings(settings: QCodeSettings): boolean {
    if (!settings || typeof settings !== 'object') {
        return false;
    }

    const requiredFields = ['grok3AI', 'openAI', 'ollamaAI', 'groqAI', 'anthropicAI', 'theme', 'language', 'websocket', 'analyzeAIs'];
    for (const field of requiredFields) {
        if (!(field in settings)) {
            return false;
        }
    }

    if (!Array.isArray(settings.analyzeAIs)) {
        return false;
    }

    // ... additional validation
    return true;
}

const rateLimiter = new Map<string, number>();

interface AIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

function sanitizeContent(content: string): string {
    return content.replace(/[^\w\s\-\.\/\\\(\)\[\]\{\}]/g, '');
}

async function queryAI(prompt: string, provider: keyof QCodeSettings = 'grok3AI'): Promise<string> {
    if (!prompt?.trim()) {
        throw new Error('Empty prompt provided');
    }
    
    const config = vscode.workspace.getConfiguration().get(`qcode.${provider}`) as {
        active: boolean;
        apiKeys: string[];
    };
    
    if (!config?.active || !config?.apiKeys?.[0]) {
        throw new Error(`${provider} is not properly configured`);
    }

    const now = Date.now();
    const lastCall = rateLimiter.get(provider) || 0;
    if (now - lastCall < 1000) { // 1 second minimum between calls
        throw new Error('Rate limit exceeded');
    }
    rateLimiter.set(provider, now);

    try {

        
        const response = await Axios.post(
            API_URLS[provider],
            {
                model: provider === 'grok3AI' ? 'grok-3' : 'default',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000,
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.apiKeys[0]}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        await validateAIResponse(response);
        return response.data.choices[0].message.content;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(`${provider} API Error: ${error.response?.data?.error || error.message}`);
        }
        throw error;
    }
}
function connectWebSocket(settings: QCodeSettings) {
    if (!settings.websocket.active) {return;}
    
    if (wsReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        vscode.window.showWarningMessage('Max WebSocket reconnect attempts reached. Skipping connection.');
        wsReconnectAttempts = 0; // Reset for future attempts
        return;
    }
    
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }
    
    if (settings.websocket.active) {
        try {
            ws = new WebSocket(settings.websocket.address);
            
            ws.on('error', (error) => {
                console.warn('WebSocket error, skipping:', error);
                vscode.window.showWarningMessage('WebSocket connection failed, continuing without it.');
                ws?.close();
                ws = undefined;
            });
            
            ws.on('close', () => {
                if (wsReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    setTimeout(() => {
                        wsReconnectAttempts++;
                        connectWebSocket(settings);
                    }, 1000 * Math.pow(2, wsReconnectAttempts));
                }
            });

            ws.on('open', () => {
                wsReconnectAttempts = 0;
                console.log('Connected to speech server');
                vscode.window.showInformationMessage('Voice command server connected');
            });
        } catch (error) {
            console.warn('WebSocket initialization failed, skipping:', error);
            vscode.window.showWarningMessage('WebSocket unavailable, proceeding without it.');
            ws = undefined;
        }
    }
}

// Continuing extension.ts...

async function validateAIResponse(response: any): Promise<boolean> {
    if (!response?.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid AI response format');
    }
    return true;
}

async function readFile(filePath: string): Promise<string> {
    try {
        const uri = vscode.Uri.file(filePath);
        const content = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(content).toString('utf8');
    } catch (error) {
        console.error('Read file error:', error);
        throw new Error(`Failed to read file: ${filePath}`);
    }
}

async function writeFile(filePath: string, content: string): Promise<void> {
    try {
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    } catch (error) {
        console.error('Write file error:', error);
        throw new Error(`Failed to write file: ${filePath}`);
    }
}

async function getWebviewContentFromFile(
    settingsJson: string,
    context: vscode.ExtensionContext,
    theme: string
): Promise<string> {
    try {
        let content: Uint8Array;
        let htmlPath: string;

        try {
            htmlPath = path.join(context.extensionPath, 'dist', 'webview', 'dashboard.html');
            const uri = vscode.Uri.file(htmlPath);
            content = await vscode.workspace.fs.readFile(uri);
        } catch (error) {
            htmlPath = context.asAbsolutePath('dist/webview/dashboard.html');
            const uri = vscode.Uri.file(htmlPath);
            content = await vscode.workspace.fs.readFile(uri);
        }

        let htmlContent = Buffer.from(content).toString('utf8');
        htmlContent = htmlContent.replace('${SETTINGS}', settingsJson || '{}');
        htmlContent = htmlContent.replace('${THEME}', theme);
        return htmlContent;
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

function getValidSettings(partialSettings: Partial<QCodeSettings> | undefined): QCodeSettings {
    const defaultSettings: QCodeSettings = {
        grok3AI: { active: true, apiKeys: [] },
        openAI: { active: false, apiKeys: [] },
        ollamaAI: { active: false, apiKeys: [] },
        groqAI: { active: false, apiKeys: [] },
        anthropicAI: { active: false, apiKeys: [] },
        theme: 'system',
        language: 'en',
        websocket: { active: true, address: 'ws://localhost:9001' },
        analyzeAIs: ['grok3AI']
    };
    return { ...defaultSettings, ...partialSettings };
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "qcode" is now active!');
    vscode.commands.executeCommand('setContext', 'qcode.active', true);

    // Initialize provider and register views
    const provider = new QCodePanelProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('qcode-view', provider)
    );

    let isRecording = false;
    let startTime: number | null = null;
    let cancelTimeout: NodeJS.Timeout | null = null;

    const commandMap: { [key: string]: () => Promise<void> } = {
        'hello': async () => {
            vscode.window.showInformationMessage('Hello World from QCode!');
        },
        'analyze': async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                throw new Error('No active editor found');
            }

            const content = editor.document.getText();
            const prompt = `Analyze this code and suggest improvements:\n\n${content}`;
            const settings = vscode.workspace.getConfiguration().get('qcode') as QCodeSettings;
            
            if (!settings.analyzeAIs?.length) {
                throw new Error('No AIs selected for analysis');
            }

            const responses: { [key: string]: string } = {};
            for (const ai of settings.analyzeAIs) {
                responses[ai] = await queryAI(prompt, ai as keyof QCodeSettings);
            }

            const combinedResponse = Object.entries(responses)
                .map(([ai, resp]) => `${ai}:\n${resp}`)
                .join('\n\n');
            
            const resultPanel = vscode.window.createWebviewPanel(
                'analysisResult',
                'Analysis Results',
                vscode.ViewColumn.Beside,
                { enableScripts: true }
            );
            
            resultPanel.webview.html = `
                <html>
                    <body>
                        <pre>${combinedResponse}</pre>
                    </body>
                </html>
            `;
        },
        'modify': async () => {
            const files = await vscode.workspace.findFiles('**/*.{ts,js}');
            if (files.length === 0) {
                throw new Error('No TypeScript/JavaScript files found');
            }
            
            const filePath = files[0].fsPath;
            const content = await readFile(filePath);
            const prompt = `Add a comment at the top of this file:\n\n${content}`;
            const modifiedContent = await queryAI(prompt, 'grok3AI');
            await writeFile(filePath, modifiedContent);
            vscode.window.showInformationMessage(`File modified: ${filePath}`);
        }
    };

    // Register commands with proper error handling
    const disposables: vscode.Disposable[] = [];
    Object.entries(commandMap).forEach(([command, handler]) => {
        disposables.push(
            vscode.commands.registerCommand(`qcode.${command}`, async () => {
                try {
                    await handler();
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`Command failed: ${message}`);
                    console.error(`Command ${command} failed:`, error);
                }
            })
        );
    });

    
    // Register openPanel and showPanel commands
    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.openPanel', async () => {
            console.log("qcode.openPanel called");

            // Focus the qcode-view in the activity bar
            await vscode.commands.executeCommand('qcode-view.focus');
        }),
        vscode.commands.registerCommand('qcode.showPanel', async () => {
            console.log("qcode.showPanel called");
            // Focus the qcode-view in the activity bar
            await vscode.commands.executeCommand('qcode-view.focus');
        })
    );

    // Register recording commands
    disposables.push(
        vscode.commands.registerCommand('qcode.startRecording', () => {
            if (ws?.readyState === WebSocket.OPEN && !isRecording) {
                isRecording = true;
                startTime = Date.now();
                vscode.commands.executeCommand('setContext', 'qcode.recording', true);
                ws.send(JSON.stringify({ action: 'start_recording' }));
                cancelTimeout = setTimeout(() => {
                    cancelTimeout = null;
                }, 2000);
            }
        }),

        vscode.commands.registerCommand('qcode.stopRecording', () => {
            if (ws?.readyState === WebSocket.OPEN && isRecording) {
                isRecording = false;
                startTime = null;
                vscode.commands.executeCommand('setContext', 'qcode.recording', false);
                if (cancelTimeout) {
                    clearTimeout(cancelTimeout);
                    cancelTimeout = null;
                }
                ws.send(JSON.stringify({ action: 'stop_recording' }));
            }
        }),

        vscode.commands.registerCommand('qcode.cancelRecording', () => {
            if (ws?.readyState === WebSocket.OPEN) {
                isRecording = false;
                startTime = null;
                vscode.commands.executeCommand('setContext', 'qcode.recording', false);
                if (cancelTimeout) {
                    clearTimeout(cancelTimeout);
                    cancelTimeout = null;
                }
                ws.send(JSON.stringify({ action: 'cancel_recording' }));
            }
        })
    );

    // Initialize WebSocket connection
    const settings = getValidSettings(context.globalState.get('qcode.settings'));
    connectWebSocket(settings);

    // Add all disposables to context subscriptions
    context.subscriptions.push(...disposables);

}

export function deactivate() {
    if (ws) {
        ws.removeAllListeners();
        ws.close();
        ws = undefined;
    }
}