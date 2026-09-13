// D1 版本升级提醒——真实 MCP 闭环探针（2026-09-10 ITER-004 NR3 补充轮）
// 用例: D1-39(MCP端到端修复前)/41(四态契约)/42(dismiss跨进程闭环)/43(dismiss参数边界+SPEC证据)
//       D1-45(兜底序列+预热竞态)/48(多agent多进程隔离)/50f-MCP(up_to_date不升级)/40+53(镜像lag)/29(MCP级证据)
// 用法: node d1-mcp-loop.mjs <沙箱根>
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const S = resolve(process.argv[2] || join(__dirname, '.sandbox'));
const SC = join(S, 'scenarios');

const results = [];
function check(id, pass, detail) {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${detail}`);
}
const section = (t) => console.log(`\n===== ${t} =====`);

// ---------- 外部 fixture 子进程 ----------
function spawnFx() {
  return spawn(process.execPath, [join(__dirname, 'fixture-server.mjs'), '--port', '0', '--fixture', join(SC, 'sc-stable-new.json'), '--tarballs', join(S, 'fixtures')], { stdio: ['ignore', 'pipe', 'pipe'] });
}
async function fxReady(fxProc) {
  const port = await new Promise((res, rej) => {
    let buf = '';
    const iv = setInterval(() => { const m = /FIXTURE_PORT=(\d+)/.exec(buf); if (m) { clearInterval(iv); res(Number(m[1])); } }, 150);
    setTimeout(() => { clearInterval(iv); rej(new Error('no FIXTURE_PORT: ' + buf)); }, 10000);
    fxProc.stdout.on('data', (d) => { buf += String(d); });
  });
  const url = `http://127.0.0.1:${port}`;
  const t0 = Date.now();
  while (Date.now() - t0 < 15000) {
    const r = spawnSync(process.execPath, ['-e', `fetch('${url}/__stats').then(x=>process.exit(x.ok?0:1)).catch(()=>process.exit(1))`], { timeout: 4000, stdio: 'ignore' });
    if (r.status === 0) return { port, url };
    await new Promise((r2) => setTimeout(r2, 400));
  }
  throw new Error('fixture not ready');
}

// ---------- MCP 客户端 ----------
class McpClient {
  constructor(serverPath, env) {
    this.child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env });
    this.buf = Buffer.alloc(0);
    this.seq = 0;
    this.pending = new Map();
    this.stderrLog = '';
    this.child.stderr.on('data', (d) => { this.stderrLog += String(d); });
    this.child.stdout.on('data', (d) => this._onData(d));
    this.exited = false;
    this.child.on('exit', () => { this.exited = true; });
  }
  _onData(d) {
    this.buf = Buffer.concat([this.buf, d]);
    while (true) {
      const i = this.buf.indexOf('\r\n\r\n');
      if (i === -1) return;
      const header = this.buf.subarray(0, i).toString('utf8');
      const len = Number(header.match(/Content-Length: (\d+)/i)?.[1]);
      if (!len) { this.buf = this.buf.subarray(i + 4); continue; }
      if (this.buf.length < i + 4 + len) return;
      const body = this.buf.subarray(i + 4, i + 4 + len).toString('utf8');
      this.buf = this.buf.subarray(i + 4 + len);
      let msg;
      try { msg = JSON.parse(body); } catch { continue; }
      const p = this.pending.get(msg.id);
      if (!p) continue;
      clearTimeout(p.t);
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  }
  request(method, params = {}) {
    const id = ++this.seq;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    this.child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, t: setTimeout(() => { this.pending.delete(id); reject(new Error(`timeout ${method} #${id}`)); }, 30000) });
    });
  }
  async tool(name, args = {}) {
    const r = await this.request('tools/call', { name, arguments: args });
    const text = r?.content?.[0]?.text;
    if (typeof text !== 'string') throw new Error('no text content: ' + JSON.stringify(r));
    return JSON.parse(text);
  }
  async close() {
    for (const p of this.pending.values()) clearTimeout(p.t);
    this.pending.clear();
    try { this.child.kill(); } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
}

