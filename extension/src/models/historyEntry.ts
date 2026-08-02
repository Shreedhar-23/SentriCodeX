import { Severity } from './scanResult';

/**
 * A single historical scan record.
 *
 * Deliberately metadata-only (per PDF 2, FR-08: "Input: Scan metadata,
 * Output: History") - NOT a full copy of that scan's findings. Findings
 * belong to Reports (FR-06) and the Dashboard's in-memory session
 * state; History answers "how has my security posture trended over
 * time?", not "replay every past finding."
 */
export interface HistoryEntry {
  id: string;
  timestamp: string;
  target: string;
  filesScanned: number;
  findingsCount: number;
  securityScore: number;
  severityBreakdown: Record<Severity, number>;
  durationMs: number;
}
