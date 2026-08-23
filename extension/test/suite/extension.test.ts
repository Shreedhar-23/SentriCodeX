import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'sentricodex.sentricodex';

// generateReport is intentionally absent here: it was retired in
// favor of per-scan actions (View Report / Download Report) in the
// History panel, since every scan is now recorded there automatically
// with its full findings.
const EXPECTED_COMMANDS = [
  'sentricodex.scanCurrentFile',
  'sentricodex.scanWorkspace',
  'sentricodex.viewHistory',
  'sentricodex.openSettings',
  'sentricodex.showDashboard',
];

suite('SentriCodeX Extension Integration Tests', () => {
  test('extension activates without error', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, 'Extension should be discoverable by VS Code.');

    await extension?.activate();

    assert.ok(extension?.isActive, 'Extension should report itself as active.');
  });

  test('all SentriCodeX commands are registered', async () => {
    const allCommands = await vscode.commands.getCommands(true);

    for (const commandId of EXPECTED_COMMANDS) {
      assert.ok(
        allCommands.includes(commandId),
        `Expected command "${commandId}" to be registered.`
      );
    }
  });

  test('generateReport command no longer exists', async () => {
    const allCommands = await vscode.commands.getCommands(true);
    assert.ok(
      !allCommands.includes('sentricodex.generateReport'),
      'generateReport should have been removed in favor of History per-row actions.'
    );
  });

  test('configuration properties are contributed with correct defaults', () => {
    const config = vscode.workspace.getConfiguration('sentricodex');

    assert.equal(config.get('pythonPath'), 'python');
    assert.equal(config.get('scanOnSave'), false);
    assert.equal(config.get('defaultReportFormat'), 'html');
    assert.deepEqual(config.get('excludedFolders'), [
      'node_modules',
      '.git',
      'dist',
      'out',
    ]);
  });

  test('scanCurrentFile command warns rather than throws when no editor is open', async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('sentricodex.scanCurrentFile'))
    );
  });

  test('scanWorkspace command warns rather than throws when no folder is open', async () => {
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('sentricodex.scanWorkspace'))
    );
  });

  test('showDashboard command does not throw when no scan has run', async () => {
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('sentricodex.showDashboard'))
    );
  });
});
