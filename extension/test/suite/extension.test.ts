import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'sentricodex.sentricodex';

const EXPECTED_COMMANDS = [
  'sentricodex.scanCurrentFile',
  'sentricodex.scanWorkspace',
  'sentricodex.generateReport',
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
    // Close any open editors first so this test is deterministic
    // regardless of what ran before it.
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    // Should resolve cleanly (showing a warning notification internally)
    // rather than rejecting - this is the command's documented behavior
    // for the "no active editor" case. Wrapped in Promise.resolve()
    // since VS Code's Thenable isn't a real Promise.
    await assert.doesNotReject(
      Promise.resolve(vscode.commands.executeCommand('sentricodex.scanCurrentFile'))
    );
  });

  test('scanWorkspace command warns rather than throws when no folder is open', async () => {
    // In the default test environment, no workspace folder is open.
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
