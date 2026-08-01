import * as vscode from 'vscode';
import { createScanCurrentFileCommand } from './scanCurrentFile';
import { createScanWorkspaceCommand } from './scanWorkspace';
import { generateReport } from './generateReport';
import { viewHistory } from './viewHistory';
import { openSettings } from './openSettings';
import { createShowDashboardCommand } from './showDashboard';

/**
 * Registers every SentriCodeX command with VS Code.
 *
 * Responsibility:
 *  - This is the single source of truth mapping command IDs (declared in
 *    package.json's "contributes.commands") to their handler functions.
 *  - Every registration is pushed onto context.subscriptions so VS Code
 *    disposes of them cleanly when the extension deactivates.
 *
 * Commands that need access to the extension's install location (to
 * locate the engine/ folder or the media/ assets) are built via factory
 * functions that receive the ExtensionContext once, here, rather than
 * threading it through every call site.
 *
 * Input:  vscode.ExtensionContext (provided by VS Code during activation)
 * Output: None (side effect: commands become invokable from the Command
 *         Palette, keybindings, and the sidebar webview)
 */
export function registerCommands(context: vscode.ExtensionContext): void {
  const registrations: Array<[string, (...args: unknown[]) => unknown]> = [
    ['sentricodex.scanCurrentFile', createScanCurrentFileCommand(context)],
    ['sentricodex.scanWorkspace', createScanWorkspaceCommand(context)],
    ['sentricodex.generateReport', generateReport],
    ['sentricodex.viewHistory', viewHistory],
    ['sentricodex.openSettings', openSettings],
    ['sentricodex.showDashboard', createShowDashboardCommand(context)],
  ];

  for (const [commandId, handler] of registrations) {
    const disposable = vscode.commands.registerCommand(commandId, handler);
    context.subscriptions.push(disposable);
  }
}
