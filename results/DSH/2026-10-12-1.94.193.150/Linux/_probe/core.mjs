// core.mjs — 每日测试探针共享核心：hdk 导入 + 注册表 + 证据落盘 + probe.mjs 生成。
import { pathToFileURL } from 'node:url';
import { join, dirname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// _probe/ 位于结果包 Linux/ 目录下
export const PACK = dirname(__dirname);
export const EVID = join(PACK, 'evidence');
export const REPO_ROOT = dirname(dirname(dirname(dirname(PACK))));

export function hdkSrc() {
  if (process.env.HDK_SRC) return process.env.HDK_SRC;
  return join(dirname(REPO_ROOT), 'hdk', 'plugins', 'huaweicloud-core', 'src');
}

let _h = null;
export async function hdk() {
  if (_h) return _h;
  const SRC = hdkSrc();
  const U = (p) => pathToFileURL(join(SRC, p)).href;
  const authCred = await import(U('auth/credentials.mjs'));
  const authSvc = await import(U('auth/service.mjs'));
  const authRec = await import(U('auth/reconcile.mjs'));
  const authVal = await import(U('auth/credential-validator.mjs'));
  const authProj = await import(U('auth/project-id.mjs'));
  const authReg = await import(U('auth/agent-registration.mjs'));
  _h = {
    SRC,
    tools: await import(U('tools.mjs')),
    uc: await import(U('update-check.mjs')),
    sp: await import(U('safety-policy.mjs')),
    rr: await import(U('risk-rule-engine.mjs')),
    hcl: await import(U('hcloud-cli.mjs')),
    hcp: await import(U('hcloud-probe.mjs')),
    kv: await import(U('koocli-version.mjs')),
    mcbm: await import(U('mcp-config-backup.mjs')),
    mcmg: await import(U('mcp-config-merge.mjs')),
    icon: await import(U('icon-library.mjs')),
    market: await import(U('search-market.mjs')),
    detect: await import(U('detect-framework.mjs')),
    proto: await import(U('mcp-protocol.mjs')),
    remote: await import(U('mcp-server-remote.mjs')),
    telemetry: await import(U('telemetry/telemetry.mjs')),
    proxyCfg: await import(U('proxy/proxy-config.mjs')),
    proxyAg: await import(U('proxy/proxy-agent.mjs')),
    sandboxApi: await import(U('sandbox/hdkitservice-api.mjs')),
    hwlink: await import(U('sandbox/hwlink-api.mjs')),
    authCred, authSvc, authRec, authVal, authProj, authReg,
  };
  return _h;
}

export const CHECKS = new Map();
export function reg(id, fn) { CHECKS.set(id, fn); }

// 运行 eval/harness/fixtures 下已有探针（权威探针），输出新鲜证据
export function fixture(cid, script, opts = {}) {
  const { noHdk = false } = opts;
  reg(cid, async () => {
    const h = await hdk();
    const dir = join(REPO_ROOT, 'eval', 'harness', 'fixtures');
    const args = [join(dir, script)];
    if (!noHdk) args.push(h.SRC);
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

// 简单断言：cond 为真 PASS，否则 FAIL
export function chk(cond, whyPass = '', whyFail = '') {
  return cond ? ok(whyPass) : fail(whyFail);
}

// 执行 hcloud 命令（真云）
export function sh(args, env = {}) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', env: { ...process.env, ...env }, timeout: 120000 });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// 执行任意命令
export function run(cmd, opts = {}) {
  const r = spawnSync('bash', ['-c', cmd], { encoding: 'utf8', timeout: 120000, ...opts });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}

export function writeEvidence(id, res) {
  const dir = join(EVID, id);
  mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
  const payload = { status: res.status, why: res.why || '', executedAt: ts };
  if (res.detail) payload.detail = res.detail;
  if (res.data !== undefined) payload.data = res.data;
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(payload) + '\n', 'utf-8');
  if (res.detail) writeFileSync(join(dir, 'detail.log'), String(res.detail) + '\n', 'utf-8');
  return dir;
}

// 生成每个用例的 probe.mjs（真实可重跑入口 → 委托 main.mjs 的 runOne）
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
  status: r.status, why: r.why || '', executedAt: new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14),
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