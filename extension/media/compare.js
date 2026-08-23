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
    const beforeFingerprints = new Set(before.findings.map((f) => f.fingerprint));
    const afterFingerprints = new Set(after.findings.map((f) => f.fingerprint));

    const newFindings = after.findings.filter((f) => !beforeFingerprints.has(f.fingerprint));
    const resolvedFindings = before.findings.filter((f) => !afterFingerprints.has(f.fingerprint));
    const unchangedCount = after.findings.filter((f) => beforeFingerprints.has(f.fingerprint)).length;

    document.getElementById('newCount').textContent = String(newFindings.length);
    document.getElementById('resolvedCount').textContent = String(resolvedFindings.length);
    document.getElementById('unchangedCount').textContent = String(unchangedCount);

    renderFindingList('newFindingsList', newFindings, 'No new findings.');
    renderFindingList('resolvedFindingsList', resolvedFindings, 'No findings were resolved.');
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
