// D1-65: 调试模式env — verify HUAWEICLOUD_DEVKIT_DEBUG=1 enables debug logging
import { loadUpdateCheck } from '../_helper.mjs';
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';

const { semverCompare, judgeUpdate } = await loadUpdateCheck();

// Test 1: Verify debugLog function exists and is gated by HUAWEICLOUD_DEVKIT_DEBUG
// We spawn a child process that sets the env var and calls a function that triggers debugLog.
// queryDistTagsSync calls debugLog on failure, so we can capture stderr.

const helperPath = new URL('../_helper.mjs', import.meta.url).pathname.replace(/^\//, '');
const probeDir = new URL('.', import.meta.url).pathname.replace(/^\//, '');

// Write a temporary child script that triggers debugLog
const childScript = `
import { loadUpdateCheck } from '${new URL('../_helper.mjs', import.meta.url).href}';
const { queryDistTagsSync } = await loadUpdateCheck();
// This will fail (npm view with very short timeout) and trigger debugLog
process.env.HUAWEICLOUD_DEVKIT_DEBUG = '1';
const result = queryDistTagsSync({ timeoutMs: 100 });
console.log(JSON.stringify({ hadResult: result !== undefined }));
`;

const childPath = new URL('_debug-child.mjs', import.meta.url).pathname.replace(/^\//, '');
writeFileSync(childPath, childScript, 'utf8');

const nodeExe = process.execPath;
const childResult = spawnSync(nodeExe, [childPath], {
  encoding: 'utf8',
  timeout: 15000,
  cwd: probeDir,
});

// Clean up
try { unlinkSync(childPath); } catch {}

const stderrText = childResult.stderr || '';
const stdoutText = childResult.stdout || '';
const hasDebugOutput = stderrText.includes('[debug]');

// Test 2: Also verify that without the env var, no debug output is produced
const childScript2 = `
import { loadUpdateCheck } from '${new URL('../_helper.mjs', import.meta.url).href}';
const { queryDistTagsSync } = await loadUpdateCheck();
delete process.env.HUAWEICLOUD_DEVKIT_DEBUG;
const result = queryDistTagsSync({ timeoutMs: 100 });
console.log(JSON.stringify({ hadResult: result !== undefined }));
`;
const childPath2 = new URL('_debug-child2.mjs', import.meta.url).pathname.replace(/^\//, '');
writeFileSync(childPath2, childScript2, 'utf8');

const childResult2 = spawnSync(nodeExe, [childPath2], {
  encoding: 'utf8',
  timeout: 15000,
  cwd: probeDir,
});

try { unlinkSync(childPath2); } catch {}

const stderrText2 = childResult2.stderr || '';
const noDebugWithoutEnv = !stderrText2.includes('[debug]');

// Test 3: Verify semverCompare still works (basic sanity)
const cmpOk = semverCompare('1.0.0', '1.0.1') === -1;

const ok = hasDebugOutput && noDebugWithoutEnv && cmpOk;

console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D1-65',
  why: ok
    ? 'HUAWEICLOUD_DEVKIT_DEBUG=1 enables [debug] stderr output; without env var no debug output; semverCompare sane.'
    : `hasDebugOutput=${hasDebugOutput}, noDebugWithoutEnv=${noDebugWithoutEnv}, cmpOk=${cmpOk}`,
  executedAt: '20261009000000',
  debugWithEnv: hasDebugOutput,
  debugWithoutEnv: !noDebugWithoutEnv,
  cmpOk,
  stderrSample: stderrText.slice(0, 200)
}, null, 2));