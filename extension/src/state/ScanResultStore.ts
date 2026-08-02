import { ScanResult } from '../models/scanResult';

/**
 * Holds the most recent scan's full result in memory for the duration
 * of the VS Code session.
 *
 * Responsibility:
 *  - Give the "Generate Report" command something to export without
 *    re-running a scan, and without the Dashboard and Report Generator
 *    needing direct references to each other.
 *
 * This is intentionally session-only (not persisted) - persisted data
 * is History's job (metadata only, see HistoryManager), while full
 * findings for export live only as long as VS Code stays open, which
 * is an acceptable and clearly-scoped limitation for this phase.
 */
let latestResult: ScanResult | undefined;

export function setLatestScanResult(result: ScanResult): void {
  latestResult = result;
}

export function getLatestScanResult(): ScanResult | undefined {
  return latestResult;
}
