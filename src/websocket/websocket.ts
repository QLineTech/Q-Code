import WebSocket from 'ws';
import * as vscode from 'vscode';
import { QCodeSettings, ServerMessage } from '../types/types';
import { QCodePanelProvider } from '../webview/webview'; 

let ws: WebSocket | undefined;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;



export function connectWebSocket(settings: QCodeSettings, provider: QCodePanelProvider) {
    if (!settings.websocket.active) {
        provider.sendMessage({ type: 'websocketStatus', connected: false });
        return;
    }
    if (wsReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        vscode.window.showWarningMessage('Max WebSocket reconnect attempts reached.');
        wsReconnectAttempts = 0;
        provider.sendMessage({ type: 'websocketStatus', connected: false });
        return;
    }
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }
    try {
        ws = new WebSocket("ws://localhost:" + settings.websocket.port);
        ws.on('error', error => {
            console.warn('WebSocket error:', error);
            provider.sendMessage({ type: 'websocketStatus', connected: false });
            ws?.close();
            ws = undefined;
        });
        ws.on('close', () => {
            provider.sendMessage({ type: 'websocketStatus', connected: false });
            if (wsReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                setTimeout(() => {
                    wsReconnectAttempts++;
                    connectWebSocket(settings, provider);
                }, 1000 * Math.pow(2, wsReconnectAttempts));
            }
        });
        ws.on('open', () => {
            wsReconnectAttempts = 0;
            console.log('Connected to speech server');
            vscode.window.showInformationMessage('Voice command server connected');
            provider.sendMessage({ type: 'websocketStatus', connected: true });
        });

        ws.on('message', (data: WebSocket.Data) => {
            try {
                const message = data.toString();
                const parsedData: ServerMessage = JSON.parse(message);
                
                // Handle top-level status
                switch (parsedData.status) {
                    case 'success':
                        if (parsedData.transcription) {
                            // Handle nested transcription status
                            switch (parsedData.transcription.status) {
                                case 'success':
                                    // vscode.window.showInformationMessage(
                                    //     `Transcription: ${parsedData.transcription.transcription}`
                                    // );
                                    // console.log('Server message:', parsedData.message);
                                    // Send the transcription to the webview
                                    provider.sendMessage({
                                        type: 'transcription',
                                        transcription: parsedData.transcription.transcription
                                    });
                                    // send to ai
                                    // if (parsedData.message) {
                                    //     console.log('Sending to AI:', parsedData.message);
                                    //     // Add your AI sending logic here, e.g.:
                                    //     // aiService.send(parsedData.data);
                                    // }
                                    break;
                                case 'error':
                                    vscode.window.showErrorMessage(
                                        `Transcription failed: ${parsedData.message}`
                                    );
                                    break;
                                default:
                                    console.warn('Unknown status:', parsedData.status);
                                    console.log('Message:', parsedData.message);
                                    console.log('Transcription:', parsedData.transcription);
                            }
                        }
                        break;
                    
                    case 'error':
                        vscode.window.showErrorMessage(
                            `Error: ${parsedData.message}`
                        );
                        console.error('Transcription data:', parsedData.transcription);
                        break;
                    
                    default:
                        console.warn('Unknown status:', parsedData.status);
                        console.log('Message:', parsedData.message);
                        console.log('Transcription:', parsedData.transcription);
                }
            } catch (error) {
                console.warn('Failed to process WebSocket message:', error);
                vscode.window.showErrorMessage(
                    'Failed to process voice server response'
                );
                provider.sendMessage({ type: 'websocketStatus', connected: false });
            }
        });
        
    } catch (error) {
        console.warn('WebSocket initialization failed:', error);
        vscode.window.showWarningMessage('WebSocket unavailable.');
        ws = undefined;
    }
}

export function getWebSocket(): WebSocket | undefined {
    return ws;
}