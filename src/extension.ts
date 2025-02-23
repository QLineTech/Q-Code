import * as vscode from 'vscode';
import WebSocket from 'ws';
import { QCodePanelProvider } from './webview';
import { connectWebSocket, getWebSocket } from './websocket';
import { sendChatMessage, getChatHistory, commandMap } from './commands';
import { getValidSettings } from './settings';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "qcode" is now active!');
    vscode.commands.executeCommand('setContext', 'qcode.active', true);

    const provider = new QCodePanelProvider(context);
    const settings = getValidSettings(context.globalState.get('qcode.settings'));
    context.globalState.update('qcode.settings', settings);

    context.subscriptions.push(vscode.window.registerWebviewViewProvider('qcode-view', provider));

    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.sendChatMessage', (text: string, states: any ) => {
            // const { text, states } = params;
            // TODO bring back states
            sendChatMessage(text, context, provider);
        }),
        vscode.commands.registerCommand('qcode.getChatHistory', () => getChatHistory(context, provider)),
        vscode.commands.registerCommand('qcode.getSettings', () => {
            const settings = getValidSettings(context.globalState.get('qcode.settings'));
            provider.sendMessage({ type: 'settings', settings });
        }),
        vscode.commands.registerCommand('qcode.saveSettings', (settings: any) => {
            const validatedSettings = getValidSettings(settings);
            context.globalState.update('qcode.settings', validatedSettings);
            provider.sendMessage({ type: 'settings', settings: validatedSettings }); // Echo back to webview
        }),
        vscode.commands.registerCommand('qcode.testApiKey', async (params: { model: string, keys: string }) => {
            const { model, keys } = params;
            // Placeholder for API key testing logic
            const success = keys.length > 0; // Mock test result
            provider.sendMessage({ type: 'apiTestResult', model, success });
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

    connectWebSocket(settings);
}

export function deactivate() {
    const ws = getWebSocket();
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }
}