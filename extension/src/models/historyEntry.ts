import { ScanResult } from './scanResult';

/**
 * A single historical scan record.
 *
 * Design note: originally (Phase 6) this stored metadata only, per
 * FR-08's literal scope ("Input: Scan metadata, Output: History").
 * That was revisited based on real usage: viewing, downloading, and
 * comparing a specific past scan's actual findings requires the full
 * ScanResult, not just a summary. Each entry now wraps the complete
 * result exactly as returned by the engine, including every finding
 * (each carrying the fingerprint from Phase 3's normalizer, which is
 * what makes fingerprint-matched comparison between two entries
 * possible without any additional bookkeeping).
 */
export interface HistoryEntry {
  id: string;
  result: ScanResult;
}
