// AI生成
// D1-39: Windows升级检测链可用性 (P0)
// On Windows, directly call queryDistTagsSync/queryDistTags, check for EINVAL error
// Root cause: npm.cmd spawn without shell:true causes EINVAL on Windows
import { queryDistTagsSync, queryDistTags, queryDistTagsFetch } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const results = {};

try {
  // Step 1: Call queryDistTagsSync with correct args (object, not string)
  let syncResult = null;
  let syncError = null;
  try {
    syncResult = queryDistTagsSync({ timeoutMs: 30000 });
    results.syncResult = syncResult;
  } catch (e) {
    syncError = e;
    results.syncError = { message: e.message, code: e.code };
  }
  
  const syncHasEinval = syncError && (syncError.code === 'EINVAL' || /EINVAL/.test(syncError.message));
  const syncSilentNull = !syncError && syncResult === null;
  results.syncHasEinval = !!syncHasEinval;
  results.syncSilentNull = syncSilentNull;
  
  // Step 2: Call queryDistTags (async version) with correct args
  let asyncResult = null;
  let asyncError = null;
  try {
    asyncResult = await queryDistTags({ timeoutMs: 30000 });
    results.asyncResult = asyncResult;
  } catch (e) {
    asyncError = e;
    results.asyncError = { message: e.message, code: e.code };
  }
  
  const asyncHasEinval = asyncError && (asyncError.code === 'EINVAL' || /EINVAL/.test(asyncError.message));
  const asyncSilentNull = !asyncError && asyncResult === null;
  results.asyncHasEinval = !!asyncHasEinval;
  results.asyncSilentNull = asyncSilentNull;
  
  // Step 3: Call queryDistTagsFetch (uses fetch instead of spawn)
  let fetchResult = null;
  let fetchError = null;
  try {
    fetchResult = await queryDistTagsFetch({ timeoutMs: 30000 });
    results.fetchResult = fetchResult;
  } catch (e) {
    fetchError = e;
    results.fetchError = { message: e.message };
  }
  results.fetchHasResult = !!fetchResult;
  
  // Step 4: Compare with shell:true version (control)
  let shellTrueResult = null;
  try {
    const out = execSync('npm view huaweicloud-devkit dist-tags --json', {
      encoding: 'utf8', timeout: 30000,
      env: { ...process.env, PYTHONUTF8: '1' },
      shell: true
    });
    shellTrueResult = JSON.parse(out);
    results.shellTrueResult = shellTrueResult;
  } catch (e) {
    results.shellTrueError = e.message;
  }
  
  // Step 5: Direct spawnSync test to confirm EINVAL
  let directSpawnError = null;
  try {
    const r = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      encoding: 'utf8', timeout: 30000, windowsHide: true
    });
    if (r.error) directSpawnError = { message: r.error.message, code: r.error.code };
    results.directSpawnResult = r.error ? null : { stdout: r.stdout?.substring(0, 200) };
    results.directSpawnError = directSpawnError;
  } catch (e) {
    directSpawnError = { message: e.message, code: e.code };
    results.directSpawnError = directSpawnError;
  }
  
  // Step 6: spawnSync with shell:true (should work)
  let shellSpawnResult = null;
  try {
    const r = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
      encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true
    });
    shellSpawnResult = r.error ? null : JSON.parse(r.stdout);
    results.shellSpawnResult = shellSpawnResult;
  } catch (e) {
    results.shellSpawnError = e.message;
  }
  
  // Determine status
  const hasValidSyncResult = syncResult && (syncResult.latest || syncResult.next);
  const hasValidAsyncResult = asyncResult && (asyncResult.latest || asyncResult.next);
  const hasValidFetchResult = fetchResult && (fetchResult.latest || fetchResult.next);
  
  const status = (hasValidSyncResult || hasValidAsyncResult || hasValidFetchResult) ? 'PASS' : 'FAIL';
  
  const res = {
    status,
    why: status === 'PASS'
      ? `Windows检测链可用。sync=${!!hasValidSyncResult}, async=${!!hasValidAsyncResult}, fetch=${!!hasValidFetchResult}`
      : `Windows检测链EINVAL静默失败: queryDistTagsSync返回null(syncSilentNull=${syncSilentNull}), queryDistTags返回null(asyncSilentNull=${asyncSilentNull}), queryDistTagsFetch=${!!hasValidFetchResult}。根因: update-check.mjs:238 spawnSync('npm.cmd',...)未设shell:true, Windows下npm.cmd是批处理文件无法直接spawn`,
    executedAt: ts(),
    platform: process.platform,
    rootCause: status === 'FAIL' ? 'update-check.mjs:238/259 spawnSync/spawn使用npm.cmd但未设shell:true, Windows下批处理文件spawn导致EINVAL, 错误被catch后静默返回null' : null,
    issue: '#554',
    ...results
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
