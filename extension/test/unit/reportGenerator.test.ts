import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { ReportGenerator } from '../../src/reports/ReportGenerator';
import { ScanResult } from '../../src/models/scanResult';

function makeResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    schema_version: '1.0',
    scanned_at: '2026-08-01T12:00:00Z',
    target: '/home/user/project',
    files_scanned: 5,
    findings: [
      {
        rule_id: 'SCX-SECRET-001',
        title: 'Hardcoded Password',
        severity: 'critical',
        confidence: 'medium',
        category: 'secrets',
        file: '/home/user/project/app.py',
        line: 12,
        column: 5,
        description: 'A password appears to be hardcoded.',
        recommendation: 'Use an environment variable instead.',
        fingerprint: 'abc123',
      },
    ],
    summary: {
      files_scanned: 5,
      findings_count: 1,
      severity_breakdown: { critical: 1, high: 0, medium: 0, low: 0, informational: 0 },
    },
    security_score: 75,
    duration_ms: 42,
    ...overrides,
  };
}

describe('ReportGenerator.toJson', () => {
  test('produces valid, parseable JSON matching the input data', () => {
    const result = makeResult();
    const json = ReportGenerator.toJson(result);

    const parsed = JSON.parse(json);
    assert.equal(parsed.security_score, 75);
    assert.equal(parsed.findings.length, 1);
    assert.equal(parsed.findings[0].rule_id, 'SCX-SECRET-001');
  });
});

describe('ReportGenerator.toMarkdown', () => {
  test('includes the security score and target', () => {
    const md = ReportGenerator.toMarkdown(makeResult());

    assert.match(md, /Security Score:\*\* 75\/100/);
    assert.match(md, /\/home\/user\/project/);
  });

  test('includes a findings table row for each finding', () => {
    const md = ReportGenerator.toMarkdown(makeResult());

    assert.match(md, /SCX-SECRET-001/);
    assert.match(md, /A password appears to be hardcoded/);
  });

  test('shows a friendly message when there are no findings', () => {
    const clean = makeResult({
      findings: [],
      summary: {
        files_scanned: 5,
        findings_count: 0,
        severity_breakdown: { critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
      },
      security_score: 100,
    });

    const md = ReportGenerator.toMarkdown(clean);

    assert.match(md, /No findings\. Great work!/);
  });

  test('escapes pipe characters in table cells to avoid breaking the table', () => {
    const withPipe = makeResult({
      findings: [
        {
          rule_id: 'SCX-TEST-001',
          title: 'Test',
          severity: 'low',
          confidence: 'low',
          category: 'best_practices',
          file: 'app.py',
          line: 1,
          column: 0,
          description: 'Contains a | pipe character',
          recommendation: 'N/A',
          fingerprint: 'xyz',
        },
      ],
    });

    const md = ReportGenerator.toMarkdown(withPipe);

    assert.match(md, /Contains a \\\| pipe character/);
  });
});

describe('ReportGenerator.toHtml', () => {
  test('produces a complete HTML document', () => {
    const html = ReportGenerator.toHtml(makeResult());

    assert.match(html, /<!DOCTYPE html>/);
    assert.match(html, /<\/html>/);
  });

  test('includes the correct severity badge class for each finding', () => {
    const html = ReportGenerator.toHtml(makeResult());

    assert.match(html, /badge-critical/);
  });

  test('escapes HTML special characters in finding descriptions', () => {
    const malicious = makeResult({
      findings: [
        {
          rule_id: 'SCX-TEST-002',
          title: 'Test',
          severity: 'low',
          confidence: 'low',
          category: 'best_practices',
          file: 'app.py',
          line: 1,
          column: 0,
          description: '<script>alert("xss")</script>',
          recommendation: 'N/A',
          fingerprint: 'xyz',
        },
      ],
    });

    const html = ReportGenerator.toHtml(malicious);

    assert.ok(!html.includes('<script>alert("xss")</script>'));
    assert.match(html, /&lt;script&gt;/);
  });

  test('shows a friendly message when there are no findings', () => {
    const clean = makeResult({
      findings: [],
      summary: {
        files_scanned: 5,
        findings_count: 0,
        severity_breakdown: { critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
      },
    });

    const html = ReportGenerator.toHtml(clean);

    assert.match(html, /No findings\. Great work!/);
  });
});
