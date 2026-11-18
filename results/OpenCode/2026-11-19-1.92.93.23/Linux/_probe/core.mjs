// core.mjs — 每日测试探针共享核心 v2 适配
// SUT = huaweicloud-devkit 2.0.0-next.4 (TypeScript 重写)。本 harness 直调 src/*.ts（Node 原生 strip-types），
// 经 `node --experimental-strip-types` 运行；vendor gate 通过统一注入 vendorConfirmed + HUAWEICLOUD_VENDOR_CHALLENGE=off 关闭一次性挑战。
import { pathToFileURL } from 'node:url';
import { join, dirname, relative } from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

process.env.HUAWEICLOUD_VENDOR_CHALLENGE = 'off';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACK = dirname(__dirname);
export const EVID = join(PACK, 'evidence');
export const REPO_ROOT = dirname(dirname(dirname(dirname(PACK))));

export const VENDOR_CONFIRMED = '用户运营维护华为云账号资源（每日测试机队 OpenCode 客户端）';

// 源码根（.ts），供 strip-types 直接 import
export function hdkSrc() {
  if (process.env.HDK_SRC) return process.env.HDK_SRC;
  return join(dirname(REPO_ROOT), 'hdk', 'plugins', 'huaweicloud-core', 'src');
}

// 已编译 bundle 的 mcp-server 入口（自包含，可直接 spawn）
export function mcpServerDist() {
  for (const c of [
    process.env.HDK_MCP_SERVER,
    join(process.env.HOME || '/root', 'nodejs', 'lib', 'node_modules', 'huaweicloud-devkit', 'plugins', 'huaweicloud-core', 'dist', 'mcp-server.js'),
    '/usr/local/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist/mcp-server.js',
  ]) {
    if (c && existsSync(c)) return c;
  }
  return null;
}

let _h = null;
export async function hdk() {
  if (_h) return _h;
  const SRC = hdkSrc();
  const U = (p) => pathToFileURL(join(SRC, p)).href;
  const toolsRaw = await import(U('tools.ts'));
  const tools = {
    ...toolsRaw,
    // vendor gate 统一注入：所有 callTool 自动带 vendorConfirmed 引用（真实测试机场景已确认华为云）
    callTool: (name, rawArgs = {}, opts = {}) =>
      toolsRaw.callTool(name, { vendorConfirmed: VENDOR_CONFIRMED, ...(rawArgs || {}) }, opts),
  };
  _h = {
    SRC,
    tools,
    uc: await import(U('update-check.ts')),
    sp: await import(U('safety-policy.ts')),
    rr: await import(U('risk-rule-engine.ts')),
    hcl: await import(U('hcloud-cli.ts')),
    hcp: await import(U('hcloud-probe.ts')),
    kv: await import(U('koocli-version.ts')),
    mcbm: await import(U('mcp-config-backup.ts')),
    mcmg: await import(U('mcp-config-merge.ts')),
    icon: await import(U('icon-library.ts')),
    market: await import(U('search-market.ts')),
    detect: await import(U('detect-framework.ts')),
    proto: await import(U('mcp-protocol.ts')),
    remote: await import(U('mcp-server-remote.ts')),
    telemetry: await import(U('telemetry/telemetry.ts')),
    proxyCfg: await import(U('proxy/proxy-config.ts')),
    proxyAg: await import(U('proxy/proxy-agent.ts')),
    sandboxApi: await import(U('lib/hdkit/hdkitservice-api.ts')),
    hwlink: await import(U('lib/hdkit/hwlink-api.ts')),
    authCred: await import(U('auth/credentials.ts')),
    authSvc: await import(U('auth/service.ts')),
    authRec: await import(U('auth/reconcile.ts')),
    authVal: await import(U('auth/credential-validator.ts')),
    authProj: await import(U('auth/project-id.ts')),
    authReg: await import(U('auth/agent-registration.ts')),
  };
  return _h;
}

export const CHECKS = new Map();
export function reg(id, fn) { CHECKS.set(id, fn); }

export const ok = (why = '', detail = '', data) => ({ status: 'PASS', why, detail, data });
export const fail = (why = '', detail = '', data) => ({ status: 'FAIL', why, detail, data });
export const spec = (why = '', detail = '', data) => ({ status: 'SPEC-MISMATCH', why, detail, data });
export const blocked = (why = '', detail = '') => ({ status: 'BLOCKED', why, detail });
export const notrun = (why = '', detail = '') => ({ status: 'NOT_RUN', why, detail });

export function chk(cond, whyPass = '', whyFail = '') {
  return cond ? ok(whyPass) : fail(whyFail);
}

export function sh(args, env = {}) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', env: { ...process.env, PATH: process.env.PATH, ...env }, timeout: 180000 });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + '\n' + (r.stderr || '')).trim() };
}

export function run(cmd, opts = {}) {
  const r = spawnSync('bash', ['-c', cmd], { encoding: 'utf8', timeout: 180000, ...opts });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + '\n' + (r.stderr || '')).trim() };
}

export function tsBeijing() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
}

export function writeEvidence(id, res) {
  const dir = join(EVID, id);
  mkdirSync(dir, { recursive: true });
  const payload = { status: res.status, why: res.why || '', executedAt: tsBeijing() };
  if (res.detail) payload.detail = res.detail;
  if (res.data !== undefined) payload.data = res.data;
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(payload) + '\n', 'utf-8');
  if (res.detail) writeFileSync(join(dir, 'detail.log'), String(res.detail) + '\n', 'utf-8');
  return dir;
}

export function genProbe(id) {
  const dir = join(EVID, id);
  mkdirSync(dir, { recursive: true });
  const relMain = relative(dir, join(PACK, '_probe', 'main.mjs')).replace(/\\/g, '/');
  const script = `// 探针: ${id} —— 每日测试执行（委托 _probe/main.mjs 真实执行逻辑，SUT=2.0.0-next.4）
import { runOne } from '${relMain}';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const r = await runOne('${id}');
process.stdout.write(JSON.stringify(r) + '\\n');
writeFileSync(join(here, 'stdout.log'), JSON.stringify({
  status: r.status, why: r.why || '', executedAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, '').slice(0, 14),
  ...(r.detail ? { detail: r.detail } : {}), ...(r.data !== undefined ? { data: r.data } : {}) }) + '\\n');
`;
  writeFileSync(join(dir, 'probe.mjs'), script, 'utf-8');
}

export async function runOne(id) {
  if (!CHECKS.has(id)) return notrun(`无探针实现: ${id}`);
  try {
    const r = await CHECKS.get(id)();
    return r && typeof r === 'object' ? r : ok('', String(r));
  } catch (e) {
    return fail(`探针异常: ${e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e}`, String(e));
  }
}

// —— MCP 客户端封装（spawn 已编译 dist/mcp-server.js，Content-Length 帧）——
export function makeServer(serverPath) {
  const sp = serverPath || mcpServerDist();
  const child = spawn(process.execPath, [sp], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', HUAWEICLOUD_VENDOR_CHALLENGE: 'off' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, args) {
    return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: { vendorConfirmed: VENDOR_CONFIRMED, ...(args || {}) } } });
  }
  return { child, send, call, kill: () => { try { child.kill(); } catch {} } };
}