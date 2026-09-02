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
    console.log(
  'BEFORE FINDINGS:',
  beforeFindings
);

console.log(
  'AFTER FINDINGS:',
  afterFindings
);

console.log(
  'AFTER SUPPRESSED:',
  afterSuppressed
);

    const beforeFingerprintSet =
      new Set(
        beforeFindings.map(function (f) {
          return f.fingerprint;
        })
      );


    const afterFingerprintSet =
      new Set(
        afterFindings.map(function (f) {
          return f.fingerprint;
        })
      );


    const afterSuppressedFingerprintSet =
      new Set(
        afterSuppressed.map(function (f) {
          return f.fingerprint;
        })
      );


    const afterSuppressedKeySet =
      new Set(
        afterSuppressed.map(function (f) {
          return getKey(f);
        })
      );


    // NEW
    const newFindings =
      afterFindings.filter(function (finding) {

        if (
          beforeFingerprintSet.has(
            finding.fingerprint
          )
        ) {
          return false;
        }

        const key = getKey(finding);

        return !beforeFindings.some(function (oldFinding) {
          return getKey(oldFinding) === key;
        });
      });


    // SUPPRESSED
    const suppressedFindings =
  beforeFindings.filter(function (oldFinding) {

    // 1. Exact fingerprint match
    if (
      afterSuppressedFingerprintSet.has(
        oldFinding.fingerprint
      )
    ) {
      return true;
    }

    // 2. Rule + file fallback match
    const oldKey = getKey(oldFinding);

    return afterSuppressed.some(function (suppressedFinding) {

      return getKey(suppressedFinding) === oldKey;

    });
  });


    // RESOLVED
    const resolvedFindings =
  beforeFindings.filter(function (oldFinding) {

    // Still active in the new scan
    if (
      afterFindings.some(function (newFinding) {

        return (
          newFinding.fingerprint ===
          oldFinding.fingerprint
        );
      })
    ) {
      return false;
    }


    // Suppressed in the new scan
    if (
      afterSuppressed.some(function (suppressedFinding) {

        return (
          suppressedFinding.fingerprint ===
          oldFinding.fingerprint
        );

      })
    ) {
      return false;
    }


    // Suppressed with changed line/fingerprint
    if (
      afterSuppressed.some(function (suppressedFinding) {

        return (
          getKey(suppressedFinding) ===
          getKey(oldFinding)
        );

      })
    ) {
      return false;
    }


    // Only now is it truly resolved
    return true;
  });


    // UNCHANGED
    const unchangedFindings =
      afterFindings.filter(function (newFinding) {

        return beforeFindings.some(function (oldFinding) {

          if (
            oldFinding.fingerprint ===
            newFinding.fingerprint
          ) {
            return true;
          }

          return (
            getKey(oldFinding) ===
            getKey(newFinding)
          );
        });
      });


    // SUPPRESSED FILES
    const suppressedFiles =
      new Set(
        suppressedFindings.map(function (finding) {
          return finding.file;
        })
      );


    setText(
      'newCount',
      newFindings.length
    );

    setText(
      'resolvedCount',
      resolvedFindings.length
    );

    setText(
      'unchangedCount',
      unchangedFindings.length
    );

    setText(
      'suppressedCount',
      suppressedFindings.length
    );

    setText(
      'suppressedFileCount',
      suppressedFiles.size
    );


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