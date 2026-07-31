import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

/**
 * Command: sentricodex.openSettings
 *
 * Responsibility:
 *  - Open the native VS Code Settings UI, pre-filtered to SentriCodeX's
 *    own configuration properties (declared in package.json's
 *    "contributes.configuration" section).
 *
 * This command is fully functional in this phase because it depends on
 * no future engine work — it only uses VS Code's built-in settings UI.
 *
 * Input:  None
 * Output: Opens the VS Code Settings editor scoped to "sentricodex".
 */
export async function openSettings(): Promise<void> {
  Logger.info('Opening SentriCodeX settings.');
  await vscode.commands.executeCommand(
    'workbench.action.openSettings',
    'sentricodex'
  );
}
