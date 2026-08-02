import * as vscode from 'vscode';
import { HistoryEntry } from '../models/historyEntry';
import { HistoryManager } from '../storage/HistoryManager';
import { Logger } from '../utils/logger';

/**
 * The SentriCodeX History screen (PDF 3, Section 8): shows previous
 * scans, timestamps, project targets, and security scores.
 *
 * Singleton WebviewPanel, same pattern as DashboardPanel. Unlike the
 * Dashboard, this panel talks back to the extension host (the "Clear
 * History" button), reusing the message-passing pattern first
 * established by the Sidebar in an earlier phase.
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
      (message: { command: string }) => this.handleMessage(message),
      null,
      this.disposables
    );
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private async handleMessage(message: { command: string }): Promise<void> {
    if (message.command === 'clearHistory') {
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
  }

  private async refresh(): Promise<void> {
    const entries = await this.historyManager.getAll();
    this.panel.webview.html = this.getHtml(this.panel.webview, entries);
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
    const dataJson = JSON.stringify(entries).replace(/</g, '\\u003c');

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
      <button id="clearHistoryButton" class="clear-button">Clear History</button>
    </header>

    <table class="history-table">
      <thead>
        <tr>
          <th data-sort="timestamp">Timestamp</th>
          <th data-sort="target">Target</th>
          <th data-sort="filesScanned">Files</th>
          <th data-sort="findingsCount">Findings</th>
          <th data-sort="securityScore">Score</th>
          <th data-sort="durationMs">Duration</th>
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
