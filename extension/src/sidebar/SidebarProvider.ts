import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

/**
 * Message shape sent FROM the sidebar webview TO the extension host
 * when a user clicks a button.
 */
interface SidebarMessage {
  command: string;
}

/**
 * Provides the SentriCodeX sidebar webview (Activity Bar → Sidebar).
 *
 * Responsibility:
 *  - Render the sidebar's HTML/CSS/JS (buttons: Scan Current File, Scan
 *    Workspace, Generate Report, View History, Settings), matching the
 *    UI/UX specification's Sidebar section.
 *  - Receive button-click messages from the webview and dispatch them
 *    to the corresponding registered VS Code command.
 *  - Apply a strict Content-Security-Policy so the webview can only run
 *    scripts and load styles that ship with the extension itself.
 *
 * This class deliberately contains NO scanning or business logic — it
 * only renders UI and forwards user intent to commands, in line with
 * the single-responsibility principle from the architecture spec.
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

    // Keep the webview's DOM state when the user switches to a different
    // sidebar/tab and back, instead of reloading from scratch every time.
    webviewView.webview.options = {
      ...webviewView.webview.options,
      enableScripts: true,
    };
  }

  private handleMessage(message: SidebarMessage): void {
    const knownCommands = new Set([
      'sentricodex.scanCurrentFile',
      'sentricodex.scanWorkspace',
      'sentricodex.generateReport',
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

    <button id="scanCurrentFile" class="sc-button sc-button-primary">
      Scan Current File
    </button>
    <button id="scanWorkspace" class="sc-button">
      Scan Workspace
    </button>
    <button id="generateReport" class="sc-button">
      Generate Report
    </button>
    <button id="viewHistory" class="sc-button">
      View History
    </button>
    <button id="openSettings" class="sc-button sc-button-secondary">
      ⚙
    </button>
  </div>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}

/**
 * Generates a random nonce used by the Content-Security-Policy to allow
 * only our own inline script tag to execute.
 */
function getNonce(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
