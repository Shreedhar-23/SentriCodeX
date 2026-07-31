import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

/**
 * Command: sentricodex.viewHistory
 *
 * Responsibility (this phase):
 *  - Log the history request and inform the user of current capability.
 *
 * Responsibility (from Phase 6 onward):
 *  - Read local scan history from storage/ and display it in the
 *    History screen defined in the UI/UX specification.
 *
 * Input:  None
 * Output: A VS Code notification confirming the request was received.
 */
export async function viewHistory(): Promise<void> {
  Logger.info('View History requested.');

  void vscode.window.showInformationMessage(
    'SentriCodeX: Scan history will be available once local scan storage ' +
      'is implemented in a later phase.'
  );
}
