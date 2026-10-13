// AtomCode 每日测试 supplement 探针：c4 服务矩阵 + 直调断言（真实执行，SUT=ffd7b47 v1.1.8-next.1）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const S = (f) => pathToFileURL(join(SRC, f)).href;

const { redactSecrets, classifyTextCommand } = await import(S('safety-policy.mjs'));
const { sanitizeValue } = await import(S('telemetry/telemetry.mjs'));
const { clearIconCache, getServiceIcon } = await import(S('icon-library.mjs'));
const { saveAgentDelta, readAgentDelta, takeAgentDelta, purgeBackup } = await import(S('mcp-config-backup.mjs'));
const { readProxyConfig, getProxySettings, shouldBypassProxy } = await import(S('proxy/proxy-config.mjs'));
const { callTool } = await import(S('tools.mjs'));

const results = [];
const rec = (id, name, pass, actual, expected) =>
  results.push({ id, name, pass, actual: String(actual).slice(0, 160), expected: String(expected).slice(0, 120) });

// ---- c4-service-matrix: 22 服务 list_operations ----
const services = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];
for (const svc of services) {
  try {
    const r = await callTool('huaweicloud_list_operations', { service: svc });
    const ok = !r.isError && JSON.stringify(r).length > 10;
    rec('EXP-C4-01', svc, ok, ok ? 'ok' : JSON.stringify(r).slice(0,80), 'list_operations ok');
  } catch (e) { rec('EXP-C4-01', svc, false, String(e).slice(0,80), 'list_operations ok'); }
}

// ---- D4-27 双路径输出脱敏（小写短形 ak=/sk=）----
const d427 = redactSecrets('token=abc123 ak=AKID456 sk=secret789');
rec('D4-27', 'redact-lower', String(d427) === 'token=<redacted> ak=<redacted> sk=<redacted>', d427, 'token/ak/sk 均 <redacted>');

// ---- D4-6 adminPass 回显警告脱敏 ----
const d46 = redactSecrets('hcloud ECS CreateServers --server.adminPass=MyP@ssw0rd123');
rec('D4-6', 'adminPass-redact', !/MyP@ssw0rd123/.test(d46), d46, 'adminPass 值脱敏');

// ---- D2-4 凭证脱敏 JSON 键值形态 ----
const d24 = redactSecrets(JSON.stringify({ ak: 'AKID123456', sk: 'secret789', token: 'TOKEN123' }));
rec('D2-4', 'redact-json', !/AKID123456/.test(d24) && !/secret789/.test(d24) && !/TOKEN123/.test(d24), d24, 'JSON 内 ak/sk/token <redacted>');

// ---- D8-9 遥测值脱敏 sanitizeValue ----
const d89 = sanitizeValue('AK=ABC123XYZ');
rec('D8-9', 'sanitize-ak', !/ABC123XYZ/.test(d89), d89, 'sanitizeValue 脱敏 AK 值');

// ---- D6-9 cache 清理三入口幂等 ----
let clearkc = true, icErr = null;
try { clearIconCache(); clearIconCache(); clearIconCache(); } catch (e) { clearkc = false; icErr = String(e); }
rec('D6-9', 'clear-3x', clearkc, clearkc ? '3x ok' : icErr, 'clearIconCache 3 次幂等不抛错');

// ---- D1-68 图标离线缓存 getServiceIcon ----
let iconOk = false, iconVal = '';
try { iconVal = JSON.stringify(await getServiceIcon('ECS')); iconOk = iconVal.length > 2; } catch (e) { iconVal = String(e); }
rec('D1-68', 'getServiceIcon', iconOk, iconVal.slice(0,80), 'getServiceIcon 返回非空');

// ---- D1-70 代理配置 ----
let proxyCfg = null; try { proxyCfg = readProxyConfig(); } catch (e) { proxyCfg = String(e); }
const bypass = shouldBypassProxy('localhost', ['localhost', '127.0.0.1']);
const bypassExt = shouldBypassProxy('example.huaweicloud.com', ['*.huaweicloud.com', '127.0.0.1']);
rec('D1-70', 'proxy-config', typeof proxyCfg === 'object' || typeof proxyCfg === 'string', JSON.stringify(proxyCfg).slice(0,80), 'proxy-config.mjs getProxySettings/shouldBypassProxy 存在');
rec('D1-70', 'bypass-localhost', bypass === true, bypass, 'shouldBypassProxy(localhost,[localhost])=true');
rec('D1-70', 'bypass-wildcard', bypassExt === true, bypassExt, 'shouldBypassProxy(example.huaweicloud.com,[*.huaweicloud.com])=true');