// ---------- 环境构造 ----------
function buildEnv(home, fxUrl) {
  const env = { ...process.env };
  delete env.HUAWEICLOUD_DEVKIT_SKIP_UPDATE;
  env.USERPROFILE = home;
  env.HOME = home;
  env.APPDATA = join(home, 'AppData', 'Roaming');
  env.LOCALAPPDATA = join(home, 'AppData', 'Local');
  env.HUAWEICLOUD_HOME = join(home, 'hc-home');
  env.npm_config_registry = fxUrl;
  env.npm_config_cache = join(home, 'npm-cache');
  env.NO_UPDATE_NOTIFIER = '1';
  env.npm_config_update_notifier = 'false';
  return env;
}
function skipFilePath(home) {
  return join(home, 'hc-home', '.config', 'huaweicloud', 'devkit-skip.json');
}
function freshHome(name) {
  const h = join(S, name);
  rmSync(h, { recursive: true, force: true });
  mkdirSync(h, { recursive: true });
  return h;
}
const MCP_FIX_S = join(S, 'app-fix-s', 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const MCP_FIX_P = join(S, 'app-fix-p', 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

async function setFx(url, patch) {
  await fetch(`${url}/__set`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
}
async function clearNpmCache(home) {
  rmSync(join(home, 'npm-cache'), { recursive: true, force: true });
}

let fxProc;
try {
  fxProc = spawnFx();
  const fx = await fxReady(fxProc);
  const { url } = fx;
  let c; // MCP 客户端复用变量

  // ========== SC0: D1-39 修复前 MCP 端到端（app-next 未修复，Windows 实锤）==========
  section('D1-39 修复前 MCP 端到端（app-next @1.1.3-next.2 未修复）');
  const home39 = freshHome('home-39');
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } });
  await clearNpmCache(home39);
  c = new McpClient(join(S, 'app-next', 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs'), buildEnv(home39, url));
  const i39 = await c.request('initialize', { protocolVersion: '2024-11-05' });
  check('D1-39mcp-a', i39.serverInfo?.version === '1.1.3-next.2', `修复前 serverInfo=${i39.serverInfo?.name}@${i39.serverInfo?.version}`);
  const u39 = await c.tool('huaweicloud_check_update', {});
  check('D1-39mcp-b', u39.result === 'check_failed' && u39.latestStable === null,
    `修复前 check_update => ${u39.result}（latestStable=null，Windows EINVAL 静默失败，存量用户收不到提醒）`);
  const up39 = await c.tool('huaweicloud_upgrade', {});
  check('D1-39mcp-c', up39.success === false && /无法确认最新版本|registry 查询失败/.test(up39.error || ''),
    `修复前 upgrade => ${JSON.stringify(up39)}（升级腿同样不可用）`);
  await c.close();

  // ========== SC1: D1-41 返回契约四态（app-fix-s = 修复后 stable 1.1.2）==========
  section('D1-41 check_update 真实 MCP 返回契约（四态）');
  const home41 = freshHome('home-41');

  // ① up_to_date（latest == current）
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.2', next: '1.1.3-next.2' } });
  await clearNpmCache(home41);
  c = new McpClient(MCP_FIX_S, buildEnv(home41, url));
  const init1 = await c.request('initialize', { protocolVersion: '2024-11-05' });
  check('D1-41-init', init1.serverInfo?.name === 'huaweicloud-devkit' && init1.serverInfo?.version === '1.1.2',
    `serverInfo=${init1.serverInfo?.name}@${init1.serverInfo?.version}`);
  const tl = await c.request('tools/list');
  const toolNames = (tl.tools || []).map((t) => t.name);
  check('D1-41-tools', tl.tools.length === 39 && toolNames.includes('huaweicloud_check_update') && toolNames.includes('huaweicloud_upgrade'),
    `tools/list=${tl.tools.length} 工具，含 check_update/upgrade（expect 39）`);
  const u1 = await c.tool('huaweicloud_check_update', {});
  check('D1-41a', u1.result === 'up_to_date' && u1.currentVersion === '1.1.2' && u1.latestStable === '1.1.2' && u1.updateAvailable === false && u1.dismissed === false && u1.dismissExpiresAt === null && u1.targetVersion === '1.1.2',
    `up_to_date 态：${JSON.stringify(u1)}（targetVersion=latest 指向自身，语义一致）`);
  await c.close();

  // ② update_available（latest > current）
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } });
  await clearNpmCache(home41);
  c = new McpClient(MCP_FIX_S, buildEnv(home41, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const u2 = await c.tool('huaweicloud_check_update', {});
  check('D1-41b', u2.result === 'update_available' && u2.currentVersion === '1.1.2' && u2.latestStable === '1.1.3' && u2.updateAvailable === true && u2.dismissed === false && u2.targetVersion === '1.1.3',
    `update_available 态：${JSON.stringify(u2)}`);
  await c.close();

  // ③ check_failed（registry 500 注入）
  await setFx(url, { mode: 'error500' });
  await clearNpmCache(home41);
  c = new McpClient(MCP_FIX_S, buildEnv(home41, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const u3 = await c.tool('huaweicloud_check_update', {});
  check('D1-41c', u3.result === 'check_failed' && u3.latestStable === null && u3.updateAvailable === false,
    `check_failed 态（500 注入）：${JSON.stringify(u3)}（不抛协议错误=契约满足）`);
  await c.close();

  // ========== SC2: D1-42 dismiss 真实闭环 + 跨进程 + D1-45 兜底序列 ==========
  section('D1-42/D1-45 兜底序列 + dismiss 闭环（完整 7 步 MCP 链路）');
  const home42 = freshHome('home-42');
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } });
  await clearNpmCache(home42);

  c = new McpClient(MCP_FIX_S, buildEnv(home42, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  await c.request('tools/list');
  // ① check_update → update_available
  const s2u = await c.tool('huaweicloud_check_update', {});
  check('D1-42a', s2u.updateAvailable && s2u.targetVersion === '1.1.3', `① check_update => ${s2u.result} target=${s2u.targetVersion}`);
  // ② 首个普通工具（check_cli）→ 附加 _updateInfo
  const cli1 = await c.tool('huaweicloud_check_cli', {});
  const hasHint1 = Boolean(cli1 && cli1._updateInfo);
  check('D1-45a', hasHint1 && cli1._updateInfo?.currentVersion === '1.1.2' && cli1._updateInfo?.latestVersion === '1.1.3',
    `② 首个非检查工具携带 _updateInfo（${JSON.stringify(cli1._updateInfo)}）`);
  // ③ 第二个普通工具 → 不再附加
  const cli2 = await c.tool('huaweicloud_check_cli', {});
  check('D1-45b', !cli2._updateInfo, `③ 第二个普通工具不携带 _updateInfo（一次性消费）`);
  // ④ dismiss=true（不传 dismissVersion → target 兜底）
  const s2d = await c.tool('huaweicloud_check_update', { dismiss: true });
  check('D1-42b', s2d.result === 'dismissed' && s2d.dismissed === true && s2d.dismissExpiresAt,
    `④ dismiss=true => ${s2d.result}（dismissExpiresAt=${s2d.dismissExpiresAt}）`);
  // ⑤ skip 文件断言（字段 + 3 天）
  const skip = JSON.parse(readFileSync(skipFilePath(home42), 'utf8'));
  const ms3d = new Date(skip.expireAt).getTime() - new Date(skip.dismissedAt).getTime();
  check('D1-42c', skip.dismissedVersion === '1.1.3' && ms3d === 3 * 24 * 3600 * 1000,
    `⑤ 实际 skip 文件=${skipFilePath(home42).replace(S, '<S>')}（dismissedVersion=${skip.dismissedVersion}，3天=${ms3d}ms）`);
  // ⑥ 再次 check_update → dismissed（同版本冷却）
  const s2e = await c.tool('huaweicloud_check_update', {});
  check('D1-42d', s2e.result === 'dismissed', `⑥ 冷却期内再查 => ${s2e.result}`);
  await c.close();

  // ⑦ 重启新 MCP 进程复查（跨进程持久化）
  c = new McpClient(MCP_FIX_S, buildEnv(home42, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const s2r = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-42e', s2r.result === 'dismissed' && s2r.dismissed === true,
    `⑦ 进程重启后仍生效 => ${s2r.result}（跨进程持久化）`);

  // ========== SC3: D1-43 dismiss 参数边界与失败语义 ==========
  section('D1-43 dismiss 参数边界');
  const home43 = freshHome('home-43');
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } });

  // ① dismissVersion 低于 target：不误冷却（新版本仍提醒）+ skip 记录该版本
  await clearNpmCache(home43);
  c = new McpClient(MCP_FIX_S, buildEnv(home43, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const p1 = await c.tool('huaweicloud_check_update', { dismiss: true, dismissVersion: '1.1.2' });
  const skip1 = JSON.parse(readFileSync(skipFilePath(home43), 'utf8'));
  await c.close();
  check('D1-43a', p1.result === 'update_available' && skip1.dismissedVersion === '1.1.2' && p1.targetVersion === '1.1.3',
    `dismissVersion=1.1.2(<target) => 结果 ${p1.result}（不误冷却，新版本无视），skip=${skip1.dismissedVersion}`);

  // ② 空串 dismissVersion → target 兜底
  await clearNpmCache(home43);
  c = new McpClient(MCP_FIX_S, buildEnv(home43, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const p2 = await c.tool('huaweicloud_check_update', { dismiss: true, dismissVersion: '' });
  const skip2 = JSON.parse(readFileSync(skipFilePath(home43), 'utf8'));
  await c.close();
  check('D1-43b', p2.result === 'dismissed' && skip2.dismissedVersion === '1.1.3',
    `dismissVersion='' => target 兜底（skip=${skip2.dismissedVersion}），结果 ${p2.result}`);

  // ③ registry 失败 + dismiss=true：SPEC-MISMATCH 证据（预期不应伪造 dismissed/up_to_date、不写 current 伪冷却）
  await setFx(url, { mode: 'error500' });
  await clearNpmCache(home43);
  c = new McpClient(MCP_FIX_S, buildEnv(home43, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const p3 = await c.tool('huaweicloud_check_update', { dismiss: true });
  const skip3 = existsSync(skipFilePath(home43)) ? JSON.parse(readFileSync(skipFilePath(home43), 'utf8')) : null;
  await c.close();
  check('D1-43c', p3.result === 'up_to_date' && skip3 && skip3.dismissedVersion === '1.1.2',
    `dismiss + registry 失败 => 返回 ${p3.result}（预期 check_failed 未满足=伪造 up_to_date）且写入 skip current=${skip3?.dismissedVersion}（伪冷却）→ SPEC-MISMATCH（功能无害：后续 target>current 冷却不生效，但违反用例预期条款）`);
  // ④ 恢复 registry 后不残留错误冷却（新版本 1.1.4 仍可提醒）
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.4', next: null } });
  await clearNpmCache(home43);
  c = new McpClient(MCP_FIX_S, buildEnv(home43, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const p4 = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-43d', p4.result === 'update_available' && p4.targetVersion === '1.1.4',
    `恢复后新版本 1.1.4 > 伪冷却版本 => ${p4.result}（伪冷却不阻断新版本）`);

  // ========== SC4: D1-45 预热竞态（工具先到，预热未完成）==========
  section('D1-45 预热竞态（delay 1500ms，普通工具先于预热完成）');
  const home45 = freshHome('home-45');
  await setFx(url, { mode: 'ok', delayMs: 1500, 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } });
  await clearNpmCache(home45);
  c = new McpClient(MCP_FIX_S, buildEnv(home45, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const race1 = await c.tool('huaweicloud_check_cli', {}); // 立即调用（预热查询仍在途）
  check('D1-45c', !race1._updateInfo, `预热未完成时普通工具不附加 _updateInfo（不阻塞正常工具）`);
  const raceU = await c.tool('huaweicloud_check_update', {}); // join inflight，等待 1.5s
  check('D1-45d', raceU.result === 'update_available', `预热完成后 check_update => ${raceU.result}（inflight 合并）`);
  const race2 = await c.tool('huaweicloud_check_cli', {});
  check('D1-45e', Boolean(race2._updateInfo), `结果就绪后首个普通工具携带 _updateInfo（${JSON.stringify(race2._updateInfo)}）`);
  const race3 = await c.tool('huaweicloud_check_cli', {});
  check('D1-45f', !race3._updateInfo, `再下一个普通工具不再附带（一次性语义保持）`);
  await c.close();

  // ========== SC5: D1-40/53 镜像 lag（MCP 级）+ D1-29 MCP 级证据 ==========
  section('D1-40/53 受控镜像 lag（MCP 级）+ D1-29 pre 策略证据');
  const home40 = freshHome('home-40');

  // ① 镜像 latest 滞后（1.1.1 < current 1.1.2）：不得提示倒退
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.1', next: null } });
  await clearNpmCache(home40);
  c = new McpClient(MCP_FIX_S, buildEnv(home40, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const lag1 = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-40a', lag1.result === 'up_to_date' && lag1.latestStable === '1.1.1' && lag1.updateAvailable === false,
    `镜像 lag（latest=1.1.1<current 1.1.2）=> ${lag1.result}（latestStable=${lag1.latestStable}，不提示版本倒退）`);

  // ② next 倒退 lag（pre 用户，current=1.1.3-next.2；latest/next 均低于 current 才构成纯倒退场景）
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.2', next: '1.1.2' } });
  await clearNpmCache(home40);
  c = new McpClient(MCP_FIX_P, buildEnv(home40, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const lag2 = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-40b', lag2.result === 'up_to_date', `pre 用户 + latest/next 均倒退（1.1.2<current 1.1.3-next.2）=> ${lag2.result}（防倒退）`);

  // ③ pre 用户 next 提升：D1-29 MCP 级证据（实现会提醒 next，文档表 ❌）
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.4-next.1' } });
  await clearNpmCache(home40);
  c = new McpClient(MCP_FIX_P, buildEnv(home40, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const p29 = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-29-mcp', p29.result === 'update_available' && p29.targetVersion === '1.1.4-next.1',
    `pre 用户 current=1.1.3-next.2, latest=1.1.3, next=1.1.4-next.1 => MCP 实际提醒 ${p29.targetVersion}（与设计文档表「pre 不提醒」❌ 冲突，SPEC-MISMATCH 待开发确认）`);

  // ========== SC6: D1-48 多 agent/多进程隔离 ==========
  section('D1-48 多 agent/多进程隔离');
  const homeA = freshHome('home-48a');
  const homeB = freshHome('home-48b');
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } });

  // A：dismiss 1.1.3
  await clearNpmCache(homeA);
  c = new McpClient(MCP_FIX_S, buildEnv(homeA, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  await c.tool('huaweicloud_check_update', { dismiss: true });
  await c.close();
  // B：同环境（不同 HOME）→ 不应串用 A 的 dismissed
  await clearNpmCache(homeB);
  c = new McpClient(MCP_FIX_S, buildEnv(homeB, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const b1 = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-48a', b1.result === 'update_available', `agent B（独立 HOME）不受 A 的 dismiss 影响 => ${b1.result}`);
  // B：dismiss 同版本
  await clearNpmCache(homeB);
  c = new McpClient(MCP_FIX_S, buildEnv(homeB, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  await c.tool('huaweicloud_check_update', { dismiss: true });
  await c.close();
  // 断言两个 skip 文件独立存在、路径不同、内容一致（各自状态）
  const skipA = readFileSync(skipFilePath(homeA), 'utf8');
  const skipB = readFileSync(skipFilePath(homeB), 'utf8');
  check('D1-48b', skipFilePath(homeA) !== skipFilePath(homeB) && JSON.parse(skipA).dismissedVersion === '1.1.3' && JSON.parse(skipB).dismissedVersion === '1.1.3',
    `skip 文件按 agent HOME 隔离（A=${skipFilePath(homeA).replace(S, '<S>')} ≠ B=...），内容各自独立`);
  // 重启 A → 仍 dismissed（自己的状态）
  c = new McpClient(MCP_FIX_S, buildEnv(homeA, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const a2 = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-48c', a2.result === 'dismissed', `重启 A => ${a2.result}（持久化且不串 B）`);
  // 新版本 1.1.4 发布 → A 无视冷却重新提醒（跨进程语义）
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.4', next: null } });
  await clearNpmCache(homeA);
  c = new McpClient(MCP_FIX_S, buildEnv(homeA, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const a3 = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-48d', a3.result === 'update_available' && a3.targetVersion === '1.1.4', `新版本 1.1.4 发布后 A => ${a3.result}（无视旧冷却）`);

  // ========== SC7: D1-50f-MCP up_to_date 不执行升级 ==========
  section('D1-50f-MCP up_to_date 守卫（handler 层）');
  const home50 = freshHome('home-50');
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.2', next: '1.1.3-next.2' } });
  await clearNpmCache(home50);
  c = new McpClient(MCP_FIX_S, buildEnv(home50, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const up50 = await c.tool('huaweicloud_upgrade', {});
  await c.close();
  check('D1-50f-mcp', up50.success === false && up50.requiresRestart === false && up50.message === '已是最新版本，无需升级。',
    `up_to_date 状态调 huaweicloud_upgrade => ${JSON.stringify(up50)}（handler 层拦截，不执行升级命令）`);

  // ========== 汇总 ==========
  const pass = results.filter((r) => r.pass).length;
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n===== 汇总: ${results.length} 断言, PASS ${pass}, FAIL ${fail} =====`);
  if (fail > 0) console.log('失败明细:', JSON.stringify(results.filter((r) => !r.pass), null, 2));
  process.exitCode = fail > 0 ? 1 : 0;
} finally {
  if (fxProc) { try { fxProc.kill(); } catch {} }
}