import * as vscode from 'vscode';
import { DashboardPanel } from '../dashboard/DashboardPanel';
import { Logger } from '../utils/logger';

/**
 * Factory for the sentricodex.showDashboard command.
 *
 * Responsibility:
 *  - Reveal the Dashboard panel if it currently holds results from a
 *    previous scan in this session (DashboardPanel.currentPanel).
 *  - If no scan has run yet this session, guide the user to run one
 *    instead of opening an empty/confusing panel.
 */
export function createShowDashboardCommand(
  _context: vscode.ExtensionContext
): () => Promise<void> {
  return async function showDashboard(): Promise<void> {
    if (DashboardPanel.currentPanel) {
      Logger.info('Revealing existing Dashboard panel.');
      DashboardPanel.currentPanel.reveal();
      return;
    }

    Logger.info('Show Dashboard requested but no scan has run yet this session.');
    void vscode.window.showInformationMessage(
      'SentriCodeX: No scan results yet. Run "Scan Current File" or ' +
        '"Scan Workspace" first.'
    );
  };
}
