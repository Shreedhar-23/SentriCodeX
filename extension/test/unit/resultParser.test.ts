import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { parseScanResult, extractErrorMessage, ScanResultParseError } from '../../src/bridge/resultParser';

describe('parseScanResult', () => {
  test('parses valid ScanResult JSON', () => {
    const json = JSON.stringify({
      schema_version: '1.0',
      scanned_at: '2026-08-01T00:00:00Z',
      target: '/some/path',
      files_scanned: 3,
      findings: [],
      summary: { files_scanned: 3, findings_count: 0, severity_breakdown: {} },
      security_score: 100,
      duration_ms: 5,
    });

    const result = parseScanResult(json);

    assert.equal(result.files_scanned, 3);
    assert.equal(result.security_score, 100);
  });

  test('throws ScanResultParseError for invalid JSON', () => {
    assert.throws(() => parseScanResult('{not valid json'), ScanResultParseError);
  });

  test('throws ScanResultParseError for valid JSON that is not an object', () => {
    assert.throws(() => parseScanResult('42'), ScanResultParseError);
    assert.throws(() => parseScanResult('"just a string"'), ScanResultParseError);
  });

  test('throws ScanResultParseError for JSON null', () => {
    assert.throws(() => parseScanResult('null'), ScanResultParseError);
  });
});

describe('extractErrorMessage', () => {
  test('extracts the error field from structured JSON stderr', () => {
    const stderr = '[2026-08-01T00:00:00] [ERROR] Scan failed\n{"error": "Scan target does not exist: /bad/path"}';

    const message = extractErrorMessage(stderr);

    assert.equal(message, 'Scan target does not exist: /bad/path');
  });

  test('falls back to raw stderr text when last line is not JSON', () => {
    const stderr = 'Traceback (most recent call last):\n  File "cli.py", line 1\nSyntaxError: invalid syntax';

    const message = extractErrorMessage(stderr);

    assert.equal(message, stderr.trim());
  });

  test('returns null for empty stderr', () => {
    assert.equal(extractErrorMessage(''), null);
    assert.equal(extractErrorMessage('   \n  '), null);
  });

  test('handles single-line structured error with no preceding log lines', () => {
    const stderr = '{"error": "Unable to read file: /locked/file.py"}';

    const message = extractErrorMessage(stderr);

    assert.equal(message, 'Unable to read file: /locked/file.py');
  });
});
