import { ScanResult } from '../models/scanResult';

/**
 * Pure parsing logic for the Scanner Bridge's subprocess output.
 *
 * Deliberately has zero dependency on the `vscode` module, unlike
 * ScannerBridge itself (which needs it for spawning processes and
 * reading configuration). Keeping this logic pure and separate means
 * it can be unit tested with Node's built-in test runner - no VS Code
 * instance required - while ScannerBridge stays a thin process-
 * management wrapper around it.
 */

export class ScanResultParseError extends Error {}

/**
 * Parses the CLI's stdout as a ScanResult.
 *
 * Throws ScanResultParseError if the content is not valid JSON. Does
 * NOT validate the full schema shape beyond being an object - trusting
 * the engine's own contract (verified independently by the Python
 * test suite) rather than duplicating schema validation on both sides.
 */
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

/**
 * Extracts a human-readable error message from the CLI's stderr.
 *
 * The CLI (see engine/sentricodex/cli.py) prints structured errors as
 * the last line of stderr, e.g. {"error": "Scan target does not
 * exist: ..."}. This function looks for that structure first, and
 * falls back to the raw stderr text if it isn't present (e.g. a Python
 * traceback from an unexpected crash).
 *
 * Returns null if stderr is empty - callers should supply their own
 * generic fallback message in that case.
 */
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
    // Last line isn't JSON - fall through to returning the raw text.
  }

  return trimmed;
}
