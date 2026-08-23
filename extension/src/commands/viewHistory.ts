import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { HistoryManager } from '../storage/HistoryManager';
import { HistoryPanel } from '../history/HistoryPanel';

export function createViewHistoryCommand(
  context: vscode.ExtensionContext,
  historyManager: HistoryManager
): () => Promise<void> {
  return async function viewHistory(): Promise<void> {
    Logger.info('Opening scan history.');
    await HistoryPanel.createOrShow(context.extensionUri, historyManager);
  };
}
