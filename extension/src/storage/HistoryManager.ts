import * as vscode from 'vscode';
import { HistoryEntry } from '../models/historyEntry';
import { ScanResult } from '../models/scanResult';
import { Logger } from '../utils/logger';

const HISTORY_FILE_NAME = 'history.json';

// Lowered from the original 100 now that each entry stores full scan
// results (not just metadata) - keeps the local JSON file at a
// reasonable size while still covering a generous scan history.
const MAX_HISTORY_ENTRIES = 50;

/**
 * Manages local scan history (PDF 2, FR-08), persisted to a JSON file
 * inside the extension's global storage directory (per-machine,
 * independent of any single workspace - so SentriCodeX's own
 * bookkeeping never shows up in a user's project git status).
 *
 * Each entry stores the complete ScanResult, enabling View Report,
 * Download Report, and Compare actions directly from History.
 */
export class HistoryManager {
  private readonly historyFileUri: vscode.Uri;

  constructor(context: vscode.ExtensionContext) {
    this.historyFileUri = vscode.Uri.joinPath(
      context.globalStorageUri,
      HISTORY_FILE_NAME
    );
  }

  public async recordScan(result: ScanResult): Promise<void> {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      result,
    };

    const existing = await this.getAll();
    const updated = [entry, ...existing].slice(0, MAX_HISTORY_ENTRIES);

    await this.writeAll(updated);
    Logger.info(`Recorded scan to history (${updated.length} total entries).`);
  }

  /**
   * Returns all stored history entries, newest first.
   *
   * Entries are validated against the current HistoryEntry shape
   * before being returned. This matters because the schema changed in
   * this version (from metadata-only to storing the full ScanResult) -
   * without validation, an old-format history.json from before this
   * change would parse successfully as JSON but crash the History
   * panel when it tried to read entry.result.scanned_at on an entry
   * that has no .result field at all. Invalid entries are silently
   * dropped (logged, not surfaced as an error) since there is no way
   * to reconstruct full findings from the old metadata-only shape.
   */
  public async getAll(): Promise<HistoryEntry[]> {
    try {
      const bytes = await vscode.workspace.fs.readFile(this.historyFileUri);
      const parsed: unknown = JSON.parse(Buffer.from(bytes).toString('utf8'));

      if (!Array.isArray(parsed)) {
        return [];
      }

      const validEntries = parsed.filter(isValidHistoryEntry);
      const discarded = parsed.length - validEntries.length;
      if (discarded > 0) {
        Logger.warn(
          `Discarded ${discarded} history entr${discarded === 1 ? 'y' : 'ies'} ` +
            'in an outdated format (from before scan history began storing ' +
            'full results).'
        );
      }

      return validEntries;
    } catch (err) {
      if (!this.isFileNotFound(err)) {
        Logger.error('Failed to read scan history', err);
      }
      return [];
    }
  }

  /** Returns a single entry by id, or undefined if not found. */
  public async getById(id: string): Promise<HistoryEntry | undefined> {
    const entries = await this.getAll();
    return entries.find((entry) => entry.id === id);
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
    return err instanceof vscode.FileSystemError && err.code === 'FileNotFound';
  }
}

/**
 * Runtime check that an unknown value from disk actually matches the
 * current HistoryEntry shape (has an id and a result object with the
 * fields a ScanResult must have). Deliberately checks a few key
 * fields rather than every field - enough to catch "this is the old
 * metadata-only format" without becoming a full schema validator.
 */
function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string') {
    return false;
  }
  if (typeof candidate.result !== 'object' || candidate.result === null) {
    return false;
  }
  const result = candidate.result as Record<string, unknown>;
  return (
    typeof result.scanned_at === 'string' &&
    typeof result.security_score === 'number' &&
    Array.isArray(result.findings)
  );
}
