import * as vscode from 'vscode';

export class Logger {
  private static outputChannel: vscode.OutputChannel | undefined;

  public static initialize(context: vscode.ExtensionContext): void {
    Logger.outputChannel = vscode.window.createOutputChannel('SentriCodeX');
    context.subscriptions.push(Logger.outputChannel);
  }

  public static info(message: string): void {
    Logger.write('INFO', message);
  }

  public static warn(message: string): void {
    Logger.write('WARN', message);
  }

  public static error(message: string, error?: unknown): void {
    const details = error instanceof Error ? `: ${error.message}` : '';
    Logger.write('ERROR', `${message}${details}`);
  }

  public static show(): void {
    Logger.outputChannel?.show(true);
  }

  private static write(level: 'INFO' | 'WARN' | 'ERROR', message: string): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${message}`;

    if (Logger.outputChannel) {
      Logger.outputChannel.appendLine(line);
    } else {
      console.warn(`SentriCodeX Logger not initialized. Message: ${line}`);
    }
  }
}
