import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Existing QCodePanelProvider class (assumed in ./webview/webview.ts)
class QCodeMultiPagePanel {
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionPath: string;
    private _disposables: vscode.Disposable[] = [];

    constructor(extensionPath: string) {
        this._extensionPath = extensionPath;
        this._panel = vscode.window.createWebviewPanel(
            'qCodeDashboard',
            'Q-Code',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'src', 'webview'))]
            }
        );

        this._panel.webview.html = this._getWebviewContent('chat');
        this._initWebview();
    }

    private _getWebviewContent(page: string): string {
        const filePath = path.join(this._extensionPath, 'src', 'webview', 'pages', `${page}.html`);
        let html = fs.readFileSync(filePath, 'utf8');

        const cssUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionPath, 'src', 'webview', 'css', 'styles.css'))
        );
        const jsUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionPath, 'src', 'webview', 'js', 'main.js'))
        );
        const logoUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this._extensionPath, 'src', 'webview', 'assets', 'images', 'logo.png'))
        );

        return html
            .replace('${CSS_URI}', cssUri.toString())
            .replace('${JS_URI}', jsUri.toString())
            .replace('${LOGO_URI}', logoUri.toString());
    }

    private _initWebview(): void {
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.type) {
                    case 'switchPage':
                        this._panel.webview.html = this._getWebviewContent(message.page);
                        break;
                    // Add more message handlers as needed
                }
            },
            undefined,
            this._disposables
        );

        this._panel.onDidDispose(() => {
            this.dispose();
        }, null, this._disposables);
    }

    public dispose(): void {
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}