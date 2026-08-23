import * as vscode from 'vscode';
import { Logger } from './utils/logger';
import { registerCommands } from './commands';
import { SidebarProvider } from './sidebar/SidebarProvider';
import { HistoryManager } from './storage/HistoryManager';

export function activate(context: vscode.ExtensionContext): void {
  Logger.initialize(context);
  Logger.info('SentriCodeX extension activating...');

  const historyManager = new HistoryManager(context);

  registerCommands(context, historyManager);

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  Logger.info('SentriCodeX extension activated successfully.');
}

export function deactivate(): void {
  Logger.info('SentriCodeX extension deactivated.');
}
