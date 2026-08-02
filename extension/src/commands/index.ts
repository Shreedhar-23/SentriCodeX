import * as vscode from 'vscode';
import { createScanCurrentFileCommand } from './scanCurrentFile';
import { createScanWorkspaceCommand } from './scanWorkspace';
import { createGenerateReportCommand } from './generateReport';
import { createViewHistoryCommand } from './viewHistory';
import { openSettings } from './openSettings';
import { createShowDashboardCommand } from './showDashboard';
import { HistoryManager } from '../storage/HistoryManager';

/**
 * Registers every SentriCodeX command with VS Code.
 *
 * Responsibility:
 *  - This is the single source of truth mapping command IDs (declared in
 *    package.json's "contributes.commands") to their handler functions.
 *  - Every registration is pushed onto context.subscriptions so VS Code
 *    disposes of them cleanly when the extension deactivates.
 *
 * Commands that need access to the extension's install location, or to
 * the shared HistoryManager instance, are built via factory functions
 * that receive those dependencies once, here, rather than threading
 * them through every call site.
 *
 * Input:  vscode.ExtensionContext (provided by VS Code during activation)
 * Output: None (side effect: commands become invokable from the Command
 *         Palette, keybindings, and the sidebar webview)
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  historyManager: HistoryManager
): void {
  const registrations: Array<[string, (...args: unknown[]) => unknown]> = [
    ['sentricodex.scanCurrentFile', createScanCurrentFileCommand(context, historyManager)],
    ['sentricodex.scanWorkspace', createScanWorkspaceCommand(context, historyManager)],
    ['sentricodex.generateReport', createGenerateReportCommand(context)],
    ['sentricodex.viewHistory', createViewHistoryCommand(context, historyManager)],
    ['sentricodex.openSettings', openSettings],
    ['sentricodex.showDashboard', createShowDashboardCommand(context)],
  ];

  for (const [commandId, handler] of registrations) {
    const disposable = vscode.commands.registerCommand(commandId, handler);
    context.subscriptions.push(disposable);
  }
}