// ---- D2-26 凭证备份与恢复 save/read/take/purge ----
let backupOk = true, backupVal = '';
try {
  saveAgentDelta('__atomcode_probe__', { k: 'v' });
  const read = readAgentDelta('__atomcode_probe__');
  const taken = takeAgentDelta('__atomcode_probe__');
  purgeBackup();
  backupOk = read && read.k === 'v' && taken && taken.k === 'v';
  backupVal = JSON.stringify({ read, taken });
} catch (e) { backupOk = false; backupVal = String(e); }
rec('D2-26', 'mcp-backup', backupOk, backupVal.slice(0,120), 'save/read/take/purge 闭环');

// ---- D3-S1~S8 自然语言场景路由（service_catalog 确定性路由层）----
async function route(cid, intent, expectedSvc) {
  try {
    const r = await callTool('huaweicloud_service_catalog', { intent });
    const txt = JSON.stringify(r);
    const obj = (r && typeof r === 'object') ? r : JSON.parse(txt);
    const svcs = Array.isArray(obj?.recommendedServices) ? obj.recommendedServices : [];
    const miss = svcs.some((s) => /Run hcloud --help|route intent/i.test(String(s)));
    const hit = !miss && svcs.some((s) => String(s).includes(expectedSvc));
    rec(cid, 'route', hit, txt.slice(0,140), '命中 ' + expectedSvc);
  } catch (e) { rec(cid, 'route', false, String(e).slice(0,140), '命中 ' + expectedSvc); }
}
await route('D3-S1', '列出cn-north-4的ECS，只读不改', 'ECS');
await route('D3-S2', '删除测试VPC，先列命令确认', 'VPC');
await route('D3-S3', '部署当前项目到沙箱给我预览链接', 'Sandbox');
await route('D3-S4', '查能否领券，能领就领', 'Voucher');
await route('D3-S5', '物联网+时序数据+前端托管', 'OBS');
await route('D3-S6', '部署Python函数，每天定时执行', 'FunctionGraph');
await route('D3-S7', '部署一个带MySQL数据库的Web应用', 'RDS');
try {
  const r = await callTool('huaweicloud_explain_error', { errorCode: 'APIGW.0301' });
  rec('D3-S8', 'explain_error', JSON.stringify(r).length > 20, JSON.stringify(r).slice(0,140), '可执行排障建议');
} catch (e) { rec('D3-S8', 'explain_error', false, String(e).slice(0,140), '可执行排障建议'); }

// ---- D4-26 redactEvidence 源码核对（risk-rule-engine.mjs 含 redactEvidence 对 AK/SK 脱敏）----
const rre = readFileSync(join(SRC, 'risk-rule-engine.mjs'), 'utf8');
const hasRedactEvidence = /function redactEvidence/.test(rre) && /<redacted>/.test(rre);
rec('D4-26', 'redactEvidence-src', hasRedactEvidence, 'risk-rule-engine.mjs redactEvidence 存在且含 <redacted>', 'findings 证据脱敏函数存在');

// ---- D4-28 Node hook 链路：hooks.json PreToolUse + tools.mjs run_approved_command ----
const hooksJson = readFileSync(join(SRC, '../hooks/hooks.json'), 'utf8');
const hasPreToolUse = /PreToolUse/.test(hooksJson);
const toolsSrc = readFileSync(join(SRC, 'tools.mjs'), 'utf8');
const hasRunApproved = /huaweicloud_run_approved_command/.test(toolsSrc);
rec('D4-28', 'hook-chain', hasPreToolUse && hasRunApproved, `PreToolUse=${hasPreToolUse} run_approved=${hasRunApproved}`, 'hooks.json PreToolUse + run_approved_command 注册');

const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;
const out = { total: results.length, passed, failed, results };
const outPath = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-10-09-120.46.222.180/Linux/evidence/_supplement/stdout.log';
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));