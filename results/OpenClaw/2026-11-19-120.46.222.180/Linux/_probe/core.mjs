// core.mjs — 每日测试探针共享核心（v2.0.0-next.4 适配版）
// SUT 由 .mjs 平铺重写为 TypeScript（packs 架构 + vendor-gate）。Node v22 原生
// type-stripping 支持直接 import .ts；本 harness 直调 hdk src/*.ts 源码导出。
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACK = dirname(__dirname);
export const EVID = join(PACK, 'evidence');
export const REPO_ROOT = dirname(dirname(dirname(dirname(PACK))));

export function hdkSrc() {
  if (process.env.HDK_SRC) return process.env.HDK_SRC;
  return join(dirname(REPO_ROOT), 'hdk', 'plugins', 'huaweicloud-core', 'src');
}

// vendorConfirmed 引用语（vendor-gate 要求 gated 工具带用户确认华为云的引用）
const VENDOR = { vendorConfirmed: '测试华为云 hcloud 资源操作（每日测试用例）' };

let _h = null;
export async function hdk() {
  if (_h) return _h;
  const SRC = hdkSrc();
  const U = (p) => pathToFileURL(join(SRC, p)).href;
  const authCred = await import(U('auth/credentials.ts'));
  const authSvc = await import(U('auth/service.ts'));
  const authRec = await import(U('auth/reconcile.ts'));
  const authVal = await import(U('auth/credential-validator.ts'));
  const authProj = await import(U('auth/project-id.ts'));
  const authReg = await import(U('auth/agent-registration.ts'));
  _h = {
    SRC,
    tools: await import(U('tools.ts')),
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
    telemetry: await import(U('telemetry/telemetry.ts')),
    proxyCfg: await import(U('proxy/proxy-config.ts')),
    proxyAg: await import(U('proxy/proxy-agent.ts')),
    sandboxApi: await import(U('lib/hdkit/hdkitservice-api.ts')),
    hwlink: await import(U('lib/hdkit/hwlink-api.ts')),
    authCred, authSvc, authRec, authVal, authProj, authReg,
    VENDOR,
  };
  return _h;
}

// callTool 封装：自动补 vendorConfirmed（gated 工具需要）
export async function callVendor(name, args = {}, opts = {}) {
  const h = await hdk();
  return h.tools.callTool(name, { ...VENDOR, ...args }, opts);
}

export const CHECKS = new Map();
export function reg(id, fn) { CHECKS.set(id, fn); }

export function ok(why = '', detail = '', data) { return { status: 'PASS', why, detail, data }; }
export function fail(why = '', detail = '', data) { return { status: 'FAIL', why, detail, data }; }
export function spec(why = '', detail = '', data) { return { status: 'SPEC-MISMATCH', why, detail, data }; }
export function blocked(why = '', detail = '') { return { status: 'BLOCKED', why, detail }; }
export function notrun(why = '', detail = '') { return { status: 'NOT_RUN', why, detail }; }
export function chk(cond, whyPass = '', whyFail = '') { return cond ? ok(whyPass) : fail(whyFail); }

export function sh(args, env = {}) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 120000 });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}

export function run(cmd, opts = {}) {
  const r = spawnSync('bash', ['-c', cmd], { encoding: 'utf8', timeout: 120000, ...opts });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}

export function tsBeijing() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
}

export function writeEvidence(id, res) {
  const dir = join(EVID, id);
  mkdirSync(dir, { recursive: true });
  const ts = tsBeijing();
  const payload = { status: res.status, why: res.why || '', executedAt: ts };
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
  const script = `// 探针: ${id} —— 每日测试执行（v2.0.0-next.4，委托 _probe/main.mjs 真实执行逻辑）
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

// MCP stdio 客户端（协议类用例 D6-3/4, D9-*）
export function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
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
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  child.on('error', () => { for (const [k, r] of pending) r({ error: { code: -32000, message: 'spawn error' } }); pending.clear(); });
  function call(name, args) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args || {} } }); }
  return { child, send, call, kill: () => { try { child.kill('SIGKILL'); } catch {} } };
}