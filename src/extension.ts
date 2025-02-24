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

    // Ensure logger is disposed when the extension deactivates
    context.subscriptions.push({
        dispose: () => logger.dispose()
    });

    // Set extension active context for UI visibility
    vscode.commands.executeCommand('setContext', 'qcode.active', true);

    // Initialize settings and store them in global state
    const settings = getValidSettings(context.globalState.get('qcode.settings'));
    context.globalState.update('qcode.settings', settings);

    // Register the existing QCode webview panel
    const existingProvider = new QCodePanelProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('qcode-view', existingProvider)
    );
    vscode.commands.executeCommand('qcode-view.focus');

    // State variables for recording functionality
    let isRecording = false;
    let startTime: number | null = null;
    let cancelTimeout: NodeJS.Timeout | null = null;

    // Register core commands for chat and settings management
    context.subscriptions.push(
        // Command to send a chat message
        vscode.commands.registerCommand('qcode.sendChatMessage', (text: string, states: any) => {
            sendChatMessage(text, context, existingProvider);
        }),
        // Command to retrieve chat history
        vscode.commands.registerCommand('qcode.getChatHistory', () => getChatHistory(context, existingProvider)),
        // Command to remove a specific chat entry
        vscode.commands.registerCommand('qcode.removeChatEntry', (id: string) => removeChatEntry(context, existingProvider, id)),
        // Command to clear all chat history
        vscode.commands.registerCommand('qcode.clearChatHistory', () => clearChatHistory(context, existingProvider)),
        // Command to export chat history
        vscode.commands.registerCommand('qcode.exportChatHistory', () => exportChatHistory(context, existingProvider)),
        // Command to get current settings
        vscode.commands.registerCommand('qcode.getSettings', () => {
            const settings = getValidSettings(context.globalState.get('qcode.settings'));
            existingProvider.sendMessage({ type: 'settings', settings });
        }),
        // Command to save and validate settings
        vscode.commands.registerCommand('qcode.saveSettings', (settings: any) => {
            const validatedSettings = getValidSettings(settings);
            context.globalState.update('qcode.settings', validatedSettings);
            existingProvider.sendMessage({ type: 'settings', settings: validatedSettings });
            connectWebSocket(validatedSettings, existingProvider);
        }),
        // Command to test an API key (placeholder logic)
        vscode.commands.registerCommand('qcode.testApiKey', async (params: { model: string, keys: string }) => {
            const { model, keys } = params;
            const success = keys.length > 0; // Mock test result
            existingProvider.sendMessage({ type: 'apiTestResult', model, success });
        })
    );

    // Register terminal input handler
    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.terminalInput', (data: string) => {
            existingProvider.sendMessage({
                type: 'terminalOutput',
                data: `Echo: ${data}\r\n`
            });
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
        // Command to open/focus the panel
        vscode.commands.registerCommand('qcode.openPanel', () => vscode.commands.executeCommand('qcode-view.focus')),
        vscode.commands.registerCommand('qcode.showPanel', () => vscode.commands.executeCommand('qcode-view.focus')),
        // Command to start audio recording via WebSocket
        vscode.commands.registerCommand('qcode.startRecording', () => {
            const ws = getWebSocket();
            if (ws?.readyState === WebSocket.OPEN && !isRecording) {
                isRecording = true;
                startTime = Date.now();
                vscode.commands.executeCommand('setContext', 'qcode.recording', true);
                ws.send(JSON.stringify({ action: 'start_recording' }));
                existingProvider.sendMessage({ type: 'recordingStarted' });
                cancelTimeout = setTimeout(() => cancelTimeout = null, 2000);
            }
        }),
        // Command to stop audio recording
        vscode.commands.registerCommand('qcode.stopRecording', () => {
            const ws = getWebSocket();
            if (ws?.readyState === WebSocket.OPEN && isRecording) {
                isRecording = false;
                startTime = null;
                vscode.commands.executeCommand('setContext', 'qcode.recording', false);
                if (cancelTimeout) { clearTimeout(cancelTimeout); }
                ws.send(JSON.stringify({ action: 'stop_recording' }));
                existingProvider.sendMessage({ type: 'recordingStopped' });
            }
        }),
        // Command to cancel audio recording
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
    connectWebSocket(settings, existingProvider);
    
}

/**
 * Deactivates the QCode extension, cleaning up resources like WebSocket connections.
 */
export function deactivate() {
    
    const ws = getWebSocket();
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }
    logger.info('QCode extension deactivated');
}