import * as vscode from 'vscode';
import { scanCurrentFile } from './scanCurrentFile';
import { scanWorkspace } from './scanWorkspace';
import { generateReport } from './generateReport';
import { viewHistory } from './viewHistory';
import { openSettings } from './openSettings';

/**
 * Registers every SentriCodeX command with VS Code.
 *
 * Responsibility:
 *  - This is the single source of truth mapping command IDs (declared in
 *    package.json's "contributes.commands") to their handler functions.
 *  - Every registration is pushed onto context.subscriptions so VS Code
 *    disposes of them cleanly when the extension deactivates.
 *
 * Input:  vscode.ExtensionContext (provided by VS Code during activation)
 * Output: None (side effect: commands become invokable from the Command
 *         Palette, keybindings, and the sidebar webview)
 */
export function registerCommands(context: vscode.ExtensionContext): void {
  const registrations: Array<[string, (...args: unknown[]) => unknown]> = [
    ['sentricodex.scanCurrentFile', scanCurrentFile],
    ['sentricodex.scanWorkspace', scanWorkspace],
    ['sentricodex.generateReport', generateReport],
    ['sentricodex.viewHistory', viewHistory],
    ['sentricodex.openSettings', openSettings],
  ];

  for (const [commandId, handler] of registrations) {
    const disposable = vscode.commands.registerCommand(commandId, handler);
    context.subscriptions.push(disposable);
  }
}
