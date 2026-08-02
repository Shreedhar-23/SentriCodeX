import * as vscode from 'vscode';
import { HistoryEntry } from '../models/historyEntry';
import { ScanResult } from '../models/scanResult';
import { Logger } from '../utils/logger';

const HISTORY_FILE_NAME = 'history.json';
const MAX_HISTORY_ENTRIES = 100;

/**
 * Manages local scan history (PDF 2, FR-08).
 *
 * Responsibility:
 *  - Persist scan metadata (not full findings - see HistoryEntry) to a
 *    JSON file inside the extension's global storage directory, which
 *    VS Code manages per-machine, independent of any single workspace.
 *  - Load that history back on demand for the History screen.
 *
 * Using context.globalStorageUri rather than writing into the scanned
 * workspace keeps SentriCodeX's own bookkeeping out of the user's
 * project - their git status should never show unrelated SentriCodeX
 * files.
 */
export class HistoryManager {
  private readonly historyFileUri: vscode.Uri;

  constructor(context: vscode.ExtensionContext) {
    this.historyFileUri = vscode.Uri.joinPath(
      context.globalStorageUri,
      HISTORY_FILE_NAME
    );
  }

  /**
   * Appends a new entry derived from a completed scan, evicting the
   * oldest entries beyond MAX_HISTORY_ENTRIES to prevent unbounded
   * growth. Newest entries are stored first.
   */
  public async recordScan(result: ScanResult): Promise<void> {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: result.scanned_at,
      target: result.target,
      filesScanned: result.files_scanned,
      findingsCount: result.summary.findings_count,
      securityScore: result.security_score,
      severityBreakdown: result.summary.severity_breakdown,
      durationMs: result.duration_ms,
    };

    const existing = await this.getAll();
    const updated = [entry, ...existing].slice(0, MAX_HISTORY_ENTRIES);

    await this.writeAll(updated);
    Logger.info(`Recorded scan to history (${updated.length} total entries).`);
  }

  /**
   * Returns all stored history entries, newest first. Returns an empty
   * array if no history file exists yet (first run) rather than
   * throwing - an empty history is a normal, valid state.
   */
  public async getAll(): Promise<HistoryEntry[]> {
    try {
      const bytes = await vscode.workspace.fs.readFile(this.historyFileUri);
      const parsed: unknown = JSON.parse(Buffer.from(bytes).toString('utf8'));
      return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
    } catch (err) {
      // File not found is expected on first run; anything else is
      // logged so a genuinely corrupt file isn't silently swallowed.
      if (!this.isFileNotFound(err)) {
        Logger.error('Failed to read scan history', err);
      }
      return [];
    }
  }

  /** Deletes all stored history entries. */
  public async clear(): Promise<void> {
    await this.writeAll([]);
    Logger.info('Scan history cleared.');
  }

  private async writeAll(entries: HistoryEntry[]): Promise<void> {
    await vscode.workspace.fs.createDirectory(
      vscode.Uri.joinPath(this.historyFileUri, '..')
    );
    const bytes = Buffer.from(JSON.stringify(entries, null, 2), 'utf8');
    await vscode.workspace.fs.writeFile(this.historyFileUri, bytes);
  }

  private isFileNotFound(err: unknown): boolean {
    return (
      err instanceof vscode.FileSystemError &&
      err.code === 'FileNotFound'
    );
  }
}
