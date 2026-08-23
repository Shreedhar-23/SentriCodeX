import * as vscode from 'vscode';
import { createScanCurrentFileCommand } from './scanCurrentFile';
import { createScanWorkspaceCommand } from './scanWorkspace';
import { createViewHistoryCommand } from './viewHistory';
import { openSettings } from './openSettings';
import { createShowDashboardCommand } from './showDashboard';
import { HistoryManager } from '../storage/HistoryManager';

/**
 * Registers every SentriCodeX command with VS Code.
 *
 * sentricodex.generateReport was retired: every scan is now recorded
 * to History automatically with its full findings, so report
 * generation for any past scan (including the most recent) happens
 * through History's per-row "..." menu (see HistoryPanel) instead of
 * a standalone sidebar action.
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  historyManager: HistoryManager
): void {
  const registrations: Array<[string, (...args: unknown[]) => unknown]> = [
    ['sentricodex.scanCurrentFile', createScanCurrentFileCommand(context, historyManager)],
    ['sentricodex.scanWorkspace', createScanWorkspaceCommand(context, historyManager)],
    ['sentricodex.viewHistory', createViewHistoryCommand(context, historyManager)],
    ['sentricodex.openSettings', openSettings],
    ['sentricodex.showDashboard', createShowDashboardCommand(context)],
  ];

  for (const [commandId, handler] of registrations) {
    const disposable = vscode.commands.registerCommand(commandId, handler);
    context.subscriptions.push(disposable);
  }
}
