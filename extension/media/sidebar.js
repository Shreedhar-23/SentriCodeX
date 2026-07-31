// This script runs inside the sandboxed webview context. It has no
// access to the file system or VS Code APIs directly — its only job is
// to forward button clicks to the extension host via postMessage.
(function () {
  const vscode = acquireVsCodeApi();

  const buttonToCommand = {
    scanCurrentFile: 'sentricodex.scanCurrentFile',
    scanWorkspace: 'sentricodex.scanWorkspace',
    generateReport: 'sentricodex.generateReport',
    viewHistory: 'sentricodex.viewHistory',
    openSettings: 'sentricodex.openSettings',
  };

  Object.entries(buttonToCommand).forEach(([elementId, commandId]) => {
    const button = document.getElementById(elementId);
    if (button) {
      button.addEventListener('click', () => {
        vscode.postMessage({ command: commandId });
      });
    }
  });
})();
