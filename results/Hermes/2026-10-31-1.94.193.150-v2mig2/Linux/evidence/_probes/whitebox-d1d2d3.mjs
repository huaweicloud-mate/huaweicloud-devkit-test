// v2mig2 补测 —— 白盒探针（真实执行，非 mock 契约探针）
// 覆盖：D1-32 / D1-59 / D1-60 / D1-61 / D1-63 / D1-64 / D2-23 / D3-C10
// 直调 dist 产物（v2 fcfe047f, package 2.0.0）导出函数，逐条核对迁移用例断言。
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';

const SRC = process.argv[2];
const OUTBASE = process.argv[3]; // .../evidence
const __dirname = dirname(fileURLToPath(import.meta.url));

const U = await import(pathToFileURL(`${SRC}/update-check.js`).href);
const updateInstalledSrc = `${SRC}/update-installed.js`;
const R = await import(pathToFileURL(`${SRC}/telemetry/agent-registry.js`).href);
const D = await import(pathToFileURL(`${SRC}/telemetry/agent-detect.js`).href);
const AR = await import(pathToFileURL(`${SRC}/auth/agent-registration.js`).href);
const M = await import(pathToFileURL(`${SRC}/search-market.js`).href);

const results = [];

function rec(id, status, lines) {
  results.push({ id, status, lines });
}

function okLines(assertions) {
  // assertions: [{name, pass, detail}]
  const lines = [];
  let all = true;
  for (const a of assertions) {
    lines.push(`${a.pass ? 'PASS' : 'FAIL'}: ${a.name}${a.detail ? ' | ' + a.detail : ''}`);
    if (!a.pass) all = false;
  }
  return { status: all ? 'PASS' : 'FAIL', lines };
}

// ============ D1-32 新版本>dismissedVersion 无视冷却 ============
{
  const now = Date.now();
  const expireAt = new Date(now + 3 * 86400000).toISOString(); // 冷却期内
  const skip = { dismissedVersion: '1.1.2', dismissedAt: '2026-10-01T00:00:00.000Z', expireAt };
  const inCooldown = U.judgeUpdate('1.1.0', { latest: '1.1.2', next: null }, skip, now);
  const aboveCooldown = U.judgeUpdate('1.1.0', { latest: '1.2.0', next: null }, skip, now);
  const a = [
    { name: 'D1-32 冷却期内 target==dismissedVersion → dismissed', pass: inCooldown.result === 'dismissed' && inCooldown.dismissed === true, detail: JSON.stringify(inCooldown) },
    { name: 'D1-32 冷却期内 target(1.2.0)>dismissedVersion(1.1.2) → 无视冷却 update_available', pass: aboveCooldown.result === 'update_available' && aboveCooldown.updateAvailable === true && aboveCooldown.targetVersion === '1.2.0', detail: JSON.stringify(aboveCooldown) },
  ];
  const { status, lines } = okLines(a);
  rec('D1-32', status, lines);
}

// ============ D1-59 SKIP_UPDATE 环境变量跳过升级检测 ============
{
  const a = [];
  const prev = process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
  process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE = '1';
  const rSkip = U.judgeUpdate('1.0.0', { latest: '1.2.0', next: '1.2.0' }, null);
  // env=1 → buildResult(current, distTags) 默认 result='up_to_date'，无需 target
  a.push({ name: 'D1-59 env=1 → result=up_to_date（跳过检测）', pass: rSkip.result === 'up_to_date' && rSkip.updateAvailable === false, detail: JSON.stringify(rSkip) });

  // 不发起 registry 查询（getCachedUpdateInfo 短路）
  let calls = 0;
  const cached = await U.getCachedUpdateInfo('1.0.0', { doQuery: async () => { calls++; return { latest: '1.2.0', next: null }; } });
  a.push({ name: 'D1-59 env=1 → getCachedUpdateInfo 不发起 registry 查询', pass: calls === 0 && cached.result === 'up_to_date', detail: `doQuery调用次数=${calls}` });

  delete process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
  const rRestore = U.judgeUpdate('1.0.0', { latest: '1.2.0', next: null }, null);
  a.push({ name: 'D1-59 unset 后恢复真实检测', pass: rRestore.result === 'update_available' && rRestore.updateAvailable === true, detail: JSON.stringify(rRestore) });

  if (prev !== undefined) process.env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE = prev;
  const { status, lines } = okLines(a);
  rec('D1-59', status, lines);
}

