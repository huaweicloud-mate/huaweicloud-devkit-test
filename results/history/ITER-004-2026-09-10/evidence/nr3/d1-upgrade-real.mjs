// D1 版本升级提醒——真实升级 E2E（一次性隔离环境，2026-09-10 ITER-004 NR3 补充轮）
// 用例: D1-52(真实升级安装与重启生效) / D1-38(真实侧) / D1-50(真实命令链) / D1-42(真实安装路径 skip)
// 流程: 装 fj-old(1.1.2 原码) → 旧 MCP 版本/检测态 → 修复后 MCP huaweicloud_upgrade(真实 npx via fixture)
//       → 文件同步/配置保持 → 新 MCP 版本/检测态 → dismiss 落真实插件目录 .update-skip.json
// 用法: node d1-upgrade-real.mjs <沙箱根>
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

// ---------- fixture ----------
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
async function getStats(url) {
  const r = await fetch(`${url}/__stats`);
  return r.json();
}

// ---------- MCP 客户端（同 mcp-loop）----------
class McpClient {
  constructor(serverPath, env) {
    this.child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'pipe'], env });
    this.buf = Buffer.alloc(0);
    this.seq = 0;
    this.pending = new Map();
    this.child.stderr.on('data', (d) => { /* keep */ });
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
      this.pending.set(id, { resolve, reject, t: setTimeout(() => { this.pending.delete(id); reject(new Error(`timeout ${method}`)); }, 120000) });
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

// ---------- 环境 ----------
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

