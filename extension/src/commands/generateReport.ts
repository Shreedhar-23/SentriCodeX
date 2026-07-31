import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

/**
 * Command: sentricodex.generateReport
 *
 * Responsibility (this phase):
 *  - Log the report request and inform the user of current capability.
 *
 * Responsibility (from Phase 6 onward):
 *  - Serialize the most recent findings into HTML, JSON, and Markdown
 *    reports and save them to the reports/ directory.
 *
 * Input:  None
 * Output: A VS Code notification confirming the request was received.
 */
export async function generateReport(): Promise<void> {
  Logger.info('Generate Report requested.');

  void vscode.window.showInformationMessage(
    'SentriCodeX: Report generation will be available once the scanning ' +
      'engine and report builder are implemented in a later phase.'
  );
}
