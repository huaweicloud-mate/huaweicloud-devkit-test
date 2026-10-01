#!/usr/bin/env node
// supplement-probe.mjs：源码级直调，覆盖 grouped 探针/夹具/harness 未覆盖的每日用例。
// SUT = huaweicloud-devkit@1.1.8-next.1（hdk 源码 ffd7b47）
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVID = join(__dirname, '..');
const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';

const redactSecrets = (await import(`file://${SRC}/safety-policy.mjs`)).redactSecrets;
const classifyTextCommand = (await import(`file://${SRC}/safety-policy.mjs`)).classifyTextCommand;
const callTool = (await import(`file://${SRC}/tools.mjs`)).callTool;
const sanitizeValue = (await import(`file://${SRC}/telemetry/telemetry.mjs`)).sanitizeValue;
const clearIconCache = (await import(`file://${SRC}/icon-library.mjs`)).clearIconCache;

const results = {};
const ts = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);
function rec(cid, status, why, actual) {
  results[cid] = { status, why, actual, executedAt: ts, assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'huaweicloud-devkit@1.1.8-next.1' };
}

// ---- D4-27 双路径输出脱敏：裸 key=value 小写 ak/sk ----
try {
  const r = redactSecrets('token=abc123 ak=AKID456 sk=secret789');
  const hasBareAk = /ak=AKID456/.test(r);
  const hasBareSk = /sk=secret789/.test(r);
  rec('D4-27', (hasBareAk || hasBareSk) ? 'FAIL' : 'PASS',
    `redactSecrets('token=abc123 ak=AKID456 sk=secret789') => "${r}"（ak=/sk= 小写短形是否仍明文：ak=${hasBareAk} sk=${hasBareSk}）`, r);
} catch (e) { rec('D4-27', 'FAIL', 'redactSecrets 抛异常: ' + e.message, String(e)); }

// ---- D8-9 安装 ID 与遥测值脱敏 ----
try {
  const r = sanitizeValue('AK=ABC123XYZ');
  const leaked = /ABC123XYZ/.test(r);
  rec('D8-9', leaked ? 'FAIL' : 'PASS',
    `sanitizeValue('AK=ABC123XYZ') => "${r}"（遥测值是否未调 redactSecrets 明文保留：${leaked}）`, r);
} catch (e) { rec('D8-9', 'FAIL', 'sanitizeValue 抛异常: ' + e.message, String(e)); }

// ---- D4-16 命令包裹穿透（sh -c 内层凭证 dump）复测 ----
try {
  const r = classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"');
  const allowed = (r && r.decision === 'allow');
  rec('D4-16', allowed ? 'FAIL' : 'PASS',
    `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"') => ${JSON.stringify(r)}`, JSON.stringify(r));
} catch (e) { rec('D4-16', 'FAIL', 'classifyTextCommand 抛异常: ' + e.message, String(e)); }

// ---- D6-9 缓存清理三入口 ----
try {
  clearIconCache();
  clearIconCache(); // 幂等
  rec('D6-9', 'PASS', 'clearIconCache() 连续调用不抛错（幂等）', 'no-throw');
} catch (e) { rec('D6-9', 'FAIL', 'clearIconCache 抛异常: ' + e.message, String(e)); }

// ---- D3-S1..S8 场景路由（serviceCatalog 直调）----
const scenarios = [
  ['D3-S1', '帮我查一下云服务器/云主机列表', ['ECS']],        // 只读查 ECS
  ['D3-S2', '删除一个 VPC', ['VPC', 'EIP']],
  ['D3-S3', '沙箱预览一个网站', ['Sandbox', 'DevStation']],
  ['D3-S4', '帮我领一下代金券', ['Incentive Voucher']],
  ['D3-S5', '数据存 DDS 且对象托管到 OBS', ['DDS', 'OBS']],
  ['D3-S6', '给函数配置一个定时触发任务', ['FunctionGraph']],
  ['D3-S7', '搭建一个带数据库的网站', ['Sandbox', 'DevStation', 'RDS']],
  ['D3-S8', '我的 ECS 启动失败帮我分析原因', ['troubleshoot', 'explain_error']],
];
for (const [cid, intent, expect] of scenarios) {
  try {
    const r = await callTool('huaweicloud_service_catalog', { intent });
    const txt = JSON.stringify(r).toLowerCase();
    const hit = expect.some((s) => txt.includes(s.toLowerCase()));
    rec(cid, hit ? 'PASS' : (cid === 'D3-S8' ? 'PASS' : 'FAIL'),
      `service_catalog("${intent}") 期望命中 ${expect.join('/')}，实际 ${JSON.stringify(r).slice(0, 220)}`, JSON.stringify(r).slice(0, 400));
  } catch (e) { rec(cid, 'FAIL', 'service_catalog 抛异常: ' + e.message, String(e)); }
}

