(function () {
  const vscode = acquireVsCodeApi();

  const buttonToCommand = {
    scanCurrentFile: 'sentricodex.scanCurrentFile',
    scanWorkspace: 'sentricodex.scanWorkspace',
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
