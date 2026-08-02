import * as vscode from 'vscode';
import { ScanResult } from '../models/scanResult';

/**
 * The SentriCodeX Dashboard: a singleton WebviewPanel implementing the
 * Dashboard screen from the UI/UX specification (PDF 3, Section 5) -
 * Security Score, severity cards, a severity chart, scan metadata, and
 * a searchable/sortable/filterable findings table (Section 6).
 *
 * Singleton pattern: createOrShow() reveals the existing panel instead
 * of creating a new tab on every scan, matching standard VS Code
 * extension conventions for a single "main destination" webview.
 */
export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private static readonly viewType = 'sentricodex.dashboard';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, result: ScanResult): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal(column);
      DashboardPanel.currentPanel.update(result);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      DashboardPanel.viewType,
      'SentriCodeX Dashboard',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel, extensionUri, result);
  }

  /**
   * Reveals the panel without changing its content - used by the
   * "Show Dashboard" command to bring an already-populated dashboard
   * back into focus.
   */
  public reveal(): void {
    this.panel.reveal();
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    result: ScanResult
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.update(result);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private update(result: ScanResult): void {
    this.panel.webview.html = this.getHtml(this.panel.webview, result);
  }

  private dispose(): void {
    DashboardPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      disposable?.dispose();
    }
  }

  private getHtml(webview: vscode.Webview, result: ScanResult): string {
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'dashboard.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'dashboard.js')
    );
    const nonce = getNonce();
    const dataJson = JSON.stringify(result).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"
  />
  <link rel="stylesheet" href="${cssUri}" />
  <title>SentriCodeX Dashboard</title>
</head>
<body>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="score-panel">
        <div class="score-ring" data-score="${result.security_score}">
          <span class="score-value">${result.security_score}</span>
          <span class="score-label">Security Score</span>
        </div>
      </div>
      <div class="scan-info">
        <h1>SentriCodeX Dashboard</h1>
        <p class="scan-target">${escapeHtml(result.target)}</p>
        <p class="scan-meta">
          ${result.files_scanned} file(s) scanned &middot;
          ${result.summary.findings_count} finding(s) &middot;
          ${result.duration_ms}ms &middot;
          ${new Date(result.scanned_at).toLocaleString()}
        </p>
      </div>
    </header>

    <section class="severity-cards" id="severityCards"></section>

    <section class="chart-section">
      <h2>Findings by Severity</h2>
      <div class="bar-chart" id="barChart"></div>
    </section>

    <section class="recommendations-section">
      <h2>Top Recommendations</h2>
      <ul class="recommendations-list" id="recommendationsList"></ul>
    </section>

    <section class="findings-section">
      <h2>Findings</h2>
      <div class="findings-toolbar">
        <input
          type="text"
          id="searchInput"
          class="search-input"
          placeholder="Search findings..."
        />
        <select id="severityFilter" class="severity-filter">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="informational">Informational</option>
        </select>
      </div>
      <table class="findings-table">
        <thead>
          <tr>
            <th data-sort="severity">Severity</th>
            <th data-sort="rule_id">Rule ID</th>
            <th data-sort="file">File</th>
            <th data-sort="line">Line</th>
            <th data-sort="description">Description</th>
            <th data-sort="recommendation">Recommendation</th>
          </tr>
        </thead>
        <tbody id="findingsTableBody"></tbody>
      </table>
      <p class="empty-state" id="emptyState" hidden>No findings match your filters.</p>
    </section>
  </div>

  <script nonce="${nonce}">
    window.__SENTRICODEX_DATA__ = ${dataJson};
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
