import * as vscode from 'vscode';
import WebSocket from 'ws';
import { QCodeMultiPagePanel } from './webview/webview2';
import { sendChatMessage, getChatHistory, commandMap, removeChatEntry, clearChatHistory, exportChatHistory } from './commands/commands';
import { getValidSettings } from './settings/settings';
import { logger } from './utils/logger';
import { connectWebSocket, getWebSocket } from './websocket/websocket';

/**
 * Activates the QCode extension, setting up commands, webview, and WebSocket connections.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext): void {
    logger.info('QCode extension activated');

    // Ensure logger is disposed when the extension deactivates
    context.subscriptions.push({
        dispose: () => logger.dispose()
    });

    // Set extension active context for UI visibility
    vscode.commands.executeCommand('setContext', 'qcode.active', true);

    // Initialize settings and store them in global state
    const settings = getValidSettings(context.globalState.get('qcode.settings'));
    context.globalState.update('qcode.settings', settings);

    // Register the new multi-page webview panel
    let multiPagePanel: QCodeMultiPagePanel | undefined;
    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.showDashboard', () => {
            if (!multiPagePanel) {
                multiPagePanel = new QCodeMultiPagePanel(context.extensionPath);
                multiPagePanel['_panel'].onDidDispose(() => {
                    multiPagePanel = undefined;
                });
            }
        })
    );

    // State variables for recording functionality
    let isRecording = false;
    let startTime: number | null = null;
    let cancelTimeout: NodeJS.Timeout | null = null;

    // Register core commands for chat and settings management
    context.subscriptions.push(
        // vscode.commands.registerCommand('qcode.sendChatMessage', (text: string, states: any) => {
        //     sendChatMessage(text, context, multiPagePanel ? { sendMessage: (msg: any) => multiPagePanel['_panel'].webview.postMessage(msg) } : undefined);
        // }),
        // vscode.commands.registerCommand('qcode.getChatHistory', () => getChatHistory(context, multiPagePanel ? { sendMessage: (msg: any) => multiPagePanel['_panel'].webview.postMessage(msg) } : undefined)),
        // vscode.commands.registerCommand('qcode.removeChatEntry', (id: string) => removeChatEntry(context, multiPagePanel ? { sendMessage: (msg: any) => multiPagePanel['_panel'].webview.postMessage(msg) } : undefined, id)),
        // vscode.commands.registerCommand('qcode.clearChatHistory', () => clearChatHistory(context, multiPagePanel ? { sendMessage: (msg: any) => multiPagePanel['_panel'].webview.postMessage(msg) } : undefined)),
        // vscode.commands.registerCommand('qcode.exportChatHistory', () => exportChatHistory(context, multiPagePanel ? { sendMessage: (msg: any) => multiPagePanel['_panel'].webview.postMessage(msg) } : undefined)),
        // vscode.commands.registerCommand('qcode.getSettings', () => {
        //     const settings = getValidSettings(context.globalState.get('qcode.settings'));
        //     if (multiPagePanel) {
        //         multiPagePanel['_panel'].webview.postMessage({ type: 'settings', settings });
        //     }
        // }),
        // vscode.commands.registerCommand('qcode.saveSettings', (settings: any) => {
        //     const validatedSettings = getValidSettings(settings);
        //     context.globalState.update('qcode.settings', validatedSettings);
        //     if (multiPagePanel) {
        //         multiPagePanel['_panel'].webview.postMessage({ type: 'settings', settings: validatedSettings });
        //     }
        //     connectWebSocket(validatedSettings, multiPagePanel ? { sendMessage: (msg: any) => multiPagePanel['_panel'].webview.postMessage(msg) } : undefined);
        // }),
        // vscode.commands.registerCommand('qcode.testApiKey', async (params: { model: string, keys: string }) => {
        //     const { model, keys } = params;
        //     const success = keys.length > 0; // Mock test result
        //     if (multiPagePanel) {
        //         multiPagePanel['_panel'].webview.postMessage({ type: 'apiTestResult', model, success });
        //     }
        // })
    );

    // Register terminal input handler
    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.terminalInput', (data: string) => {
            if (multiPagePanel) {
                multiPagePanel['_panel'].webview.postMessage({
                    type: 'terminalOutput',
                    data: `Echo: ${data}\r\n`
                });
            }
        })
    );

    // Register commands from the commandMap
    Object.entries(commandMap).forEach(([command, handler]) => {
        context.subscriptions.push(
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

    // Register recording-related commands
    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.openPanel', () => vscode.commands.executeCommand('qcode.showDashboard')),
        vscode.commands.registerCommand('qcode.showPanel', () => vscode.commands.executeCommand('qcode.showDashboard')),
        vscode.commands.registerCommand('qcode.startRecording', () => {
            const ws = getWebSocket();
            if (ws?.readyState === WebSocket.OPEN && !isRecording) {
                isRecording = true;
                startTime = Date.now();
                vscode.commands.executeCommand('setContext', 'qcode.recording', true);
                ws.send(JSON.stringify({ action: 'start_recording' }));
                if (multiPagePanel) {
                    multiPagePanel['_panel'].webview.postMessage({ type: 'recordingStarted' });
                }
                cancelTimeout = setTimeout(() => cancelTimeout = null, 2000);
            }
        }),
        vscode.commands.registerCommand('qcode.stopRecording', () => {
            const ws = getWebSocket();
            if (ws?.readyState === WebSocket.OPEN && isRecording) {
                isRecording = false;
                startTime = null;
                vscode.commands.executeCommand('setContext', 'qcode.recording', false);
                if (cancelTimeout) { clearTimeout(cancelTimeout); }
                ws.send(JSON.stringify({ action: 'stop_recording' }));
                if (multiPagePanel) {
                    multiPagePanel['_panel'].webview.postMessage({ type: 'recordingStopped' });
                }
            }
        }),
        vscode.commands.registerCommand('qcode.cancelRecording', () => {
            const ws = getWebSocket();
            if (ws?.readyState === WebSocket.OPEN) {
                isRecording = false;
                startTime = null;
                vscode.commands.executeCommand('setContext', 'qcode.recording', false);
                if (cancelTimeout) { clearTimeout(cancelTimeout); }
                ws.send(JSON.stringify({ action: 'cancel_recording' }));
            }
        })
    );

    // Initialize WebSocket connection with current settings
    // connectWebSocket(settings, multiPagePanel ? { sendMessage: (msg: any) => multiPagePanel['_panel'].webview.postMessage(msg) } : undefined);

    // Auto-show the dashboard on activation
    vscode.commands.executeCommand('qcode.showDashboard');
}

/**
 * Deactivates the QCode extension, cleaning up resources like WebSocket connections.
 */
export function deactivate(): void {
    const ws = getWebSocket();
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }
    logger.info('QCode extension deactivated');
}