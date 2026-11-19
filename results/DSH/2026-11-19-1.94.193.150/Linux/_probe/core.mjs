// core.mjs — 每日测试探针共享核心：hdk 导入 + 注册表 + 证据落盘 + probe.mjs 生成。
import { pathToFileURL } from 'node:url';
import { join, dirname, relative } from 'node:path';
import { homedir } from 'node:os';
import { execSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, symlinkSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require_readdir = (d) => readdirSync(d);
const statIsDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
// _probe/ 位于结果包 Linux/ 目录下
export const PACK = dirname(__dirname);
export const EVID = join(PACK, 'evidence');
export const REPO_ROOT = dirname(dirname(dirname(dirname(PACK))));

// v2.0.0 SUT：源码由 .mjs 迁移为 TypeScript，npm 包发布编译产物 dist/*.js。
// 探针直接导入「已安装包」的 dist（与被测黑盒/全局安装同一份代码），
// hdk 源码仓仅用于根因定位（文件:行号指向 .ts）。
export function hdkSrc() {
  if (process.env.HDK_DIST) return process.env.HDK_DIST;
  if (process.env.HDK_SRC) return process.env.HDK_SRC; // 兼容旧版 .mjs 源码直调
  const cands = [];
  try { cands.push(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'huaweicloud-devkit', 'plugins', 'huaweicloud-core', 'dist')); } catch {}
  cands.push(join(homedir(), 'nodejs', 'lib', 'node_modules', 'huaweicloud-devkit', 'plugins', 'huaweicloud-core', 'dist'));
  for (const c of cands) if (existsSync(c)) return c;
  return cands[0];
}

// 旧夹具以 hdk src 为根、按 .mjs 相对路径 import/read；v2 需把 .mjs 映射到 dist 的 .js。
// 生成符号链接树：<compat>/<rel>.mjs -> <dist>/<rel>.js（内容为编译产物，真实可执行）。
export function compatSrc() {
  const dist = hdkSrc();
  const COMPAT = join(PACK, '_probe', '_compat');
  const MARK = join(COMPAT, '.ready-v2');
  if (existsSync(MARK)) return join(COMPAT, 'plugins', 'huaweicloud-core', 'dist');
  const pkgRoot = join(dist, '..', '..', '..');
  const coreRoot = join(dist, '..');
  const mirrorDist = join(COMPAT, 'plugins', 'huaweicloud-core', 'dist');
  mkdirSync(mirrorDist, { recursive: true });
  const linkIfExists = (target, link) => { try { if (existsSync(target) && !existsSync(link)) symlinkSync(target, link); } catch {} };
  // 包根与 core 根的相对路径读取（夹具按 srcDir/../../../package.json 规则定位）
  for (const f of ['package.json', 'README.md', 'README.zh-CN.md', 'plugin.json', 'mcp.json', 'cordis.patch.yml', 'rules', 'bin', 'integrations', 'LICENSE', 'NOTICE']) {
    linkIfExists(join(pkgRoot, f), join(COMPAT, f));
  }
  for (const f of ['package.json', 'safety', 'hooks', 'assets', 'skills', 'telemetry', 'openclaw.plugin.json', 'tsconfig.json']) {
    linkIfExists(join(coreRoot, f), join(COMPAT, 'plugins', 'huaweicloud-core', f));
  }
  // dist 内 .js 全部映射为同名 .mjs 符号链接（真实编译产物，可直接 import/readFileSync）
  const walk = (d) => {
    for (const e of require_readdir(d)) {
      const src = join(d, e);
      const rel = relative(dist, src);
      if (statIsDir(src)) { walk(src); continue; }
      if (!e.endsWith('.js')) continue;
      const dst = join(mirrorDist, rel.replace(/\.js$/, '.mjs'));
      mkdirSync(dirname(dst), { recursive: true });
      try { if (!existsSync(dst)) symlinkSync(src, dst); } catch {}
    }
  };
  walk(dist);
  writeFileSync(MARK, String(Date.now()));
  return mirrorDist;
}

let _h = null;
export async function hdk() {
  if (_h) return _h;
  const SRC = hdkSrc();
  const U = (p) => pathToFileURL(join(SRC, p.replace(/\.mjs$/, '.js'))).href;
  const authCred = await import(U('auth/credentials.mjs'));
  const authSvc = await import(U('auth/service.mjs'));
  const authRec = await import(U('auth/reconcile.mjs'));
  const authVal = await import(U('auth/credential-validator.mjs'));
  const authProj = await import(U('auth/project-id.mjs'));
  const authReg = await import(U('auth/agent-registration.mjs'));
  // v2.0.0 新增 vendor gate：受门禁工具必须带 vendorConfirmed（用户侧确认原文），
  // 且首次断言会弹一次 challenge。测试确定性层级用官方开关关闭 challenge（gate 本身不关），
  // 探针统一补「华为云」确认原文，使被测逻辑（而非门禁）成为断言对象。
  process.env.HUAWEICLOUD_VENDOR_CHALLENGE = 'off';
  const toolsMod = await import(U('tools.mjs'));
  const gated = toolsMod.VENDOR_GATED_TOOLS || new Set();
  const _callTool = toolsMod.callTool;
  const toolsObj = { ...toolsMod };
  toolsObj.callTool = (name, args = {}, opts = {}) => {
    const a = { ...(args || {}) };
    if (gated.has(name) && (typeof a.vendorConfirmed !== 'string' || !a.vendorConfirmed.trim())) {
      a.vendorConfirmed = process.env.HDK_VENDOR_QUOTE || '帮我查一下华为云上的资源';
    }
    return _callTool(name, a, opts);
  };
  _h = {
    SRC,
    vg: await import(U('vendor-gate.mjs')),
    tools: toolsObj,
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
    telemetry: await import(U('telemetry/telemetry.mjs')),
    proxyCfg: await import(U('proxy/proxy-config.mjs')),
    proxyAg: await import(U('proxy/proxy-agent.mjs')),
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
    if (!noHdk) args.push(compatSrc());
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

// 北京时间 14 位紧凑时间戳 YYYYMMDDHHmmss（UTC+8）
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