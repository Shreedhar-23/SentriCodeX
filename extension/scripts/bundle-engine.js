const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const EXTENSION_DIR = path.resolve(__dirname, '..');
const BUNDLED_DIR = path.join(EXTENSION_DIR, 'bundled');

const EXCLUDED_NAMES = new Set(['__pycache__', '.pytest_cache', '.mypy_cache', '.git']);

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
    throw new Error(`Cannot bundle "${sourceName}": expected to find it at ${source}.`);
  }

  fs.cpSync(source, destination, { recursive: true, filter: shouldCopy });
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
