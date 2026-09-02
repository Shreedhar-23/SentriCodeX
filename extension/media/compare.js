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
    function renderDiff() {

  // Safely support old history entries that may not
  // contain suppressed_findings.
  const beforeFindings = before.findings ?? [];
  const afterFindings = after.findings ?? [];
  const afterSuppressed = after.suppressed_findings ?? [];


  // --------------------------------------------------
  // EXACT FINGERPRINTS
  // --------------------------------------------------

  const beforeFingerprints = new Set(
    beforeFindings.map((f) => f.fingerprint)
  );

  const afterFingerprints = new Set(
    afterFindings.map((f) => f.fingerprint)
  );

  const afterSuppressedFingerprints = new Set(
    afterSuppressed.map((f) => f.fingerprint)
  );


  // --------------------------------------------------
  // STABLE IDENTITY
  // --------------------------------------------------
  //
  // Fingerprints contain line/column.
  // Adding a suppression comment above a finding
  // can change the line number.
  //
  // Therefore we also compare:
  //
  // rule_id + file + title + description
  //
  // This lets us recognize the same finding even
  // when its line number changed.
  //

  function stableFindingKey(finding) {
    return [
      finding.rule_id,
      finding.file,
      finding.title,
      finding.description
    ]
      .map((value) => String(value ?? '').toLowerCase())
      .join('|');
  }


  // --------------------------------------------------
  // BUILD STABLE KEYS FOR NEW SUPPRESSED FINDINGS
  // --------------------------------------------------

  const suppressedStableKeys = new Set(
    afterSuppressed.map(
      (f) => stableFindingKey(f)
    )
  );


  // --------------------------------------------------
  // NEW FINDINGS
  // --------------------------------------------------
  //
  // A finding is NEW only if it is not represented
  // by an active finding from the previous scan.
  //

  const newFindings = afterFindings.filter(
    (f) => {

      if (beforeFingerprints.has(f.fingerprint)) {
        return false;
      }

      const key = stableFindingKey(f);

      return !beforeFindings.some(
        (oldFinding) =>
          stableFindingKey(oldFinding) === key
      );
    }
  );


  // --------------------------------------------------
  // SUPPRESSED FINDINGS
  // --------------------------------------------------
  //
  // IMPORTANT:
  //
  // A finding from the old scan is SUPPRESSED if
  // the same finding appears in the new scan's
  // suppressed_findings.
  //
  // We first try fingerprint matching.
  // Then we fall back to stable identity matching.
  //

  const suppressedFindings = beforeFindings.filter(
    (oldFinding) => {

      // Exact fingerprint match
      if (
        afterSuppressedFingerprints.has(
          oldFinding.fingerprint
        )
      ) {
        return true;
      }

      // Stable identity match
      const oldKey =
        stableFindingKey(oldFinding);

      return suppressedStableKeys.has(oldKey);
    }
  );


  // --------------------------------------------------
  // RESOLVED FINDINGS
  // --------------------------------------------------
  //
  // A finding is RESOLVED only when it:
  //
  // 1. Is not active in the new scan
  // AND
  // 2. Is not suppressed in the new scan
  //
  // This is the important correction.
  //

  const suppressedStableKeySet =
    new Set(
      suppressedFindings.map(
        (f) => stableFindingKey(f)
      )
    );


  const resolvedFindings =
    beforeFindings.filter(
      (oldFinding) => {

        // Still active
        if (
          afterFingerprints.has(
            oldFinding.fingerprint
          )
        ) {
          return false;
        }

        // Now suppressed
        if (
          afterSuppressedFingerprints.has(
            oldFinding.fingerprint
          )
        ) {
          return false;
        }

        // Suppressed but line number changed
        if (
          suppressedStableKeySet.has(
            stableFindingKey(oldFinding)
          )
        ) {
          return false;
        }

        // Truly gone
        return true;
      }
    );


  // --------------------------------------------------
  // UNCHANGED
  // --------------------------------------------------

  const unchangedFindings =
    afterFindings.filter(
      (newFinding) =>
        beforeFindings.some(
          (oldFinding) => {

            if (
              oldFinding.fingerprint ===
              newFinding.fingerprint
            ) {
              return true;
            }

            return (
              stableFindingKey(oldFinding) ===
              stableFindingKey(newFinding)
            );
          }
        )
    );


  // --------------------------------------------------
  // SUPPRESSED FILE COUNT
  // --------------------------------------------------

  const suppressedFileCount =
    new Set(
      suppressedFindings.map(
        (f) => f.file
      )
    ).size;


  // --------------------------------------------------
  // UPDATE COUNTS
  // --------------------------------------------------

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


  // --------------------------------------------------
  // RENDER LISTS
  // --------------------------------------------------

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