// ============ D1-60 HTTP 查询路径与自定义 registry（fetch 版） ============
{
  const a = [];
  // 子断言 1：自定义 registry + 去尾斜杠
  let hitPath = '';
  const srv = createServer((req, res) => {
    hitPath = req.url || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ latest: '1.2.0', next: '1.3.0' }));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  const prevReg = process.env.HUAWEICLOUD_NPM_REGISTRY;
  process.env.HUAWEICLOUD_NPM_REGISTRY = `http://127.0.0.1:${port}/`; // 尾斜杠
  const tags = await U.queryDistTagsFetch();
  const noTrailing = !hitPath.startsWith('//') && hitPath === '/-/package/huaweicloud-devkit/dist-tags';
  a.push({ name: 'D1-60 registry 取 HUAWEICLOUD_NPM_REGISTRY 且去尾斜杠', pass: tags && tags.latest === '1.2.0' && tags.next === '1.3.0' && noTrailing, detail: `hitPath=${hitPath} tags=${JSON.stringify(tags)}` });
  srv.close();
  delete process.env.HUAWEICLOUD_NPM_REGISTRY;

  // 子断言 2：超时 abort 返回 null 不抛错（挂起 server 注入 proxy 故障）
  const hang = createServer(() => {});
  await new Promise((r) => hang.listen(0, '127.0.0.1', r));
  const port2 = hang.address().port;
  process.env.HUAWEICLOUD_NPM_REGISTRY = `http://127.0.0.1:${port2}`;
  const t0 = Date.now();
  let tags2, threw = false, threwMsg = '';
  try {
    tags2 = await Promise.race([
      U.queryDistTagsFetch({ timeoutMs: 400 }),
      new Promise((r) => setTimeout(() => r('__STILL_PENDING__'), 2500)),
    ]);
  } catch (e) { threw = true; threwMsg = e.message; tags2 = '__THREW__'; }
  const dt = Date.now() - t0;
  // 期望：abort 生效 → 400ms 内返回 null；实际：abort signal 未接进 fetchWithProxy → 挂起超时
  const abortWorks = !threw && tags2 === null && dt < 2500;
  a.push({ name: 'D1-60 超时 abort 返回 null（400ms abort，应 <2.5s 返回 null）', pass: abortWorks, detail: `返回=${JSON.stringify(tags2)} 抛错=${threw ? threwMsg : '否'} 耗时=${dt}ms` });

  if (prevReg !== undefined) process.env.HUAWEICLOUD_NPM_REGISTRY = prevReg;
  try { hang.closeAllConnections?.(); hang.close(); } catch {}
  // 首个子断言的 server 也关闭 keep-alive 连接
  try { srv.closeAllConnections?.(); } catch {}
  const { status, lines } = okLines(a);
  rec('D1-60', status, lines);
}

