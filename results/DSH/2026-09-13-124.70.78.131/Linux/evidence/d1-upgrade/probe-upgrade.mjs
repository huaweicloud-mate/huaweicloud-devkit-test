// DSH/Linux daily test probe — upgrade detection chain (D1-26..D1-54)
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const {
  semverCompare, semverParse, hasPrerelease, determineTarget, parseDistTagsOutput,
  judgeUpdate, readInstalledVersion, writeSkipState, readSkipState,
  resolveSkipFilePath, getCachedUpdateInfo, invalidateUpdateCache, queryDistTagsSync,
} = await import(CORE + '/update-check.mjs');
const { TOOL_DEFINITIONS } = await import(CORE + '/tools.mjs');
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const results = [];
function check(caseId, name, pass, actual) {
  results.push({ caseId, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) });
}

// ============ D1-26 升级提醒工具注册 ============
const names = TOOL_DEFINITIONS.map(t => t.name);
const cu = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update');
const up = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_upgrade');
check('D1-26', 'huaweicloud_check_update registered', !!cu, !!cu);
check('D1-26', 'huaweicloud_upgrade registered', !!up, !!up);
check('D1-26', 'check_update schema has description+inputSchema', !!cu?.description && !!cu?.inputSchema, cu?.description);
check('D1-26', 'upgrade schema has description+inputSchema', !!up?.description && !!up?.inputSchema, up?.description);

// ============ D1-30 semver 比对 ============
check('D1-30', '1.1.2 > 1.1.1', semverCompare('1.1.2', '1.1.1') > 0, semverCompare('1.1.2', '1.1.1'));
check('D1-30', '1.1.0 > 1.1.0-next.9 (stable>pre)', semverCompare('1.1.0', '1.1.0-next.9') > 0, semverCompare('1.1.0', '1.1.0-next.9'));
check('D1-30', 'equal = 0', semverCompare('1.1.0', '1.1.0') === 0, semverCompare('1.1.0', '1.1.0'));
check('D1-30', 'prev: 1.1.0-next.9 < 1.1.0-next.10', semverCompare('1.1.0-next.9', '1.1.0-next.10') < 0, semverCompare('1.1.0-next.9', '1.1.0-next.10'));
check('D1-30', 'invalid string lexicographic', semverCompare('abc', 'def') < 0, semverCompare('abc', 'def'));
check('D1-30', 'hasPrerelease true/false', hasPrerelease('1.1.0-next.9') === true && hasPrerelease('1.1.0') === false, `${hasPrerelease('1.1.0-next.9')},${hasPrerelease('1.1.0')}`);

// ============ D1-27 已是最新 ============
const r27 = judgeUpdate('1.1.4', { latest: '1.1.4', next: null });
check('D1-27', 'up_to_date && !updateAvailable', r27.result === 'up_to_date' && r27.updateAvailable === false, r27);

// ============ D1-28 有新版本 ============
const r28 = judgeUpdate('1.1.2', { latest: '1.1.4', next: '1.1.4-next.3' });
check('D1-28', 'update_available && targetVersion=1.1.4', r28.result === 'update_available' && r28.updateAvailable === true && r28.targetVersion === '1.1.4', r28);

// ============ D1-40 镜像 lag 不提示倒退 ============
const r40a = judgeUpdate('1.1.4', { latest: '1.1.3', next: null });
check('D1-40', 'remote<=local -> up_to_date (no downgrade)', r40a.result === 'up_to_date' && r40a.updateAvailable === false, r40a);
const r40b = judgeUpdate('1.1.4-next.3', { latest: '1.1.3', next: '1.1.3-next.9' });
check('D1-40', 'pre remote<=local -> no downgrade', r40b.result === 'up_to_date', r40b);

// ============ D1-34 check_failed 不阻塞 ============
const r34 = judgeUpdate('1.1.4', null);
check('D1-34', 'check_failed && note && !updateAvailable', r34.result === 'check_failed' && typeof r34.note === 'string' && !r34.updateAvailable, r34);

