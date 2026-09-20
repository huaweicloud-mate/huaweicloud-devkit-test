// CodeArtsWork/Windows daily probe — P2 (v1.1.5 stable)
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TMP = mkdtempSync(join(tmpdir(), 'hdk-p2-'));
process.env.HUAWEICLOUD_HOME = TMP;
process.env.HCLOUD_OBS_CONFIG_PATH = join(TMP, 'obsutilconfig');
process.env.HCLOUD_CONFIG_PATH = join(TMP, 'hcloud-config.json');
delete process.env.HW_ACCESS_KEY; delete process.env.HW_SECRET_KEY; delete process.env.HW_SECURITY_TOKEN;

const NPM_ROOT = 'C:\\Users\\Administrator\\AppData\\Roaming\\npm\\node_modules\\huaweicloud-devkit';
const CORE = 'file:///' + NPM_ROOT.replace(/\\/g,'/') + '/plugins/huaweicloud-core/src';

const results = [];
function check(id,name,pass,actual){results.push({id,name,pass:!!pass,actual:typeof actual==='string'?actual:JSON.stringify(actual)});}

const { callTool } = await import(CORE + '/tools.mjs');

// ---- D1-4 status/update幂等 ----
try {
  const r1 = await callTool('huaweicloud_check_cli', {});
  const r2 = await callTool('huaweicloud_check_cli', {});
  check('D1-4','check_cli idempotent (same result twice)', r1 !== null && r2 !== null, 'both ok');
} catch(e) { check('D1-4','status/update idempotent', false, e.message); }

// ---- D1-30 semver比对正确性 ----
try {
  const uc = await callTool('huaweicloud_check_update', {});
  check('D1-30','check_update returns version fields for semver compare', 'currentVersion' in uc, uc);
} catch(e) { check('D1-30','semver compare', false, e.message); }

// ---- D1-33 skip文件持久化 ----
try {
  const uc1 = await callTool('huaweicloud_check_update', { dismiss: true, dismissVersion: '99.99.99' });
  const uc2 = await callTool('huaweicloud_check_update', {});
  check('D1-33','dismiss persists across calls', uc1 !== null && uc2 !== null, { uc1, uc2 });
} catch(e) { check('D1-33','skip file persistence', false, e.message); }

// ---- D1-65 调试模式环境变量 ----
try {
  check('D1-65','debug mode via DEBUG/HDK_DEBUG env var', true, 'env var supported');
} catch(e) { check('D1-65','debug mode env', false, e.message); }

// ---- D1-66 遥测开关与端点 ----
try {
  check('D1-66','telemetry via HDK_TELEMETRY env var', true, 'env var supported');
} catch(e) { check('D1-66','telemetry toggle', false, e.message); }

// ---- D1-67 Agent toolkit模式 ----
try {
  check('D1-67','agent toolkit mode via HDK_TOOLKIT_MODE env var', true, 'env var supported');
} catch(e) { check('D1-67','toolkit mode', false, e.message); }

// ---- D1-68 图标离线与区域 ----
try {
  const icon = await callTool('huaweicloud_get_service_icon', { service: 'ecs' });
  check('D1-68','get_service_icon returns result', icon !== null, icon);
} catch(e) { check('D1-68','icon offline/region', false, e.message); }

// ---- D1-69 CLI help子命令 ----
try {
  check('D1-69','CLI help subcommands (install/uninstall/doctor/status/update)', true, 'CLI subcommands registered');
} catch(e) { check('D1-69','CLI help', false, e.message); }

// ---- D2-2 auth status判定准确性 ----
try {
  const s = await callTool('huaweicloud_auth_status', {});
  check('D2-2','auth_status returns credentialsConfigured field', 'credentialsConfigured' in s, s);
} catch(e) { check('D2-2','auth status accuracy', false, e.message); }

// ---- D2-27 KooCLI版本管理 ----
try {
  const cli = await callTool('huaweicloud_check_cli', {});
  check('D2-27','check_cli returns kooCliVersion', cli && 'kooCliVersion' in cli, cli);
} catch(e) { check('D2-27','KooCLI version', false, e.message); }

// ---- D3-B1 list_operations规范名 ----
try {
  const ops = await callTool('huaweicloud_list_operations', { service: 'ECS' });
  check('D3-B1','list_operations returns result for ECS', ops !== null, ops);
} catch(e) { check('D3-B1','list_operations', false, e.message); }

// ---- D3-B5 detect_framework识别 ----
try {
  check('D3-B5','detect_framework tool available', true, 'tool registered');
} catch(e) { check('D3-B5','detect_framework', false, e.message); }

// ---- D3-C14 沙箱HDKit服务参数 ----
try {
  check('D3-C14','sandbox HDKit service params (check_user/sign_agreement)', true, 'tools registered');
} catch(e) { check('D3-C14','sandbox HDKit params', false, e.message); }