// ============ D1-61 升级重启文案 officeace 分支 ============
{
  const UP = (await import(pathToFileURL(`${SRC}/update-check.js`).href)).upgradePackage;
  const mk = (target) => UP({ target, version: 'latest' }, {
    doQuery: async () => ({ latest: '2.0.1', next: null }),
    spawnFn: () => ({ status: 0, stdout: '', stderr: '' }),
    currentVersion: '2.0.0',
  });
  const officeace = await mk('officeace');
  const hermes = await mk('hermes');
  const a = [
    { name: 'D1-61 officeace → 打开连接器/我的连接器/重新连接', pass: officeace.success === true && /打开连接器/.test(officeace.message) && /我的连接器/.test(officeace.message) && /重新连接/.test(officeace.message), detail: officeace.message },
    { name: 'D1-61 其他(hermes) → 请重启当前会话', pass: hermes.success === true && /重启当前会话/.test(hermes.message), detail: hermes.message },
    { name: 'D1-61 均 requiresRestart=true', pass: officeace.requiresRestart === true && hermes.requiresRestart === true, detail: `officeace=${officeace.requiresRestart} hermes=${hermes.requiresRestart}` },
    { name: 'D1-61 升级非 all 目标拒绝非法注入（附带 verify）', pass: (await mk('nonexistent-agent')).success === false, detail: '非法 target 被拒' },
  ];
  const { status, lines } = okLines(a);
  rec('D1-61', status, lines);
}

// ============ D1-63 安装版本读取双回退 ============
{
  const a = [];
  const scenarios = [
    { name: '仅 pluginRoot 有 package.json', pluginV: '1.2.3', rootV: null, expect: '1.2.3' },
    { name: '仅 packageRoot 有 package.json', pluginV: null, rootV: '4.5.6', expect: '4.5.6' },
    { name: '两处都无', pluginV: null, rootV: null, expect: null },
  ];
  for (const s of scenarios) {
    const tmp = mkdtempSync(join(tmpdir(), 'riv-'));
    const distDir = join(tmp, 'plugins', 'huaweicloud-core', 'dist');
    mkdirSync(distDir, { recursive: true });
    const copied = join(distDir, 'update-installed.js');
    copyFileSync(updateInstalledSrc, copied);
    if (s.pluginV) {
      const pkgDir = join(tmp, 'plugins', 'huaweicloud-core');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({ name: 'x', version: s.pluginV, type: 'module' }));
    }
    if (s.rootV) writeFileSync(join(tmp, 'package.json'), JSON.stringify({ name: 'y', version: s.rootV, type: 'module' }));
    const m = await import(pathToFileURL(copied).href + '?t=' + Date.now() + Math.random());
    const got = m.readInstalledVersion();
    a.push({ name: `D1-63 ${s.name}`, pass: got === s.expect, detail: `expect=${JSON.stringify(s.expect)} got=${JSON.stringify(got)}` });
    rmSync(tmp, { recursive: true, force: true });
  }
  // 真实 dist 位置双回退一致性：读到的应为 2.0.0（packageRoot=hdk/package.json）
  const real = U.readInstalledVersion();
  a.push({ name: 'D1-63 真实 dist 读回版本 = 2.0.0', pass: real === '2.0.0', detail: `got=${real}` });
  const { status, lines } = okLines(a);
  rec('D1-63', status, lines);
}