// ============ D1-31 dismiss 冷却期 ============
{
  const f = join(tmpdir(), `d1-31-${Date.now()}.json`);
  writeSkipState(f, '1.1.4', { at: 1000, days: 3 });
  const st = readSkipState(f);
  check('D1-31', 'skip file fields dismissedVersion/dismissedAt/expireAt', st.dismissedVersion === '1.1.4' && !!st.dismissedAt && !!st.expireAt, st);
  const inCool = judgeUpdate('1.1.2', { latest: '1.1.4' }, st, 2000);
  check('D1-31', 'cooldown -> dismissed', inCool.result === 'dismissed' && inCool.dismissed === true, inCool);
  const expireMs = new Date(st.expireAt).getTime() - new Date(st.dismissedAt).getTime();
  check('D1-31', 'expireAt = dismissedAt + 3 days', expireMs === 3*24*60*60*1000, expireMs);
  rmSync(f, { force: true });
}

// ============ D1-32 新版本 > dismissedVersion 无视冷却 ============
{
  const st = { dismissedVersion: '1.1.4', dismissedAt: new Date(1000).toISOString(), expireAt: new Date(1000 + 3*86400000).toISOString() };
  const r = judgeUpdate('1.1.2', { latest: '1.1.5' }, st, 2000);
  check('D1-32', 'new target > dismissed -> update_available', r.result === 'update_available' && r.updateAvailable === true, r);
}

// ============ D1-33 skip 持久化与多路径 ============
{
  const f = join(tmpdir(), `d1-33-${Date.now()}.json`);
  const st = writeSkipState(f, '1.1.4');
  const parsed = JSON.parse(readFileSync(f, 'utf8'));
  check('D1-33', 'skip file JSON structure', parsed.dismissedVersion === '1.1.4' && !!parsed.dismissedAt && !!parsed.expireAt, parsed);
  const resolved = resolveSkipFilePath();
  check('D1-33', 'resolveSkipFilePath returns path', typeof resolved === 'string' && resolved.length > 0, resolved);
  rmSync(f, { force: true });
}

// ============ D1-44 冷却边界 ============
{
  const st = { dismissedVersion: '1.1.4', dismissedAt: new Date(0).toISOString(), expireAt: new Date(1000).toISOString() };
  const atBoundary = judgeUpdate('1.1.2', { latest: '1.1.4' }, st, 1000); // now == expireAt
  check('D1-44', 'at exact expireAt -> NOT dismissed (re-remind)', atBoundary.result === 'update_available', atBoundary);
  const before = judgeUpdate('1.1.2', { latest: '1.1.4' }, st, 999);
  check('D1-44', 'strictly before expireAt -> dismissed', before.result === 'dismissed', before);
}

// ============ D1-53 镜像滞后确定性夹具 ============
{
  const fixtures = [
    { current: '1.1.4', tags: { latest: '1.1.4', next: '1.1.4-next.2' }, expect: 'up_to_date' },
    { current: '1.1.4', tags: { latest: '1.1.3' }, expect: 'up_to_date' },
    { current: '1.1.2', tags: { latest: '1.1.4', next: null }, expect: 'update_available' },
    { current: '1.1.2-next.1', tags: { latest: '1.1.2', next: '1.1.2-next.3' }, expect: 'update_available' },
  ];
  let all = true;
  for (const f of fixtures) {
    const r = judgeUpdate(f.current, f.tags);
    if (r.result !== f.expect) all = false;
  }
  check('D1-53', '4 fixtures deterministic (no downgrade/backward)', all, fixtures.map(f => judgeUpdate(f.current, f.tags).result).join(','));
}

