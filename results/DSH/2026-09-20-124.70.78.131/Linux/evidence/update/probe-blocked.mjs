// 补充探针：升级域假阻塞用例直调回填（D1-39 / D1-41 / D1-42 / D1-45）
// 直调 hdk 源码 update-check.mjs 导出函数，无需真云/无需 registry 夹具。
import {
  judgeUpdate, determineTarget, semverCompare, semverParse, hasPrerelease,
  writeSkipState, readSkipState, applyUpdateHint, peekCachedUpdateInfo,
  queryDistTagsSync, queryDistTags, parseDistTagsOutput, readInstalledVersion,
} from '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let PASS = 0, FAIL = 0;
function assert(label, cond, detail = '') {
  const ok = Boolean(cond);
  if (ok) PASS++; else FAIL++;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ' | ' + detail : ''}`);
}
function section(id) { console.log(`\n=====CASE ${id}=====`); }

// ---- D1-39 Windows 升级检测链（source-level 直调 queryDistTagsSync + shell:true 检查） ----
section('D1-39');
{
  const dt = queryDistTagsSync({ timeoutMs: 15000 });
  console.log('queryDistTagsSync(Linux) 返回:', JSON.stringify(dt));
  console.log('Linux 下检测链 status 语义: 非 null 即 status=0 可得 dist-tags');
  // source-level 根因检查：NPM_BIN on win32 = npm.cmd；spawnSync 无 shell:true → Windows EINVAL
  const src = readFileSync('/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src/update-check.mjs', 'utf8');
  const npmBinWin = /IS_WINDOWS \? 'npm\.cmd' : 'npm'/.test(src);
  const hasShellTrueInQuery = /queryDistTags(Sync)?\([\s\S]{0,400}?shell:\s*true/.test(src);
  console.log('source: NPM_BIN=win32?npm.cmd 判定:', npmBinWin, '| queryDistTags/Sync 含 shell:true 判定:', hasShellTrueInQuery);
  assert('D1-39: Linux 直调 queryDistTagsSync 非 null（status=0）', dt && (dt.latest || dt.next), JSON.stringify(dt));
  assert('D1-39: 源码 queryDistTagsSync/queryDistTags 未加 shell:true（Windows npm.cmd EINVAL 根因仍在，已知 #554）', !hasShellTrueInQuery);
}

// ---- D1-41 check_update 四态契约（judgeUpdate 直调） ----
section('D1-41');
{
  const cur = '1.1.4';
  const s1 = judgeUpdate(cur, { latest: '1.1.4', next: null }, null);            // up_to_date
  const s2 = judgeUpdate(cur, { latest: '1.1.5', next: null }, null);            // update_available
  const s3 = judgeUpdate(cur, null, null);                                       // check_failed
  const s4 = judgeUpdate(cur, { latest: '1.1.5', next: null }, { dismissedVersion: '1.1.5', expireAt: new Date(Date.now() + 86400000).toISOString() }); // dismissed
  console.log('up_to_date    :', JSON.stringify(s1));
  console.log('update_avail  :', JSON.stringify(s2));
  console.log('check_failed  :', JSON.stringify(s3));
  console.log('dismissed     :', JSON.stringify(s4));
  const fields = ['currentVersion', 'latestStable', 'latestNext', 'targetVersion', 'updateAvailable', 'dismissed', 'dismissExpiresAt', 'result'];
  const hasAll = (o) => fields.every((f) => Object.prototype.hasOwnProperty.call(o, f));
  assert('D1-41: up_to_date result=', s1.result === 'up_to_date' && s1.updateAvailable === false, `result=${s1.result}`);
  assert('D1-41: update_available result= + target + 字段全', s2.result === 'update_available' && s2.updateAvailable === true && s2.targetVersion === '1.1.5' && hasAll(s2));
  assert('D1-41: check_failed result= + note', s3.result === 'check_failed' && typeof s3.note === 'string');
  assert('D1-41: dismissed result=（dismissExpiresAt 非空）', s4.result === 'dismissed' && s4.dismissed === true && Boolean(s4.dismissExpiresAt));
  assert('D1-41: 四态字段语义统一', hasAll(s1) && hasAll(s2) && hasAll(s3) && hasAll(s4), '8 字段齐备');
}

// ---- D1-42 dismiss 闭环与跨调用持久化（writeSkipState/readSkipState + judgeUpdate 冷却） ----
section('D1-42');
{
  const dir = mkdtempSync(join(tmpdir(), 'hdk-skip-'));
  const f = join(dir, '.update-skip.json');
  const st = writeSkipState(f, '1.1.5', { at: Date.now(), days: 3 });
  console.log('writeSkipState:', JSON.stringify(st));
  const ex = new Date(st.expireAt).getTime() - new Date(st.dismissedAt).getTime();
  const read = readSkipState(f);
  const jd = judgeUpdate('1.1.4', { latest: '1.1.5', next: null }, read);
  console.log('readSkipState valid:', Boolean(read), '| 冷却内 judgeUpdate:', jd.result);
  assert('D1-42: dismiss 写入 dismissedVersion/dismissedAt/expireAt 字段完整', Boolean(read && read.dismissedVersion === '1.1.5' && read.dismissedAt && read.expireAt));
  assert('D1-42: expireAt = dismissedAt + 3 天', Math.abs(ex - 3 * 86400000) < 60000, `delta=${ex}ms`);
  assert('D1-42: 同版本冷却内返回 dismissed', jd.result === 'dismissed' && jd.dismissExpiresAt === read.expireAt);
  assert('D1-42: 冷却过期后恢复 update_available', (() => { const r = judgeUpdate('1.1.4', { latest: '1.1.5', next: null }, { dismissedVersion: '1.1.5', expireAt: new Date(Date.now() - 1000).toISOString() }); return r.result === 'update_available'; })(), 'expireAt 已过期');
}

// ---- D1-45 兜底提示序列（applyUpdateHint 一次注入规则） ----
section('D1-45');
{
  const hint = { currentVersion: '1.1.4', latestVersion: '1.1.5', updateAvailable: true, targetVersion: '1.1.5' };
  const base = { ok: 1 };
  const normal = applyUpdateHint(base, 'huaweicloud_list_operations', hint);
  const check = applyUpdateHint(base, 'huaweicloud_check_update', hint);
  const upgrade = applyUpdateHint(base, 'huaweicloud_upgrade', hint);
  console.log('非检查工具附加 _updateInfo:', JSON.stringify(normal));
  console.log('check_update 附加:', JSON.stringify(check));
  console.log('upgrade 附加:', JSON.stringify(upgrade));
  assert('D1-45: 非检查工具首调用附加 _updateInfo', normal._updateInfo && normal._updateInfo.latestVersion === '1.1.5');
  assert('D1-45: check_update 不附加 _updateInfo', !check._updateInfo);
  assert('D1-45: upgrade 不附加 _updateInfo', !upgrade._updateInfo);
  assert('D1-45: 无 updateAvailable 时不附加', !applyUpdateHint(base, 'huaweicloud_list_operations', { updateAvailable: false })._updateInfo);
}

console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL ? 1 : 0);