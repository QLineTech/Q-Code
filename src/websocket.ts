import WebSocket from 'ws';
import * as vscode from 'vscode';
import { QCodeSettings } from './types';

let ws: WebSocket | undefined;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export function connectWebSocket(settings: QCodeSettings) {
    if (!settings.websocket.active) return;
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
        ws = new WebSocket(settings.websocket.address);
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
    } catch (error) {
        console.warn('WebSocket initialization failed:', error);
        vscode.window.showWarningMessage('WebSocket unavailable.');
        ws = undefined;
    }
}

export function getWebSocket(): WebSocket | undefined {
    return ws;
}