import * as vscode from 'vscode';

/**
 * Centralized logging utility for the SentriCodeX extension.
 *
 * Responsibility:
 *  - Provide a single, consistent place to write diagnostic messages.
 *  - Write to a dedicated VS Code Output Channel ("SentriCodeX") so users
 *    and developers can inspect extension behavior without opening the
 *    Developer Tools console.
 *
 * Security note:
 *  - Callers must NEVER pass raw source code contents, secrets, or file
 *    contents into these methods. Only pass file paths, rule IDs, counts,
 *    and status messages. This mirrors the "never log sensitive source
 *    code or secrets" requirement from the architecture specification.
 */
export class Logger {
  private static outputChannel: vscode.OutputChannel | undefined;

  /**
   * Must be called once during extension activation before any logging
   * occurs. Creates the Output Channel and registers it for disposal.
   */
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

  /**
   * Reveals the Output Channel panel so the user can see log history.
   */
  public static show(): void {
    Logger.outputChannel?.show(true);
  }

  private static write(level: 'INFO' | 'WARN' | 'ERROR', message: string): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${message}`;

    if (Logger.outputChannel) {
      Logger.outputChannel.appendLine(line);
    } else {
      // Fallback in case initialize() was not called yet (should not
      // happen in normal operation, but prevents a silent failure).
      console.warn(`SentriCodeX Logger not initialized. Message: ${line}`);
    }
  }
}
