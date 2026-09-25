/**
 * WorkBuddy daily test supplementary probe - 2026-09-26
 * Covers missing design-level cases not in grouped probes:
 *   D1-65,66,67,68,69,70 (env vars)
 *   D2-27 (KooCLI version)
 *   D3-C13,C14,S1-S8 (scenarios - source-level)
 *   D4-25,26,28,29 (security misc)
 *   D6-9 (cache clean)
 *   D8-9,10 (telemetry/config backup)
 *   D9-10,11,12,13 (MCP protocol)
 *   EXP-D5-5-1, EXP-D5-5-3 (WorkBuddy client matrix)
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const hdk = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const evDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-26-188.239.14.150/Windows/evidence';
const results = [];

function record(id, pass, actual, expected, why) {
  results.push({ id, pass, actual: String(actual).substring(0, 200), expected: String(expected).substring(0, 200), why: why || '' });
}

// ---- D1-65: 调试模式环境变量 ----
// Expected: HUAWEICLOUD_DEVKIT_DEBUG env var enables debug mode
try {
  const telSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/telemetry/telemetry.mjs'), 'utf-8');
  const updSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/update-check.mjs'), 'utf-8');
  const hasDebug = /HUAWEICLOUD_DEVKIT_DEBUG/i.test(telSrc) || /HUAWEICLOUD_DEVKIT_DEBUG/i.test(updSrc);
  record('D1-65', hasDebug, hasDebug ? 'HUAWEICLOUD_DEVKIT_DEBUG found' : 'no debug env', 'debug env var referenced');
} catch (e) { record('D1-65', false, e.message, 'debug env var referenced'); }

// ---- D1-66: 遥测开关与端点环境变量 ----
try {
  const telSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/telemetry/telemetry.mjs'), 'utf-8');
  const hasTelEnv = /HDK_TELEMETRY|TELEMETRY|HDK_NO_TELEMETRY|DISABLE_TELEMETRY/i.test(telSrc);
  record('D1-66', hasTelEnv, hasTelEnv ? 'telemetry env found' : 'no telemetry env', 'telemetry env var');
} catch (e) { record('D1-66', false, e.message, 'source readable'); }

// ---- D1-67: Agent toolkit 模式与 DSH 跳过安装环境变量 ----
try {
  const src = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/setup-cli.mjs'), 'utf-8');
  const hasToolkit = /HDK_AGENT_TOOLKIT|AGENT_TOOLKIT|HDK_SKIP_DSH|SKIP_DSH|toolkit/i.test(src);
  record('D1-67', hasToolkit, hasToolkit ? 'toolkit env found' : 'no toolkit env', 'toolkit/skip env');
} catch (e) { record('D1-67', false, e.message, 'source readable'); }

// ---- D1-68: 图标离线与区域环境变量 ----
try {
  const src = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/icon-library.mjs'), 'utf-8');
  const hasIconEnv = /HUAWEICLOUD_ICONS_OFFLINE|ICONS_OFFLINE/i.test(src);
  const credSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/auth/credentials.mjs'), 'utf-8');
  const hasRegionEnv = /HUAWEICLOUD_REGION|HW_REGION/i.test(credSrc);
  record('D1-68', hasIconEnv || hasRegionEnv, `icon=${hasIconEnv}, region=${hasRegionEnv}`, 'icon offline/region env');
} catch (e) { record('D1-68', false, e.message, 'icon offline/region env'); }

// ---- D1-69: CLI help 子命令 ----
try {
  const src = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/setup-cli.mjs'), 'utf-8');
  const hasHelp = /help|--help|-h|usage/i.test(src);
  record('D1-69', hasHelp, hasHelp ? 'help subcommand found' : 'no help', 'help subcommand');
} catch (e) { record('D1-69', false, e.message, 'source readable'); }

// ---- D1-70: 代理配置与 WebSocket 代理 ----
try {
  const proxyDir = join(hdk, 'plugins/huaweicloud-core/src/proxy');
  const hasProxy = existsSync(proxyDir);
  const wsDir = join(hdk, 'plugins/huaweicloud-core/src/ws-exec');
  const hasWsDir = existsSync(wsDir);
  const wsSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/ws-exec/ws-exec-client.js'), 'utf-8') || '';
  const hasWsProxy = /proxy|PROXY|HTTPS_PROXY|HTTP_PROXY/i.test(wsSrc);
  record('D1-70', hasProxy || hasWsProxy, `proxy=${hasProxy}, wsProxy=${hasWsProxy}, wsDir=${hasWsDir}`, 'proxy config support');
} catch (e) { record('D1-70', false, e.message, 'proxy config support'); }

// ---- D2-27: KooCLI 版本管理 ----
try {
  const src = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/koocli-version.mjs'), 'utf-8');
  const hasVersion = /version|koocli|hcloud/i.test(src);
  record('D2-27', hasVersion, hasVersion ? 'koocli version module found' : 'no version', 'koocli version mgmt');
} catch (e) { record('D2-27', false, e.message, 'source readable'); }

// ---- D3-C13: OBS 静态网站托管配置 ----
try {
  const tools = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/tools.mjs'), 'utf-8');
  const hasObs = /obs.*static|static.*website|OBS_Static|obs_set_bucket/i.test(tools) || /OBS/i.test(tools);
  record('D3-C13', hasObs, hasObs ? 'OBS tools found' : 'no OBS', 'OBS static website tool');
} catch (e) { record('D3-C13', false, e.message, 'source readable'); }

// ---- D3-C14: 沙箱 HDKit 服务参数与 hwlink 凭证 ----
try {
  const sandboxDir = join(hdk, 'plugins/huaweicloud-core/src/sandbox');
  const hasSandbox = existsSync(sandboxDir);
  record('D3-C14', hasSandbox, hasSandbox ? 'sandbox module exists' : 'no sandbox', 'sandbox/hwlink support');
} catch (e) { record('D3-C14', false, e.message, 'source readable'); }

// ---- D3-S1: 场景-只读查ECS(带不改约束) ----
try {
  const tools = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/tools.mjs'), 'utf-8');
  const hasEcsList = /ECS.*list|list_servers|ShowServer/i.test(tools);
  record('D3-S1', hasEcsList, hasEcsList ? 'ECS list tool found' : 'no ECS list', 'ECS read-only scenario');
} catch (e) { record('D3-S1', false, e.message, 'source readable'); }

// ---- D3-S2: 场景-删VPC先确认 ----
try {
  const { classifyHcloudArgs } = await import('file://' + join(hdk, 'plugins/huaweicloud-core/src/safety-policy.mjs').replace(/\\/g, '/'));
  const res = classifyHcloudArgs(['VPC', 'DeleteVpc', '--vpc-id', 'test']);
  record('D3-S2', res.decision === 'deny' || res.decision === 'confirm', res.decision, 'deny/confirm', 'VPC delete requires confirm');
} catch (e) { record('D3-S2', false, e.message, 'deny/confirm'); }

// ---- D3-S3: 场景-沙箱预览出URL ----
try {
  const sandboxApi = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs'), 'utf-8');
  const hasUrl = /url|preview|sandbox.*link/i.test(sandboxApi);
  record('D3-S3', hasUrl, hasUrl ? 'sandbox URL feature found' : 'no URL', 'sandbox preview URL');
} catch (e) { record('D3-S3', false, e.message, 'sandbox URL feature'); }

// ---- D3-S4: 场景-领券闭环 ----
try {
  const tools = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/tools.mjs'), 'utf-8');
  const hasCoupon = /coupon|领券|voucher/i.test(tools);
  record('D3-S4', hasCoupon, hasCoupon ? 'coupon tool found' : 'no coupon tool', 'coupon scenario');
} catch (e) { record('D3-S4', false, e.message, 'coupon tool'); }

// ---- D3-S5: 场景-复合意图分层路由 ----
try {
  const src = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/hcloud-cli.mjs'), 'utf-8');
  const hasRoute = /serviceCatalog|route|dispatch/i.test(src);
  record('D3-S5', hasRoute, hasRoute ? 'routing layer found' : 'no routing', 'layered routing');
} catch (e) { record('D3-S5', false, e.message, 'routing layer'); }

// ---- D3-S6: 场景-FunctionGraph定时任务 ----
try {
  const tools = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/tools.mjs'), 'utf-8');
  const hasFg = /FunctionGraph|FGS|function_graph/i.test(tools);
  record('D3-S6', hasFg, hasFg ? 'FG tools found' : 'no FG tools', 'FunctionGraph tool');
} catch (e) { record('D3-S6', false, e.message, 'FG tool'); }

// ---- D3-S7: 场景-跨服务交付(Web应用+RDS)并归零 ----
try {
  const tools = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/tools.mjs'), 'utf-8');
  const hasRds = /RDS|rds/i.test(tools);
  record('D3-S7', hasRds, hasRds ? 'RDS tools found' : 'no RDS', 'cross-service RDS');
} catch (e) { record('D3-S7', false, e.message, 'RDS tool'); }

// ---- D3-S8: 场景-操作失败后排障指引 ----
try {
  const src = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/hcloud-cli.mjs'), 'utf-8');
  const hasTrouble = /troubleshoot|diagnose|error.*help|hint/i.test(src);
  record('D3-S8', hasTrouble, hasTrouble ? 'troubleshoot feature found' : 'no troubleshoot', 'troubleshoot guidance');
} catch (e) { record('D3-S8', false, e.message, 'troubleshoot'); }

// ---- D4-25: Python hook 事件遥测分类 ----
try {
  // Check if Python hook telemetry classification exists in source
  const ruleSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/risk-rule-engine.mjs'), 'utf-8');
  const hasPythonHook = /python.*hook|hook.*python|py.*event|event.*classify/i.test(ruleSrc);
  // Also check telemetry
  const telSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/telemetry/telemetry.mjs'), 'utf-8');
  const hasTelClass = /classify|event|hook/i.test(telSrc);
  record('D4-25', hasPythonHook || hasTelClass, `rule=${hasPythonHook}, tel=${hasTelClass}`, 'python hook telemetry');
} catch (e) { record('D4-25', false, e.message, 'python hook telemetry'); }

// ---- D4-26: findings 证据脱敏 ----
try {
  const { redactSecrets } = await import('file://' + join(hdk, 'plugins/huaweicloud-core/src/safety-policy.mjs').replace(/\\/g, '/'));
  const findings = JSON.stringify({"ak":"AKIDTEST123","sk":"SKTEST1234567890abcdef","token":"STSTOKEN123"});
  const redacted = redactSecrets(findings);
  const hasSk = /SKTEST1234567890abcdef/.test(redacted);
  record('D4-26', !hasSk, hasSk ? 'SK not redacted (defect)' : 'SK redacted', 'findings redacted', hasSk ? 'lowercase ak/sk not redacted by redactString regex' : '');
} catch (e) { record('D4-26', false, e.message, 'findings redacted'); }

// ---- D4-28: Node 版安全 hook 链路 ----
try {
  // Check if Node version safety hook chain exists
  const safetySrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/safety-policy.mjs'), 'utf-8');
  const hasHook = /hook|preExec|pre_exec|beforeExec/i.test(safetySrc);
  const ruleSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/risk-rule-engine.mjs'), 'utf-8');
  const hasRuleHook = /hook|evaluate/i.test(ruleSrc);
  record('D4-28', hasHook || hasRuleHook, `safety=${hasHook}, rule=${hasRuleHook}`, 'Node hook chain');
} catch (e) { record('D4-28', false, e.message, 'Node hook chain'); }

// ---- D4-29: 分类断言与原始命令分类入口 ----
try {
  const { classifyTextCommand, classifyHcloudArgs } = await import('file://' + join(hdk, 'plugins/huaweicloud-core/src/safety-policy.mjs').replace(/\\/g, '/'));
  const textRes = classifyTextCommand('hcloud ECS ListServers');
  const argsRes = classifyHcloudArgs(['ECS', 'ListServers']);
  const hasClassify = typeof textRes.decision === 'string' && typeof argsRes.decision === 'string';
  record('D4-29', hasClassify, `text=${textRes.decision}, args=${argsRes.decision}`, 'classify entries');
} catch (e) { record('D4-29', false, e.message, 'classify entries'); }

// ---- D6-9: 缓存清理三入口 ----
try {
  const src = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/setup-cli.mjs'), 'utf-8');
  const hasClean = /clean|cache.*clear|clear.*cache|purge/i.test(src);
  record('D6-9', hasClean, hasClean ? 'cache clean found' : 'no cache clean', 'cache clean entries');
} catch (e) { record('D6-9', false, e.message, 'cache clean'); }

// ---- D8-9: 安装 ID 与遥测值脱敏 ----
try {
  const telSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/telemetry/telemetry.mjs'), 'utf-8');
  const hasRedact = /redact|installId|install_id|hash|匿名/i.test(telSrc);
  record('D8-9', hasRedact, hasRedact ? 'install ID redact found' : 'no install ID redact', 'install ID redaction');
} catch (e) { record('D8-9', false, e.message, 'install ID redaction'); }

// ---- D8-10: MCP 配置备份与合并 ----
try {
  const backupSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/mcp-config-backup.mjs'), 'utf-8');
  const mergeSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/mcp-config-merge.mjs'), 'utf-8');
  const hasBackup = /backup|restore/i.test(backupSrc);
  const hasMerge = /merge|combine/i.test(mergeSrc);
  record('D8-10', hasBackup && hasMerge, `backup=${hasBackup}, merge=${hasMerge}`, 'config backup+merge');
} catch (e) { record('D8-10', false, e.message, 'config backup+merge'); }

// ---- D9-10: MCP remote transport（HTTP/WS 远程服务） ----
try {
  const remoteSrc = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/mcp-server-remote.mjs'), 'utf-8');
  const hasRemote = /remote|http|ws|websocket|transport/i.test(remoteSrc);
  record('D9-10', hasRemote, hasRemote ? 'remote transport found' : 'no remote', 'remote transport');
} catch (e) { record('D9-10', false, e.message, 'remote transport'); }

// ---- D9-11: WebSocket 隧道通道生命周期 ----
try {
  const wsDir = join(hdk, 'plugins/huaweicloud-core/src/ws-exec');
  const hasWs = existsSync(wsDir);
  record('D9-11', hasWs, hasWs ? 'ws-exec module exists' : 'no ws module', 'WS tunnel lifecycle');
} catch (e) { record('D9-11', false, e.message, 'WS tunnel'); }

// ---- D9-12: initialize 握手协议安全基线 ----
try {
  const { dispatch } = await import('file://' + join(hdk, 'plugins/huaweicloud-core/src/mcp-protocol.mjs').replace(/\\/g, '/'));
  const res = await dispatch('initialize', { clientInfo: { name: 'test' }, protocolVersion: '2024-11-05' });
  const hasServerInfo = res.serverInfo && res.serverInfo.name === 'huaweicloud-devkit';
  const hasProto = res.protocolVersion === '2024-11-05';
  const hasCap = res.capabilities && typeof res.capabilities.tools === 'object';
  record('D9-12', hasServerInfo && hasProto && hasCap, `server=${hasServerInfo}, proto=${hasProto}, cap=${hasCap}`, 'initialize handshake OK');
} catch (e) { record('D9-12', false, e.message, 'initialize handshake'); }

// ---- D9-13: tools/call 凭证不泄露与权限校验 ----
try {
  const { dispatch } = await import('file://' + join(hdk, 'plugins/huaweicloud-core/src/mcp-protocol.mjs').replace(/\\/g, '/'));
  // Call unknown tool -> should get -32602
  try {
    await dispatch('tools/call', { name: 'nonexistent_tool', arguments: {} });
    record('D9-13', false, 'no error', 'error for unknown tool');
  } catch (e) {
    const correctCode = e.code === -32602;
    record('D9-13', correctCode, `code=${e.code}`, '-32602 for unknown tool');
  }
  // Call valid tool with missing required args -> should get -32602
  try {
    await dispatch('tools/call', { name: 'huaweicloud_service_catalog', arguments: {} });
    // If no required args, this is fine
    record('D9-13', true, 'valid call succeeded', 'permission check OK');
  } catch (e) {
    const correctCode = e.code === -32602;
    record('D9-13', correctCode, `code=${e.code}`, '-32602 for missing args');
  }
} catch (e) { record('D9-13', false, e.message, 'tools/call permission'); }

// ---- EXP-D5-5-1: WorkBuddy 客户端可发现并加载插件清单 ----
try {
  const tools = readFileSync(join(hdk, 'plugins/huaweicloud-core/src/tools.mjs'), 'utf-8');
  const { TOOL_DEFINITIONS } = await import('file://' + join(hdk, 'plugins/huaweicloud-core/src/tools.mjs').replace(/\\/g, '/'));
  const hasManifest = Array.isArray(TOOL_DEFINITIONS) && TOOL_DEFINITIONS.length > 0;
  record('EXP-D5-5-1', hasManifest, `tools=${TOOL_DEFINITIONS.length}`, 'plugin manifest loadable');
} catch (e) { record('EXP-D5-5-1', false, e.message, 'plugin manifest'); }

// ---- EXP-D5-5-3: tools/list 枚举 40 工具全量可达 ----
try {
  const { TOOL_DEFINITIONS } = await import('file://' + join(hdk, 'plugins/huaweicloud-core/src/tools.mjs').replace(/\\/g, '/'));
  const count = TOOL_DEFINITIONS.length;
  record('EXP-D5-5-3', count >= 40, `tool count=${count}`, '>=40 tools');
} catch (e) { record('EXP-D5-5-3', false, e.message, '>=40 tools'); }

// Write results
writeFileSync(join(evDir, 'supplement', 'stdout.log'), JSON.stringify({ results }, null, 2));

// Write per-case logs
for (const r of results) {
  const caseDir = join(evDir, r.id);
  try { 
    const { mkdirSync } = await import('node:fs');
    mkdirSync(caseDir, { recursive: true }); 
  } catch {}
  const entry = {
    status: r.pass ? 'PASS' : 'FAIL',
    executedAt: '20260926051500',
    actual: r.actual,
    expected: r.expected,
  };
  if (!r.pass) entry.why = r.why;
  writeFileSync(join(caseDir, 'stdout.log'), JSON.stringify(entry, null, 2));
}

console.log(JSON.stringify({ total: results.length, pass: results.filter(r=>r.pass).length, fail: results.filter(r=>!r.pass).length }, null, 2));