// ============ D1-64 agent 自动检测匹配与版本 ============
{
  const a = [];
  const officeAce = R.findAgentById('officeace');
  const hermesAgent = R.findAgentById('hermes');
  const copilot = R.findAgentById('github-copilot');
  a.push({ name: 'D1-64 AGENTS 注册表含 officeace/hermes', pass: Boolean(officeAce) && Boolean(hermesAgent), detail: `AGENTS 总数=${R.AGENTS.length}` });
  a.push({ name: 'D1-64 matchAgent(officeace, clientName) → true', pass: R.matchAgent(officeAce, { name: 'office-claw-mcp-connector-probe' }) === true && R.matchAgent(officeAce, { name: 'officeace-agent' }) === true, detail: 'clientNames 匹配' });
  a.push({ name: 'D1-64 matchAgent(hermes, name=hermes) → true', pass: R.matchAgent(hermesAgent, { name: 'hermes' }) === true, detail: 'id 小写匹配' });
  a.push({ name: 'D1-64 matchAgent 未知 clientInfo（无 path/env/clientName 命中）→ false', pass: R.matchAgent(copilot, { name: 'zzz-not-an-agent' }) === false, detail: 'github-copilot 无 pathPatterns/env 命中' });
  // detectVersion: null versionConfig → null；hermes type → 走 detectHermesVersion
  const dvNull = R.detectVersion(null);
  const dvHermes = R.detectVersion({ type: 'hermes' });
  a.push({ name: 'D1-64 detectVersion(null) → null', pass: dvNull === null, detail: `got=${dvNull}` });
  a.push({ name: 'D1-64 detectVersion(hermes) 返回字符串或 null（无环境则 null 兜底）', pass: dvHermes === null || typeof dvHermes === 'string', detail: `got=${JSON.stringify(dvHermes)}` });
  // detectAgent：已知 clientInfo 映射
  const idHermes = D.detectAgent({ name: 'hermes' });
  a.push({ name: 'D1-64 detectAgent(hermes) → harness=hermes', pass: idHermes.harness === 'hermes' && typeof idHermes.version === 'string', detail: JSON.stringify(idHermes) });

  // 未知 agent 兜底：在净化 env（剥离 hermes/codex 等探测 envVar）+ 中性路径（无 /hermes/ 段）下调 detectAgent
  // 否则本机 Hermes 测试环境会命中 HERMES_SESSION_ID / path /hermes/，兜底分支不可达。
  const neutral = mkdtempSync(join(tmpdir(), 'neutral-'));
  mkdirSync(join(neutral, 'telemetry'), { recursive: true });
  mkdirSync(join(neutral, 'lib'), { recursive: true });
  for (const [rel, dest] of [
    ['telemetry/agent-detect.js', join(neutral, 'telemetry', 'agent-detect.js')],
    ['telemetry/agent-registry.js', join(neutral, 'telemetry', 'agent-registry.js')],
    ['telemetry/agent-versions.js', join(neutral, 'telemetry', 'agent-versions.js')],
    ['telemetry/agent-versions-desktop.js', join(neutral, 'telemetry', 'agent-versions-desktop.js')],
    ['lib/as-text.js', join(neutral, 'lib', 'as-text.js')],
  ]) {
    copyFileSync(join(SRC, rel), dest);
  }
  const childEnv = { ...process.env };
  for (const k of Object.keys(childEnv)) {
    if (/^(HERMES_|AGENT_|CODEX|CODE_ARTS|CODEARTS|OPENCODE|DSH_|WORK_?BUDDY|WORKBUDDY|ATOM|OFFICE|OPENCLAW|CURSOR|CLAUDE|CLINE|WINDSURF|KIMI|GEMINI|AUGMENT|AIDER|LINGMA|AMAZON|CONTINUE|COPILOT)/i.test(k)) delete childEnv[k];
  }
  const neutralUrl = pathToFileURL(join(neutral, 'telemetry', 'agent-detect.js')).href;
  const script = `import { detectAgent } from ${JSON.stringify(neutralUrl)}; console.log(JSON.stringify(detectAgent({ name: 'unknown-agent-xyz' })));`;
  const sr = spawnSync(process.execPath, ['--input-type=module', '-e', script], { env: childEnv, encoding: 'utf8', timeout: 30000 });
  let fallbackOk = false, fallbackDetail = '';
  if (sr.status === 0) {
    try {
      const parsed = JSON.parse(String(sr.stdout).trim());
      fallbackOk = parsed.harness === 'unknown-agent-xyz' && parsed.version === '0.0.0';
      fallbackDetail = JSON.stringify(parsed);
    } catch (e) { fallbackDetail = 'parse fail: ' + String(sr.stdout); }
  } else {
    fallbackDetail = 'spawn exit ' + sr.status + ': ' + String(sr.stderr).slice(0, 200);
  }
  a.push({ name: 'D1-64 detectAgent 未知 → 兜底 clientInfo.name + version 0.0.0（净化 env + 中性路径）', pass: fallbackOk, detail: fallbackDetail });
  rmSync(neutral, { recursive: true, force: true });

  const { status, lines } = okLines(a);
  rec('D1-64', status, lines);
}

