import * as vscode from 'vscode';
import * as path from 'path';
import { HistoryEntry } from '../models/historyEntry';
import { HistoryManager } from '../storage/HistoryManager';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { ComparePanel } from './ComparePanel';
import { ReportGenerator } from '../reports/ReportGenerator';
import { Logger } from '../utils/logger';

type ReportFormat = 'html' | 'json' | 'markdown';

const EXTENSIONS: Record<ReportFormat, string> = {
  html: 'html',
  json: 'json',
  markdown: 'md',
};

interface FormatChoice extends vscode.QuickPickItem {
  format: ReportFormat;
}

const FORMAT_CHOICES: FormatChoice[] = [
  { label: 'HTML', description: 'Shareable, styled report viewable in any browser', format: 'html' },
  { label: 'JSON', description: 'Full machine-readable scan result', format: 'json' },
  { label: 'Markdown', description: 'Plain-text report, ideal for PRs and wikis', format: 'markdown' },
];

interface HistoryWebviewMessage {
  command: 'clearHistory' | 'viewReport' | 'downloadReport' | 'compareReports';
  entryId?: string;
  entryIds?: [string, string];
}

/**
 * The SentriCodeX History screen (PDF 3, Section 8).
 *
 * Each row's findings now live in full (see HistoryEntry), which is
 * what makes View Report, Download Report, and Compare possible
 * directly from here - Generate Report as a separate sidebar action
 * is retired in favor of these per-scan actions, since every scan is
 * already recorded here automatically.
 */
export class HistoryPanel {
  public static currentPanel: HistoryPanel | undefined;
  private static readonly viewType = 'sentricodex.history';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly historyManager: HistoryManager;
  private disposables: vscode.Disposable[] = [];

