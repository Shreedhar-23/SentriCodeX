// Note: colors are applied via CSS classes (score-good/medium/poor),
// never inline style="" strings - the webview's Content-Security-Policy
// blocks inline style attributes, a lesson learned building the
// Dashboard panel. Direct DOM property assignment or class toggling
// both remain unaffected by that policy.
(function () {
  const vscode = acquireVsCodeApi();
  const entries = window.__SENTRICODEX_HISTORY__;

  let sortColumn = 'timestamp';
  let sortDirection = 'desc';

  init();

  function init() {
    renderTable();

    document.getElementById('clearHistoryButton').addEventListener('click', () => {
      vscode.postMessage({ command: 'clearHistory' });
    });

    document.querySelectorAll('.history-table th[data-sort]').forEach((th) => {
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

  function renderTable() {
    const tbody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('emptyState');

    if (entries.length === 0) {
      tbody.innerHTML = '';
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    const sorted = sortEntries(entries, sortColumn, sortDirection);

    tbody.innerHTML = sorted
      .map((entry) => {
        const scoreClass = scoreClassFor(entry.securityScore);
        return (
          '<tr>' +
          '<td>' + new Date(entry.timestamp).toLocaleString() + '</td>' +
          '<td>' + escapeHtml(shortenPath(entry.target)) + '</td>' +
          '<td>' + entry.filesScanned + '</td>' +
          '<td>' + entry.findingsCount + '</td>' +
          '<td class="' + scoreClass + '">' + entry.securityScore + '</td>' +
          '<td>' + entry.durationMs + 'ms</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function sortEntries(list, column, direction) {
    const sorted = [...list].sort((a, b) => {
      let result;
      if (typeof a[column] === 'number') {
        result = a[column] - b[column];
      } else {
        result = String(a[column]).localeCompare(String(b[column]));
      }
      return direction === 'asc' ? result : -result;
    });
    return sorted;
  }

  function scoreClassFor(score) {
    if (score < 50) {
      return 'score-poor';
    }
    if (score < 80) {
      return 'score-medium';
    }
    return 'score-good';
  }

  function shortenPath(target) {
    const parts = target.split(/[\\/]/);
    return parts.length > 2 ? '...' + parts.slice(-2).join('/') : target;
  }

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
})();
