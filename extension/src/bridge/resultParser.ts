import { ScanResult } from '../models/scanResult';

export class ScanResultParseError extends Error {}

export function parseScanResult(stdout: string): ScanResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch (err) {
    throw new ScanResultParseError(
      `Scan output could not be parsed as JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ScanResultParseError('Scan output was valid JSON but not an object.');
  }

  return parsed as ScanResult;
}

export function extractErrorMessage(stderr: string): string | null {
  const trimmed = stderr.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const lines = trimmed.split('\n');
  const lastLine = lines[lines.length - 1];

  try {
    const parsed: unknown = JSON.parse(lastLine);
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      return String((parsed as { error: unknown }).error);
    }
  } catch {
    // Not JSON - fall through.
  }

  return trimmed;
}
