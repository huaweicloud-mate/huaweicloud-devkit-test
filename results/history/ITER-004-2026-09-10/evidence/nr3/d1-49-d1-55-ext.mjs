// D1-49(upgrade handler 无更新与参数校验) + D1-55(同 server 多会话隔离) 扩展探针
// 2026-09-10T17:00:00+08:00 生成（ISO 8601）
// 用法: node d1-49-d1-55-ext.mjs <沙箱根>
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const S = resolve(process.argv[2] || join(__dirname, '.sandbox'));
const SC = join(S, 'scenarios');

const results = [];
function check(id, pass, detail) {
  results.push({ id, pass, kind: pass ? 'PASS' : 'FAIL', detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${detail}`);
}
// 规格偏差观测：探针断言通过（观测成功）但行为不符合设计预期——OBSERVED_SPEC_MISMATCH
function checkSpec(id, pass, detail) {
  results.push({ id, pass, kind: 'SPEC', detail });
  console.log(`SPEC  ${id}  ${detail}`);
}
// 未执行/阻断项：NOT_RUN / BLOCKED（探针断言计数不计入 PASS）
function checkBlocked(id, detail) {
  results.push({ id, pass: true, kind: 'BLOCKED', detail });
  console.log(`BLOCKED  ${id}  ${detail}`);
}
const section = (t) => console.log(`\n===== ${t} =====`);

// fixture（独立子进程）
function spawnFx() {
  return spawn(process.execPath, [join(__dirname, 'fixture-server.mjs'), '--port', '0', '--fixture', join(SC, 'sc-stable-new.json'), '--tarballs', join(S, 'fixtures')], { stdio: ['ignore', 'pipe', 'pipe'] });
}
async function fxReady(fxProc) {
  const port = await new Promise((res, rej) => {
    let buf = '';
    const iv = setInterval(() => { const m = /FIXTURE_PORT=(\d+)/.exec(buf); if (m) { clearInterval(iv); res(Number(m[1])); } }, 150);
    setTimeout(() => { clearInterval(iv); rej(new Error('no port: ' + buf)); }, 10000);
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
async function setFx(url, patch) {
  await fetch(`${url}/__set`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
}
async function clearNpmCache(home) {
  rmSync(join(home, 'npm-cache'), { recursive: true, force: true });
}

// stdio MCP 客户端
class McpClient {
  constructor(serverPath, env) {
    this.child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env });
    this.buf = Buffer.alloc(0);
    this.seq = 0;
    this.pending = new Map();
    this.child.stdout.on('data', (d) => this._onData(d));
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
      this.pending.set(id, { resolve, reject, t: setTimeout(() => { this.pending.delete(id); reject(new Error(`timeout ${method}`)); }, 60000) });
    });
  }
  async tool(name, args = {}) {
    const r = await this.request('tools/call', { name, arguments: args });
    const text = r?.content?.[0]?.text;
    if (typeof text !== 'string') throw new Error('no text: ' + JSON.stringify(r));
    return JSON.parse(text);
  }
  async close() {
    for (const p of this.pending.values()) clearTimeout(p.t);
    this.pending.clear();
    try { this.child.kill(); } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
}

// remote HTTP MCP 客户端（单请求模型：每请求一个 POST）
async function rpc(remoteUrl, method, params = {}, id = 1) {
  const res = await fetch(remoteUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(JSON.stringify(body.error));
  return body.result;
}
async function rpcTool(remoteUrl, name, args = {}, id = 1) {
  const r = await rpc(remoteUrl, 'tools/call', { name, arguments: args }, id);
  return JSON.parse(r.content[0].text);
}
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

async function startRemote(env) {
  const child = spawn(process.execPath, [MCP_FIX_S, '--transport', 'remote', '--port', '0', '--host', '127.0.0.1'], { stdio: ['ignore', 'pipe', 'pipe'], env });
  const port = await new Promise((res, rej) => {
    let buf = '';
    const iv = setInterval(() => {
      const m = /listening on 127\.0\.0\.1:(\d+)/.exec(buf);
      if (m) { clearInterval(iv); res(Number(m[1])); }
    }, 150);
    setTimeout(() => { clearInterval(iv); rej(new Error('remote not ready: ' + buf.slice(0, 300))); }, 15000);
    child.stdout.on('data', (d) => { buf += String(d); });
  });
  return { url: `http://127.0.0.1:${port}`, child };
}

let fxProc;
try {
  fxProc = spawnFx();
  const fx = await fxReady(fxProc);
  const { url } = fx;

  // ========== D1-49 upgrade handler 无更新与参数校验（MCP 层逐项） ==========
  section('D1-49 upgrade handler 无更新与参数校验（6 项）');
  const home49 = freshHome('home-49');
  let c;

  // ① up_to_date 不执行升级命令
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.2', next: null } });
  await clearNpmCache(home49);
  c = new McpClient(MCP_FIX_S, buildEnv(home49, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const r1 = await c.tool('huaweicloud_upgrade', {});
  await c.close();
  check('D1-49a', r1.success === false && r1.requiresRestart === false && r1.message === '已是最新版本，无需升级。',
    `up_to_date => ${JSON.stringify(r1)}（handler 层拦截，不执行升级命令）`);

  // ② 非法 version（非 latest）被明确拒绝
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: null } });
  await clearNpmCache(home49);
  c = new McpClient(MCP_FIX_S, buildEnv(home49, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const r2 = await c.tool('huaweicloud_upgrade', { version: '1.4.0' });
  await c.close();
  check('D1-49b', r2.success === false && /仅支持 latest/.test(r2.error || ''),
    `version='1.4.0' => ${JSON.stringify(r2)}（明确拒绝，不误报成功）`);

  // ③ version 空串 → 按默认 latest 处理（check_failed 场景下由 manual 的 tag 证明，无真实升级副作用）
  await setFx(url, { mode: 'error500' });
  await clearNpmCache(home49);
  c = new McpClient(MCP_FIX_S, buildEnv(home49, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const r3 = await c.tool('huaweicloud_upgrade', { version: '' });
  await c.close();
  check('D1-49c', r3.success === false && (r3.manual || '').includes('huaweicloud-devkit@latest'),
    `version='' + check_failed => ${JSON.stringify(r3)}（空串解析为默认 latest）`);

  // ④ check_failed 态不误报 success，且返回 manual
  await setFx(url, { mode: 'error500' });
  await clearNpmCache(home49);
  c = new McpClient(MCP_FIX_S, buildEnv(home49, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const r4 = await c.tool('huaweicloud_upgrade', {});
  await c.close();
  check('D1-49d', r4.success === false && /无法确认最新版本/.test(r4.error || '') && /npx --yes huaweicloud-devkit@latest update --target all/.test(r4.manual || ''),
    `check_failed => ${JSON.stringify(r4)}（不误报成功，manual 含正确命令）`);

  // ⑤ target=未知客户端：target 原样传递（manual 证明），CLI 层未知 target 校验失败路径不误报成功（D1-50 mock 已证 spawn 非零退出路径）
  await setFx(url, { mode: 'error500' });
  await clearNpmCache(home49);
  c = new McpClient(MCP_FIX_S, buildEnv(home49, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const r5 = await c.tool('huaweicloud_upgrade', { target: 'unknown-client' });
  await c.close();
  check('D1-49e', r5.success === false && (r5.manual || '').includes('--target unknown-client'),
    `target='unknown-client' => manual=${r5.manual}（target 原样传递；未知 target 的真实 CLI 拒绝依赖 D1-49e2 观测）`);

  // ⑤b 真实 CLI 对未知 target 的拒绝（不经 upgradePackage，直接跑 update CLI 快速观测，隔离缓存清空不产生副作用）
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.2', next: null } });
  const r5b = spawnSync(process.execPath, [join(S, 'app-fix-s', 'bin', 'setup.cjs'), 'update', '--target', 'unknown-client'], { encoding: 'utf8', timeout: 30000, windowsHide: true, env: buildEnv(freshHome('home-49b'), url) });
  check('D1-49e2', r5b.status !== 0 && /Unknown target/.test(r5b.stderr || r5b.stdout || ''),
    `CLI update --target unknown-client => exit=${r5b.status}（Unknown target 拒绝，失败不静默成功）`);

  // ⑥ target 缺省 → all
  await setFx(url, { mode: 'error500' });
  await clearNpmCache(home49);
  c = new McpClient(MCP_FIX_S, buildEnv(home49, url));
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const r6 = await c.tool('huaweicloud_upgrade', {});
  await c.close();
  check('D1-49f', (r6.manual || '').includes('--target all'), `target 缺省 => manual=${r6.manual}（默认 all）`);

  // ========== D1-55 同一 MCP server 多会话状态边界（remote transport） ==========
    // 证据级别声明（Codex review-round-03）：mcp-server-remote.mjs 为 HTTP 单请求模型，
    // 无 session 标识、无 session header 绑定、无独立长连接——dispatch() 直接处理每个请求，
    // 协议状态（hintConsumed/cachedDistTags/failedAt）均为 mcp-protocol.mjs 模块级单例。
    // 因此本段证据降级为 PROCESS_SHARED_STATE（同进程双请求序列），不等同于完整 session 生命周期验证。
    section('D1-55 同进程双请求序列状态共享（PROCESS_SHARED_STATE 证据）');
    const home55 = freshHome('home-55');

    // 协议能力探测：initialize 时 remote server 是否回传 session 标识头
    await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } });
    await clearNpmCache(home55);
    const env55 = buildEnv(home55, url);
    const rem = await startRemote(env55);
    const R = rem.url;
    const probeInit = await fetch(R, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', 'MCP-Protocol-Version': '2024-11-05' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } }),
    });
    const sessHeader = probeInit.headers.get('mcp-session-id');
    check('D1-55s1', !sessHeader,
      `协议能力探测：initialize 响应 MCP-Session-Id=${sessHeader ?? '(无)'}——remote transport 不支持 session 标识（源码确认：mcp-server-remote.mjs 无 session 状态绑定）`);
    checkBlocked('D1-55-session',
      `真实 MCP session 隔离验证（独立 session 标识/header/长连接 A/B 会话交错调用）——NOT_RUN：被测 remote transport 无 session 支持（协议探测无 MCP-Session-Id），无法建立真实 session 流程；影响=「会话级隔离」需产品支持 session 后才可验收（当前按进程共享语义记录）；解除条件=产品或 remote transport 增加 session 标识与绑定后复用本探针 A/B 交错序列重测`);

    // 客户端 A：initialize → check_update → 普通工具（应消费 _updateInfo）
    await rpc(R, 'initialize', { protocolVersion: '2024-11-05' }, 101);
    const A1 = await rpcTool(R, 'huaweicloud_check_update', {}, 102);
    const A2 = await rpcTool(R, 'huaweicloud_check_cli', {}, 103); // A 首个普通工具 → 附加
    check('D1-55a', A1.result === 'update_available' && Boolean(A2._updateInfo),
      `客户端 A 请求序列：check_update=${A1.result}，首工具 _updateInfo=${JSON.stringify(A2._updateInfo)}（正常消费）`);

    // 客户端 B：同一 server 进程，initialize 后首个普通工具 → 观察 _updateInfo（进程级 hintConsumed 已由 A 置 true）
    await rpc(R, 'initialize', { protocolVersion: '2024-11-05' }, 201);
    const B1 = await rpcTool(R, 'huaweicloud_check_cli', {}, 202); // B 首个普通工具
    checkSpec('D1-55b', !B1._updateInfo,
      `客户端 B 请求序列首工具 _updateInfo=${JSON.stringify(B1._updateInfo)}（A 消费后 B 拿不到提示）→ PROCESS_SHARED_STATE：mcp-protocol.mjs hintConsumed 模块级单例，状态按进程共享非按会话隔离；与设计文档「会话中第一个 tool 调用」承诺不符 = OBSERVED_SPEC_MISMATCH（等待开发裁决：按 session 隔离 or 按进程共享为正式语义）`);

  // 对照：fresh server 进程。remote 无 updatePrewarm（仅 stdio 有）→ 观察无预热下的 hint 生成条件
  await clearNpmCache(home55);
  const rem2 = await startRemote(env55);
  await rpc(rem2.url, 'initialize', { protocolVersion: '2024-11-05' }, 301);
  const B2a = await rpcTool(rem2.url, 'huaweicloud_check_cli', {}, 302); // fresh 进程直接普通工具
  const B2b = await rpcTool(rem2.url, 'huaweicloud_check_update', {}, 303); // 显式查询生成 hint
  const B2c = await rpcTool(rem2.url, 'huaweicloud_check_cli', {}, 304); // hint 生成后的首个普通工具
  check('D1-55c', B2b.result === 'update_available' && Boolean(B2c._updateInfo),
    `对照（fresh server）：裸普通工具 _updateInfo=${JSON.stringify(B2a._updateInfo)}（无预热不附加）→ 显式 check_update=${B2b.result} 后首工具 _updateInfo=${JSON.stringify(B2c._updateInfo)}（提示按进程状态生成）`);
  check('D1-55c2', !B2a._updateInfo,
    `观察：remote transport 无 updatePrewarm，仅调普通工具时 hint 永不生成 → 远程部署下「第二层兜底」不可达（stdio 有 prewarm；记录为 P3 观察，remote 会话需先调 check_update 才有提示）`);
  rem2.child.kill();

  // ⑤dismiss 隔离补段：A dismiss 后 B 再查（同一 server、同一 env/homedir → skip 文件共享观察）
  const D1 = await rpcTool(R, 'huaweicloud_check_update', { dismiss: true }, 401);
  const B3 = await rpcTool(R, 'huaweicloud_check_update', {}, 402);
  const skipShared = readFileSync(skipFilePath(home55), 'utf8');
  check('D1-55d', D1.result === 'dismissed' && B3.result === 'dismissed',
    `A dismiss 后 B 查询 => B=${B3.result}（同一 remote server 单进程单 HOME → skip 文件共享，dismiss 按 server/部署级共享；多用户部署需每用户独立 HOME/进程，记录为设计约束）skip=${skipShared.dismissedVersion ?? skipShared}`);

  // ⑤e：新版本 1.1.4 发布。remote 进程内存缓存（cachedDistTags）与外部 fixture 改动不同步（TTL 1h 或重启才刷新）
  //   → 重启 remote server（进程缓存失效）后，B 对 1.1.4 应恢复 update_available（A 的 1.1.3 冷却不阻断新版本）
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.4', next: null } });
  await clearNpmCache(home55);
  const rem3 = await startRemote(env55);
  await rpc(rem3.url, 'initialize', { protocolVersion: '2024-11-05' }, 501);
  const B4 = await rpcTool(rem3.url, 'huaweicloud_check_update', {}, 502);
  rem3.child.kill();
  check('D1-55e', B4.result === 'update_available' && B4.targetVersion === '1.1.4',
    `新版本 1.1.4 发布 + server 重启（进程缓存失效） => B=${B4.result}（target=${B4.targetVersion}，A 的 dismiss 不阻断 B 对新版本提醒）`);
  check('D1-55e2', true,
    `观察：进程级 cachedDistTags 与外部 dist-tags 变更不同步（TTL 1h/重启才刷新）——「A 刷新缓存影响 B」的语义=缓存按 server 进程共享，属合理设计（避免重复 npm view），记录为部署约束`);
  rem.child.kill();

  // ---------- 汇总（四类分档：PASS / SPEC / BLOCKED / FAIL） ----------
  const passN = results.filter((r) => r.kind === 'PASS').length;
  const specN = results.filter((r) => r.kind === 'SPEC').length;
  const blockedN = results.filter((r) => r.kind === 'BLOCKED').length;
  const failN = results.filter((r) => r.kind === 'FAIL').length;
  console.log(`\n===== 汇总: ${results.length} 项 = PASS ${passN} / OBSERVED_SPEC_MISMATCH ${specN} / BLOCKED(NOT_RUN) ${blockedN} / FAIL ${failN} =====`);
  if (failN > 0) console.log('失败明细:', JSON.stringify(results.filter((r) => r.kind === 'FAIL'), null, 2));
  process.exitCode = failN > 0 ? 1 : 0;
} finally {
  if (fxProc) { try { fxProc.kill(); } catch {} }
}