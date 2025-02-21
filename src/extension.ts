import * as vscode from 'vscode';
import Axios from 'axios';
import WebSocket from 'ws';

const API_URL = 'https://api.x.ai/v1/chat/completions';
let ws: WebSocket;

async function queryGrok3(prompt: string): Promise<string> {
    const API_KEY = vscode.workspace.getConfiguration().get('qcode.apiKey') as string;
    if (!API_KEY) {
        throw new Error('API key not set. Please configure "qcode.apiKey" in settings.');
    }
    try {
        const response = await Axios.post(API_URL, {
            model: 'grok-3',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Grok3 API Error:', error);
        throw error;
    }
}

async function readFile(filePath: string): Promise<string> {
    try {
        const uri = vscode.Uri.file(filePath);
        const content = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(content).toString('utf8');
    } catch (error) {
        console.error('Read file error:', error);
        throw error;
    }
}

async function writeFile(filePath: string, content: string): Promise<void> {
    try {
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    } catch (error) {
        console.error('Write file error:', error);
        throw error;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "qcode" is now active!');

    ws = new WebSocket('ws://localhost:9001');
    ws.on('open', () => {
        console.log('Connected to speech server');
        vscode.window.showInformationMessage('Voice command server connected');
    });
    ws.on('error', (err) => console.error('WebSocket error:', err));

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
                vscode.window.showErrorMessage('No active editor found.');
                return;
            }
            const content = editor.document.getText();
            const prompt = `Analyze this code and suggest improvements:\n\n${content}`;
            try {
                const response = await queryGrok3(prompt);
                vscode.window.showInformationMessage(`Grok3 Response: ${response}`);
            } catch (error) {
                vscode.window.showErrorMessage('Failed to get response from Grok3.');
            }
        },
        'modify': async () => {
            const files = await vscode.workspace.findFiles('**/*.{ts,js}');
            if (files.length === 0) {
                vscode.window.showErrorMessage('No TypeScript/JavaScript files found.');
                return;
            }
            const filePath = files[0].fsPath;
            try {
                const content = await readFile(filePath);
                const prompt = `Add a comment at the top of this file:\n\n${content}`;
                const modifiedContent = await queryGrok3(prompt);
                await writeFile(filePath, modifiedContent);
                vscode.window.showInformationMessage(`File modified: ${filePath}`);
            } catch (error) {
                vscode.window.showErrorMessage('Failed to modify file.');
            }
        }
    };

    ws.on('message', (data: string) => {
        const { command, grok3Response, error, status } = JSON.parse(data);
        if (error) {
            vscode.window.showWarningMessage(error);
            return;
        }
        if (status === 'cancelled') {
            vscode.window.showInformationMessage('Recording cancelled');
            isRecording = false;
            startTime = null;
            return;
        }
        const action = commandMap[command.toLowerCase()];
        if (action) {
            action().catch(err => {
                console.error(`Error executing voice command ${command}:`, err);
                vscode.window.showErrorMessage(`Voice command failed: ${command}`);
            });
            vscode.window.showInformationMessage(`Voice command executed: ${command}`);
            if (grok3Response) {
                vscode.window.showInformationMessage(`Grok3 Analysis: ${grok3Response}`);
            }
        } else {
            vscode.window.showWarningMessage(`Unknown voice command: ${command}`);
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('qcode.startRecording', () => {
            if (ws.readyState === WebSocket.OPEN && !isRecording) {
                isRecording = true;
                startTime = Date.now();
                vscode.commands.executeCommand('setContext', 'qcode.recording', true);
                ws.send(JSON.stringify({ action: 'start_recording' }));
                console.log('Sent start_recording to server');
                cancelTimeout = setTimeout(() => {
                    cancelTimeout = null;
                }, 2000);
            }
        }),
        vscode.commands.registerCommand('qcode.stopRecording', () => {
            if (ws.readyState === WebSocket.OPEN && isRecording) {
                isRecording = false;
                startTime = null;
                vscode.commands.executeCommand('setContext', 'qcode.recording', false);
                if (cancelTimeout) {
                    clearTimeout(cancelTimeout);
                    cancelTimeout = null;
                }
                ws.send(JSON.stringify({ action: 'stop_recording' }));
                console.log('Sent stop_recording to server');
            }
        }),
        vscode.commands.registerCommand('qcode.cancelRecording', () => {
            if (ws.readyState === WebSocket.OPEN && isRecording) {
                isRecording = false;
                startTime = null;
                vscode.commands.executeCommand('setContext', 'qcode.recording', false);
                if (cancelTimeout) {
                    clearTimeout(cancelTimeout);
                    cancelTimeout = null;
                }
                ws.send(JSON.stringify({ action: 'cancel_recording' }));
                console.log('Sent cancel_recording to server');
            }
        }),
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (isRecording && cancelTimeout && startTime) {
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < 2000) {
                    vscode.commands.executeCommand('qcode.cancelRecording');
                    console.log('Cancelled recording due to text change within 2 seconds');
                }
            }
        }),
        vscode.commands.registerCommand('qcode.helloWorld', commandMap['hello']),
        vscode.commands.registerCommand('qcode.analyzeWithGrok3', commandMap['analyze']),
        vscode.commands.registerCommand('qcode.modifyFile', commandMap['modify']),
        { dispose: () => ws.close() }
    );
}

export function deactivate() {
    if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
    }
}