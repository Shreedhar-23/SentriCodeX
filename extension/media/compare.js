(function () {

  const data = window.__SENTRICODEX_COMPARE_DATA__;

  if (!data || !data.before || !data.after) {
    console.error('SentriCodeX Compare: comparison data is missing.');
    return;
  }

  const before = data.before;
  const after = data.after;

  const SEVERITY_ORDER = [
    'critical',
    'high',
    'medium',
    'low',
    'informational'
  ];

  const beforeFindings = before.findings || [];
  const afterFindings = after.findings || [];

  const beforeSuppressed = before.suppressed_findings || [];
  const afterSuppressed = after.suppressed_findings || [];


  function init() {
    renderScoreComparison();
    renderSeverityTable();
    renderDiff();
  }


  function renderScoreComparison() {

    const container =
      document.getElementById('scoreComparison');

    if (!container) {
      return;
    }

    const beforeScore =
      before.security_score || 0;

    const afterScore =
      after.security_score || 0;

    const delta =
      afterScore - beforeScore;

    let deltaClass = 'delta-flat';
    let deltaText = 'No change';

    if (delta > 0) {
      deltaClass = 'delta-up';
      deltaText = '+' + delta;
    }

    if (delta < 0) {
      deltaClass = 'delta-down';
      deltaText = String(delta);
    }

    container.innerHTML =
      '<div class="score-block">' +
        '<div class="value">' +
          beforeScore +
        '</div>' +
        '<div class="label">' +
          formatDate(before.scanned_at) +
        '</div>' +
      '</div>' +

      '<div class="score-arrow">&rarr;</div>' +

      '<div class="score-block">' +
        '<div class="value">' +
          afterScore +
        '</div>' +
        '<div class="label">' +
          formatDate(after.scanned_at) +
        '</div>' +
      '</div>' +

      '<div class="score-delta ' +
        deltaClass +
      '">' +
        deltaText +
      '</div>';
  }


  function renderSeverityTable() {

    const table =
      document.getElementById('severityTable');

    if (!table) {
      return;
    }

    const beforeBreakdown =
      before.summary &&
      before.summary.severity_breakdown
        ? before.summary.severity_breakdown
        : {};

    const afterBreakdown =
      after.summary &&
      after.summary.severity_breakdown
        ? after.summary.severity_breakdown
        : {};

    let rows =
      '<tr>' +
        '<th>Severity</th>' +
        '<th>Before</th>' +
        '<th>After</th>' +
        '<th>Change</th>' +
      '</tr>';

    SEVERITY_ORDER.forEach(function (severity) {

      const beforeCount =
        beforeBreakdown[severity] || 0;

      const afterCount =
        afterBreakdown[severity] || 0;

      const change =
        afterCount - beforeCount;

      const changeText =
        change === 0
          ? '—'
          : (change > 0 ? '+' : '') + change;

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


  function getKey(finding) {

  if (!finding) {
    return '';
  }

  const ruleId =
    String(finding.rule_id || '').toLowerCase().trim();

  const file =
    String(finding.file || '').toLowerCase().trim();

  /*
   * Do NOT use line or column here.
   *
   * A suppression comment can move the finding
   * to another line.
   */

  return ruleId + '|' + file;
}


function renderDiff() {
    const beforeActive = before.findings || [];
    const afterActive = after.findings || [];

    const beforeSuppressed = before.suppressed_findings || [];
    const afterSuppressed = after.suppressed_findings || [];

    console.log('BEFORE ACTIVE:', beforeActive);
    console.log('BEFORE SUPPRESSED:', beforeSuppressed);
    console.log('AFTER ACTIVE:', afterActive);
    console.log('AFTER SUPPRESSED:', afterSuppressed);

    // All findings that existed in each scan, whether active or suppressed.
    const beforeAll = [...beforeActive, ...beforeSuppressed];
    const afterAll = [...afterActive, ...afterSuppressed];

    const beforeFingerprints = new Set(
        beforeAll.map((f) => f.fingerprint)
    );

    const afterFingerprints = new Set(
        afterAll.map((f) => f.fingerprint)
    );

    // New = did not exist at all in the previous scan.
    const newFindings = afterActive.filter(
        (f) => !beforeFingerprints.has(f.fingerprint)
    );

    // Resolved = existed before and does not exist at all in the new scan.
    const resolvedFindings = beforeActive.filter(
        (f) => !afterFingerprints.has(f.fingerprint)
    );

    // Suppressed = exists in the new scan's suppressed findings.
    const suppressedFindings = afterSuppressed;

    // Unchanged = active finding exists in both scans.
    const unchangedFindings = afterActive.filter(
        (f) => beforeFingerprints.has(f.fingerprint)
    );

    document.getElementById('newCount').textContent =
        String(newFindings.length);

    document.getElementById('resolvedCount').textContent =
        String(resolvedFindings.length);

    document.getElementById('suppressedCount').textContent =
        String(suppressedFindings.length);

    document.getElementById('unchangedCount').textContent =
        String(unchangedFindings.length);

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


  function setText(id, value) {

    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        String(value);
    }
  }


  function renderFindingList(
    elementId,
    findings,
    emptyMessage
  ) {

    const list =
      document.getElementById(elementId);

    if (!list) {
      return;
    }

    if (!findings.length) {

      list.innerHTML =
        '<li class="empty-list-message">' +
        emptyMessage +
        '</li>';

      return;
    }

    list.innerHTML =
      findings
        .map(function (finding) {

          return (
            '<li class="finding-diff-item">' +

              '<span class="severity-badge severity-' +
                escapeHtml(finding.severity) +
              '">' +

                escapeHtml(
                  finding.severity
                ) +

              '</span>' +

              '<div class="details">' +

                '<div class="title">' +
                  escapeHtml(
                    finding.title ||
                    finding.description ||
                    'Finding'
                  ) +
                  ' (' +
                  escapeHtml(
                    finding.rule_id
                  ) +
                  ')' +
                '</div>' +

                '<div class="location">' +
                  escapeHtml(
                    shortenPath(
                      finding.file
                    )
                  ) +
                  ':' +
                  escapeHtml(
                    finding.line
                  ) +
                '</div>' +

              '</div>' +

            '</li>'
          );
        })
        .join('');
  }


  function formatDate(value) {

    if (!value) {
      return '';
    }

    return new Date(value)
      .toLocaleString();
  }


  function shortenPath(filePath) {

    const value =
      String(filePath || '');

    const parts =
      value.split(/[\\/]/);

    if (parts.length > 2) {
      return '...' +
        parts.slice(-2).join('/');
    }

    return value;
  }


  function escapeHtml(value) {

    const div =
      document.createElement('div');

    div.textContent =
      String(value || '');

    return div.innerHTML;
  }


  // Start the comparison.
  init();

})();