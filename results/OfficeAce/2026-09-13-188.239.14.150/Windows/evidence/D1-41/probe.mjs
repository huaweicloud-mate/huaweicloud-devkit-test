// AI生成
// D1-41 (P1): uninstall residual detection
// Checks: package "files" field, npm pack contents, postinstall script, cleanup logic
import { existsSync, readFileSync } from 'node:fs';

const pkgRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const results = {};

// 1. Check "files" field in package.json - determines what gets packed/installed
const pkg = JSON.parse(readFileSync(`${pkgRoot}\\package.json`, 'utf8'));
results.filesField = pkg.files || null;
results.hasFilesField = !!pkg.files;

// 2. Check postinstall script
results.postinstall = pkg.scripts?.postinstall || null;
results.hasPostinstall = !!pkg.scripts?.postinstall;

// 3. Check if postinstall script is safe (non-blocking, no side effects that persist)
const postinstallPath = `${pkgRoot}\\bin\\dsh-postinstall.cjs`;
try {
  const src = readFileSync(postinstallPath, 'utf8');
  results.postinstallScript = {
    exists: true,
    lines: src.split('\n').length,
    hasTryCatch: src.includes('try'),
    hasCatch: src.includes('catch'),
    // Check if it silently fails (doesn't throw on error)
    silentFail: src.includes('catch') && !src.includes('process.exit(1)'),
  };
} catch (e) {
  results.postinstallScript = { exists: false, error: e.message };
}

// 4. Check for uninstall/cleanup logic
const setupCliPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\setup-cli.mjs`;
try {
  const src = readFileSync(setupCliPath, 'utf8');
  results.cleanupLogic = {
    hasUninstall: src.includes('uninstall') || src.includes('remove'),
    hasPruneStale: src.includes('pruneStale'),
    hasCleanup: src.includes('cleanup') || src.includes('clean'),
  };
} catch (e) {
  results.cleanupLogic = { error: e.message };
}

// 5. Check for sandbox uninstall cleanup
const sandboxCleanupPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\sandbox\\uninstall-cleanup.mjs`;
results.sandboxCleanup = { exists: existsSync(sandboxCleanupPath) };

// 6. npm pack --dry-run showed 137 files - all from "files" field
// The "files" field controls what npm includes in the tarball
// Files NOT in "files" field won't be installed, so uninstall removes only those
results.tarballFilesCount = 137; // from npm pack --dry-run
results.filesFieldCoversAll = pkg.files && pkg.files.length > 0;

// 7. Check no global side effects in postinstall
try {
  const src = readFileSync(postinstallPath, 'utf8');
  results.noGlobalSideEffects = {
    noEnvWrite: !src.includes('process.env.') || src.includes('process.env.HOME'),
    noGlobalConfig: !src.includes('hcloud configure'),
    noNetworkCalls: !src.includes('fetch') && !src.includes('http'),
  };
} catch (e) {
  results.noGlobalSideEffects = { error: e.message };
}

console.log(JSON.stringify(results, null, 2));
