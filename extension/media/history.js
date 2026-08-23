(function () {
  const vscode = acquireVsCodeApi();
  const entries = window.__SENTRICODEX_HISTORY__;

  let sortColumn = 'timestamp';
  let sortDirection = 'desc';
  const selectedIds = new Set();

  init();

  function init() {
    renderTable();

    document.getElementById('clearHistoryButton').addEventListener('click', () => {
      vscode.postMessage({ command: 'clearHistory' });
    });

    document.getElementById('compareSelectedButton').addEventListener('click', () => {
      const ids = Array.from(selectedIds);
      if (ids.length === 2) {
        vscode.postMessage({ command: 'compareReports', entryIds: [ids[0], ids[1]] });
      }
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

    // Close any open row menu when clicking elsewhere in the page.
    document.addEventListener('click', (event) => {
      document.querySelectorAll('.row-menu-dropdown').forEach((dropdown) => {
        if (!dropdown.parentElement.contains(event.target)) {
          dropdown.hidden = true;
        }
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
        const checked = selectedIds.has(entry.id) ? 'checked' : '';
        return (
          '<tr data-id="' + entry.id + '">' +
          '<td><input type="checkbox" class="row-checkbox" data-id="' + entry.id + '" ' + checked + ' /></td>' +
          '<td>' + new Date(entry.timestamp).toLocaleString() + '</td>' +
          '<td>' + escapeHtml(shortenPath(entry.target)) + '</td>' +
          '<td>' + entry.filesScanned + '</td>' +
          '<td>' + entry.findingsCount + '</td>' +
          '<td class="' + scoreClass + '">' + entry.securityScore + '</td>' +
          '<td>' + entry.durationMs + 'ms</td>' +
          '<td>' + buildRowMenu(entry.id) + '</td>' +
          '</tr>'
        );
      })
      .join('');

    attachRowHandlers();
    updateSelectedRowStyles();
    updateCompareButtonState();
  }

  function buildRowMenu(entryId) {
    return (
      '<div class="row-menu-wrapper">' +
      '<button class="row-menu-trigger" data-id="' + entryId + '" aria-label="Row actions">&#8942;</button>' +
      '<div class="row-menu-dropdown" hidden>' +
      '<button class="row-menu-item" data-action="viewReport" data-id="' + entryId + '">View Report</button>' +
      '<button class="row-menu-item" data-action="downloadReport" data-id="' + entryId + '">Download Report</button>' +
      '</div>' +
      '</div>'
    );
  }

  function attachRowHandlers() {
    document.querySelectorAll('.row-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        const id = event.target.getAttribute('data-id');
        if (event.target.checked) {
          if (selectedIds.size >= 2) {
            // Cap selection at 2 - uncheck the oldest selection to make
            // room, so the checkbox the user just clicked stays checked.
            const [firstSelected] = selectedIds;
            selectedIds.delete(firstSelected);
          }
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }
        renderTable();
      });
    });

    document.querySelectorAll('.row-menu-trigger').forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const dropdown = trigger.nextElementSibling;
        const wasHidden = dropdown.hidden;
        document.querySelectorAll('.row-menu-dropdown').forEach((d) => (d.hidden = true));
        dropdown.hidden = !wasHidden;
      });
    });

    document.querySelectorAll('.row-menu-item').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        const action = item.getAttribute('data-action');
        const id = item.getAttribute('data-id');
        vscode.postMessage({ command: action, entryId: id });
        item.closest('.row-menu-dropdown').hidden = true;
      });
    });
  }

  function updateSelectedRowStyles() {
    document.querySelectorAll('.history-table tbody tr').forEach((row) => {
      const id = row.getAttribute('data-id');
      row.classList.toggle('row-selected', selectedIds.has(id));
    });
  }

  function updateCompareButtonState() {
    const button = document.getElementById('compareSelectedButton');
    button.disabled = selectedIds.size !== 2;
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
