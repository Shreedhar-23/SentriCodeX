import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { HistoryManager } from '../storage/HistoryManager';
import { HistoryPanel } from '../history/HistoryPanel';

/**
 * Factory for the sentricodex.viewHistory command (FR-08).
 *
 * Responsibility:
 *  - Open (or refresh) the History panel, backed by the shared
 *    HistoryManager instance created once at activation.
 */
export function createViewHistoryCommand(
  context: vscode.ExtensionContext,
  historyManager: HistoryManager
): () => Promise<void> {
  return async function viewHistory(): Promise<void> {
    Logger.info('Opening scan history.');
    await HistoryPanel.createOrShow(context.extensionUri, historyManager);
  };
}
