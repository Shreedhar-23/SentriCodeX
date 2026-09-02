(function () {
  const data = window.__SENTRICODEX_COMPARE_DATA__;
  const before = data.before;
  const after = data.after;

  const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'informational'];

  init();

  function init() {
    renderScoreComparison();
    renderSeverityTable();
    renderDiff();
  }

  function renderScoreComparison() {
    const container = document.getElementById('scoreComparison');
    const delta = after.security_score - before.security_score;

    let deltaClass = 'delta-flat';
    let deltaText = 'No change';
    if (delta > 0) {
      deltaClass = 'delta-up';
      deltaText = '+' + delta;
    } else if (delta < 0) {
      deltaClass = 'delta-down';
      deltaText = String(delta);
    }

    container.innerHTML =
      '<div class="score-block">' +
      '<div class="value">' + before.security_score + '</div>' +
      '<div class="label">' + formatDate(before.scanned_at) + '</div>' +
      '</div>' +
      '<div class="score-arrow">&rarr;</div>' +
      '<div class="score-block">' +
      '<div class="value">' + after.security_score + '</div>' +
      '<div class="label">' + formatDate(after.scanned_at) + '</div>' +
      '</div>' +
      '<div class="score-delta ' + deltaClass + '">' + deltaText + '</div>';
  }

  function renderSeverityTable() {
    const table = document.getElementById('severityTable');
    const beforeBreakdown = before.summary.severity_breakdown;
    const afterBreakdown = after.summary.severity_breakdown;

    let rows =
      '<tr><th>Severity</th><th>Before</th><th>After</th><th>Change</th></tr>';

    SEVERITY_ORDER.forEach((severity) => {
      const beforeCount = beforeBreakdown[severity] || 0;
      const afterCount = afterBreakdown[severity] || 0;
      const change = afterCount - beforeCount;
      const changeText = change === 0 ? '—' : (change > 0 ? '+' : '') + change;

      rows +=
        '<tr>' +
        '<td>' + severity + '</td>' +
        '<td>' + beforeCount + '</td>' +
        '<td>' + afterCount + '</td>' +
        '<td>' + changeText + '</td>' +
        '</tr>';
    });

    table.innerHTML = rows;
  }

  function renderDiff() {
    function renderDiff() {

  // Safely get findings from both scans.
  // The ?? [] also supports older scan history
  // that may not have suppressed_findings.
  const beforeFindings = before.findings ?? [];
  const afterFindings = after.findings ?? [];

  const beforeSuppressed = before.suppressed_findings ?? [];
  const afterSuppressed = after.suppressed_findings ?? [];

  // Fingerprints of active findings in the newer scan.
  const afterActiveFingerprints = new Set(
    afterFindings.map((f) => f.fingerprint)
  );

  // Fingerprints of suppressed findings in the newer scan.
  const afterSuppressedFingerprints = new Set(
    afterSuppressed.map((f) => f.fingerprint)
  );

  // Fingerprints of active findings in the older scan.
  const beforeFingerprints = new Set(
    beforeFindings.map((f) => f.fingerprint)
  );

  // -----------------------------------------
  // NEW FINDINGS
  // -----------------------------------------
  // Exists in the new active scan,
  // but did not exist in the old active scan.
  const newFindings = afterFindings.filter(
    (f) => !beforeFingerprints.has(f.fingerprint)
  );

  // -----------------------------------------
  // SUPPRESSED FINDINGS
  // -----------------------------------------
  // Was active in the old scan,
  // but is suppressed in the new scan.
  const suppressedFindings = beforeFindings.filter(
    (f) => afterSuppressedFingerprints.has(f.fingerprint)
  );

  // -----------------------------------------
  // RESOLVED FINDINGS
  // -----------------------------------------
  // Was active before and is NOT present
  // in either active OR suppressed findings
  // in the new scan.

  const suppressedFileCount = new Set(
  afterSuppressed.map((f) => f.file)
).size;
  const resolvedFindings = beforeFindings.filter(
    (f) =>
      !afterActiveFingerprints.has(f.fingerprint) &&
      !afterSuppressedFingerprints.has(f.fingerprint)
  );

  // -----------------------------------------
  // UNCHANGED FINDINGS
  // -----------------------------------------
  // Exists as an active finding in both scans.
  const unchangedFindings = afterFindings.filter(
    (f) => beforeFingerprints.has(f.fingerprint)
  );

  // -----------------------------------------
  // UPDATE COUNTS
  // -----------------------------------------

  document.getElementById('newCount').textContent =
    String(newFindings.length);

  document.getElementById('resolvedCount').textContent =
    String(resolvedFindings.length);

  document.getElementById('unchangedCount').textContent =
    String(unchangedFindings.length);

  const suppressedCount =
    document.getElementById('suppressedCount');

  if (suppressedCount) {
    suppressedCount.textContent =
      String(suppressedFindings.length);
  const suppressedFileCountElement =
  document.getElementById('suppressedFileCount');

if (suppressedFileCountElement) {
  suppressedFileCountElement.textContent =
    String(suppressedFileCount);
}
  }

  // -----------------------------------------
  // DISPLAY FINDINGS
  // -----------------------------------------

  renderFindingList(
    'newFindingsList',
    newFindings,
    'No new findings.'
  );

  renderFindingList(
    'resolvedFindingsList',
    resolvedFindings,
    'No findings were resolved.'
  );

  renderFindingList(
    'suppressedFindingsList',
    suppressedFindings,
    'No findings were suppressed.'
  );
}
  
  }

  // Render lists
  renderFindingList(
    'newFindingsList',
    newFindings,
    'No new findings.'
  );

  renderFindingList(
    'resolvedFindingsList',
    resolvedFindings,
    'No findings were resolved.'
  );

  renderFindingList(
    'suppressedFindingsList',
    suppressedFindings,
    'No findings were suppressed.'
  );
}

  function renderFindingList(elementId, findings, emptyMessage) {
    const list = document.getElementById(elementId);

    if (findings.length === 0) {
      list.innerHTML = '<li class="empty-list-message">' + emptyMessage + '</li>';
      return;
    }

    list.innerHTML = findings
      .map((finding) => {
        return (
          '<li class="finding-diff-item">' +
          '<span class="severity-badge severity-' + finding.severity + '">' +
          finding.severity + '</span>' +
          '<div class="details">' +
          '<div class="title">' + escapeHtml(finding.title) + ' (' + escapeHtml(finding.rule_id) + ')</div>' +
          '<div class="location">' + escapeHtml(shortenPath(finding.file)) + ':' + finding.line + '</div>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');
  }

  function formatDate(isoString) {
    return new Date(isoString).toLocaleString();
  }

  function shortenPath(filePath) {
    const parts = filePath.split(/[\\/]/);
    return parts.length > 2 ? '...' + parts.slice(-2).join('/') : filePath;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
})();
