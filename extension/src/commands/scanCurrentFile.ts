import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ScannerBridge, ScannerBridgeError } from '../bridge/ScannerBridge';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { HistoryManager } from '../storage/HistoryManager';
import { setLatestScanResult } from '../state/ScanResultStore';

/**
 * Factory for the sentricodex.scanCurrentFile command.
 *
 * Responsibility:
 *  - Validate that there is an active, supported file to scan.
 *  - Run the real scan via the ScannerBridge, with a progress
 *    notification since scanning is not instantaneous.
 *  - On success: store the result for Report generation, record it to
 *    History, and open/refresh the Dashboard with real results.
 *  - On failure, surface a clear error message and log details.
 *
 * Returns a bound command handler (rather than being one directly) so
 * it has access to context.extensionUri, which the bridge needs to
 * locate the engine/ folder and the dashboard needs to locate media/.
 *
 * Input:  None (reads vscode.window.activeTextEditor)
 * Output: Opens the Dashboard panel with real scan results, or shows
 *         an error notification.
 */
export function createScanCurrentFileCommand(
  context: vscode.ExtensionContext,
  historyManager: HistoryManager
): () => Promise<void> {
  return async function scanCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      Logger.warn('Scan Current File requested but no active editor is open.');
      void vscode.window.showWarningMessage(
        'SentriCodeX: Open a file before running a scan.'
      );
      return;
    }

    const filePath = editor.document.fileName;
    Logger.info(`Scan Current File requested for: ${filePath}`);

    const bridge = new ScannerBridge(context.extensionUri);

    try {
      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'SentriCodeX: Scanning current file...',
          cancellable: false,
        },
        () => bridge.run(filePath)
      );

      Logger.info(
        `Scan complete: ${result.summary.findings_count} finding(s), ` +
          `score ${result.security_score}.`
      );

      setLatestScanResult(result);
      await historyManager.recordScan(result);
      DashboardPanel.createOrShow(context.extensionUri, result);
    } catch (err) {
      const message = err instanceof ScannerBridgeError ? err.message : String(err);
      Logger.error('Scan Current File failed', err);
      void vscode.window.showErrorMessage(`SentriCodeX: Scan failed. ${message}`);
    }
  };
}
