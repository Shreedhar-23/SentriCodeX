import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ScannerBridge, ScannerBridgeError } from '../bridge/ScannerBridge';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { HistoryManager } from '../storage/HistoryManager';

/**
 * Factory for the sentricodex.scanWorkspace command.
 *
 * On success: records the full result to History and opens/refreshes
 * the Dashboard.
 */
export function createScanWorkspaceCommand(
  context: vscode.ExtensionContext,
  historyManager: HistoryManager
): () => Promise<void> {
  return async function scanWorkspace(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;

    if (!folders || folders.length === 0) {
      Logger.warn('Scan Workspace requested but no folder is open.');
      void vscode.window.showWarningMessage(
        'SentriCodeX: Open a folder or workspace before running a workspace scan.'
      );
      return;
    }

    const workspacePath = folders[0].uri.fsPath;
    Logger.info(`Scan Workspace requested for: ${workspacePath}`);

    const bridge = new ScannerBridge(context.extensionUri);

    try {
      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'SentriCodeX: Scanning workspace...',
          cancellable: false,
        },
        () => bridge.run(workspacePath)
      );

      Logger.info(
        `Scan complete: ${result.files_scanned} file(s), ` +
          `${result.summary.findings_count} finding(s), score ${result.security_score}.`
      );

      await historyManager.recordScan(result);
      DashboardPanel.createOrShow(context.extensionUri, result);
    } catch (err) {
      const message = err instanceof ScannerBridgeError ? err.message : String(err);
      Logger.error('Scan Workspace failed', err);
      void vscode.window.showErrorMessage(`SentriCodeX: Scan failed. ${message}`);
    }
  };
}
