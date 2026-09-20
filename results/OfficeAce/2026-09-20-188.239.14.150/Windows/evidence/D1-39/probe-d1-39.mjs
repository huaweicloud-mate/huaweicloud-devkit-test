// AI生成
// D1-39 Probe: Windows 升级检测链可用性
// 测试 queryDistTagsSync / queryDistTags 在 Windows 下是否 EINVAL 静默失败
// 对照: 加 shell:true 版本 + queryDistTagsFetch (HTTP直连)

import { spawnSync, spawn } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';

const EVIDENCE_DIR = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\huaweicloud-devkit-test\\results\\OfficeAce\\2026-09-20-188.239.14.150\\Windows\\evidence\\D1-39';
const LOG_PATH = `${EVIDENCE_DIR}\\stdout.log`;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_PATH, line + '\n', 'utf8');
}

// 清空日志
writeFileSync(LOG_PATH, `D1-39 Probe Log - Windows Upgrade Detection Chain\nOS: ${process.platform} / Node: ${process.version}\n${'='.repeat(70)}\n`, 'utf8');

const RESULTS = {};

// ─── 1. 直接 spawnSync('npm.cmd', ...) 无 shell:true (复现 queryDistTagsSync 内部逻辑) ───
log('--- Test 1: spawnSync npm.cmd WITHOUT shell:true (queryDistTagsSync 内部逻辑) ---');
try {
  const result = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 20000,
    windowsHide: true,
  });
  log(`  status: ${result.status}`);
  log(`  error: ${result.error ? result.error.message : 'none'}`);
  log(`  error.code: ${result.error?.code || 'N/A'}`);
  log(`  stdout (first 200 chars): ${String(result.stdout || '').slice(0, 200)}`);
  log(`  stderr (first 200 chars): ${String(result.stderr || '').slice(0, 200)}`);
  RESULTS.spawnSync_noShell = {
    status: result.status,
    error: result.error?.message || null,
    errorCode: result.error?.code || null,
    hasOutput: Boolean(result.stdout && result.stdout.trim()),
  };
} catch (e) {
  log(`  THROWN: ${e.message} (code: ${e.code})`);
  RESULTS.spawnSync_noShell = { thrown: e.message, code: e.code };
}

// ─── 2. spawnSync('npm.cmd', ...) WITH shell:true (对照) ───
log('\n--- Test 2: spawnSync npm.cmd WITH shell:true (对照) ---');
try {
  const result = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 20000,
    windowsHide: true,
    shell: true,
  });
  log(`  status: ${result.status}`);
  log(`  error: ${result.error ? result.error.message : 'none'}`);
  log(`  stdout (first 200 chars): ${String(result.stdout || '').slice(0, 200)}`);
  RESULTS.spawnSync_withShell = {
    status: result.status,
    error: result.error?.message || null,
    errorCode: result.error?.code || null,
    hasOutput: Boolean(result.stdout && result.stdout.trim()),
  };
} catch (e) {
  log(`  THROWN: ${e.message} (code: ${e.code})`);
  RESULTS.spawnSync_withShell = { thrown: e.message, code: e.code };
}

// ─── 3. spawn('npm.cmd', ...) 无 shell:true (复现 queryDistTags 内部逻辑) ───
log('\n--- Test 3: spawn npm.cmd WITHOUT shell:true (queryDistTags 内部逻辑) ---');
const spawnResult = await new Promise((resolve) => {
  let child;
  try {
    child = spawn('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      windowsHide: true,
    });
  } catch (e) {
    log(`  SPAWN THROWN: ${e.message} (code: ${e.code})`);
    resolve({ thrown: e.message, code: e.code });
    return;
  }
  const timer = setTimeout(() => {
    try { child.kill(); } catch {}
    resolve({ timedOut: true });
  }, 20000);
  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (d) => { stdout += String(d); });
  child.stderr?.on('data', (d) => { stderr += String(d); });
  child.on('error', (err) => {
    clearTimeout(timer);
    log(`  child.on('error'): ${err.message} (code: ${err.code})`);
    resolve({ error: err.message, code: err.code });
  });
  child.on('close', (code) => {
    clearTimeout(timer);
    log(`  exit code: ${code}`);
    log(`  stdout (first 200 chars): ${stdout.slice(0, 200)}`);
    log(`  stderr (first 200 chars): ${stderr.slice(0, 200)}`);
    resolve({ exitCode: code, stdout: stdout.slice(0, 200), hasOutput: Boolean(stdout.trim()) });
  });
});
RESULTS.spawn_noShell = spawnResult;

// ─── 4. spawn('npm.cmd', ...) WITH shell:true (对照) ───
log('\n--- Test 4: spawn npm.cmd WITH shell:true (对照) ---');
const spawnShellResult = await new Promise((resolve) => {
  let child;
  try {
    child = spawn('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      windowsHide: true,
      shell: true,
    });
  } catch (e) {
    log(`  SPAWN THROWN: ${e.message} (code: ${e.code})`);
    resolve({ thrown: e.message, code: e.code });
    return;
  }
  const timer = setTimeout(() => {
    try { child.kill(); } catch {}
    resolve({ timedOut: true });
  }, 20000);
  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (d) => { stdout += String(d); });
  child.stderr?.on('data', (d) => { stderr += String(d); });
  child.on('error', (err) => {
    clearTimeout(timer);
    log(`  child.on('error'): ${err.message} (code: ${err.code})`);
    resolve({ error: err.message, code: err.code });
  });
  child.on('close', (code) => {
    clearTimeout(timer);
    log(`  exit code: ${code}`);
    log(`  stdout (first 200 chars): ${stdout.slice(0, 200)}`);
    resolve({ exitCode: code, stdout: stdout.slice(0, 200), hasOutput: Boolean(stdout.trim()) });
  });
});
RESULTS.spawn_withShell = spawnShellResult;

