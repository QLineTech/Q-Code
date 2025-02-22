import * as vscode from 'vscode';

export async function readFile(filePath: string): Promise<string> {
    try {
        const uri = vscode.Uri.file(filePath);
        const content = await vscode.workspace.fs.readFile(uri);
        return Buffer.from(content).toString('utf8');
    } catch (error) {
        console.error('Read file error:', error);
        throw new Error(`Failed to read file: ${filePath}`);
    }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
    try {
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    } catch (error) {
        console.error('Write file error:', error);
        throw new Error(`Failed to write file: ${filePath}`);
    }
}