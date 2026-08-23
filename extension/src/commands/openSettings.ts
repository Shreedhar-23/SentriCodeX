import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export async function openSettings(): Promise<void> {
  Logger.info('Opening SentriCodeX settings.');
  await vscode.commands.executeCommand(
    'workbench.action.openSettings',
    'sentricodex'
  );
}
