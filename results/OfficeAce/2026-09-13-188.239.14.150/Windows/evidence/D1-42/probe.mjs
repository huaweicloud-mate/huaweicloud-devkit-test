// AI生成
// D1-42 (P1): concurrent install safety
// Checks: files field, install scripts race conditions, dependency tree
import { existsSync, readFileSync } from 'node:fs';

const pkgRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const results = {};

const pkg = JSON.parse(readFileSync(`${pkgRoot}\\package.json`, 'utf8'));

// 1. "files" field present - prevents arbitrary file access during install
results.hasFilesField = !!pkg.files;
results.filesField = pkg.files;

// 2. Check install scripts for race conditions
results.scripts = {
  preinstall: pkg.scripts?.preinstall || null,
  postinstall: pkg.scripts?.postinstall || null,
  prepublish: pkg.scripts?.prepublish || null,
  prepublishOnly: pkg.scripts?.prepublishOnly || null,
};

// 3. Check postinstall for race-prone patterns
const postinstallPath = `${pkgRoot}\\bin\\dsh-postinstall.cjs`;
try {
  const src = readFileSync(postinstallPath, 'utf8');
  results.postinstallAnalysis = {
    hasFileSync: src.includes('writeFileSync') || src.includes('appendFileSync'),
    hasMkdirSync: src.includes('mkdirSync'),
    hasLockFile: src.includes('lock') || src.includes('O_EXCL'),
    hasAtomicWrite: src.includes('rename') || src.includes('tmp'),
    // Check if it uses existsSync before write (common race pattern)
    hasCheckBeforeWrite: src.includes('existsSync'),
    // Check if it handles EEXIST errors
    handlesEEXIST: src.includes('EEXIST') || src.includes('recursive'),
    lineCount: src.split('\n').length,
  };
} catch (e) {
  results.postinstallAnalysis = { error: e.message };
}

// 4. Dependencies
results.dependencies = pkg.dependencies;
results.devDependencies = Object.keys(pkg.devDependencies || {});
results.hasOverrides = !!pkg.overrides;

// 5. Check for single dependency (undici) - fewer deps = fewer race conditions
results.runtimeDepCount = Object.keys(pkg.dependencies || {}).length;

// 6. Check engines field
results.engines = pkg.engines;

// 7. Check type=module (ESM) - ESM is single-threaded, no require() race
results.packageType = pkg.type;

// 8. Check if postinstall is idempotent (can run multiple times safely)
try {
  const src = readFileSync(postinstallPath, 'utf8');
  results.idempotent = {
    // If it creates a file with existsSync check, it's likely idempotent
    hasExistsSyncCheck: src.includes('existsSync'),
    // If it uses recursive mkdir, it's idempotent
    usesRecursiveMkdir: src.includes('recursive'),
    // If it wraps in try/catch, errors are handled
    hasTryCatch: src.includes('try') && src.includes('catch'),
  };
} catch (e) {
  results.idempotent = { error: e.message };
}

console.log(JSON.stringify(results, null, 2));
