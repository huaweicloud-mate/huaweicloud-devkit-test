// core.mjs — v2 每日测试探针共享核心：npm 全局包 dist 导入 + 注册表 + 证据落盘 + probe.mjs 生成。
import { pathToFileURL } from 'node:url';
import { join, dirname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const PACK = dirname(__dirname);
export const EVID = join(PACK, 'evidence');
export const REPO_ROOT = dirname(dirname(dirname(dirname(PACK))));

// 关掉 vendor challenge（确定性测试 tier 约定）：令首次受限工具调用不弹「伪造用户证词」挑战，
// 便于直接测工具真实行为。vendor gate 本身仍需 vendorConfirmed 证词（见 ct()）。
process.env.HUAWEICLOUD_VENDOR_CHALLENGE = process.env.HUAWEICLOUD_VENDOR_CHALLENGE || 'off';

function npmRootG() {
  try {
    const r = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' });
    return (r.stdout || '').trim();
  } catch { return ''; }
}

export function pkgRoot() {
  if (process.env.HDK_PKG) return process.env.HDK_PKG;
  const n = npmRootG();
  if (n) return join(n, 'huaweicloud-devkit');
  return join(homedir(), 'nodejs', 'lib', 'node_modules', 'huaweicloud-devkit');
}

export function pkgCore() { return join(pkgRoot(), 'plugins', 'huaweicloud-core'); }
export function distDir() { return join(pkgCore(), 'dist'); }
export function srcDir() { return join(pkgCore(), 'src'); }
export function skillsDir() { return join(pkgCore(), 'skills'); }

export function shimDir() {
  if (process.env.HDK_SHIM) return process.env.HDK_SHIM;
  return join(homedir(), 'devkit-test', 'scratch', 'v2shim');
}

// 兼容旧接口：hdkSrc() = 供夹具/makeServer 使用的 shim（含 .mjs 桥接）
export function hdkSrc() { return distDir(); }

let _h = null;
export async function hdk() {
  if (_h) return _h;
  const D = distDir();
  const C = pkgCore();
  const S = srcDir();
  const R = pkgRoot();
  const U = (p) => pathToFileURL(join(D, p)).href;
  _h = {
    D, C, S, R,
    dist: D, core: C, src: S, pkg: R, SRC: S,
    skills: skillsDir(),
    shim: shimDir(),
    tools: await import(U('tools.js')),
    schemas: await import(U('tool-schemas.js')),
    uc: await import(U('update-check.js')),
    sp: await import(U('safety-policy.js')),
    rr: await import(U('risk-rule-engine.js')),
    hcl: await import(U('hcloud-cli.js')),
    hcp: await import(U('hcloud-probe.js')),
    kv: await import(U('koocli-version.js')),
    mcbm: await import(U('mcp-config-backup.js')),
    mcmg: await import(U('mcp-config-merge.js')),
    icon: await import(U('icon-library.js')),
    market: await import(U('search-market.js')),
    detect: await import(U('detect-framework.js')),
    proto: await import(U('mcp-protocol.js')),
    telemetry: await import(U('telemetry/telemetry.js')),
    proxyCfg: await import(U('proxy/proxy-config.js')),
    proxyAg: await import(U('proxy/proxy-agent.js')),
    catalog: await import(U('capability-catalog.js')),
    target: await import(U('targets.js')),
    vg: await import(U('vendor-gate.js')),
    authCred: await import(U('auth/credentials.js')),
    authSvc: await import(U('auth/service.js')),
    authRec: await import(U('auth/reconcile.js')),
    authVal: await import(U('auth/credential-validator.js')),
    authProj: await import(U('auth/project-id.js')),
    authReg: await import(U('auth/agent-registration.js')),
  };
  return _h;
}

// 调工具：自动附 vendor gate 证词（v2 14 个云侧工具需 vendorConfirmed 字符串），非受限工具附加无害。
export const VENDOR_QUOTE = '用户已确认操作目标为华为云（cn-north-4 华北-北京四，已登录 hcloud）';
export async function ct(h, name, args = {}, opts = {}) {
  return h.tools.callTool(name, { vendorConfirmed: VENDOR_QUOTE, ...(args || {}) }, opts);
}

export const CHECKS = new Map();
export function reg(id, fn) { CHECKS.set(id, fn); }

// 运行 eval/harness/fixtures 下已有探针（权威探针）—— v2 下 hdkSrc 指向 shim 桥接目录
export function fixture(cid, script, opts = {}) {
  const { noHdk = false } = opts;
  reg(cid, async () => {
    const dir = join(REPO_ROOT, 'eval', 'harness', 'fixtures');
    const args = [join(dir, script)];
    if (!noHdk) args.push(shimDir());
    args.push('--evid', join(EVID, cid));
    const r = run(`node ${args.map(a => `"${a}"`).join(' ')} 2>&1`);
    if (r.status === 0) return ok('fixture exit=0', r.text.slice(-900));
    if (r.status === 2) return blocked('fixture 依赖宿主/环境未满足(exit=2)', r.text.slice(-900));
    return fail(`fixture exit=${r.status}`, r.text.slice(-1400));
  });
}

export const ok = (why = '', detail = '', data) => ({ status: 'PASS', why, detail, data });
export const fail = (why = '', detail = '', data) => ({ status: 'FAIL', why, detail, data });
export const spec = (why = '', detail = '', data) => ({ status: 'SPEC-MISMATCH', why, detail, data });
export const blocked = (why = '', detail = '') => ({ status: 'BLOCKED', why, detail });
export const notrun = (why = '', detail = '') => ({ status: 'NOT_RUN', why, detail });

export function chk(cond, whyPass = '', whyFail = '') {
  return cond ? ok(whyPass) : fail(whyFail);
}

export function sh(args, env = {}) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 180000 });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}

export function run(cmd, opts = {}) {
  const r = spawnSync('bash', ['-c', cmd], { encoding: 'utf8', timeout: 180000, ...opts });
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
  const script = `// 探针: ${id} —— 每日测试执行（委托 _probe/main.mjs 真实执行逻辑）
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