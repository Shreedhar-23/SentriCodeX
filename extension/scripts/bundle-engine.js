/**
 * Bundles the Python engine (engine/ and rules/, siblings of extension/
 * at the project root) into extension/bundled/, so vsce package - which
 * only sees files inside extension/ - actually includes them in the
 * packaged .vsix.
 *
 * Preserves the same sibling folder relationship
 * (bundled/engine/ next to bundled/rules/) that
 * engine/sentricodex/rule_loader.py already expects when it computes
 * the repo root as engine_dir.parent - so no Python code needs to
 * change for bundling to work.
 *
 * Uses plain Node fs.cpSync (no shell commands) for cross-platform
 * portability - this must work identically on Windows, macOS, and
 * Linux since any contributor's machine might run it.
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const EXTENSION_DIR = path.resolve(__dirname, '..');
const BUNDLED_DIR = path.join(EXTENSION_DIR, 'bundled');

// Never copy generated/cache artifacts into the package - keeps the
// VSIX small and avoids shipping stale bytecode.
const EXCLUDED_NAMES = new Set([
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.git',
]);

function shouldCopy(src) {
  const baseName = path.basename(src);
  if (EXCLUDED_NAMES.has(baseName)) {
    return false;
  }
  if (baseName.endsWith('.pyc')) {
    return false;
  }
  return true;
}

function bundleFolder(sourceName) {
  const source = path.join(PROJECT_ROOT, sourceName);
  const destination = path.join(BUNDLED_DIR, sourceName);

  if (!fs.existsSync(source)) {
    throw new Error(
      `Cannot bundle "${sourceName}": expected to find it at ${source}. ` +
        'Run this script from a full SentriCodeX repo checkout.'
    );
  }

  fs.cpSync(source, destination, {
    recursive: true,
    filter: shouldCopy,
  });

  console.log(`Bundled ${sourceName}/ -> extension/bundled/${sourceName}/`);
}

function main() {
  if (fs.existsSync(BUNDLED_DIR)) {
    fs.rmSync(BUNDLED_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(BUNDLED_DIR, { recursive: true });

  bundleFolder('engine');
  bundleFolder('rules');

  console.log('Engine bundling complete.');
}

main();
