(function () {

  const data = window.__SENTRICODEX_COMPARE_DATA__;

  const before = data.before;
  const after = data.after;

  const SEVERITY_ORDER = [
    'critical',
    'high',
    'medium',
    'low',
    'informational'
  ];

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

      '<div class="score-delta ' + deltaClass + '">' +
        deltaText +
      '</div>';
  }

  function renderSeverityTable() {
    const table = document.getElementById('severityTable');

    const beforeBreakdown =
      before.summary?.severity_breakdown ?? {};

    const afterBreakdown =
      after.summary?.severity_breakdown ?? {};

    let rows =
      '<tr>' +
        '<th>Severity</th>' +
        '<th>Before</th>' +
        '<th>After</th>' +
        '<th>Change</th>' +
      '</tr>';

    SEVERITY_ORDER.forEach((severity) => {

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

  function renderDiff() {

    /*
     * Safely get findings from both scans.
     * The ?? [] also supports older history entries
     * that do not have suppressed_findings.
     */
    const beforeFindings =
      before.findings ?? [];

    const afterFindings =
      after.findings ?? [];

    const beforeSuppressed =
      before.suppressed_findings ?? [];

    const afterSuppressed =
      after.suppressed_findings ?? [];


    /*
     * Fingerprints of active findings
     * in the newer scan.
     */
    const afterActiveFingerprints =
      new Set(
        afterFindings.map(
          (f) => f.fingerprint
        )
      );


    /*
     * Fingerprints of suppressed findings
     * in the newer scan.
     */
    const afterSuppressedFingerprints =
      new Set(
        afterSuppressed.map(
          (f) => f.fingerprint
        )
      );


    /*
     * Fingerprints of active findings
     * in the older scan.
     */
    const beforeActiveFingerprints =
      new Set(
        beforeFindings.map(
          (f) => f.fingerprint
        )
      );


    /*
     * ------------------------------------
     * NEW FINDINGS
     * ------------------------------------
     *
     * Present in the new active scan
     * but not in the old active scan.
     */
    const newFindings =
      afterFindings.filter(
        (f) =>
          !beforeActiveFingerprints.has(
            f.fingerprint
          )
      );


    /*
     * ------------------------------------
     * SUPPRESSED FINDINGS
     * ------------------------------------
     *
     * Was active in the old scan,
     * but is suppressed in the new scan.
     */
    const suppressedFindings =
      beforeFindings.filter(
        (f) =>
          afterSuppressedFingerprints.has(
            f.fingerprint
          )
      );


    /*
     * ------------------------------------
     * RESOLVED FINDINGS
     * ------------------------------------
     *
     * Was active before and is completely
     * absent from the new scan.
     *
     * IMPORTANT:
     * If it exists in new suppressed findings,
     * it is NOT resolved.
     */
    const resolvedFindings =
      beforeFindings.filter(
        (f) =>
          !afterActiveFingerprints.has(
            f.fingerprint
          ) &&
          !afterSuppressedFingerprints.has(
            f.fingerprint
          )
      );


    /*
     * ------------------------------------
     * UNCHANGED FINDINGS
     * ------------------------------------
     *
     * Active in both scans.
     */
    const unchangedFindings =
      afterFindings.filter(
        (f) =>
          beforeActiveFingerprints.has(
            f.fingerprint
          )
      );


    /*
     * ------------------------------------
     * SUPPRESSED FILE COUNT
     * ------------------------------------
     *
     * Count unique files containing
     * suppressed findings in the new scan.
     */
    const suppressedFileCount =
      new Set(
        afterSuppressed.map(
          (f) => f.file
        )
      ).size;


    /*
     * ------------------------------------
     * UPDATE COUNTS
     * ------------------------------------
     */

    const newCount =
      document.getElementById('newCount');

    if (newCount) {
      newCount.textContent =
        String(newFindings.length);
    }


    const resolvedCount =
      document.getElementById('resolvedCount');

    if (resolvedCount) {
      resolvedCount.textContent =
        String(resolvedFindings.length);
    }


    const unchangedCount =
      document.getElementById('unchangedCount');

    if (unchangedCount) {
      unchangedCount.textContent =
        String(unchangedFindings.length);
    }


    const suppressedCount =
      document.getElementById('suppressedCount');

    if (suppressedCount) {
      suppressedCount.textContent =
        String(suppressedFindings.length);
    }


    const suppressedFileCountElement =
      document.getElementById(
        'suppressedFileCount'
      );

    if (suppressedFileCountElement) {
      suppressedFileCountElement.textContent =
        String(suppressedFileCount);
    }


    /*
     * ------------------------------------
     * RENDER FINDING LISTS
     * ------------------------------------
     */

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


  function renderFindingList(
    elementId,
    findings,
    emptyMessage
  ) {

    const list =
      document.getElementById(elementId);

    /*
     * The suppressed section was newly added.
     * If the HTML does not contain the element,
     * simply skip it instead of crashing.
     */
    if (!list) {
      return;
    }


    if (findings.length === 0) {

      list.innerHTML =
        '<li class="empty-list-message">' +
        emptyMessage +
        '</li>';

      return;
    }


    list.innerHTML =
      findings
        .map((finding) => {

          const title =
            finding.title ||
            finding.description ||
            'Security finding';


          return (
            '<li class="finding-diff-item">' +

              '<span class="severity-badge severity-' +
              escapeHtml(finding.severity) +
              '">' +
              escapeHtml(finding.severity) +
              '</span>' +

              '<div class="details">' +

                '<div class="title">' +
                escapeHtml(title) +
                ' (' +
                escapeHtml(finding.rule_id) +
                ')' +
                '</div>' +

                '<div class="location">' +
                escapeHtml(
                  shortenPath(finding.file)
                ) +
                ':' +
                escapeHtml(finding.line) +
                '</div>' +

              '</div>' +

            '</li>'
          );

        })
        .join('');
  }


  function formatDate(isoString) {
    return new Date(
      isoString
    ).toLocaleString();
  }


  function shortenPath(filePath) {

    const parts =
      String(filePath).split(/[\\/]/);

    return parts.length > 2
      ? '...' + parts.slice(-2).join('/')
      : String(filePath);
  }


  function escapeHtml(value) {

    const div =
      document.createElement('div');

    div.textContent =
      String(value ?? '');

    return div.innerHTML;
  }

})();