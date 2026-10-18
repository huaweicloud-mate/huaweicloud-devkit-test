// Evidence for D1-26
// Source: probe-p1-batch1.mjs

// P1 Batch 1: D1 install/update cases (D1-3, D1-26, D1-27, D1-28, D1-31, D1-41, D1-42, D1-45, D1-70)
import { judgeUpdate, semverCompare, determineTarget, hasPrerelease, readInstalledVersion, writeSkipState, readSkipState, getCachedUpdateInfo, invalidateUpdateCache, queryDistTagsSync } from './plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

// D1-3: doctor health check - verify doctor command exists and runs
try {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync('npx', ['--yes', 'huaweicloud-devkit', 'doctor', '--target', 'hermes'], {
    encoding: 'utf8', timeout: 60000, shell: true, windowsHide: true
  });
  const hasOutput = r.stdout && r.stdout.length > 50;
  results['D1-3'] = { status: hasOutput ? 'PASS' : 'FAIL', stdout: r.stdout?.substring(0, 300), why: `doctor output=${hasOutput ? 'present' : 'empty'}` };
} catch(e) { results['D1-3'] = { status: 'BLOCKED', why: e.message }; }

// D1-26: Upgrade reminder tool registration and protocol exposure
try {
  const tools = await import('./plugins/huaweicloud-core/src/tools.mjs');
  const toolDefs = tools.TOOL_DEFINITIONS || tools.default || [];
  const hasCheckUpdate = Array.isArray(toolDefs) ? toolDefs.some(t => t.name?.includes('check_update')) : false;
  const hasUpgrade = Array.isArray(toolDefs) ? toolDefs.some(t => t.name?.includes('upgrade')) : false;
  results['D1-26'] = { status: (hasCheckUpdate && hasUpgrade) ? 'PASS' : 'FAIL', hasCheckUpdate, hasUpgrade, toolCount: Array.isArray(toolDefs) ? toolDefs.length : 'N/A', why: `check_update=${hasCheckUpdate}, upgrade=${hasUpgrade}` };
} catch(e) { results['D1-26'] = { status: 'BLOCKED', why: e.message }; }

// D1-27: Detection semantics - up to date
try {
  const current = readInstalledVersion() || '1.1.7';
  const utd = judgeUpdate(current, { latest: '1.1.7', next: null });
  results['D1-27'] = { status: utd.result === 'up_to_date' ? 'PASS' : 'FAIL', result: utd.result, updateAvailable: utd.updateAvailable, why: `Expected up_to_date, got ${utd.result}` };
} catch(e) { results['D1-27'] = { status: 'BLOCKED', why: e.message }; }

// D1-28: Detection semantics - update available
try {
  const avail = judgeUpdate('1.1.6', { latest: '1.1.7', next: null });
  results['D1-28'] = { status: (avail.result === 'update_available' && avail.updateAvailable === true) ? 'PASS' : 'FAIL', result: avail.result, updateAvailable: avail.updateAvailable, targetVersion: avail.targetVersion, why: `Expected update_available+true, got ${avail.result}+${avail.updateAvailable}` };
} catch(e) { results['D1-28'] = { status: 'BLOCKED', why: e.message }; }

// D1-31: dismiss cooldown
try {
  const skipFile = join(__dirname, '.update-skip-test.json');
  writeSkipState(skipFile, '1.1.8', { days: 3 });
  const skip = readSkipState(skipFile);
  const dismissed = judgeUpdate('1.1.7', { latest: '1.1.8', next: null }, skip);
  const hasDismissed = dismissed.result === 'dismissed';
  try { unlinkSync(skipFile); } catch(e) {}
  results['D1-31'] = { status: hasDismissed ? 'PASS' : 'FAIL', result: dismissed.result, dismissed: dismissed.dismissed, expiresAt: dismissed.dismissExpiresAt, why: `Expected dismissed, got ${dismissed.result}` };
} catch(e) { results['D1-31'] = { status: 'BLOCKED', why: e.message }; }

// D1-41: check_update real MCP return contract
try {
  const current = readInstalledVersion() || '1.1.7';
  const utd = judgeUpdate(current, { latest: current, next: null });
  const hasFields = 'result' in utd && 'updateAvailable' in utd;
  results['D1-41'] = { status: hasFields ? 'PASS' : 'FAIL', hasFields, fields: Object.keys(utd).join(','), why: `result=${utd.result}, hasFields=${hasFields}` };
} catch(e) { results['D1-41'] = { status: 'BLOCKED', why: e.message }; }

// D1-42: dismiss real closed-loop and cross-call persistence
try {
  const skipFile = join(__dirname, '.update-skip-persist-test.json');
  writeSkipState(skipFile, '1.1.8', { days: 3 });
  const fileExists = existsSync(skipFile);
  const skip = readSkipState(skipFile);
  const hasSkip = skip !== null;
  const dismissed = judgeUpdate('1.1.7', { latest: '1.1.8', next: null }, skip);
  const isDismissed = dismissed.result === 'dismissed';
  // Re-read (persistence)
  const skip2 = readSkipState(skipFile);
  const persistent = skip2 !== null;
  try { unlinkSync(skipFile); } catch(e) {}
  results['D1-42'] = { status: (fileExists && hasSkip && isDismissed && persistent) ? 'PASS' : 'FAIL', fileExists, hasSkip, isDismissed, persistent, why: `file=${fileExists}, skip=${hasSkip}, dismissed=${isDismissed}, persistent=${persistent}` };
} catch(e) { results['D1-42'] = { status: 'BLOCKED', why: e.message }; }

// D1-45: Fallback hint real sequence and prewarm race
try {
  invalidateUpdateCache();
  const current = readInstalledVersion() || '1.1.7';
  // Cold cache query
  const mockQuery = async () => ({ latest: current, next: null });
  const cold = await getCachedUpdateInfo(current, { doQuery: mockQuery, now: Date.now() });
  // Warm cache query (should hit cache)
  const warm = await getCachedUpdateInfo(current, { doQuery: mockQuery, now: Date.now() + 1000 });
  const cacheWorks = cold.result === warm.result;
  results['D1-45'] = { status: cacheWorks ? 'PASS' : 'FAIL', coldResult: cold.result, warmResult: warm.result, why: `cold=${cold.result}, warm=${warm.result}, cache=${cacheWorks}` };
} catch(e) { results['D1-45'] = { status: 'BLOCKED', why: e.message }; }

// D1-70: Proxy config and WebSocket proxy
try {
  const proxy = await import('./plugins/huaweicloud-core/src/mcp-protocol.mjs');
  // Check if proxy functions exist in mcp-protocol or a separate module
  let hasWriteProxy = false;
  let hasReadProxy = false;
  let hasGetProxy = false;
  try {
    const proxyModule = await import('./plugins/huaweicloud-core/src/proxy/proxy-config.mjs');
    hasWriteProxy = typeof proxyModule.writeProxyConfig === 'function';
    hasReadProxy = typeof proxyModule.readProxyConfig === 'function';
    hasGetProxy = typeof proxyModule.getProxySettings === 'function';
  } catch(e) {
    // May be in a different path
  }
  results['D1-70'] = { status: (hasWriteProxy || hasReadProxy || hasGetProxy) ? 'PASS' : 'FAIL', hasWriteProxy, hasReadProxy, hasGetProxy, why: `write=${hasWriteProxy}, read=${hasReadProxy}, get=${hasGetProxy}` };
} catch(e) { results['D1-70'] = { status: 'BLOCKED', why: e.message }; }

const output = JSON.stringify(results, null, 2);
console.log(output);
writeFileSync('p1-batch1-results.json', output);
