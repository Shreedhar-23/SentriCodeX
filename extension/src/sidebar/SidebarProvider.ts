import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

interface SidebarMessage {
  command: string;
}

/**
 * Provides the SentriCodeX sidebar webview (Activity Bar -> Sidebar).
 *
 * "Generate Report" was removed from here: every completed scan is
 * now automatically recorded to History (with its full findings), so
 * downloading a report for the most recent scan is just "open History,
 * use the ... menu on the top row" - no separate action needed for
 * the common case, and the History-based flow additionally supports
 * downloading a report for *any* past scan, not only the latest one.
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'sentricodex.sidebar';

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: SidebarMessage) => {
      this.handleMessage(message);
    });
  }

  private handleMessage(message: SidebarMessage): void {
    const knownCommands = new Set([
      'sentricodex.scanCurrentFile',
      'sentricodex.scanWorkspace',
      'sentricodex.viewHistory',
      'sentricodex.openSettings',
    ]);

    if (!knownCommands.has(message.command)) {
      Logger.warn(`Sidebar sent an unrecognized command: ${message.command}`);
      return;
    }

    void vscode.commands.executeCommand(message.command);
  }

  private getHtml(webview: vscode.Webview): string {
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'sidebar.js')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"
  />
  <link rel="stylesheet" href="${cssUri}" />
  <title>SentriCodeX</title>
</head>
<body>
  <div class="sentricodex-sidebar">
    <h2>SentriCodeX</h2>
    <p class="subtitle">Local-first security scanning</p>

    <button id="scanCurrentFile" class="sc-button sc-button-primary">
      Scan Current File
    </button>
    <button id="scanWorkspace" class="sc-button">
      Scan Workspace
    </button>
    <button id="viewHistory" class="sc-button">
      View History
    </button>
    <button id="openSettings" class="sc-button sc-button-secondary">
      Settings
    </button>
  </div>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
