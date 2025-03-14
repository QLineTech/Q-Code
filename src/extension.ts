import * as vscode from 'vscode';
import WebSocket from 'ws';
import { QCodePanelProvider } from './webview/webview';
import { sendChatMessage, getChatHistory, commandMap, removeChatEntry, clearChatHistory, exportChatHistory } from './commands/commands';
import { getValidSettings } from './settings/settings';
import { logger } from './utils/logger';
import { connectWebSocket, getWebSocket } from './websocket/websocket';

/**
 * Activates the QCode extension, setting up commands, webview, and WebSocket connections.
 * @param context The extension context provided by VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    logger.info('QCode extension activated');
    context.subscriptions.push({
        dispose: () => logger.dispose()
    });

    vscode.commands.executeCommand('setContext', 'qcode.active', true);

    const provider = new QCodePanelProvider(context);
    const settings = getValidSettings(context.globalState.get('qcode.settings'));
    context.globalState.update('qcode.settings', settings);

    context.subscriptions.push(vscode.window.registerWebviewViewProvider('qcode-view', provider));
    vscode.commands.executeCommand('qcode-view.focus');
    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.sendChatMessage', (message) => {
            
            
            sendChatMessage(message.text, context, provider, message);
        }),
        vscode.commands.registerCommand('qcode.getChatHistory', () => getChatHistory(context, provider)),
        vscode.commands.registerCommand('qcode.removeChatEntry', (id: string) => removeChatEntry(context, provider, id)),
        vscode.commands.registerCommand('qcode.clearChatHistory', () => clearChatHistory(context, provider)),
        vscode.commands.registerCommand('qcode.exportChatHistory', () => exportChatHistory(context, provider)),
        vscode.commands.registerCommand('qcode.getSettings', () => {
            const settings = getValidSettings(context.globalState.get('qcode.settings'));
            provider.sendMessage({ type: 'settings', settings });
        }),
        vscode.commands.registerCommand('qcode.saveSettings', (settings: any) => {
            const validatedSettings = getValidSettings(settings);
            context.globalState.update('qcode.settings', validatedSettings);
            provider.sendMessage({ type: 'settings', settings: validatedSettings }); // Echo back to webview
            connectWebSocket(validatedSettings, provider); // Reconnect with new settings
        }),
        vscode.commands.registerCommand('qcode.testApiKey', async (params: { model: string, keys: string }) => {
            const { model, keys } = params;
            // Placeholder for API key testing logic
            const success = keys.length > 0; // Mock test result
            provider.sendMessage({ type: 'apiTestResult', model, success });
        })
    );

    // Terminal input handler
    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.terminalInput', (data: string) => {
            provider.sendMessage({
                type: 'terminalOutput',
                data: `Echo: ${data}\r\n`
            });
        })
    );

    let isRecording = false;
    let startTime: number | null = null;
    let cancelTimeout: NodeJS.Timeout | null = null;

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

    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.openPanel', () => vscode.commands.executeCommand('qcode-view.focus')),
        vscode.commands.registerCommand('qcode.showPanel', () => vscode.commands.executeCommand('qcode-view.focus')),
        vscode.commands.registerCommand('qcode.startRecording', () => {
            const ws = getWebSocket();
            if (ws?.readyState === WebSocket.OPEN && !isRecording) {
                isRecording = true;
                startTime = Date.now();
                vscode.commands.executeCommand('setContext', 'qcode.recording', true);
                ws.send(JSON.stringify({ action: 'start_recording' }));
                provider.sendMessage({ type: 'recordingStarted' }); // Notify webview
                cancelTimeout = setTimeout(() => cancelTimeout = null, 2000);
            }
        }),
        vscode.commands.registerCommand('qcode.stopRecording', () => {
            const ws = getWebSocket();
            if (ws?.readyState === WebSocket.OPEN && isRecording) {
                isRecording = false;
                startTime = null;
                vscode.commands.executeCommand('setContext', 'qcode.recording', false);
                if (cancelTimeout) {clearTimeout(cancelTimeout);}
                ws.send(JSON.stringify({ action: 'stop_recording' }));
                provider.sendMessage({ type: 'recordingStopped' }); // Notify webview
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

    connectWebSocket(settings, provider);
}

export function deactivate() {
    
    const ws = getWebSocket();
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }
    logger.info('QCode extension deactivated');
}