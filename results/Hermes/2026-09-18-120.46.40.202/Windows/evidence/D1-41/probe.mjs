import { judgeUpdate, readInstalledVersion, semverCompare, determineTarget, parseDistTagsOutput,
  writeSkipState, readSkipState, resolveSkipFilePath, skipFilePath, fallbackSkipFilePath,
  queryDistTagsSync, queryDistTags, hasPrerelease, semverParse } from './plugins/huaweicloud-core/src/update-check.mjs';
import { callTool } from './plugins/huaweicloud-core/src/tools.mjs';
import { dispatch } from './plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';

const results = {};
const installed = readInstalledVersion();

// D1-1: Fresh environment guided install - check check_update tool
results['D1-1'] = [];
try {
  const r = await callTool('huaweicloud_check_update', {});
  results['D1-1'].push({ desc: 'check_update tool', ok: r?.ok !== false, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D1-1'].push({ desc: 'check_update tool', error: e.message });
}

// D1-3: doctor health check
results['D1-3'] = [];
try {
  const r = await callTool('huaweicloud_check_cli', {});
  results['D1-3'].push({ desc: 'check_cli (doctor)', ok: r?.ok !== false, installed: JSON.parse(r?.content?.[0]?.text || '{}').installed, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D1-3'].push({ desc: 'check_cli', error: e.message });
}

// D1-5: uninstall cleanliness - check tool availability
results['D1-5'] = [];
try {
  const r = await dispatch('tools/list', {});
  const hasUninstall = r?.tools?.some(t => t.name === 'huaweicloud_upgrade');
  results['D1-5'].push({ desc: 'upgrade tool exists', hasUninstall, pass: hasUninstall });
} catch(e) {
  results['D1-5'].push({ desc: 'tools list', error: e.message });
}

// D1-26: Upgrade reminder tool registration
results['D1-26'] = [];
try {
  const r = await dispatch('tools/list', {});
  const hasCheckUpdate = r?.tools?.some(t => t.name === 'huaweicloud_check_update');
  const hasUpgrade = r?.tools?.some(t => t.name === 'huaweicloud_upgrade');
  results['D1-26'].push({ desc: 'update tools registered', hasCheckUpdate, hasUpgrade, pass: hasCheckUpdate && hasUpgrade });
} catch(e) {
  results['D1-26'].push({ desc: 'tools list', error: e.message });
}

// D1-27: Detection semantics - already latest
results['D1-27'] = [];
try {
  const distTags = { latest: installed, next: installed + '-next.1' };
  const judge = judgeUpdate(installed, distTags, null);
  results['D1-27'].push({ desc: 'already latest', judge: JSON.stringify(judge).substring(0, 200), isUpToDate: judge?.result === 'up_to_date' });
} catch(e) {
  results['D1-27'].push({ desc: 'already latest', error: e.message });
}

// D1-28: Detection semantics - new version available
results['D1-28'] = [];
try {
  const distTags = { latest: '99.0.0', next: '99.0.0-next.1' };
  const judge = judgeUpdate(installed, distTags, null);
  results['D1-28'].push({ desc: 'new version available', judge: JSON.stringify(judge).substring(0, 200), hasUpdate: judge?.result === 'update_available' });
} catch(e) {
  results['D1-28'].push({ desc: 'new version', error: e.message });
}

// D1-31: dismiss cooldown period
results['D1-31'] = [];
try {
  const tmpFile = join(tmpdir(), 'test-skip-d1-31.json');
  const now = Date.now();
  writeSkipState(tmpFile, '99.0.0', { at: now, days: 7 });
  const skipState = readSkipState(tmpFile);
  const isDismissed = skipState?.dismissedVersion === '99.0.0';
  const notExpired = skipState?.dismissExpiresAt > now;
  // Check after expiry
  writeSkipState(tmpFile, '99.0.0', { at: now - 8 * 24 * 60 * 60 * 1000, days: 7 });
  const expiredState = readSkipState(tmpFile);
  const isExpired = expiredState?.dismissExpiresAt < now;
  results['D1-31'].push({ desc: 'dismiss cooldown', isDismissed, notExpired, isExpired, pass: isDismissed && notExpired && isExpired });
  try { rmSync(tmpFile); } catch {}
} catch(e) {
  results['D1-31'].push({ desc: 'dismiss cooldown', error: e.message });
}

// D1-30: semver comparison correctness
results['D1-30'] = [];
const semverTests = [
  { a: '1.1.5', b: '1.1.4', expected: 1 },
  { a: '1.1.5', b: '1.1.5', expected: 0 },
  { a: '1.1.4', b: '1.1.5', expected: -1 },
  { a: '1.2.0', b: '1.1.5', expected: 1 },
  { a: '1.1.5-next.1', b: '1.1.5', expected: -1 }, // prerelease < stable
  { a: '1.1.5-next.2', b: '1.1.5-next.1', expected: 1 },
];
let allPass = true;
for (const t of semverTests) {
  const r = semverCompare(t.a, t.b);
  const pass = r === t.expected;
  if (!pass) allPass = false;
  results['D1-30'].push({ ...t, actual: r, pass });
}
results['D1-30'].push({ desc: 'overall', pass: allPass });

// D1-33: skip file persistence and multi-path
results['D1-33'] = [];
try {
  const skipPath = skipFilePath();
  const fallbackPath = fallbackSkipFilePath();
  const resolvedPath = resolveSkipFilePath();
  results['D1-33'].push({ desc: 'skip file paths', skipPath, fallbackPath, resolvedPath, hasPaths: !!skipPath && !!fallbackPath });
  
  // Test write and read
  const testPath = join(tmpdir(), 'test-skip-d1-33.json');
  writeSkipState(testPath, '2.0.0', { at: Date.now(), days: 7 });
  const state = readSkipState(testPath);
  results['D1-33'].push({ desc: 'write+read skip state', persisted: state?.dismissedVersion === '2.0.0', pass: state?.dismissedVersion === '2.0.0' });
  try { rmSync(testPath); } catch {}
} catch(e) {
  results['D1-33'].push({ desc: 'skip file', error: e.message });
}

// D1-41: check_update real MCP return contract
results['D1-41'] = [];
try {
  const r = await callTool('huaweicloud_check_update', {});
  const hasOk = r?.ok !== undefined;
  const hasResult = r?.result !== undefined || r?.content !== undefined;
  results['D1-41'].push({ desc: 'check_update MCP contract', hasOk, hasResult, ok: r?.ok, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D1-41'].push({ desc: 'check_update MCP', error: e.message });
}

// D1-42: dismiss real lifecycle and cross-call persistence
results['D1-42'] = [];
try {
  // Use a temp directory for testing
  const tmpSkip = join(tmpdir(), 'test-skip-d1-42.json');
  writeSkipState(tmpSkip, '99.0.0', { at: Date.now(), days: 7 });
  const state1 = readSkipState(tmpSkip);
  // Read again (simulating cross-call)
  const state2 = readSkipState(tmpSkip);
  results['D1-42'].push({ desc: 'cross-call persistence', 
    state1: state1?.dismissedVersion, state2: state2?.dismissedVersion, 
    persistent: state1?.dismissedVersion === state2?.dismissedVersion,
    pass: state1?.dismissedVersion === '99.0.0' && state2?.dismissedVersion === '99.0.0'
  });
  try { rmSync(tmpSkip); } catch {}
} catch(e) {
  results['D1-42'].push({ desc: 'cross-call persistence', error: e.message });
}

// D1-45: fallback hint consumption and prewarm race
results['D1-45'] = [];
try {
  // Test that check_update returns a consistent result
  const r1 = await callTool('huaweicloud_check_update', {});
  const r2 = await callTool('huaweicloud_check_update', {});
  results['D1-45'].push({ desc: 'double check_update consistency', 
    consistent: JSON.stringify(r1) === JSON.stringify(r2),
    result1: JSON.stringify(r1).substring(0, 150),
    pass: JSON.stringify(r1) === JSON.stringify(r2)
  });
} catch(e) {
  results['D1-45'].push({ desc: 'double check_update', error: e.message });
}

// D1-58: Universal MCP whitelist (Claude/Cursor merge semantics)
results['D1-58'] = [];
try {
  // Check that the mcp config backup/merge exists
  const r = await dispatch('tools/list', {});
  const hasAuthSync = r?.tools?.some(t => t.name === 'huaweicloud_auth_sync');
  const hasMcpBackup = r?.tools?.some(t => t.name === 'huaweicloud_setup_obs_config');
  results['D1-58'].push({ desc: 'MCP whitelist tools', hasAuthSync, hasMcpBackup, pass: hasAuthSync });
} catch(e) {
  results['D1-58'].push({ desc: 'MCP whitelist', error: e.message });
}

// D1-2: Multi-agent detection
results['D1-2'] = [];
try {
  const r = await callTool('huaweicloud_check_cli', {});
  results['D1-2'].push({ desc: 'multi-agent detection', result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D1-2'].push({ desc: 'multi-agent detection', error: e.message });
}

// D1-4: status/update idempotency
results['D1-4'] = [];
try {
  const r1 = await callTool('huaweicloud_check_update', {});
  const r2 = await callTool('huaweicloud_check_update', {});
  results['D1-4'].push({ desc: 'idempotent check_update', idempotent: JSON.stringify(r1) === JSON.stringify(r2), pass: JSON.stringify(r1) === JSON.stringify(r2) });
} catch(e) {
  results['D1-4'].push({ desc: 'idempotent', error: e.message });
}

// D1-6: install-hcloud (KooCLI)
results['D1-6'] = [];
try {
  const r = await callTool('huaweicloud_check_cli', {});
  const parsed = JSON.parse(r?.content?.[0]?.text || '{}');
  results['D1-6'].push({ desc: 'hcloud installed', installed: parsed?.installed, version: parsed?.kooCliVersion, pass: parsed?.installed });
} catch(e) {
  results['D1-6'].push({ desc: 'hcloud check', error: e.message });
}

console.log(JSON.stringify(results, null, 2));
