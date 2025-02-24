// src/utils/logger.ts

import * as vscode from 'vscode';

enum LogLevel {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR'
}

/**
 * Logger utility class for consistent logging across the QCode extension
 */
class Logger {
    private outputChannel: vscode.OutputChannel;
    private static instance: Logger;

    private constructor() {
        // Create a dedicated output channel for QCode logs
        this.outputChannel = vscode.window.createOutputChannel('QCode');
    }

    /**
     * Get singleton instance of Logger
     */
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Format log message with timestamp and level
     */
    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }

    /**
     * Log an info message
     * @param message The message to log
     */
    public info(message: string): void {
        const formattedMessage = this.formatMessage(LogLevel.INFO, message);
        this.outputChannel.appendLine(formattedMessage);
    }

    /**
     * Log a warning message
     * @param message The message to log
     */
    public warning(message: string): void {
        const formattedMessage = this.formatMessage(LogLevel.WARNING, message);
        this.outputChannel.appendLine(formattedMessage);
        // Optionally show warning to user
        // vscode.window.showWarningMessage(message);
    }

    /**
     * Log an error message
     * @param message The message to log
     * @param error Optional error object to include stack trace
     */
    public error(message: string, error?: Error): void {
        const formattedMessage = this.formatMessage(LogLevel.ERROR, message);
        this.outputChannel.appendLine(formattedMessage);
        
        if (error?.stack) {
            this.outputChannel.appendLine(error.stack);
        }
        
        // Show error notification to user
        vscode.window.showErrorMessage(message);
    }

    /**
     * Show the output channel in VSCode UI
     */
    public show(): void {
        this.outputChannel.show();
    }

    /**
     * Clear all logs from the output channel
     */
    public clear(): void {
        this.outputChannel.clear();
    }

    /**
     * Dispose of the output channel when extension is deactivated
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Example usage:
/*
import { logger } from './utils/logger';

logger.info('Extension initialized successfully');
logger.warning('Configuration file not found, using defaults');
logger.error('Failed to connect to AI provider', new Error('Network error'));
*/