const APP_OLD = join(S, 'app-old'); // 1.1.2 正式版原码
const MCP_FIX_S = join(S, 'app-fix-s', 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const OPENCODE_PLUGINS = (home) => join(home, '.config', 'opencode', 'huaweicloud-plugins');
const OPENCODE_MCP = (home) => join(OPENCODE_PLUGINS(home), 'src', 'mcp-server.mjs');
const OPENCODE_CFG = (home) => join(home, '.config', 'opencode', 'opencode.json');

let fxProc;
try {
  fxProc = spawnFx();
  const fx = await fxReady(fxProc);
  const { url } = fx;
  const home = join(S, 'home-real');
  rmSync(home, { recursive: true, force: true });
  mkdirSync(home, { recursive: true });
  const env = buildEnv(home, url);

  // ---------- Phase 1: 真实安装旧版 1.1.2（app-old 原码 CLI）----------
  section('Phase 1 真实安装 1.1.2（一次性 HOME，--target opencode）');
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.2', next: '1.1.3-next.2' } });
  const inst = spawnSync(process.execPath, [join(APP_OLD, 'bin', 'setup.cjs'), 'install', '--target', 'opencode'], { encoding: 'utf8', timeout: 240000, env, windowsHide: true });
  const instOk = inst.status === 0;
  check('D1-52-p1', instOk, `install 退出码=${inst.status}${inst.stderr ? ' stderr尾=' + String(inst.stderr).split(/\r?\n/).slice(-2).join(' / ') : ''}`);
  check('D1-52-p1b', existsSync(OPENCODE_MCP(home)) && existsSync(join(OPENCODE_PLUGINS(home), 'package.json')),
    `插件落点存在：${OPENCODE_PLUGINS(home).replace(S, '<S>')}（mcp-server.mjs + package.json）`);
  const pkgOld = JSON.parse(readFileSync(join(OPENCODE_PLUGINS(home), 'package.json'), 'utf8'));
  check('D1-52-p1c', pkgOld.version === '1.1.2', `插件 package.json version=${pkgOld.version}（真实 1.1.2）`);
  check('D1-52-p1d', existsSync(join(OPENCODE_PLUGINS(home), 'node_modules', 'undici')), '运行时依赖 undici 已安装（真实 npm install 走 fixture 代理）');
  const cfgBefore = readFileSync(OPENCODE_CFG(home), 'utf8');
  check('D1-52-p1e', cfgBefore.includes('huaweicloud-plugins'), 'opencode.json 已配置 MCP server 指向插件目录');

  // ---------- Phase 2: 旧 MCP 状态（serverInfo + 检测链路）----------
  section('Phase 2 旧 MCP（1.1.2）：版本正确 + 检测链路 P0 实锤');
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.3', next: '1.1.3-next.2' } }); // 有新版但 Windows 未修复
  let c = new McpClient(OPENCODE_MCP(home), env);
  const iOld = await c.request('initialize', { protocolVersion: '2024-11-05' });
  check('D1-52-p2a', iOld.serverInfo?.version === '1.1.2', `旧 MCP serverInfo.version=${iOld.serverInfo?.version}（真实安装产物）`);
  const uOld = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-52-p2b', uOld.result === 'check_failed',
    `旧 MCP check_update => ${uOld.result}（真实存量用户态：官方 latest=1.1.3 存在但 Windows EINVAL 静默失败=收不到提醒；D1-39 P0 端到端实锤）`);

  // ---------- Phase 3: 修复后 MCP 真实升级 ----------
  section('Phase 3 修复后 MCP：huaweicloud_upgrade 真实 npx 升级 1.1.2 → 1.1.3');
  const stats0 = await getStats(url);
  c = new McpClient(MCP_FIX_S, env); // 修复副本驱动（模拟 #554 修复后）
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const up = await c.tool('huaweicloud_upgrade', {});
  const stats1 = await getStats(url);
  await c.close();
  check('D1-52-p3a', up.success === true && up.previousVersion === '1.1.2' && up.installedVersion === '1.1.3' && up.requiresRestart === true,
    `upgrade 返回 ${JSON.stringify(up)}（真实执行→success+requiresRestart）`);
  check('D1-52-p3b', stats1.hits.tgz > stats0.hits.tgz, `fixture tarball 下载命中 ${stats0.hits.tgz}→${stats1.hits.tgz}（真实 npm/npx 拉取 1.1.3 包体）`);
  const pkgNew = JSON.parse(readFileSync(join(OPENCODE_PLUGINS(home), 'package.json'), 'utf8'));
  check('D1-52-p3c', pkgNew.version === '1.1.3', `升级后插件 package.json version=${pkgNew.version}（目标文件已同步）`);
  const cfgAfter = readFileSync(OPENCODE_CFG(home), 'utf8');
  check('D1-52-p3d', cfgAfter === cfgBefore, `opencode.json 配置未丢失（升级前后内容一致）`);

  // ---------- Phase 4: 新 MCP 重启生效 ----------
  section('Phase 4 新 MCP（1.1.3）：重启生效 + 检测态');
  c = new McpClient(OPENCODE_MCP(home), env);
  const iNew = await c.request('initialize', { protocolVersion: '2024-11-05' });
  check('D1-52-p4a', iNew.serverInfo?.version === '1.1.3', `升级后新进程 serverInfo.version=${iNew.serverInfo?.version}（重启生效）`);
  const uNew = await c.tool('huaweicloud_check_update', {});
  await c.close();
  check('D1-52-p4b', uNew.result === 'up_to_date' && uNew.currentVersion === '1.1.3',
    `升级后 check_update => ${uNew.result}（current=${uNew.currentVersion}=latest，不再提醒）`);

  // ---------- Phase 5: 真实安装路径 dismiss（设计文档 spec：<pluginDir>/.update-skip.json）----------
  section('Phase 5 真实安装路径 dismiss（spec 文档路径）');
  await setFx(url, { mode: 'ok', 'dist-tags': { latest: '1.1.4', next: null } });
  rmSync(join(home, 'npm-cache'), { recursive: true, force: true });
  c = new McpClient(OPENCODE_MCP(home), env);
  await c.request('initialize', { protocolVersion: '2024-11-05' });
  const d1 = await c.tool('huaweicloud_check_update', {});
  check('D1-42-real-a', d1.result === 'update_available' && d1.targetVersion === '1.1.4', `发布 1.1.4 后 check_update => ${d1.result}（target=${d1.targetVersion}）`);
  const d2 = await c.tool('huaweicloud_check_update', { dismiss: true });
  await c.close();
  const skipReal = join(OPENCODE_PLUGINS(home), '.update-skip.json');
  check('D1-42-real-b', d2.result === 'dismissed' && existsSync(skipReal),
    `dismiss 落真实插件目录 ${skipReal.replace(S, '<S>')}（installRuntimeDeps 写入了 package.json → 走 <pluginDir>/.update-skip.json，与设计文档 §冷却 一致）`);
  const skipObj = JSON.parse(readFileSync(skipReal, 'utf8'));
  check('D1-42-real-c', skipObj.dismissedVersion === '1.1.4' && new Date(skipObj.expireAt).getTime() - new Date(skipObj.dismissedAt).getTime() === 3 * 86400000,
    `skip 内容 dismissedVersion=${skipObj.dismissedVersion}，冷却 3 天精确`);

  // ---------- 汇总 ----------
  const pass = results.filter((r) => r.pass).length;
  const fail = results.filter((r) => !r.pass).length;
  console.log(`\n===== 汇总: ${results.length} 断言, PASS ${pass}, FAIL ${fail} =====`);
  if (fail > 0) console.log('失败明细:', JSON.stringify(results.filter((r) => !r.pass), null, 2));
  process.exitCode = fail > 0 ? 1 : 0;
} finally {
  if (fxProc) { try { fxProc.kill(); } catch {} }
}