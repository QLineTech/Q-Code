import WebSocket from 'ws';
import * as vscode from 'vscode';
import { QCodeSettings, ServerMessage } from './types';

let ws: WebSocket | undefined;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;



export function connectWebSocket(settings: QCodeSettings) {
    if (!settings.websocket.active) {return;}
    if (wsReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        vscode.window.showWarningMessage('Max WebSocket reconnect attempts reached.');
        wsReconnectAttempts = 0;
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

        ws.on('message', (data: WebSocket.Data) => {
            try {
                const message = data.toString();
                const parsedData: ServerMessage = JSON.parse(message);
                
                // Handle top-level status
                switch (parsedData.status) {
                    case 'success':
                        // Handle nested transcription status
                        switch (parsedData.transcription.status) {
                            case 'success':
                                vscode.window.showInformationMessage(
                                    `Transcription: ${parsedData.transcription.transcription}`
                                );
                                console.log('Server message:', parsedData.message);
                                // Example: Handle specific transcriptions
                                if (parsedData.transcription.transcription === 'ご視聴ありがとうございました') {
                                    vscode.window.showInformationMessage(
                                        'Thank you for watching!'
                                    );
                                }
                                // send to ai
                                
                                break;
                            case 'error':
                                vscode.window.showErrorMessage(
                                    `Transcription failed: ${parsedData.message}`
                                );
                                break;
                            default:
                                console.warn('Unknown transcription status:', 
                                    parsedData.transcription.status);
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