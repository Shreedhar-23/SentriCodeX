import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ScannerBridge, ScannerBridgeError } from '../bridge/ScannerBridge';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { HistoryManager } from '../storage/HistoryManager';
import { setLatestScanResult } from '../state/ScanResultStore';

/**
 * Factory for the sentricodex.scanWorkspace command.
 *
 * Responsibility:
 *  - Validate that a workspace folder is open.
 *  - Run the real scan via the ScannerBridge against the workspace
 *    root, with a progress notification (workspace scans can take
 *    noticeably longer than a single file).
 *  - On success: store the result for Report generation, record it to
 *    History, and open/refresh the Dashboard with real results.
 *  - On failure, surface a clear error message and log details.
 *
 * Input:  None (reads vscode.workspace.workspaceFolders)
 * Output: Opens the Dashboard panel with real scan results, or shows
 *         an error notification.
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

      setLatestScanResult(result);
      await historyManager.recordScan(result);
      DashboardPanel.createOrShow(context.extensionUri, result);
    } catch (err) {
      const message = err instanceof ScannerBridgeError ? err.message : String(err);
      Logger.error('Scan Workspace failed', err);
      void vscode.window.showErrorMessage(`SentriCodeX: Scan failed. ${message}`);
    }
  };
}
