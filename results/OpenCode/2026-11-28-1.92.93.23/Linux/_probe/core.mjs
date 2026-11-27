// core.mjs — 每日测试探针共享核心（适配 2.0.x TypeScript 重写后编译产物 dist/*.js）。
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// _probe/ 位于结果包 Linux/ 目录下
export const PACK = dirname(__dirname);
export const EVID = join(PACK, 'evidence');
export const REPO_ROOT = dirname(dirname(dirname(dirname(PACK))));

// 被测对象 = 已安装 npm 全局包 huaweicloud-devkit 的编译产物 dist（2.0.x 起源码为 .ts，产物为 .js）。
// 该 dist 即 `huaweicloud-devkit-mcp` 实际运行的副本，是黑盒测试的真实 SUT。
export function hdkSrc() {
  if (process.env.HDK_SRC) return process.env.HDK_SRC;
  const HOME = process.env.HOME || '';
  const candidates = [];
  // 1) 从 node 可执行路径推导全局 prefix（node 在 <prefix>/bin/node → 全局包在 <prefix>/lib/node_modules）
  const nodeBin = process.execPath;
  if (nodeBin && /bin[\\/]node/.test(nodeBin)) {
    candidates.push(join(dirname(dirname(nodeBin)), 'lib', 'node_modules', 'huaweicloud-devkit', 'plugins', 'huaweicloud-core', 'dist'));
  }
  // 2) createRequire 解析（若全局 node_modules 在该模块的解析路径中）
  try {
    const require = createRequire(import.meta.url);
    const p = require.resolve('huaweicloud-devkit/package.json');
    candidates.push(join(dirname(p), 'plugins', 'huaweicloud-core', 'dist'));
  } catch {}
  // 3) 常见家目录安装位
  candidates.push(join(HOME, 'nodejs', 'lib', 'node_modules', 'huaweicloud-devkit', 'plugins', 'huaweicloud-core', 'dist'));
  candidates.push(join(HOME, '.local', 'lib', 'node_modules', 'huaweicloud-devkit', 'plugins', 'huaweicloud-core', 'dist'));
  candidates.push('/usr/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist');
  for (const c of candidates) {
    if (existsSync(join(c, 'mcp-server.js'))) return c;
  }
  return candidates[0];
}

// 确定性测试层级：关闭 vendor challenge 的首次断言反弹（vendor-gate.js 文档明确
// 「HUAWEICLOUD_VENDOR_CHALLENGE=off disables the bounce for the deterministic test tiers」）。
process.env.HUAWEICLOUD_VENDOR_CHALLENGE = process.env.HUAWEICLOUD_VENDOR_CHALLENGE || 'off';

const VENDOR_QUOTE = '华为云（用户已确认使用华为云，测试机队每日测试）';

let _h = null;
export async function hdk() {
  if (_h) return _h;
  const SRC = hdkSrc();
  const U = (p) => pathToFileURL(join(SRC, p)).href;
  const authCred = await import(U('auth/credentials.js'));
  const authSvc = await import(U('auth/service.js'));
  const authRec = await import(U('auth/reconcile.js'));
  const authVal = await import(U('auth/credential-validator.js'));
  const authProj = await import(U('auth/project-id.js'));
  const authReg = await import(U('auth/agent-registration.js'));
  const tools = await import(U('tools.js'));
  const schemas = await import(U('tool-schemas.js'));
  // 包装 callTool：对 vendor-gated 工具自动注入 vendorConfirmed（用户已确认华为云的合法调用），
  // 避免每日功能用例被 2.0.x 新增的 vendor gate 一票拦截而无法测到底层能力。
  const _callTool = tools.callTool;
  const gated = tools.VENDOR_GATED_TOOLS || new Set();
  async function callTool(name, args = {}, opts = {}) {
    if (gated.has(name) && !(args && typeof args === 'object' && args.vendorConfirmed)) {
      args = { ...args, vendorConfirmed: VENDOR_QUOTE };
    }
    return _callTool(name, args, opts);
  }
  _h = {
    SRC,
    tools: { ...tools, callTool, getToolSchema: schemas.getToolSchema, TOOL_SCHEMAS: schemas.TOOL_SCHEMAS },
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
    sandboxApi: await import(U('lib/hdkit/hdkitservice-api.js')),
    hwlink: await import(U('lib/hdkit/hwlink-api.js')),
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
    const r = run(`node ${args.map(a => `"${a}"`).join(' ')} 2>&1`, { timeout: 180000 });
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

export function relative(a, b) {
  const p = b.split('/');
  const q = a.split('/');
  let i = 0;
  while (i < p.length && i < q.length && p[i] === q[i]) i++;
  const up = p.length - i;
  return (up ? '../'.repeat(up) : './') + q.slice(i).join('/');
}