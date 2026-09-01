(function () {
  const data = window.__SENTRICODEX_DATA__;
  const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'informational'];
  let sortColumn = 'severity';
  let sortDirection = 'asc';

  init();

  function init() {
    applyScoreColor();
    renderSeverityCards();
    renderBarChart();
    renderRecommendations();
    renderTable();
    renderSuppressedFindings();

    document.getElementById('searchInput').addEventListener('input', renderTable);
    document.getElementById('severityFilter').addEventListener('change', renderTable);
    document.getElementById('activeCount').textContent = '(' + data.findings.length + ')';
    document.getElementById('suppressedCount').textContent = '(' + (data.suppressed_findings || []).length + ')';
    document.querySelectorAll('.findings-table th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const column = th.getAttribute('data-sort');
        if (sortColumn === column) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortColumn = column;
          sortDirection = 'asc';
        }
        renderTable();
      });
    });
  }

  function applyScoreColor() {
    const ring = document.querySelector('.score-ring');
    const score = data.security_score;
    let statusClass = 'score-good';
    if (score < 50) {
      statusClass = 'score-poor';
    } else if (score < 80) {
      statusClass = 'score-medium';
    }
    ring.classList.add(statusClass);
  }

  function renderSeverityCards() {
    const container = document.getElementById('severityCards');
    const breakdown = data.summary.severity_breakdown;
    container.innerHTML = SEVERITY_ORDER.map((severity) => {
      const count = breakdown[severity] || 0;
      return (
        '<div class="severity-card severity-' + severity + '">' +
        '<div class="count">' + count + '</div>' +
        '<div class="label">' + severity + '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderBarChart() {
    const container = document.getElementById('barChart');
    const breakdown = data.summary.severity_breakdown;
    const maxCount = Math.max(1, ...Object.values(breakdown));

    container.innerHTML = SEVERITY_ORDER.map((severity) => {
      const count = breakdown[severity] || 0;
      return (
        '<div class="bar-row">' +
        '<span class="bar-label">' + severity + '</span>' +
        '<div class="bar-track"><div class="bar-fill severity-' + severity +
        '" data-severity="' + severity + '"></div></div>' +
        '<span class="bar-count">' + count + '</span>' +
        '</div>'
      );
    }).join('');

    container.querySelectorAll('.bar-fill').forEach((el) => {
      const severity = el.getAttribute('data-severity');
      const count = breakdown[severity] || 0;
      const widthPercent = Math.round((count / maxCount) * 100);
      el.style.width = widthPercent + '%';
    });
  }

  function renderRecommendations() {
    const list = document.getElementById('recommendationsList');
    const counts = new Map();

    data.findings.forEach((finding) => {
      counts.set(finding.recommendation, (counts.get(finding.recommendation) || 0) + 1);
    });

    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    if (top.length === 0) {
      list.innerHTML = '<li>No findings — nothing to recommend right now.</li>';
      return;
    }

    list.innerHTML = top
      .map(([recommendation, count]) => '<li>' + escapeHtml(recommendation) + ' (' + count + ' occurrence' + (count > 1 ? 's' : '') + ')</li>')
      .join('');
  }

  function renderTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const severityFilter = document.getElementById('severityFilter').value;

    let filtered = data.findings.filter((finding) => {
      const matchesSeverity = !severityFilter || finding.severity === severityFilter;
      const matchesSearch =
        !searchTerm ||
        finding.title.toLowerCase().includes(searchTerm) ||
        finding.rule_id.toLowerCase().includes(searchTerm) ||
        finding.file.toLowerCase().includes(searchTerm) ||
        finding.description.toLowerCase().includes(searchTerm);
      return matchesSeverity && matchesSearch;
    });

    filtered = sortFindings(filtered, sortColumn, sortDirection);

    const tbody = document.getElementById('findingsTableBody');
    const emptyState = document.getElementById('emptyState');

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    tbody.innerHTML = filtered
      .map((finding) => {
        return (
          '<tr>' +
          '<td><span class="severity-badge severity-' + finding.severity + '">' +
          finding.severity + '</span></td>' +
          '<td>' + escapeHtml(finding.rule_id) + '</td>' +
          '<td>' + escapeHtml(shortenPath(finding.file)) + '</td>' +
          '<td>' + finding.line + '</td>' +
          '<td>' + escapeHtml(finding.description) + '</td>' +
          '<td>' + escapeHtml(finding.recommendation) + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderSuppressedFindings() {
    const findings = data.suppressed_findings || [];
    const tbody = document.getElementById('suppressedTableBody');
    const empty = document.getElementById('suppressedEmptyState');
    if (findings.length === 0) { tbody.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;
    tbody.innerHTML = findings.map((finding) => '<tr class="suppressed-row">' +
      '<td><span class="severity-badge severity-' + finding.severity + '">' + finding.severity + '</span></td>' +
      '<td>' + escapeHtml(finding.rule_id) + '</td>' +
      '<td>' + escapeHtml(shortenPath(finding.file)) + '</td>' +
      '<td>' + finding.line + '</td>' +
      '<td>' + escapeHtml(finding.description) + '</td>' +
      '<td><code>' + escapeHtml(finding.suppression_comment) + '</code><br><small>' + escapeHtml(finding.suppression_type) + ' suppression</small></td>' +
      '</tr>').join('');
  }

  function sortFindings(findings, column, direction) {
    const severityRank = Object.fromEntries(SEVERITY_ORDER.map((s, i) => [s, i]));
    const sorted = [...findings].sort((a, b) => {
      let result = 0;
      if (column === 'severity') {
        result = severityRank[a.severity] - severityRank[b.severity];
      } else if (column === 'line') {
        result = a.line - b.line;
      } else {
        result = String(a[column]).localeCompare(String(b[column]));
      }
      return direction === 'asc' ? result : -result;
    });
    return sorted;
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