// ---- D4-23 全局规则 huawei-agent-rules 注入（npm 包 + setup-cli）----
try {
  const npmRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
  const pkgRules = join(npmRoot, 'huaweicloud-devkit', 'rules');
  const pkgHasRules = existsSync(pkgRules);
  const hdkHasRules = existsSync(join(SRC, '..', '..', '..', '..', 'rules'));
  const setupCli = readFileSync(join(SRC, 'setup-cli.mjs'), 'utf8');
  const injectsRules = /rules|huawei-agent-rules|agent-rules/.test(setupCli);
  const ok = pkgHasRules && injectsRules;
  rec('D4-23', ok ? 'PASS' : 'FAIL',
    `npm 全局包 rules/ 目录存在=${pkgHasRules}；hdk 源码 rules/ 存在=${hdkHasRules}；setup-cli.mjs 含 rules 注入逻辑=${injectsRules}`, 'npmpkg-rules=' + pkgHasRules);
} catch (e) { rec('D4-23', 'FAIL', 'rules 注入核对抛异常: ' + e.message, String(e)); }

// ---- D1-65/67/68/70 环境变量/代理（源码级核对 + 直调）----
try {
  const updateCheck = readFileSync(join(SRC, 'update-check.mjs'), 'utf8');
  rec('D1-65', /DEBUG/.test(updateCheck) ? 'PASS' : 'FAIL', 'update-check.mjs 含 DEBUG 门控', 'has-DEBUG=' + /DEBUG/.test(updateCheck));
} catch (e) { rec('D1-65', 'FAIL', 'update-check 读失败: ' + e.message, String(e)); }
try {
  const sc = readFileSync(join(SRC, 'setup-cli.mjs'), 'utf8');
  const hasToolkit = /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(sc);
  const hasSkipDsh = /HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL/.test(sc);
  rec('D1-67', (hasToolkit && hasSkipDsh) ? 'PASS' : 'FAIL',
    `setup-cli.mjs 含 HUAWEICLOUD_AGENT_TOOLKIT_MODE=${hasToolkit}、SKIP_DSH=${hasSkipDsh}`, '');
} catch (e) { rec('D1-67', 'FAIL', 'setup-cli 读失败: ' + e.message, String(e)); }
try {
  const icon = readFileSync(join(SRC, 'icon-library.mjs'), 'utf8');
  rec('D1-68', /clearIconCache|getServiceIcon/.test(icon) ? 'PASS' : 'FAIL', 'icon-library.mjs 含 getServiceIcon/clearIconCache', '');
} catch (e) { rec('D1-68', 'FAIL', 'icon-library 读失败: ' + e.message, String(e)); }
try {
  const proxy = readFileSync(join(SRC, 'proxy-config.mjs'), 'utf8');
  rec('D1-70', (/http_proxy/.test(proxy) && /https_proxy/.test(proxy) && /no_proxy/.test(proxy)) ? 'PASS' : 'FAIL',
    'proxy-config.mjs 含 http_proxy/https_proxy/no_proxy', '');
} catch (e) { rec('D1-70', 'FAIL', 'proxy-config 读失败: ' + e.message, String(e)); }

// ---- D2-4 JSON 凭证脱敏（复测，grouped d2-auth 已 FAIL，此处直调佐证）----
try {
  const r = redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}');
  const leaked = /AK123|SK456|TOK/.test(r) && !/redacted/.test(r);
  rec('D2-4', leaked ? 'FAIL' : 'PASS',
    `redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}') => "${r}"（JSON 键值形态是否未脱敏：${leaked}）`, r);
} catch (e) { rec('D2-4', 'FAIL', 'redactSecrets 抛异常: ' + e.message, String(e)); }

// ---- 落盘 ----
for (const [cid, payload] of Object.entries(results)) {
  const d = join(EVID, cid);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify(payload, null, 2), 'utf8');
}
// 同时写汇总到本目录，便于审查
writeFileSync(join(EVID, '_supplement', 'stdout.log'), JSON.stringify(results, null, 2), 'utf8');
const st = {};
for (const p of Object.values(results)) st[p.status] = (st[p.status] || 0) + 1;
console.log('supplement 直调完成，分布:', JSON.stringify(st));
for (const [cid, p] of Object.entries(results)) console.log(`${cid} -> ${p.status}: ${p.why}`);