import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

/**
 * Command: sentricodex.scanWorkspace
 *
 * Responsibility (this phase):
 *  - Validate that a workspace folder is open.
 *  - Log the scan request and inform the user of current capability.
 *
 * Responsibility (from Phase 3 onward):
 *  - Enumerate all supported files in the workspace, invoke the Python
 *    scanner bridge, aggregate findings, and update the dashboard.
 *
 * Input:  None (reads vscode.workspace.workspaceFolders)
 * Output: A VS Code notification confirming the request was received.
 */
export async function scanWorkspace(): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;

  if (!folders || folders.length === 0) {
    Logger.warn('Scan Workspace requested but no folder is open.');
    void vscode.window.showWarningMessage(
      'SentriCodeX: Open a folder or workspace before running a workspace scan.'
    );
    return;
  }

  const folderNames = folders.map((f) => f.name).join(', ');
  Logger.info(`Scan Workspace requested for folder(s): ${folderNames}`);

  void vscode.window.showInformationMessage(
    'SentriCodeX: Workspace scan request received. The security scanning ' +
      'engine will be connected in a later development phase.'
  );
}
