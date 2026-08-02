import * as path from 'path';
import { runTests } from '@vscode/test-electron';

/**
 * Entry point for integration testing: downloads (and caches) a real
 * VS Code build, launches it headlessly with SentriCodeX loaded as an
 * extension under test, and runs the Mocha suite in test/suite/
 * inside that real Extension Host.
 *
 * This is the official @vscode/test-electron pattern - the same
 * approach Microsoft's own extension samples use. It genuinely
 * exercises extension activation, command registration, and webview
 * creation inside a real VS Code, which no amount of mocking fully
 * replicates.
 *
 * Requires network access to download the VS Code test binary on
 * first run, and a display (or a virtual one, e.g. xvfb on Linux CI).
 * Run via `npm run test:integration`.
 */
async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    await runTests({ extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    console.error('Failed to run integration tests:', err);
    process.exit(1);
  }
}

void main();
