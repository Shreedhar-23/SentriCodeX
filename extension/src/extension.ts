import * as vscode from 'vscode';
import { Logger } from './utils/logger';
import { registerCommands } from './commands';
import { SidebarProvider } from './sidebar/SidebarProvider';

/**
 * Called by VS Code when the extension activates.
 *
 * Responsibility:
 *  - Initialize centralized logging.
 *  - Register all SentriCodeX commands.
 *  - Register the sidebar webview provider.
 *
 * This function is deliberately a thin wiring layer: it contains no
 * scanning, reporting, or business logic itself, per the single-
 * responsibility principle defined in the architecture specification.
 */
export function activate(context: vscode.ExtensionContext): void {
  Logger.initialize(context);
  Logger.info('SentriCodeX extension activating...');

  registerCommands(context);

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  Logger.info('SentriCodeX extension activated successfully.');
}

/**
 * Called by VS Code when the extension deactivates. All disposables were
 * registered via context.subscriptions, so VS Code handles cleanup
 * automatically — this function exists to satisfy the extension API
 * contract and as a hook for future explicit teardown logic.
 */
export function deactivate(): void {
  Logger.info('SentriCodeX extension deactivated.');
}