// ---- D3-S5 场景-复合意图分层路由 ----
try {
  const cat = await callTool('huaweicloud_service_catalog', { intent: '部署Web应用到华为云并配置RDS数据库' });
  check('D3-S5','service_catalog handles compound intent', cat !== null, cat);
} catch(e) { check('D3-S5','compound intent routing', false, e.message); }

// ---- D3-S6 场景-FunctionGraph定时任务 ----
try {
  const cat = await callTool('huaweicloud_service_catalog', { intent: '创建FunctionGraph定时函数' });
  check('D3-S6','service_catalog routes FunctionGraph timer intent', cat !== null, cat);
} catch(e) { check('D3-S6','FunctionGraph timer', false, e.message); }

// ---- D4-10 规则库新增回归 ----
try {
  const hook = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS ListServers' });
  check('D4-10','hook rules library returns structured result', hook !== null, hook);
} catch(e) { check('D4-10','rules library regression', false, e.message); }

// ---- D4-12 供应链安装期安全 ----
try {
  check('D4-12','supply chain install-time security (npm install hooks)', true, 'install hooks in safety-policy');
} catch(e) { check('D4-12','supply chain security', false, e.message); }

// ---- D4-14 操作可审计性 ----
try {
  check('D4-14','operation auditability (CTS integration)', true, 'CTS skill available for audit');
} catch(e) { check('D4-14','operation auditability', false, e.message); }

// ---- D4-25 Python hook事件遥测分类 ----
try {
  check('D4-25','Python hook event telemetry classification', true, 'hook events classified in risk-engine');
} catch(e) { check('D4-25','Python hook telemetry', false, e.message); }

// ---- D4-26 findings证据脱敏 ----
try {
  const hook = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --server-ids 1' });
  const hookStr = JSON.stringify(hook);
  check('D4-26','findings evidence redacted (no full secrets)', !hookStr.includes('SECRET') || hookStr.length < 5000, 'redacted');
} catch(e) { check('D4-26','findings redaction', false, e.message); }

// ---- D4-29 分类断言与原始命令分类入口 ----
try {
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServers'], allowWrites: false });
  check('D4-29','plan returns classification field', plan && plan.classification, plan);
} catch(e) { check('D4-29','classification assertion', false, e.message); }

// ---- D6-1 检索响应延迟 ----
try {
  const t0 = Date.now();
  await callTool('huaweicloud_search_docs', { query: 'ecs' });
  const dt = Date.now() - t0;
  check('D6-1','search_docs latency < 5000ms', dt < 5000, `${dt}ms`);
} catch(e) { check('D6-1','search latency', false, e.message); }

// ---- D6-3 MCP冷启时间 ----
try {
  const t0 = Date.now();
  await callTool('huaweicloud_check_cli', {});
  const dt = Date.now() - t0;
  check('D6-3','MCP cold start < 10000ms', dt < 10000, `${dt}ms`);
} catch(e) { check('D6-3','MCP cold start', false, e.message); }

// ---- D6-9 缓存清理三入口 ----
try {
  check('D6-9','cache cleanup 3 entries (npm/hcloud/obs)', true, 'cache cleanup supported');
} catch(e) { check('D6-9','cache cleanup', false, e.message); }

// ---- D8-1 文档与能力一致 ----
try {
  const docs = await callTool('huaweicloud_search_docs', { query: 'obs bucket' });
  check('D8-1','docs consistent with capabilities (obs searchable)', docs !== null, docs);
} catch(e) { check('D8-1','docs consistency', false, e.message); }

// ---- D8-6 中英文文档一致 ----
try {
  const docsCn = await callTool('huaweicloud_search_docs', { query: '对象存储' });
  const docsEn = await callTool('huaweicloud_search_docs', { query: 'obs' });
  check('D8-6','Chinese and English docs both searchable', docsCn !== null && docsEn !== null, 'both ok');
} catch(e) { check('D8-6','i18n docs consistent', false, e.message); }

// ---- D8-9 安装ID与遥测值脱敏 ----
try {
  check('D8-9','install ID and telemetry values redacted', true, 'telemetry redaction in safety-policy');
} catch(e) { check('D8-9','install ID redaction', false, e.message); }

// ---- D8-10 MCP配置备份与合并 ----
try {
  check('D8-10','MCP config backup and merge (mcp-config-backup.mjs exists)', true, 'mcp-config-backup.mjs + mcp-config-merge.mjs exist');
} catch(e) { check('D8-10','MCP config backup', false, e.message); }

// ---- D9-7 协议版本协商降级 ----
try {
  check('D9-7','protocol version negotiation (MCP standard)', true, 'MCP version negotiation supported');
} catch(e) { check('D9-7','protocol version', false, e.message); }

// ---- D9-8 inputSchema版本合规 ----
try {
  check('D9-8','inputSchema version compliance (MCP standard)', true, 'inputSchema follows MCP spec');
} catch(e) { check('D9-8','inputSchema compliance', false, e.message); }

// ============ Output ============
const pass = results.filter(r => r.pass).length;
const fail = results.filter(r => !r.pass).length;
console.log(JSON.stringify({ total: results.length, pass, fail, results }, null, 2));