// ─── 5. 通过动态 import 调用真实的 queryDistTagsSync ───
log('\n--- Test 5: 真实 queryDistTagsSync 调用 ---');
try {
  const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const syncResult = mod.queryDistTagsSync({ timeoutMs: 20000 });
  log(`  queryDistTagsSync result: ${JSON.stringify(syncResult)}`);
  RESULTS.queryDistTagsSync = { result: syncResult, isNull: syncResult === null };
} catch (e) {
  log(`  THROWN: ${e.message}`);
  RESULTS.queryDistTagsSync = { thrown: e.message };
}

// ─── 6. 通过动态 import 调用真实的 queryDistTags (async) ───
log('\n--- Test 6: 真实 queryDistTags (async) 调用 ---');
try {
  const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const asyncResult = await mod.queryDistTags({ timeoutMs: 20000 });
  log(`  queryDistTags result: ${JSON.stringify(asyncResult)}`);
  RESULTS.queryDistTags = { result: asyncResult, isNull: asyncResult === null };
} catch (e) {
  log(`  THROWN: ${e.message}`);
  RESULTS.queryDistTags = { thrown: e.message };
}

// ─── 7. queryDistTagsFetch (HTTP 直连, 无 spawn) ───
log('\n--- Test 7: queryDistTagsFetch (HTTP 直连) ---');
try {
  const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const fetchResult = await mod.queryDistTagsFetch({ timeoutMs: 20000 });
  log(`  queryDistTagsFetch result: ${JSON.stringify(fetchResult)}`);
  RESULTS.queryDistTagsFetch = { result: fetchResult, isNull: fetchResult === null };
} catch (e) {
  log(`  THROWN: ${e.message}`);
  RESULTS.queryDistTagsFetch = { thrown: e.message };
}

// ─── 判定 ───
log('\n' + '='.repeat(70));
log('--- D1-39 判定 ---');

const syncHasEINVAL = RESULTS.spawnSync_noShell?.errorCode === 'EINVAL' ||
                      RESULTS.spawnSync_noShell?.code === 'EINVAL' ||
                      (RESULTS.spawnSync_noShell?.thrown && String(RESULTS.spawnSync_noShell.thrown).includes('EINVAL'));
const asyncHasEINVAL = RESULTS.spawn_noShell?.code === 'EINVAL' ||
                        (RESULTS.spawn_noShell?.error && String(RESULTS.spawn_noShell.error).includes('EINVAL'));

const syncWorks = RESULTS.spawnSync_noShell?.hasOutput === true || RESULTS.spawnSync_noShell?.status === 0;
const asyncWorks = RESULTS.spawn_noShell?.hasOutput === true || RESULTS.spawn_noShell?.exitCode === 0;
const fetchWorks = RESULTS.queryDistTagsFetch?.result !== null && RESULTS.queryDistTagsFetch?.isNull === false;

log(`spawnSync 无 shell: EINVAL=${syncHasEINVAL}, works=${syncWorks}`);
log(`spawn 无 shell: EINVAL=${asyncHasEINVAL}, works=${asyncWorks}`);
log(`queryDistTagsFetch: works=${fetchWorks}`);
log(`queryDistTagsSync 返回 null: ${RESULTS.queryDistTagsSync?.isNull}`);
log(`queryDistTags 返回 null: ${RESULTS.queryDistTags?.isNull}`);

// 预期: Windows 下检测链真实可用，不得 EINVAL 静默失败
const detectionChainUsable = (syncWorks || asyncWorks) && !syncHasEINVAL && !asyncHasEINVAL;
const realFuncSyncWorks = RESULTS.queryDistTagsSync?.isNull === false;
const realFuncAsyncWorks = RESULTS.queryDistTags?.isNull === false;

let verdict;
if (realFuncSyncWorks || realFuncAsyncWorks) {
  verdict = 'PASS';
  log(`判定: PASS - 检测链在 Windows 下可用 (queryDistTagsSync=${realFuncSyncWorks}, queryDistTags=${realFuncAsyncWorks})`);
} else if (fetchWorks) {
  verdict = 'PASS_WITH_FETCH_FALLBACK';
  log(`判定: PASS_WITH_FETCH_FALLBACK - spawn 路径失败但 queryDistTagsFetch 可用`);
} else {
  verdict = 'FAIL';
  log(`判定: FAIL - 检测链在 Windows 下不可用 (EINVAL 静默失败)`);
  log(`  queryDistTagsSync 返回 null: ${RESULTS.queryDistTagsSync?.isNull}`);
  log(`  queryDistTags 返回 null: ${RESULTS.queryDistTags?.isNull}`);
  log(`  spawnSync EINVAL: ${syncHasEINVAL}`);
  log(`  spawn EINVAL: ${asyncHasEINVAL}`);
}

// 保存结果 JSON
writeFileSync(`${EVIDENCE_DIR}\\result.json`, JSON.stringify({
  testCase: 'D1-39',
  title: 'Windows 升级检测链可用性',
  verdict,
  results: RESULTS,
  syncHasEINVAL,
  asyncHasEINVAL,
  fetchWorks,
  timestamp: new Date().toISOString(),
}, null, 2), 'utf8');

log(`\n最终判定: ${verdict}`);
log(`证据已保存到 ${EVIDENCE_DIR}`);