// ============ D1-35 缓存 TTL 与失败节流 ============
{
  const T0 = 1700000000000;
  invalidateUpdateCache();
  let calls = 0;
  const doQuery = async () => { calls++; return { latest: '1.1.4', next: '1.1.4-next.3' }; };
  await getCachedUpdateInfo('1.1.0', { doQuery, now: T0 });
  await getCachedUpdateInfo('1.1.0', { doQuery, now: T0 + 1000 }); // within TTL -> reuse
  check('D1-35', 'cache reused within TTL (1 query)', calls === 1, calls);
  invalidateUpdateCache();
  let fails = 0;
  const doFail = async () => { fails++; return null; };
  await getCachedUpdateInfo('1.1.0', { doQuery: doFail, now: T0 });
  await getCachedUpdateInfo('1.1.0', { doQuery: doFail, now: T0 + 299000 }); // < 5min throttle
  check('D1-35', 'failure throttled within 5min (1 query)', fails === 1, fails);
}

// ============ D1-46 缓存 TTL 边界 + 异常恢复 ============
{
  const T0 = 1700000000000;
  invalidateUpdateCache();
  let calls = 0;
  const doOk = async () => { calls++; return { latest: '1.1.4' }; };
  await getCachedUpdateInfo('1.1.0', { doQuery: doOk, now: T0 });
  await getCachedUpdateInfo('1.1.0', { doQuery: doOk, now: T0 + 3600000 }); // exactly TTL -> still valid (inclusive <=)
  const atBoundary = calls;
  await getCachedUpdateInfo('1.1.0', { doQuery: doOk, now: T0 + 3600000 + 60000 }); // past TTL -> re-query
  check('D1-46', 'within TTL reused, past TTL re-queries', atBoundary === 1 && calls === 2, `boundary=${atBoundary} total=${calls}`);
}

// ============ D1-47 缓存与当前版本解耦 ============
{
  const T0 = 1700000000000;
  invalidateUpdateCache();
  await getCachedUpdateInfo('1.1.0', { doQuery: async () => ({ latest: '1.1.4', next: null }), now: T0 });
  const r = await getCachedUpdateInfo('1.1.5', { doQuery: async () => ({ latest: '1.1.4', next: null }), now: T0 + 1000 });
  check('D1-47', 'current changed -> recompute (up_to_date)', r.result === 'up_to_date' && r.updateAvailable === false, r);
}

// ============ D1-39 检测链可用性（Linux 实测上游函数）============
const inst = readInstalledVersion();
check('D1-39', 'readInstalledVersion returns version', typeof inst === 'string' && inst.length > 0, inst);
const dist = queryDistTagsSync({ timeoutMs: 20000 });
check('D1-39', 'queryDistTagsSync returns dist-tags', !!dist && (typeof dist.latest === 'string' || typeof dist.next === 'string'), dist);
check('D1-39', 'dist latest semver-parseable', dist && semverParse(dist.latest) !== null, dist?.latest);

// ============ D1-37 SKILL.md 会话启动指令 ============
try {
  const skillPath = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/skills/huaweicloud-core/SKILL.md';
  const skill = await import(skillPath, { with: { type: 'text' } }).catch(() => null);
  // import ... text not portable; fall back to fs read
  const { readFileSync } = await import('node:fs');
  const skillText = readFileSync('/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/skills/huaweicloud-core/SKILL.md', 'utf8');
  const hasCheck = /check_update|huaweicloud_check_update|首次.{0,10}(操作|调用).{0,10}(升级|检查)/i.test(skillText);
  check('D1-37', 'SKILL.md contains check_update startup instruction', hasCheck, hasCheck ? 'found' : 'not found');
} catch (e) {
  check('D1-37', 'SKILL.md readable', false, e.message);
}

// summary
const failed = results.filter(r => !r.pass);
console.log('=== UPGRADE PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.caseId}  ${r.name}  => ${r.actual}`);
}
if (failed.length) {
  console.log('\nFAILED CASES:');
  for (const r of failed) console.log(`  ${r.caseId} ${r.name}`);
  process.exit(1);
}
console.log('\nALL UPGRADE ASSERTIONS PASSED');
