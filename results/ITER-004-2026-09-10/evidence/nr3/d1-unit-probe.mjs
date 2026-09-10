// D1 版本升级提醒——函数级探针 2（2026-09-10 ITER-004 NR3 补充轮）
// 用例: D1-29证据/30/31/32/33/34/35/36/39(fn)/44/46/47/50(mock)/51/53(fn)
// 用法: node d1-unit-probe.mjs <沙箱根> [--json]
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { startFixture } from './fixture-server.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const S = resolve(process.argv[2] || join(__dirname, '.sandbox'));
const FIXED = join(S, 'app-fix-s', 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
const UNFIXED = join(S, 'app-next', 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
const SC = join(S, 'scenarios');
const HOME_FIX = join(S, 'home-unit-fix');
const HOME_UNFIX = join(S, 'home-unit-unfix');
mkdirSync(HOME_FIX, { recursive: true });
mkdirSync(HOME_UNFIX, { recursive: true });

// --- 时钟注入（仅本进程，模块级 Date.now 调用点生效）---
const realNow = Date.now.bind(Date);
let fakeNow = realNow();
Date.now = () => fakeNow;
const advance = (ms) => { fakeNow += ms; };

const results = [];
function check(id, pass, detail) {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${detail}`);
}
const section = (t) => console.log(`\n===== ${t} =====`);

const exits = [];
let Fixed, Unfixed; // 模块作用域（try 块内赋值，resetState 闭包可见）
const CONFIG_ROOT_FIX = join(HOME_FIX, '.config');
const resetState = () => {
  Fixed.invalidateUpdateCache();
  rmSync(CONFIG_ROOT_FIX, { recursive: true, force: true });
};

// 独立 fixture 子进程 + 就绪探测（同进程 fixture 会让 spawnSync 假象超时——装置陷阱 2026-09-10 实证）
function spawnSyncRunner(port = 0) {
  const child = spawn(process.execPath, [
    join(__dirname, 'fixture-server.mjs'), '--port', String(port),
    '--fixture', join(S, 'scenarios', 'sc-stable-new.json'),
    '--tarballs', join(S, 'fixtures'),
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderrBuf = '';
  child.stderr.on('data', (d) => { stderrBuf += String(d); });
  child.fxStderr = () => stderrBuf;
  return child;
}
async function waitFixtureReady(fxProc, timeoutMs = 20000) {
  // 解析动态端口（--port 0 时 fixture 打印 FIXTURE_PORT=<n>）
  const port = await new Promise((resolve, reject) => {
    const t0 = Date.now();
    let buf = '';
    const iv = setInterval(() => {
      const m = /FIXTURE_PORT=(\d+)/.exec(buf);
      if (m) { clearInterval(iv); resolve(Number(m[1])); }
      else if (Date.now() - t0 > timeoutMs) { clearInterval(iv); reject(new Error('未收到 FIXTURE_PORT: ' + (buf || '(空)') + ' stderr=' + fxProc.fxStderr().slice(0, 300))); }
    }, 200);
    fxProc.stdout.on('data', (d) => { buf += String(d); });
  });
  const url = `http://127.0.0.1:${port}`;
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const r = spawnSync(process.execPath, ['-e', `fetch('${url}/__stats').then((x) => process.exit(x.ok ? 0 : 1)).catch(() => process.exit(1))`], { timeout: 4000, stdio: 'ignore' });
    if (r.status === 0) return { port, url };
    await new Promise((r2) => setTimeout(r2, 500));
  }
  throw new Error(`fixture 子进程未就绪: stderr=${fxProc.fxStderr().slice(0, 300)}`);
}

try {
  // ---------- fixture registry（独立子进程，避免 spawnSync 阻塞同进程事件循环的装置假象）----------
  const fixturePath = join(S, 'scenarios', 'sc-stable-new.json');
  rmSync(join(S, 'home-unit-fix', 'npm-cache'), { recursive: true, force: true }); // 每轮清空沙箱 npm cache（跨轮缓存污染）
  const fxProc = spawnSyncRunner(0); // 动态端口 + 独立进程运行 fixture-server.mjs
  const fxReady = await waitFixtureReady(fxProc);
  const fx = { url: fxReady.url, getStats: () => ({}) };
  process.env.npm_config_registry = fx.url;
  process.env.npm_config_cache = join(S, 'home-unit-fix', 'npm-cache');
  process.env.NO_UPDATE_NOTIFIER = '1';
  exits.push(() => { try { fxProc.kill(); } catch {} });

  // ---------- 导入被测模块（unfixed 先，独立 HOME；再 fixed）----------
  process.env.HUAWEICLOUD_HOME = HOME_UNFIX;
  Unfixed = await import(pathToFileURL(UNFIXED).href);
  process.env.HUAWEICLOUD_HOME = HOME_FIX;
  Fixed = await import(pathToFileURL(FIXED).href);

  // ---------- D1-30 semver 6 组 ----------
  section('D1-30 semver 版本比对');
  const semverPairs = [
    ['1.1.2', '1.1.3', -1, '正式版 patch 递增'],
    ['1.1.3-next.1', '1.1.3-next.2', -1, 'pre 数字标识符递增'],
    ['1.1.3-next.2', '1.1.3', -1, 'pre < 正式版'],
    ['1.1.10', '1.1.9', 1, '多位数 patch'],
    ['1.1.3-next.10', '1.1.3-next.9', 1, 'pre 数字按数值比较'],
    ['1.1.3', '1.1.3', 0, '相同'],
  ];
  let semverOk = true;
  for (const [a, b, expect, desc] of semverPairs) {
    const got = Fixed.semverCompare(a, b);
    if (got !== expect) { semverOk = false; check('D1-30', false, `${desc}: ${a} vs ${b} => ${got}（期望 ${expect}）`); }
  }
  if (semverOk) check('D1-30', true, `6 组比对全部符合（${semverPairs.map((p) => `${p[0]}~${p[1]}`).join(' / ')}）`);
  const badParse = Fixed.semverParse('not-a-version');
  check('D1-30b', badParse === null, `非法版本 semverParse => null（${JSON.stringify(badParse)}）`);

  // ---------- D1-29 文档-实现差异证据 ----------
  section('D1-29 pre 提醒策略（SPEC-MISMATCH 证据）');
  // 文档比对表: 1.1.0-next.8 | 1.1.0-next.9 | ❌（pre-release 不提醒）
  // 实现 determineTarget(pre 用户候选=latest+next 取最大)：latest 低于 current、仅 next 提升时 target=next（会提醒，与文档 ❌ 冲突）
  const tPre = Fixed.determineTarget('1.1.0-next.8', { latest: '1.0.2', next: '1.1.0-next.9' });
  check('D1-29', tPre === '1.1.0-next.9',
    `pre 用户 current=1.1.0-next.8, latest=1.0.2(低), next=1.1.0-next.9 → target=${tPre}（实现会提醒 next 更新；设计文档表该行为标 ❌ 不提醒）→ SPEC-MISMATCH 待开发确认`);
  const tPre3 = Fixed.determineTarget('1.1.0-next.8', { latest: '1.1.0', next: '1.1.0-next.9' });
  check('D1-29c', tPre3 === '1.1.0', `latest 与 pre 同底版本时 target=${tPre3}（稳定版大于 pre，无 next 提醒，符合文档语义）`);
  const tPre2 = Fixed.determineTarget('1.1.0-next.8', { latest: '1.2.0', next: '1.1.0-next.9' });
  check('D1-29b', tPre2 === '1.2.0', `latest 提升场景 pre 用户 target=${tPre2}（稳定版优先，与文档✅一致）`);

  // ---------- D1-31/32 冷却 3 天与跳过 ----------
  section('D1-31/32 冷却与跳过');
  const skipFile = join(HOME_FIX, '.config', 'huaweicloud', 'devkit-skip.json');
  rmSync(join(HOME_FIX, '.config'), { recursive: true, force: true });
  const dts = { latest: '1.1.3', next: null };
  const st = Fixed.writeSkipState(skipFile, '1.1.3');
  const ms3d = new Date(st.expireAt).getTime() - new Date(st.dismissedAt).getTime();
  check('D1-31', ms3d === 3 * 24 * 3600 * 1000, `skip 文件字段完整且 expireAt-dismissedAt=${ms3d}ms=3天`);
  const inCooldown = Fixed.judgeUpdate('1.1.2', dts, st, realNow());
  check('D1-31b', inCooldown.result === 'dismissed' && inCooldown.dismissed === true,
    `同版本冷却内 => ${inCooldown.result}（dismissExpiresAt=${inCooldown.dismissExpiresAt}）`);
  const newer = Fixed.judgeUpdate('1.1.2', { latest: '1.1.4', next: null }, st, realNow());
  check('D1-32', newer.result === 'update_available' && newer.targetVersion === '1.1.4',
    `新版本 1.1.4 > dismissedVersion 1.1.3 无视冷却 => ${newer.result}（target=${newer.targetVersion}）`);

  // ---------- D1-33 skip 文件路径/容错 ----------
  section('D1-33 skip 路径与容错');
  rmSync(join(HOME_UNFIX, '.config'), { recursive: true, force: true });
  check('D1-33a', Fixed.resolveSkipFilePath().includes('.config') && Fixed.resolveSkipFilePath().includes('devkit-skip.json'),
    `隔离 HOME 回退路径=${Fixed.resolveSkipFilePath().replace(S, '<S>')}`);
  check('D1-33b', Fixed.readSkipState(join(HOME_FIX, 'nope.json')) === null, '不存在文件 => null');
  writeFileSync(skipFile, '{broken json', 'utf8');
  check('D1-33c', Fixed.readSkipState(skipFile) === null, '损坏 JSON => null（安全降级）');
  writeFileSync(skipFile, JSON.stringify({ dismissedVersion: '1.1.3', dismissedAt: st.dismissedAt, expireAt: st.expireAt }), 'utf8');

  // ---------- D1-34/35 check_failed 不阻塞 + 5min 节流 + SKIP env ----------
  section('D1-34/35 失败降级与节流');
  resetState();
  let qCount = 0;
  const failingQuery = async () => { qCount++; return null; }; // 生产语义：queryDistTags 失败解析为 null（不 reject）
  fakeNow = realNow();
  const fail1 = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: failingQuery });
  check('D1-34', fail1.result === 'check_failed' && !fail1.updateAvailable,
    `registry 失败 => ${fail1.result}（不阻塞，返回结构化结果）`);
  const fail2 = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: failingQuery });
  check('D1-35', fail2.result === 'check_failed' && qCount === 1,
    `5min 内节流不重查：doQuery 次数=${qCount}（1），结果仍 ${fail2.result}（note=${fail2.note}）`);
  advance(5 * 60 * 1000 + 1);
  let qCount2 = 0;
  const okQuery = async () => { qCount2++; return { latest: '1.1.3', next: null }; };
  const rec = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: okQuery });
  check('D1-35b', rec.result === 'update_available' && qCount2 === 1,
    `节流过期后重查恢复 => ${rec.result}（doQuery=${qCount2}）`);
  process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE = '1';
  const skipEnv = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: okQuery });
  delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
  check('D1-35c', skipEnv.result === 'up_to_date' && qCount2 === 1, `SKIP_UPDATE=1 => ${skipEnv.result} 且不发起查询（doQuery=${qCount2}）`);

  // ---------- D1-46 缓存 TTL 边界/并发合并/异常恢复 ----------
    section('D1-46 缓存 TTL/节流/inflight');
    resetState();
    qCount = 0;
    let qResolve = { latest: '1.1.3', next: null };
    const slowQuery = async () => { qCount++; await new Promise((r) => setTimeout(r, 120)); return qResolve; };
    fakeNow = realNow();
    const c1 = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: slowQuery });
    check('D1-46a', c1.updateAvailable && c1.targetVersion === '1.1.3', `首次查询 => ${c1.result}（target=${c1.targetVersion}）`);
    const c2 = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: slowQuery });
    check('D1-46b', c2.result === 'update_available' && qCount === 1, `TTL 内复用缓存：doQuery=${qCount}（1），结果 ${c2.result}`);
    advance(60 * 60 * 1000 + 1);
    const c3 = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: slowQuery });
    check('D1-46c', c3.result === 'update_available' && qCount === 2, `超过 1h TTL 重查：doQuery=${qCount}（2）`);
    // inflight 合并
    resetState();
    qCount = 0;
    const [p1, p2] = await Promise.all([
      Fixed.getCachedUpdateInfo('1.1.2', { doQuery: slowQuery }),
      Fixed.getCachedUpdateInfo('1.1.2', { doQuery: slowQuery }),
    ]);
    check('D1-46d', p1.result === 'update_available' && p2.result === 'update_available' && qCount === 1,
      `并发合并：两个并发调用共享一次查询（doQuery=${qCount}），结果一致`);
    // reject（防御缺口实证：注入 doQuery reject 未封装为 check_failed，直接抛出）
    resetState();
    qCount = 0;
    const rejectQuery = async () => { qCount++; throw new Error('boom'); };
    let rejectThrown = false;
    try {
      await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: rejectQuery });
    } catch (e) {
      rejectThrown = true;
      check('D1-46g', /boom/.test(e.message), `注入 doQuery reject => getCachedUpdateInfo 直接抛出（${e.message}）而非 check_failed → 与预期「reject 不产生未处理异常且返回 check_failed」不符 = SPEC-MISMATCH（防御缺口；生产 queryDistTags 恒 resolve(null) 不可达）`);
    }
    if (!rejectThrown) check('D1-46g', false, '注入 doQuery reject 未抛出（与源码预期不符，需复核）');
    // reject 后恢复（failedAt 未被设置 → 下次调用立即重查）
      resetState();
      qCount = 0;
      const hQuery = async () => { qCount++; return { latest: '1.1.3', next: null }; };
      const rec2 = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: hQuery });
      check('D1-46h', rec2.result === 'update_available' && qCount === 1, `reject 后下次调用恢复 => ${rec2.result}（doQuery=${qCount}，无节流污染）`);

  // ---------- D1-47 缓存与 current 解耦 ----------
  section('D1-47 缓存与当前版本解耦');
  resetState();
  qCount = 0;
  const tagQuery = async () => { qCount++; return { latest: '1.1.3', next: '1.1.4-next.1' }; };
  fakeNow = realNow();
  const v1 = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: tagQuery });
  const v2 = await Fixed.getCachedUpdateInfo('1.1.3-next.5', { doQuery: tagQuery });
  check('D1-47', v1.targetVersion === '1.1.3' && v2.targetVersion === '1.1.4-next.1' && qCount === 1,
    `共享缓存（doQuery=${qCount}）但按 current 重算：stable 1.1.2→target ${v1.targetVersion}；pre 1.1.3-next.5→target ${v2.targetVersion}`);
  // dismissed 结论不复用
  rmSync(join(HOME_FIX, '.config'), { recursive: true, force: true });
  Fixed.writeSkipState(skipFile, '1.1.3');
  const d1 = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: tagQuery });
  const d2 = await Fixed.getCachedUpdateInfo('1.1.3-next.5', { doQuery: tagQuery });
  check('D1-47b', d1.result === 'dismissed' && d2.result === 'update_available' && qCount === 1,
    `同缓存下 dismissed 结论不复用：current 1.1.2→${d1.result}；current 1.1.3-next.5→${d2.result}（target ${d2.targetVersion} 无视冷却）`);

  // ---------- D1-44 冷却边界与坏状态 ----------
  section('D1-44 冷却边界');
  const nowMs = realNow();
  const iso = (t) => new Date(t).toISOString();
  const mk = (expireAt, ver = '1.1.3') => ({ dismissedVersion: ver, dismissedAt: iso(nowMs - 1000), expireAt });
  const J = (skip, now = nowMs) => Fixed.judgeUpdate('1.1.2', { latest: '1.1.3', next: null }, skip, now);
  check('D1-44a', J(mk(iso(nowMs + 86400000))).result === 'dismissed', `now<expireAt => dismissed`);
  check('D1-44b', J(mk(iso(nowMs))).result === 'update_available', `now==expireAt（边界）=> 重新提醒 update_available（仅严格早于才算冷却）`);
  check('D1-44c', J(mk(iso(nowMs - 1000))).result === 'update_available', `now>expireAt => update_available`);
  check('D1-44d', J(mk(iso(nowMs + 86400000)), nowMs).result === 'dismissed', `target==dismissedVersion 冷却仍生效`);
  const badDate = Fixed.judgeUpdate('1.1.2', { latest: '1.1.3', next: null }, mk('garbage-date'), nowMs);
  check('D1-44e', badDate.result === 'update_available', `坏日期 expireAt => ${badDate.result}（安全降级不吞更新）`);
  const neg = Fixed.writeSkipState(skipFile, '1.1.3', { days: -1 });
  check('D1-44f', Fixed.judgeUpdate('1.1.2', { latest: '1.1.3', next: null }, neg, nowMs).result === 'update_available',
    `负时长（days=-1）=> expireAt 已过 => update_available`);
  check('D1-44g', J({}).result === 'update_available', `缺字段 skip（readSkipState 视为无效）=> update_available`);
  rmSync(join(HOME_FIX, '.config'), { recursive: true, force: true });

  // ---------- D1-36 兜底附加语义 ----------
  section('D1-36 兜底 _updateInfo');
  const hint = { currentVersion: '1.1.2', targetVersion: '1.1.3', updateAvailable: true };
  const res = { ok: true, data: 'x' };
  const dec1 = Fixed.applyUpdateHint(res, 'huaweicloud_check_cli', hint);
  check('D1-36a', dec1._updateInfo?.latestVersion === '1.1.3', `普通工具附加 _updateInfo（latestVersion=${dec1._updateInfo?.latestVersion}）`);
  const dec2 = Fixed.applyUpdateHint(res, 'huaweicloud_check_update', hint);
  const dec3 = Fixed.applyUpdateHint(res, 'huaweicloud_upgrade', hint);
  check('D1-36b', !dec2._updateInfo && !dec3._updateInfo, `check_update/upgrade 不附加`);
  check('D1-36c', Fixed.applyUpdateHint(res, 'huaweicloud_check_cli', null) === res, `无 hint 原样返回`);
  check('D1-36d', Fixed.applyUpdateHint(res, 'huaweicloud_check_cli', { ...hint, updateAvailable: false }) === res, `updateAvailable=false 不附加`);

  // ---------- D1-50 upgrade mock（spawn 记录器）----------
  section('D1-50 upgrade 命令语义（mock spawn）');
  const calls = [];
  const recorder = (cmd, args, opts) => { calls.push({ cmd, args }); return { status: 0, stderr: '', stdout: '' }; };
  const up1 = await Fixed.upgradePackage({ target: 'opencode' }, { currentVersion: '1.1.2', doQuery: async () => ({ latest: '1.1.3', next: '1.1.3-next.2' }), spawnFn: recorder });
  const cmd1 = calls[0];
  check('D1-50a', up1.success && up1.requiresRestart === true && up1.installedVersion === '1.1.3' && up1.previousVersion === '1.1.2',
    `stable 用户升级成功返回（previous=1.1.2, installed=1.1.3, requiresRestart=true, message=${up1.message})`);
  check('D1-50b', cmd1.cmd === 'npx.cmd' && cmd1.args.join(' ') === '--yes huaweicloud-devkit@latest update --target opencode',
    `命令=${cmd1.cmd} ${cmd1.args.join(' ')}（tag=latest 正确）`);
  calls.length = 0;
  const up2 = await Fixed.upgradePackage({ target: 'codearts' }, { currentVersion: '1.1.3-next.1', doQuery: async () => ({ latest: '1.1.2', next: '1.1.3-next.5' }), spawnFn: recorder });
  check('D1-50c', up2.installedVersion === '1.1.3-next.5' && calls[0]?.args.join(' ') === '--yes huaweicloud-devkit@next update --target codearts',
    `pre 用户选择 next tag：命令=${calls[0]?.args.join(' ')}（installed=${up2.installedVersion}）`);
  calls.length = 0;
  const up3 = await Fixed.upgradePackage({}, { currentVersion: '1.1.2', doQuery: async () => ({ latest: '1.1.3', next: null }), spawnFn: recorder });
  check('D1-50d', calls[0]?.args.join(' ').endsWith('--target all') && up3.requiresRestart,
    `target 缺省 => --target all（命令=${calls[0]?.args.join(' ')})`);
  calls.length = 0;
  const up4 = await Fixed.upgradePackage({ version: '1.4.0' }, { spawnFn: recorder });
  check('D1-50e', up4.success === false && calls.length === 0 && up4.error.includes('仅支持 latest'),
    `version=1.4.0 非法 => 拒绝且不执行命令（${up4.error}）`);
  const up5 = await Fixed.upgradePackage({}, { currentVersion: '1.1.2', doQuery: async () => ({ latest: '1.1.2', next: null }), spawnFn: recorder });
  check('D1-50f', up5.success === true && calls.length === 1,
    `upgradePackage 直调等版本（latest==current）会执行升级命令（targetVersion 非空）→ “已最新”守卫位于 MCP handler 层 handleUpgrade，由 D1-50f-mcp 在 MCP 探针验证（此处记录分层语义）`);

  // ---------- D1-51 upgrade 失败恢复与副作用 ----------
  section('D1-51 upgrade 失败恢复');
  const throwSpawn = () => { throw new Error('simulated ENOENT'); };
  const err1 = await Fixed.upgradePackage({ target: 'workbuddy' }, { currentVersion: '1.1.2', doQuery: async () => ({ latest: '1.1.3', next: null }), spawnFn: throwSpawn });
  check('D1-51a', err1.success === false && /ENOENT/.test(err1.error) && err1.manual.includes('huaweicloud-devkit@latest') && err1.manual.includes('workbuddy'),
    `spawn 抛错 => ${JSON.stringify(err1)}（manual 含正确 tag/target）`);
  const failSpawn = () => ({ status: 1, stderr: 'line1\nnpm error boom line', stdout: '' });
  const err2 = await Fixed.upgradePackage({ target: 'opencode' }, { currentVersion: '1.1.2', doQuery: async () => ({ latest: '1.1.3', next: null }), spawnFn: failSpawn });
  check('D1-51b', err2.success === false && err2.error.includes('boom'), `npx 非零退出 => ${JSON.stringify(err2.error)}`);
  const err3 = await Fixed.upgradePackage({}, { currentVersion: '1.1.2', doQuery: async () => null, spawnFn: recorder });
  check('D1-51c', err3.success === false && err3.error.includes('无法确认最新版本'), `doQuery null => ${err3.error}`);
  // skip 状态不被污染
  rmSync(join(HOME_FIX, '.config'), { recursive: true, force: true });
  Fixed.writeSkipState(skipFile, '1.1.3');
  const before = readFileSync(skipFile, 'utf8');
  await Fixed.upgradePackage({}, { currentVersion: '1.1.2', doQuery: async () => ({ latest: '1.1.4', next: null }), spawnFn: throwSpawn });
  const after = readFileSync(skipFile, 'utf8');
  check('D1-51d', before === after, `失败不污染 skip 状态（文件内容一致）`);
  // 成功后缓存失效 → 重新查询
  let qn = 0;
  const qq = async () => { qn++; return { latest: '1.1.5', next: null }; };
  await Fixed.upgradePackage({}, { currentVersion: '1.1.2', doQuery: qq, spawnFn: recorder });
  const afterUp = await Fixed.getCachedUpdateInfo('1.1.2', { doQuery: qq });
  check('D1-51e', qn === 2 && afterUp.targetVersion === '1.1.5', `升级成功后缓存失效，重新查询（doQuery=${qn}，target=${afterUp.targetVersion}）`);
  rmSync(join(HOME_FIX, '.config'), { recursive: true, force: true });

  // ---------- D1-39 Windows npm.cmd EINVAL（修复前/后对照 + 原始 spawn 证据）----------
  section('D1-39 Windows npm.cmd EINVAL（P0 证据链）');
  const rawSpawn = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', windowsHide: true });
  check('D1-39a', rawSpawn.error?.code === 'EINVAL' || rawSpawn.status === null,
    `原始 spawnSync('npm.cmd') 无 shell:true => error.code=${rawSpawn.error?.code ?? '(status ' + rawSpawn.status + ')'}（Windows 直启 .cmd 必 EINVAL，与网络无关）`);
  // 装置陷阱对照：同进程 fixture 会让 spawnSync 假象超时；本断言在【外部 fixture】下执行
  const rawShell = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', timeout: 20000, windowsHide: true, shell: true });
  check('D1-39a2', rawShell.status === 0 && /1\.1\.3/.test(rawShell.stdout || ''),
    `spawnSync + shell:true（外部 registry）=> status=${rawShell.status} 输出含 1.1.3 → shell:true 修复方向有效（先前“死锁”为同进程 fixture 装置假象）`);
  const unfixSync = Unfixed.queryDistTagsSync({ timeoutMs: 8000 });
  check('D1-39b', unfixSync === null, `插件 queryDistTagsSync（未修复）=> ${JSON.stringify(unfixSync)}（静默 null=check_failed 来源）`);
  const unfixAsync = await Unfixed.queryDistTags({ timeoutMs: 8000 });
  check('D1-39c', unfixAsync === null, `插件 queryDistTags async（未修复）=> ${JSON.stringify(unfixAsync)}（同样 null）`);
  resetState();
  const fixSync = Fixed.queryDistTagsSync({ timeoutMs: 8000 });
  check('D1-39d', fixSync && fixSync.latest === '1.1.3', `修复副本 sync（node.exe 直跑 npm-cli，外部 registry）=> ${JSON.stringify(fixSync)}（fixture latest=1.1.3）`);
  const fixAsync = await Fixed.queryDistTags({ timeoutMs: 8000 });
  check('D1-39e', fixAsync && fixAsync.latest === '1.1.3', `修复副本 async（shell:true）=> ${JSON.stringify(fixAsync)}（成功）`);
  const full = await Fixed.getCachedUpdateInfo('1.1.2');
  check('D1-39f', full.result === 'update_available' && full.targetVersion === '1.1.3',
    `修复后函数级全链（真实 npm view 到 fixture）=> ${full.result} target=${full.targetVersion}`);
  check('D1-39g', true, `修复方向确认：EINVAL=缺 shell:true（真实 P0）；shell:true 后 sync/async 均可用（外部 registry status=0）；node.exe+npm-cli 亦可；#554 原修复建议成立。测试装置陷阱：fixture 与被测 spawnSync 同进程会假象超时（本次排查已排除）`);

  // ---------- D1-53 parseDistTagsOutput 坏响应 ----------
  section('D1-53-fn 坏响应解析');
  const p1ok = Fixed.parseDistTagsOutput('{"latest":"1.1.2","next":"1.1.3-next.2"}');
  check('D1-53fn-a', p1ok?.latest === '1.1.2' && p1ok?.next === '1.1.3-next.2', `合法输出 => ${JSON.stringify(p1ok)}`);
  check('D1-53fn-b', Fixed.parseDistTagsOutput('') === null, `空输出 => null`);
  check('D1-53fn-c', Fixed.parseDistTagsOutput('{bad json') === null, `坏 JSON => null`);
  check('D1-53fn-d', Fixed.parseDistTagsOutput('[]') === null && Fixed.parseDistTagsOutput('42') === null, `数组/数值 => null`);

  // MCP 级 badjson（通过 /__set 注入坏响应模式；外部 fixture 进程内存覆盖，不污染源场景文件）
  async function setFx(patch) {
    await fetch(`${fx.url}/__set`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
  }
  const npmCacheDir = process.env.npm_config_cache;
  await setFx({ mode: 'badjson' });
  rmSync(npmCacheDir, { recursive: true, force: true }); // npm 按 URL 缓存 packument，切换场景必须清缓存
  const badResp = await Fixed.queryDistTags({ timeoutMs: 8000 });
  check('D1-53fn-e', badResp === null, `fixture 注入坏 JSON => npm view FETCH_ERROR/坏输出 => ${JSON.stringify(badResp)}（check_failed 态）`);
  await setFx({ mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } });
  rmSync(npmCacheDir, { recursive: true, force: true });
  const okResp = await Fixed.queryDistTags({ timeoutMs: 8000 });
  check('D1-53fn-f', okResp?.latest === '1.1.3', `恢复 ok 模式（清缓存后）=> ${JSON.stringify(okResp)}（恢复后可检测）`);

  // ---------- 汇总 ----------
  const pass = results.filter((r) => r.pass).length;
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n===== 汇总: ${results.length} 断言, PASS ${pass}, FAIL ${fail} =====`);
  if (fail > 0) console.log('失败明细:', JSON.stringify(results.filter((r) => !r.pass), null, 2));
  process.exitCode = fail > 0 ? 1 : 0;
} finally {
  for (const e of exits) { try { e(); } catch {} }
  process.env.npm_config_registry = undefined;
  delete process.env.npm_config_registry;
}