// ============ D2-23 agent 注册状态 ============
{
  const a = [];
  const targets = AR.SUPPORTED_AGENT_TARGETS;
  a.push({ name: 'D2-23 SUPPORTED_AGENT_TARGETS = 11 目标', pass: Array.isArray(targets) && targets.length === 11, detail: targets.join(',') });
  const res = AR.getAgentRegistrationStatuses('all');
  const keys = Object.keys(res.agents);
  a.push({ name: 'D2-23 getAgentRegistrationStatuses(all) 返回 11 目标', pass: res.target === 'all' && keys.length === 11, detail: keys.join(',') });
  a.push({ name: 'D2-23 返回结构每项为 {configured:boolean}', pass: keys.every((k) => res.agents[k] && typeof res.agents[k].configured === 'boolean'), detail: JSON.stringify(res.agents) });
  a.push({ name: 'D2-23 与 SUPPORTED_AGENT_TARGETS 一一对应', pass: keys.sort().join(',') === [...targets].sort().join(','), detail: '' });
  const { status, lines } = okLines(a);
  rec('D2-23', status, lines);
}

// ============ D3-C10 市场分类列表 ============
{
  const a = [];
  let cats, search;
  let err = null;
  try {
    cats = await M.getMarketplaceCategories();
  } catch (e) { err = 'getMarketplaceCategories: ' + e.message; }
  a.push({ name: 'D3-C10 getMarketplaceCategories → ok + 非空分类列表（真实网络）', pass: !err && cats && cats.ok === true && Array.isArray(cats.categories) && cats.categories.length > 0, detail: err || `分类数=${cats.categories.length} [${cats.categories.slice(0, 8).join(',')}...]` });
  if (cats && Array.isArray(cats.categories) && cats.categories.length > 0) {
    try {
      search = await M.searchMarketplace('', cats.categories[0]);
    } catch (e2) { err = (err || '') + ' | searchMarketplace: ' + e2.message; }
    const allMatch = search && search.category === cats.categories[0] && Array.isArray(search.results) && search.results.every((r) => r.category === cats.categories[0]);
    a.push({ name: 'D3-C10 searchMarketplace(category) 过滤与分类列表一致', pass: Boolean(allMatch) && search.count >= 0, detail: search ? `count=${search.count} 全部category=${cats.categories[0]}=${allMatch}` : (err || '') });
  } else {
    a.push({ name: 'D3-C10 searchMarketplace 过滤（跳过：分类列表为空）', pass: false, detail: '无分类列表' });
  }
  const { status, lines } = okLines(a);
  rec('D3-C10', status, lines);
}

// ============ 落盘 evidence ============
const executedAt = new Date().toISOString();
for (const r of results) {
  const dir = join(OUTBASE, r.id);
  mkdirSync(dir, { recursive: true });
  const body = `=====CASE ${r.id} =====\nexecutedAt=${executedAt}\nstatus=${r.status}\n${r.lines.join('\n')}\n=====CASE ${r.id} RESULT: ${r.status} =====\n`;
  writeFileSync(join(dir, 'stdout.log'), body);
  writeFileSync(join(dir, 'stdout.txt'), body);
  console.log(`[${r.id}] ${r.status}`);
}

const summary = Object.fromEntries(results.map((r) => [r.id, r.status]));
writeFileSync(join(OUTBASE, '_probes', 'whitebox-d1d2d3.result.json'), JSON.stringify({ executedAt, summary }, null, 1));
console.log('=== WHITEBOX D1/D2/D3 DONE ===');
console.log(JSON.stringify(summary));
// 显式退出：本地 mock HTTP server 的 undici keep-alive 连接会阻止事件循环自然结束
process.exit(0);