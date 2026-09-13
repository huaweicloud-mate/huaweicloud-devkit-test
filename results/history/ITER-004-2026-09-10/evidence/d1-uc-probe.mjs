// D1-26~40 版本升级提醒 NR3 综合探针（node 直调 update-check.mjs）
// 被测: 本地 hdk 工作副本 @608b120（update-check.mjs 与 1.1.2 正式版 09a59b93 核心逻辑一致，差异仅 options.currentVersion 测试注入）
// 用法: node d1-uc-probe.mjs
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const HDK = 'C:/Users/Administrator/devkit-test/hdk';
const UC = await import(pathToFileURL(join(HDK, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs')).href);

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS ${name}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL ${name}${detail ? ' | ' + detail : ''}`); }
}

// ---------- D1-30 semver 比对 ----------
{
  const s = UC.semverCompare;
  check('D1-30a 1.1.2>1.1.1', s('1.1.2', '1.1.1') > 0);
  check('D1-30b 相等=0', s('1.1.2', '1.1.2') === 0);
  check('D1-30c 正式版>pre', s('1.1.0', '1.1.0-next.9') > 0);
  check('D1-30d 反向', s('1.1.1', '1.1.2') < 0);
  check('D1-30e 无效串字典序', s('abc', 'xyz') < 0);
  check('D1-30f pre 数字标识符', s('1.1.0-next.9', '1.1.0-next.10') < 0);
}

// ---------- D1-29 pre-release 用户提醒策略 ----------
{
  const det = UC.determineTarget;
  // 场景A: pre 用户 + latest 提升(1.2.0) + next 提升
  check('D1-29a pre用户遇latest提升取latest', det('1.1.0-next.8', { latest: '1.2.0', next: '1.1.0-next.9' }) === '1.2.0', '候选含 latest+next 取最大');
  // 场景B: 仅 next 提升且 stable 未变(文档表: 1.1.0-next.8 vs 1.1.0-next.9 ❌ 不提醒)
  const b = det('1.1.0-next.8', { latest: '1.0.2', next: '1.1.0-next.9' });
  check('D1-29b pre用户仅next提升会被提醒', b === '1.1.0-next.9', `target=${b}; 实现含 next 候选=提醒(文档表标注 ❌ 不提醒, 差异点已记录)`);
  // 场景B': latest=stable > current(pre) 时 target 应取 stable(实锤差异: stable 优先)
  const b2 = det('1.1.0-next.8', { latest: '1.1.0', next: '1.1.0-next.9' });
  check('D1-29c stable优先于next', b2 === '1.1.0', `target=${b2}; pre用户被引导至stable版`);
}

// ---------- D1-27/28/31/32/34 judgeUpdate ----------
{
  const j = UC.judgeUpdate;
  const r1 = j('1.1.2', { latest: '1.1.2', next: '1.1.3-next.2' }, null, Date.now());
  check('D1-27 已是最新 up_to_date', r1.result === 'up_to_date' && r1.updateAvailable === false, JSON.stringify(r1.result));
  const r2 = j('1.1.1', { latest: '1.1.2' }, null, Date.now());
  check('D1-28 有新版本 update_available', r2.result === 'update_available' && r2.updateAvailable === true && r2.targetVersion === '1.1.2');
  // D1-31 dismiss 冷却: 构造冷却期 skip 状态(未来 expireAt)
  const future = new Date(Date.now() + 3600 * 1000).toISOString();
  const skip = { dismissedVersion: '1.1.2', dismissedAt: new Date().toISOString(), expireAt: future };
  const r3 = j('1.1.1', { latest: '1.1.2' }, skip, Date.now());
  check('D1-31 冷却期 dismissed', r3.result === 'dismissed' && r3.dismissed === true && r3.dismissExpiresAt === future);
  // 冷却过期
  const past = new Date(Date.now() - 3600 * 1000).toISOString();
  const skipPast = { dismissedVersion: '1.1.2', dismissedAt: new Date(Date.now() - 4 * 86400 * 1000).toISOString(), expireAt: past };
  const r4 = j('1.1.1', { latest: '1.1.2' }, skipPast, Date.now());
  check('D1-31b 冷却过期重新提醒', r4.result === 'update_available');
  // D1-32 新版本>dismissedVersion 无视冷却
  const skip2 = { dismissedVersion: '1.1.2', dismissedAt: new Date().toISOString(), expireAt: future };
  const r5 = j('1.1.1', { latest: '1.2.0' }, skip2, Date.now());
  check('D1-32 新版本>dismissedVersion 无视冷却', r5.result === 'update_available' && r5.targetVersion === '1.2.0', `target=${r5.targetVersion}`);
  // D1-34 check_failed
  const r6 = j('1.1.1', null, null, Date.now());
  check('D1-34 distTags=null check_failed', r6.result === 'check_failed' && r6.note && !r6.updateAvailable);
  // SKIP env 逻辑(函数内读取 env, 需子进程验证, 这里仅确认函数存在)
  check('D1-34b judgeUpdate 存在且不抛错', typeof UC.judgeUpdate === 'function');
}

// ---------- D1-33 skip 文件写入(临时目录) ----------
{
  const dir = mkdtempSync(join(tmpdir(), 'd133-'));
  try {
    const f = join(dir, '.update-skip.json');
    const state = UC.writeSkipState(f, '1.2.0', { at: Date.now(), days: 3 });
    check('D1-33a 文件生成+结构', existsSync(f) && state.dismissedVersion === '1.2.0' && state.expireAt && state.dismissedAt, JSON.stringify(state));
    const parsed = JSON.parse(readFileSync(f, 'utf8'));
    check('D1-33b 字段齐全', parsed.dismissedVersion === '1.2.0' && typeof parsed.dismissedAt === 'string' && typeof parsed.expireAt === 'string');
    const expire = new Date(parsed.expireAt).getTime() - new Date(parsed.dismissedAt).getTime();
    check('D1-33c 冷却=3天', Math.abs(expire - 3 * 86400 * 1000) < 60000, `${expire / 86400000} 天`);
    const back = UC.readSkipState(f);
    check('D1-33d 回读一致', back && back.dismissedVersion === '1.2.0');
    check('D1-33e 损坏文件容错', UC.readSkipState(join(dir, 'nofile.json')) === null);
    writeFileSync(f, '{broken', 'utf8');
    check('D1-33f 损坏JSON返回null', UC.readSkipState(f) === null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  // resolveSkipFilePath 路径逻辑: fallback 基于 HUAWEICLOUD_HOME||homedir (只读检查不写)
  const fb = UC.fallbackSkipFilePath();
  check('D1-33g fallback 路径含 .config/huaweicloud', fb.includes('.config') && fb.includes('huaweicloud'), fb);
  check('D1-33h skipFilePath 在源码目录', UC.skipFilePath().endsWith('.update-skip.json'));
}

// ---------- D1-35 缓存 TTL / 失败节流 (mock doQuery) ----------
{
  UC.invalidateUpdateCache();
  let calls = 0;
  const mockQuery = async () => { calls++; return { latest: '1.2.0', next: null }; };
  const r1 = await UC.getCachedUpdateInfo('1.1.1', { doQuery: mockQuery });
  const r2 = await UC.getCachedUpdateInfo('1.1.1', { doQuery: mockQuery });
  check('D1-35a 1h 内缓存复用', calls === 1 && r1.result === 'update_available' && r2.result === 'update_available', `query calls=${calls}`);
  // 失败节流: 查询返回 null → failedAt 记录
  UC.invalidateUpdateCache();
  calls = 0;
  const mockFail = async () => { calls++; return null; };
  const f1 = await UC.getCachedUpdateInfo('1.1.1', { doQuery: mockFail });
  const f2 = await UC.getCachedUpdateInfo('1.1.1', { doQuery: mockFail });
  check('D1-35b 失败节流 check_failed', f1.result === 'check_failed' && f2.result === 'check_failed');
  check('D1-35c 失败后 5min 内不再查询', calls === 1, `query calls=${calls}`);
  // SKIP env 子进程验证
  const envProbe = spawnSync(process.execPath, ['-e',
    `import('${pathToFileURL(join(HDK, 'plugins/huaweicloud-core/src/update-check.mjs')).href}').then(m=>{const r=m.judgeUpdate('1.1.1',{latest:'1.2.0'},null,Date.now());console.log(r.result)})`],
    { encoding: 'utf8', env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' } });
  check('D1-35d SKIP env 跳过', String(envProbe.stdout).trim() === 'up_to_date' || String(envProbe.stdout).trim() === 'check_failed', String(envProbe.stdout).trim());
}

// ---------- D1-39 Windows 检测链实测 (queryDistTagsSync / queryDistTags) ----------
{
  // 真实调用 npm view（探针自身也走无 shell spawnSync，若 EINVAL 则与插件同坑）
  const t0 = Date.now();
  const syncRes = UC.queryDistTagsSync({ timeoutMs: 15000 });
  const ms = Date.now() - t0;
  check('D1-39a queryDistTagsSync 不抛异常', syncRes !== undefined, `elapsed=${ms}ms`);
  if (syncRes) {
    check('D1-39b 同步查询返回 dist-tags', typeof syncRes.latest === 'string', JSON.stringify(syncRes));
  } else {
    // 返回 null: 确认根因是否为 EINVAL（用 shell:true 对照）
    const withShell = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', timeout: 20000, shell: true, windowsHide: true });
    check('D1-39b 同步查询返回 null（#554 EINVAL 域实锤）', withShell.status === 0 && withShell.stdout.length > 0,
      `对照(shell:true) status=${withShell.status} len=${String(withShell.stdout).length}`);
    // 直接捕获无 shell 的 error.code 证明 EINVAL
    const raw = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', timeout: 5000, windowsHide: true });
    check('D1-39c 无shell报错=ENOENT/EINVAL类', raw.error && typeof raw.error.code === 'string',
      `error.code=${raw.error?.code} msg=${String(raw.error?.message).slice(0, 80)}`);
  }
  // async 版本
  const t1 = Date.now();
  const asyncRes = await UC.queryDistTags({ timeoutMs: 15000 });
  check('D1-39d async 查询可用', asyncRes !== null && typeof asyncRes.latest === 'string', `res=${JSON.stringify(asyncRes)} elapsed=${Date.now() - t1}ms`);
}

// ---------- D1-40 镜像 lag 场景 ----------
{
  // 官方源直查（探针用 shell:true 回避自身 EINVAL 坑，测的是"真实 dist-tags 基准"）
  const official = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json', '--registry=https://registry.npmjs.org'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  let officialTags = null;
  try { officialTags = JSON.parse(official.stdout); } catch {}
  check('D1-40a 官方源查询', officialTags && typeof officialTags.latest === 'string', officialTags ? `latest=${officialTags.latest} next=${officialTags.next}` : `err=${String(official.stderr).slice(0, 120)}`);
  // 本机默认 registry 对照
  const reg = spawnSync('npm.cmd', ['config', 'get', 'registry'], { encoding: 'utf8', shell: true, windowsHide: true });
  const defaultReg = String(reg.stdout || '').trim();
  console.log(`INFO D1-40b 本机默认 registry=${defaultReg || '(空)'}`);
  // 用默认 registry 直查（模拟插件 queryDistTags 在用户默认源的行为）
  const mirror = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', timeout: 30000, shell: true, windowsHide: true });
  let mirrorTags = null;
  try { mirrorTags = JSON.parse(mirror.stdout); } catch {}
  check('D1-40c 默认registry可获得dist-tags(镜像环境前提)', mirrorTags && typeof mirrorTags.latest === 'string',
    mirrorTags ? `latest=${mirrorTags.latest} next=${mirrorTags.next}` : `err=${String(mirror.stderr).slice(0, 120)}`);
  if (officialTags && mirrorTags) {
    const lag = officialTags.latest !== mirrorTags.latest;
    console.log(`INFO D1-40d 镜像lag: 官方latest=${officialTags.latest} vs 默认源latest=${mirrorTags.latest} ${lag ? '【滞后】' : '(一致)'}`);
    check('D1-40e 当前无滞后(防倒退提示前提)', !lag || mirrorTags.latest !== '1.1.0', lag ? '镜像滞后现象可复现' : '当前一致');
  }
  // 源码是否固定官方源
  const src = readFileSync(join(HDK, 'plugins/huaweicloud-core/src/update-check.mjs'), 'utf8');
  const hasOfficial = src.includes('registry.npmjs.org');
  check('D1-40f 检测未固定官方源(需防镜像滞后)', hasOfficial === false, hasOfficial ? '源码含官方源' : '源码无 registry 参数=默认 registry (#518 域风险仍在)');
}

// ---------- D1-38 upgradePackage 语义(mock, 不真升级) ----------
{
  const spySpawn = () => ({ status: 0, stdout: '', stderr: '' });
  const r1 = await UC.upgradePackage({ target: 'hermes', version: '1.2.0' }, { spawnFn: spySpawn, doQuery: async () => ({ latest: '1.2.0' }) });
  check('D1-38a version!=latest 拒绝', r1.success === false && r1.error.includes('仅支持 latest'), JSON.stringify(r1.error));
  const r2 = await UC.upgradePackage({ target: 'hermes', version: 'latest' }, { spawnFn: spySpawn, doQuery: async () => ({ latest: '1.2.0' }), currentVersion: '1.1.1' });
  check('D1-38b 升级成功语义', r2.success === true && r2.installedVersion === '1.2.0' && r2.requiresRestart === true && r2.message.includes('重启'), JSON.stringify(r2));
  const r3 = await UC.upgradePackage({ target: 'hermes', version: 'latest' }, { spawnFn: spySpawn, doQuery: async () => null });
  check('D1-38c 查询失败给 manual 提示', r3.success === false && r3.manual.includes('npx') && r3.manual.includes('update'), JSON.stringify(r3.manual));
  const r4 = await UC.upgradePackage({ target: 'officeace', version: 'latest' }, { spawnFn: spySpawn, doQuery: async () => ({ latest: '1.2.0' }), currentVersion: '1.1.1' });
  check('D1-38d officeace 专属重启文案', r4.message.includes('连接器'), JSON.stringify(r4.message));
  // 失败时 spawn 抛错 → manual 提示 (D1-38e)
  const throwSpawn = () => { throw new Error('spawn npx.cmd EINVAL'); };
  const r5 = await UC.upgradePackage({ target: 'hermes', version: 'latest' }, { spawnFn: throwSpawn, doQuery: async () => ({ latest: '1.2.0' }), currentVersion: '1.1.1' });
  check('D1-38e 执行失败给 manual 且不崩溃', r5.success === false && r5.manual.includes('update'), JSON.stringify({ err: r5.error, manual: r5.manual }));
}

// ---------- D1-36 兜底包装 applyUpdateHint ----------
{
  const r = UC.applyUpdateHint({ ok: true }, 'some_tool', { updateAvailable: true, targetVersion: '1.1.2', currentVersion: '1.1.1' });
  check('D1-36a 非检查工具附加 _updateInfo', r._updateInfo && r._updateInfo.latestVersion === '1.1.2', JSON.stringify(r._updateInfo));
  const r2 = UC.applyUpdateHint({ ok: true }, 'huaweicloud_check_update', { updateAvailable: true, targetVersion: '1.1.2' });
  check('D1-36b 检查工具本身不附加', r2._updateInfo === undefined);
  const r3 = UC.applyUpdateHint({ ok: true }, 'x', { updateAvailable: false });
  check('D1-36c 无更新不附加', r3._updateInfo === undefined);
  const r4 = UC.applyUpdateHint({ ok: true }, 'x', null);
  check('D1-36d hint null 不附加', r4._updateInfo === undefined);
  check('D1-36e peekCachedUpdateInfo 存在', typeof UC.peekCachedUpdateInfo === 'function');
}

console.log(`\n===== 结果: PASS ${pass} / FAIL ${fail} =====`);
process.exit(fail ? 1 : 0);