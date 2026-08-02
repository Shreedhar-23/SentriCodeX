import * as fs from 'fs';
import * as path from 'path';
import Mocha from 'mocha';

/**
 * Called by @vscode/test-electron inside the real, running VS Code
 * instance. Discovers every *.test.js file in this folder (compiled
 * from *.test.ts) and runs them with Mocha.
 */
export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 20000 });
  const testsRoot = path.resolve(__dirname);

  return new Promise((resolve, reject) => {
    try {
      const files = findTestFiles(testsRoot);
      files.forEach((file) => mocha.addFile(file));

      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} integration test(s) failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Manually walks testsRoot for *.test.js files, rather than relying on
 * fs.globSync (only available in newer Node than VS Code's bundled
 * Electron runtime is guaranteed to ship) or adding a new dependency
 * just for file discovery.
 */
function findTestFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      results.push(fullPath);
    }
  }
  return results;
}
