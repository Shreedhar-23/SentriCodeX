import * as vscode from 'vscode';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { getLatestScanResult } from '../state/ScanResultStore';
import { ReportGenerator } from '../reports/ReportGenerator';

type ReportFormat = 'html' | 'json' | 'markdown';

interface FormatChoice extends vscode.QuickPickItem {
  format: ReportFormat;
}

const FORMAT_CHOICES: FormatChoice[] = [
  { label: 'HTML', description: 'Shareable, styled report viewable in any browser', format: 'html' },
  { label: 'JSON', description: 'Full machine-readable scan result', format: 'json' },
  { label: 'Markdown', description: 'Plain-text report, ideal for PRs and wikis', format: 'markdown' },
];

const EXTENSIONS: Record<ReportFormat, string> = {
  html: 'html',
  json: 'json',
  markdown: 'md',
};

/**
 * Factory for the sentricodex.generateReport command (FR-06).
 *
 * Responsibility:
 *  - Require a completed scan (via ScanResultStore) to export from.
 *  - Let the user choose a format, then a save location (defaulting to
 *    the workspace's reports/ folder when one exists).
 *  - Write the formatted report and offer to open it.
 *
 * Report content itself is produced by ReportGenerator, kept separate
 * from this command's file-dialog/IO responsibilities.
 */
export function createGenerateReportCommand(
  _context: vscode.ExtensionContext
): () => Promise<void> {
  return async function generateReport(): Promise<void> {
    const result = getLatestScanResult();

    if (!result) {
      Logger.warn('Generate Report requested but no scan has run yet this session.');
      void vscode.window.showWarningMessage(
        'SentriCodeX: Run a scan before generating a report.'
      );
      return;
    }

    const defaultFormat = vscode.workspace
      .getConfiguration('sentricodex')
      .get<ReportFormat>('defaultReportFormat', 'html');
    const orderedChoices = [...FORMAT_CHOICES].sort((a, b) =>
      a.format === defaultFormat ? -1 : b.format === defaultFormat ? 1 : 0
    );

    const choice = await vscode.window.showQuickPick(orderedChoices, {
      placeHolder: `Choose a report format (default: ${defaultFormat})`,
    });
    if (!choice) {
      return; // User cancelled.
    }

    const content = renderReport(choice.format, result);
    const defaultUri = buildDefaultUri(choice.format);

    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: { [choice.label]: [EXTENSIONS[choice.format]] },
    });
    if (!saveUri) {
      return; // User cancelled.
    }

    try {
      await vscode.workspace.fs.writeFile(saveUri, Buffer.from(content, 'utf8'));
      Logger.info(`Report written to: ${saveUri.fsPath}`);

      const openAction = 'Open Report';
      const selection = await vscode.window.showInformationMessage(
        `SentriCodeX: Report saved to ${path.basename(saveUri.fsPath)}.`,
        openAction
      );

      if (selection === openAction) {
        if (choice.format === 'html') {
          void vscode.env.openExternal(saveUri);
        } else {
          const doc = await vscode.workspace.openTextDocument(saveUri);
          void vscode.window.showTextDocument(doc);
        }
      }
    } catch (err) {
      Logger.error('Failed to write report', err);
      void vscode.window.showErrorMessage(
        `SentriCodeX: Failed to save report. ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };
}

function renderReport(format: ReportFormat, result: ReturnType<typeof getLatestScanResult>): string {
  if (!result) {
    throw new Error('renderReport called without a scan result.');
  }
  switch (format) {
    case 'html':
      return ReportGenerator.toHtml(result);
    case 'json':
      return ReportGenerator.toJson(result);
    case 'markdown':
      return ReportGenerator.toMarkdown(result);
  }
}

function buildDefaultUri(format: ReportFormat): vscode.Uri {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `sentricodex-report-${timestamp}.${EXTENSIONS[format]}`;

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder) {
    return vscode.Uri.joinPath(workspaceFolder.uri, 'reports', fileName);
  }
  return vscode.Uri.file(fileName);
}
