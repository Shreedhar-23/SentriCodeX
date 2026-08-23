import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ScannerBridge, ScannerBridgeError } from '../bridge/ScannerBridge';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { HistoryManager } from '../storage/HistoryManager';

/**
 * Factory for the sentricodex.scanCurrentFile command.
 *
 * On success: records the full result to History (which is now the
 * single durable source of truth for every past scan - including the
 * most recent one, so a separate "latest scan" store is no longer
 * needed) and opens/refreshes the Dashboard.
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

      await historyManager.recordScan(result);
      DashboardPanel.createOrShow(context.extensionUri, result);
    } catch (err) {
      const message = err instanceof ScannerBridgeError ? err.message : String(err);
      Logger.error('Scan Current File failed', err);
      void vscode.window.showErrorMessage(`SentriCodeX: Scan failed. ${message}`);
    }
  };
}