  public static async createOrShow(
    extensionUri: vscode.Uri,
    historyManager: HistoryManager
  ): Promise<void> {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (HistoryPanel.currentPanel) {
      HistoryPanel.currentPanel.panel.reveal(column);
      await HistoryPanel.currentPanel.refresh();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      HistoryPanel.viewType,
      'SentriCodeX History',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    HistoryPanel.currentPanel = new HistoryPanel(panel, extensionUri, historyManager);
    await HistoryPanel.currentPanel.refresh();
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    historyManager: HistoryManager
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.historyManager = historyManager;

    this.panel.webview.onDidReceiveMessage(
      (message: HistoryWebviewMessage) => this.handleMessage(message),
      null,
      this.disposables
    );
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private async handleMessage(message: HistoryWebviewMessage): Promise<void> {
    switch (message.command) {
      case 'clearHistory':
        await this.handleClearHistory();
        break;
      case 'viewReport':
        if (message.entryId) {
          await this.handleViewReport(message.entryId);
        }
        break;
      case 'downloadReport':
        if (message.entryId) {
          await this.handleDownloadReport(message.entryId);
        }
        break;
      case 'compareReports':
        if (message.entryIds) {
          await this.handleCompareReports(message.entryIds);
        }
        break;
    }
  }

  private async handleClearHistory(): Promise<void> {
    const confirmed = await vscode.window.showWarningMessage(
      'SentriCodeX: Clear all scan history? This cannot be undone.',
      { modal: true },
      'Clear History'
    );
    if (confirmed === 'Clear History') {
      await this.historyManager.clear();
      Logger.info('Scan history cleared via History panel.');
      await this.refresh();
    }
  }

  private async handleViewReport(entryId: string): Promise<void> {
    const entry = await this.historyManager.getById(entryId);
    if (!entry) {
      void vscode.window.showWarningMessage('SentriCodeX: That scan is no longer in history.');
      return;
    }
    Logger.info(`Viewing historical report: ${entryId}`);
    DashboardPanel.createOrShow(this.extensionUri, entry.result);
  }

private async handleDownloadReport(entryId: string): Promise<void> {
  const entry = await this.historyManager.getById(entryId);

  if (!entry) {
    void vscode.window.showWarningMessage(
      'SentriCodeX: That scan is no longer in history.'
    );
    return;
  }

  const defaultFormat = vscode.workspace
    .getConfiguration('sentricodex')
    .get<ReportFormat>('defaultReportFormat', 'html');

  const orderedChoices = [...FORMAT_CHOICES].sort((a, b) =>
    a.format === defaultFormat
      ? -1
      : b.format === defaultFormat
        ? 1
        : 0
  );

  const choice = await vscode.window.showQuickPick(orderedChoices, {
    placeHolder: `Choose a report format (default: ${defaultFormat})`,
  });

  if (!choice) {
    return;
  }

  try {
    // Generate the report INSIDE the try/catch.
    const content = this.renderReport(choice.format, entry.result);

    Logger.info(
      `Generating ${choice.format} report for scan ${entryId}`
    );

    // Check that report generation actually returned content.
    if (typeof content !== 'string') {
      throw new Error(
        `${choice.format} report generator did not return a string.`
      );
    }

    if (content.length === 0) {
      throw new Error(
        `${choice.format} report generator returned an empty report.`
      );
    }

    Logger.info(
      `${choice.format} report generated successfully (${content.length} characters)`
    );

    const defaultUri = this.buildDefaultUri(
      choice.format,
      entry
    );

    const saveUri = await vscode.window.showSaveDialog({
      defaultUri,
      filters: {
        [choice.label]: [EXTENSIONS[choice.format]],
      },
    });

    if (!saveUri) {
      Logger.info('Report download cancelled by user.');
      return;
    }

    // Make sure the parent directory exists.
    const parentDirectory = vscode.Uri.file(
      path.dirname(saveUri.fsPath)
    );

    try {
      await vscode.workspace.fs.createDirectory(
        parentDirectory
      );
    } catch (mkdirError) {
      const message =
        mkdirError instanceof Error
          ? mkdirError.message
          : String(mkdirError);

      // Ignore "already exists".
      if (!/already exists|file exists|EEXIST/i.test(message)) {
        throw mkdirError;
      }
    }

    // Write report.
    await vscode.workspace.fs.writeFile(
      saveUri,
      Buffer.from(content, 'utf8')
    );

    Logger.info(
      `Report written successfully: ${saveUri.fsPath}`
    );

    const openAction = 'Open Report';

    const selection =
      await vscode.window.showInformationMessage(
        `SentriCodeX: ${choice.label} report saved successfully.`,
        openAction
      );

    if (selection === openAction) {
      if (choice.format === 'html') {
        await vscode.env.openExternal(saveUri);
      } else {
        const document =
          await vscode.workspace.openTextDocument(saveUri);

        await vscode.window.showTextDocument(document);
      }
    }

  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? `${err.name}: ${err.message}\n${err.stack ?? ''}`
        : String(err);

    Logger.error(
      `Failed to generate/save ${choice.format} report:\n${errorMessage}`
    );

    void vscode.window.showErrorMessage(
      `SentriCodeX: Failed to create ${choice.label} report. Check the SentriCodeX Output channel for details.`
    );
  }
}

  private async handleCompareReports(entryIds: [string, string]): Promise<void> {
    const [idA, idB] = entryIds;
    const entryA = await this.historyManager.getById(idA);
    const entryB = await this.historyManager.getById(idB);

    if (!entryA || !entryB) {
      void vscode.window.showWarningMessage(
        'SentriCodeX: One or both selected scans are no longer in history.'
      );
      return;
    }

    Logger.info(`Comparing scans: ${idA} vs ${idB}`);
    ComparePanel.createOrShow(this.extensionUri, entryA, entryB);
  }

  private renderReport(format: ReportFormat, result: HistoryEntry['result']): string {
    switch (format) {
      case 'html':
        return ReportGenerator.toHtml(result);
      case 'json':
        return ReportGenerator.toJson(result);
      case 'markdown':
        return ReportGenerator.toMarkdown(result);
    }
  }

  private buildDefaultUri(format: ReportFormat, entry: HistoryEntry): vscode.Uri {
    const timestamp = entry.result.scanned_at.replace(/[:.]/g, '-');
    const fileName = `sentricodex-report-${timestamp}.${EXTENSIONS[format]}`;

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      return vscode.Uri.joinPath(workspaceFolder.uri, 'reports', fileName);
    }
    return vscode.Uri.file(fileName);
  }

  private async refresh(): Promise<void> {
    try {
      const entries = await this.historyManager.getAll();
      this.panel.webview.html = this.getHtml(this.panel.webview, entries);
    } catch (err) {
      // Defensive safety net: if rendering fails for any reason, show
      // a clear error state instead of leaving the panel silently
      // blank - a blank panel with no explanation is the worst
      // possible failure mode for a user to debug.
      Logger.error('Failed to render History panel', err);
      this.panel.webview.html = this.getErrorHtml(err);
    }
  }

  private getErrorHtml(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="font-family: sans-serif; padding: 24px; color: #f14c4c;">
  <h2>SentriCodeX History failed to load</h2>
  <p>${escapeHtml(message)}</p>
  <p>See the SentriCodeX Output Channel for details.</p>
</body>
</html>`;
  }

  private dispose(): void {
    HistoryPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      disposable?.dispose();
    }
  }

  private getHtml(webview: vscode.Webview, entries: HistoryEntry[]): string {
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'history.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'history.js')
    );
    const nonce = getNonce();

    // Send a lightweight summary per entry to the webview (not the
    // full findings array) - the table only ever displays metadata;
    // full findings are fetched from HistoryManager only when an
    // action (view/download/compare) actually needs them.
    const summaries = entries.map((entry) => ({
      id: entry.id,
      timestamp: entry.result.scanned_at,
      target: entry.result.target,
      filesScanned: entry.result.files_scanned,
      findingsCount: entry.result.summary.findings_count,
      securityScore: entry.result.security_score,
      durationMs: entry.result.duration_ms,
    }));
    const dataJson = JSON.stringify(summaries).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"
  />
  <link rel="stylesheet" href="${cssUri}" />
  <title>SentriCodeX History</title>
</head>
<body>
  <div class="history">
    <header>
      <h1>Scan History</h1>
      <div class="header-actions">
        <button id="compareSelectedButton" class="compare-button" disabled>
          Compare Selected
        </button>
        <button id="clearHistoryButton" class="clear-button">Clear History</button>
      </div>
    </header>

    <table class="history-table">
      <thead>
        <tr>
          <th class="checkbox-col"></th>
          <th data-sort="timestamp">Timestamp</th>
          <th data-sort="target">Target</th>
          <th data-sort="filesScanned">Files</th>
          <th data-sort="findingsCount">Findings</th>
          <th data-sort="securityScore">Score</th>
          <th data-sort="durationMs">Duration</th>
          <th class="menu-col"></th>
        </tr>
      </thead>
      <tbody id="historyTableBody"></tbody>
    </table>
    <p class="empty-state" id="emptyState" hidden>
      No scans yet. Run "Scan Current File" or "Scan Workspace" to get started.
    </p>
  </div>

  <script nonce="${nonce}">
    window.__SENTRICODEX_HISTORY__ = ${dataJson};
  </script>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
