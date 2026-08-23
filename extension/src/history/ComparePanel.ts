import * as vscode from 'vscode';
import { HistoryEntry } from '../models/historyEntry';

/**
 * Compares two historical scans (PDF 3's implied "track security
 * posture over time" use case, made concrete).
 *
 * The diff is fingerprint-based: each Finding's fingerprint (built in
 * Phase 3's FindingNormalizer from rule_id + file + line + column) is
 * a stable identity for "the same issue," so matching fingerprints
 * across two scans tells us exactly which findings are new, which
 * were resolved, and which are unchanged - without any additional
 * bookkeeping beyond what the engine already produces.
 *
 * Not a singleton like Dashboard/History - each comparison opens its
 * own panel, since a user might reasonably want to compare more than
 * one pair of scans side by side.
 */
export class ComparePanel {
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    entryA: HistoryEntry,
    entryB: HistoryEntry
  ): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    const panel = vscode.window.createWebviewPanel(
      'sentricodex.compare',
      'SentriCodeX Compare',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    new ComparePanel(panel, extensionUri, entryA, entryB);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    entryA: HistoryEntry,
    entryB: HistoryEntry
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    // Order chronologically (older = baseline "before", newer =
    // "after") regardless of the order the two rows were checked in
    // the History table.
    const [before, after] =
      entryA.result.scanned_at <= entryB.result.scanned_at
        ? [entryA, entryB]
        : [entryB, entryA];

    this.panel.webview.html = this.getHtml(this.panel.webview, before, after);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private dispose(): void {
    this.panel.dispose();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      disposable?.dispose();
    }
  }

  private getHtml(
    webview: vscode.Webview,
    before: HistoryEntry,
    after: HistoryEntry
  ): string {
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'compare.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'compare.js')
    );
    const nonce = getNonce();
    const dataJson = JSON.stringify({ before: before.result, after: after.result }).replace(
      /</g,
      '\\u003c'
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"
  />
  <link rel="stylesheet" href="${cssUri}" />
  <title>SentriCodeX Compare</title>
</head>
<body>
  <div class="compare">
    <h1>Compare Scans</h1>

    <section class="score-comparison" id="scoreComparison"></section>

    <section class="severity-comparison">
      <h2>Severity Breakdown</h2>
      <table class="comparison-table" id="severityTable"></table>
    </section>

    <section class="diff-section">
      <h2>New Findings <span class="count-badge" id="newCount"></span></h2>
      <p class="section-hint">Present in the newer scan but not the older one.</p>
      <ul class="finding-diff-list" id="newFindingsList"></ul>
    </section>

    <section class="diff-section">
      <h2>Resolved Findings <span class="count-badge" id="resolvedCount"></span></h2>
      <p class="section-hint">Present in the older scan but no longer found.</p>
      <ul class="finding-diff-list" id="resolvedFindingsList"></ul>
    </section>

    <section class="diff-section">
      <h2>Unchanged <span class="count-badge" id="unchangedCount"></span></h2>
      <p class="section-hint">Present in both scans.</p>
    </section>
  </div>

  <script nonce="${nonce}">
    window.__SENTRICODEX_COMPARE_DATA__ = ${dataJson};
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
