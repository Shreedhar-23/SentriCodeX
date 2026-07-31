import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

/**
 * Command: sentricodex.scanCurrentFile
 *
 * Responsibility (this phase):
 *  - Validate that there is an active, supported file to scan.
 *  - Log the scan request and inform the user of current capability.
 *
 * Responsibility (from Phase 3 onward):
 *  - Invoke the Python scanner bridge on the active file and display
 *    resulting diagnostics.
 *
 * Input:  None (reads vscode.window.activeTextEditor)
 * Output: A VS Code notification confirming the request was received.
 */
export async function scanCurrentFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    Logger.warn('Scan Current File requested but no active editor is open.');
    void vscode.window.showWarningMessage(
      'SentriCodeX: Open a file before running a scan.'
    );
    return;
  }

  const fileName = editor.document.fileName;
  Logger.info(`Scan Current File requested for: ${fileName}`);

  void vscode.window.showInformationMessage(
    'SentriCodeX: Scan request received. The security scanning engine ' +
      'will be connected in a later development phase.'
  );
}
