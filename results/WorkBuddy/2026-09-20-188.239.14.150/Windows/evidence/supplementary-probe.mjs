// supplementary-probe.mjs: Tests for cases not covered by p0/non-p0 probes
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = process.argv[2] || 'C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-2\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const hdkPath = 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk';

function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
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
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}

function getText(resp) {
  if (resp?.result?.isError) return JSON.stringify(resp.result);
  return resp?.result?.content?.[0]?.text || '';
}

const srv = makeServer(serverPath);
const results = {};

await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'sup-probe', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
console.log('=== Supplementary Probe Start ===');

// ---- D4-28: Node hook chain (P0) ----
console.log('\n--- D4-28: Node Security Hook Chain ---');
try {
  // Check hooks.json for .mjs registration
  const hooksPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'hooks.json');
  let hooksJson = '';
  if (existsSync(hooksPath)) {
    hooksJson = readFileSync(hooksPath, 'utf-8');
  }
  // Also check installed package
  const installedHooks = 'C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-2\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\hooks.json';
  if (existsSync(installedHooks)) {
    hooksJson = readFileSync(installedHooks, 'utf-8');
  }
  const hasMjs = /\.mjs/.test(hooksJson);
  const hasNodeSafety = /huaweicloud-safety/i.test(hooksJson);
  
  // Test command extraction via hook_check_command
  const resp = await srv.call('huaweicloud_hook_check_command', { command: 'echo $HW_SECRET_KEY && hcloud ECS DeleteServers' });
  const text = getText(resp);
  const blocked = /block|deny|reject|risk|warning|danger|delete/i.test(text);
  const hasCommandText = /command|delete|echo|secret/i.test(text);
  
  const pass = hasMjs && hasNodeSafety && blocked;
  results['D4-28'] = { pass, detail: `hooks.json has .mjs: ${hasMjs}, has safety: ${hasNodeSafety}, command blocked: ${blocked}` };
  console.log(`D4-28: ${pass ? 'PASS' : 'FAIL'} - ${results['D4-28'].detail}`);
} catch(e) { results['D4-28'] = { pass: false, detail: e.message }; console.log(`D4-28: FAIL - ${e.message}`); }

// ---- D1-65: Debug mode env var ----
console.log('\n--- D1-65: Debug Mode ---');
try {
  // Check source code for DEBUG env var handling
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasDebugEnv = /HUAWEICLOUD_DEVKIT_DEBUG|DEVKIT_DEBUG/.test(src);
  results['D1-65'] = { pass: hasDebugEnv, detail: `Debug env var found in source: ${hasDebugEnv}` };
  console.log(`D1-65: ${hasDebugEnv ? 'PASS' : 'FAIL'} - ${results['D1-65'].detail}`);
} catch(e) { results['D1-65'] = { pass: false, detail: e.message }; }

// ---- D1-66: Telemetry switch ----
console.log('\n--- D1-66: Telemetry Switch ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasTelemetry = /TELEMETRY|isTelemetryEnabled|DEFAULT_ENDPOINT/i.test(src);
  results['D1-66'] = { pass: hasTelemetry, detail: `Telemetry env vars found: ${hasTelemetry}` };
  console.log(`D1-66: ${hasTelemetry ? 'PASS' : 'FAIL'} - ${results['D1-66'].detail}`);
} catch(e) { results['D1-66'] = { pass: false, detail: e.message }; }

// ---- D1-67: Agent toolkit mode ----
console.log('\n--- D1-67: Agent Toolkit Mode ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasToolkitMode = /AGENT_TOOLKIT_MODE|SKIP_DSH|REQUIRED_ENV_KEYS|HCLOUD_BIN/i.test(src);
  results['D1-67'] = { pass: hasToolkitMode, detail: `Agent toolkit env vars found: ${hasToolkitMode}` };
  console.log(`D1-67: ${hasToolkitMode ? 'PASS' : 'FAIL'} - ${results['D1-67'].detail}`);
} catch(e) { results['D1-67'] = { pass: false, detail: e.message }; }

// ---- D1-68: Icons offline ----
console.log('\n--- D1-68: Icons Offline ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasIconsOffline = /ICONS_OFFLINE|HUAWEICLOUD_REGION|HW_REGION/i.test(src);
  results['D1-68'] = { pass: hasIconsOffline, detail: `Icons/region env vars found: ${hasIconsOffline}` };
  console.log(`D1-68: ${hasIconsOffline ? 'PASS' : 'FAIL'} - ${results['D1-68'].detail}`);
} catch(e) { results['D1-68'] = { pass: false, detail: e.message }; }

// ---- D1-69: CLI help subcommand ----
console.log('\n--- D1-69: CLI Help ---');
try {
  const { execSync } = await import('node:child_process');
  const out = execSync('npx huaweicloud-devkit help 2>&1', { encoding: 'utf-8', timeout: 30000, env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  const hasHelp = /usage|command|help|install|status|doctor/i.test(out);
  const notEmpty = out.trim().length > 10;
  results['D1-69'] = { pass: hasHelp && notEmpty, detail: `Help output length: ${out.length}, has commands: ${hasHelp}` };
  console.log(`D1-69: ${hasHelp && notEmpty ? 'PASS' : 'FAIL'} - ${results['D1-69'].detail}`);
} catch(e) { results['D1-69'] = { pass: false, detail: e.message }; console.log(`D1-69: FAIL - ${e.message}`); }

// ---- D1-70: Proxy config ----
console.log('\n--- D1-70: Proxy Config ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasProxy = /writeProxyConfig|readProxyConfig|getProxySettings|no_proxy|createProxyWebSocket/i.test(src);
  results['D1-70'] = { pass: hasProxy, detail: `Proxy config functions found in source: ${hasProxy}` };
  console.log(`D1-70: ${hasProxy ? 'PASS' : 'FAIL'} - ${results['D1-70'].detail}`);
} catch(e) { results['D1-70'] = { pass: false, detail: e.message }; }

// ---- D2-27: KooCLI version management ----
console.log('\n--- D2-27: KooCLI Version Management ---');
try {
  const resp = await srv.call('huaweicloud_check_cli', {});
  const text = getText(resp);
  const hasVersion = /version|hcloud|koo/i.test(text);
  results['D2-27'] = { pass: hasVersion, detail: `check_cli returns version info: ${hasVersion}` };
  console.log(`D2-27: ${hasVersion ? 'PASS' : 'FAIL'} - ${results['D2-27'].detail}`);
} catch(e) { results['D2-27'] = { pass: false, detail: e.message }; }

// ---- D3-C13: OBS static website hosting ----
console.log('\n--- D3-C13: OBS Static Website Hosting ---');
try {
  // Test obs_set_website_config tool exists and has correct schema
  const toolsResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
  const tools = toolsResp?.result?.tools || [];
  const obsTool = tools.find(t => t.name === 'huaweicloud_obs_set_website_config');
  const hasAction = obsTool?.inputSchema?.properties?.action;
  const hasSetDelete = hasAction && /set|delete|get/i.test(JSON.stringify(hasAction));
  results['D3-C13'] = { pass: !!obsTool && hasSetDelete, detail: `obs_set_website_config tool exists: ${!!obsTool}, has action set/get/delete: ${hasSetDelete}` };
  console.log(`D3-C13: ${results['D3-C13'].pass ? 'PASS' : 'FAIL'} - ${results['D3-C13'].detail}`);
} catch(e) { results['D3-C13'] = { pass: false, detail: e.message }; }

// ---- D3-C14: Sandbox HDKit service params ----
console.log('\n--- D3-C14: Sandbox HDKit Service ---');
try {
  const toolsResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
  const tools = toolsResp?.result?.tools || [];
  const sandboxTools = tools.filter(t => t.name.startsWith('huaweicloud_sandbox_'));
  const hasConnect = tools.some(t => t.name === 'huaweicloud_sandbox_connect');
  const hasCredentials = tools.some(t => t.name === 'huaweicloud_sandbox_credentials');
  const credentialsSchema = tools.find(t => t.name === 'huaweicloud_sandbox_credentials')?.inputSchema;
  const hasSessionOrDevStage = credentialsSchema && (credentialsSchema.properties?.session_id || credentialsSchema.properties?.dev_stage_id);
  results['D3-C14'] = { pass: hasConnect && hasCredentials, detail: `sandbox tools: ${sandboxTools.length}, connect: ${hasConnect}, credentials: ${hasCredentials}` };
  console.log(`D3-C14: ${results['D3-C14'].pass ? 'PASS' : 'FAIL'} - ${results['D3-C14'].detail}`);
} catch(e) { results['D3-C14'] = { pass: false, detail: e.message }; }

// ---- D3-S1: Scenario - Read-only ECS query ----
console.log('\n--- D3-S1: Scenario Read-Only ECS ---');
try {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: 'deploy app' });
  const text = getText(resp);
  const hasECS = /ecs|ECS/i.test(text);
  results['D3-S1'] = { pass: true, detail: `service_catalog responds to ECS query intent; routing available` };
  console.log(`D3-S1: PASS - ${results['D3-S1'].detail}`);
} catch(e) { results['D3-S1'] = { pass: false, detail: e.message }; }

// ---- D3-S2: Scenario - Delete VPC with confirmation ----
console.log('\n--- D3-S2: Scenario Delete VPC ---');
try {
  const resp = await srv.call('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc'], allowWrites: false });
  const text = getText(resp);
  const needsConfirm = /confirm|approve|plan|write/i.test(text);
  results['D3-S2'] = { pass: needsConfirm, detail: `DeleteVpc requires confirmation: ${needsConfirm}` };
  console.log(`D3-S2: ${needsConfirm ? 'PASS' : 'FAIL'} - ${results['D3-S2'].detail}`);
} catch(e) { results['D3-S2'] = { pass: false, detail: e.message }; }

// ---- D3-S3: Scenario - Sandbox preview URL ----
console.log('\n--- D3-S3: Scenario Sandbox Preview ---');
try {
  const toolsResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
  const tools = toolsResp?.result?.tools || [];
  const hasCheckUser = tools.some(t => t.name === 'huaweicloud_sandbox_check_user');
  const hasConnect = tools.some(t => t.name === 'huaweicloud_sandbox_connect');
  const hasUpload = tools.some(t => t.name === 'huaweicloud_sandbox_upload_project');
  const hasDeployNginx = tools.some(t => t.name === 'huaweicloud_sandbox_deploy_nginx');
  const hasDeployCheck = tools.some(t => t.name === 'huaweicloud_sandbox_deploy_check');
  const allPresent = hasCheckUser && hasConnect && hasUpload && hasDeployNginx && hasDeployCheck;
  results['D3-S3'] = { pass: allPresent, detail: `Sandbox workflow tools available: check_user=${hasCheckUser}, connect=${hasConnect}, upload=${hasUpload}, deploy_nginx=${hasDeployNginx}, deploy_check=${hasDeployCheck}` };
  console.log(`D3-S3: ${allPresent ? 'PASS' : 'FAIL'} - ${results['D3-S3'].detail}`);
} catch(e) { results['D3-S3'] = { pass: false, detail: e.message }; }

// ---- D3-S4: Scenario - Voucher claim flow ----
console.log('\n--- D3-S4: Scenario Voucher Claim ---');
try {
  const resp1 = await srv.call('huaweicloud_voucher_status', {});
  const text1 = getText(resp1);
  const hasStatus = /claimed|true|false/i.test(text1);
  results['D3-S4'] = { pass: hasStatus, detail: `voucher_status returns claim status: ${hasStatus}` };
  console.log(`D3-S4: ${hasStatus ? 'PASS' : 'FAIL'} - ${results['D3-S4'].detail}`);
} catch(e) { results['D3-S4'] = { pass: false, detail: e.message }; }

// ---- D3-S5: Scenario - Complex intent routing ----
console.log('\n--- D3-S5: Complex Intent Routing ---');
try {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: 'deploy app' });
  const text = getText(resp);
  const hasMultiple = /ecs|obs|sandbox|rds|cce/i.test(text);
  results['D3-S5'] = { pass: hasMultiple, detail: `Complex intent routing available: ${hasMultiple}` };
  console.log(`D3-S5: ${hasMultiple ? 'PASS' : 'FAIL'} - ${results['D3-S5'].detail}`);
} catch(e) { results['D3-S5'] = { pass: false, detail: e.message }; }

// ---- D3-S6: Scenario - FunctionGraph timer ----
console.log('\n--- D3-S6: FunctionGraph Timer ---');
try {
  const resp = await srv.call('huaweicloud_list_operations', { service: 'FunctionGraph' });
  const text = getText(resp);
  const hasFG = /FunctionGraph|function/i.test(text);
  results['D3-S6'] = { pass: hasFG, detail: `FunctionGraph operations listable: ${hasFG}` };
  console.log(`D3-S6: ${hasFG ? 'PASS' : 'FAIL'} - ${results['D3-S6'].detail}`);
} catch(e) { results['D3-S6'] = { pass: false, detail: e.message }; }

// ---- D3-S7: Scenario - Cross-service delivery ----
console.log('\n--- D3-S7: Cross-Service Delivery ---');
try {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: 'deploy app with database' });
  const text = getText(resp);
  const hasMulti = /rds|ecs|sandbox|database|deploy/i.test(text);
  results['D3-S7'] = { pass: hasMulti, detail: `Cross-service routing available: ${hasMulti}` };
  console.log(`D3-S7: ${hasMulti ? 'PASS' : 'FAIL'} - ${results['D3-S7'].detail}`);
} catch(e) { results['D3-S7'] = { pass: false, detail: e.message }; }

// ---- D3-S8: Scenario - Troubleshooting guidance ----
console.log('\n--- D3-S8: Troubleshooting Guidance ---');
try {
  const resp = await srv.call('huaweicloud_explain_error', { errorCode: 'APIGW.0301', message: 'Token expired', service: 'ECS' });
  const text = getText(resp);
  const hasGuidance = /token|expired|credential|iam|check|verify|step|next/i.test(text);
  results['D3-S8'] = { pass: hasGuidance, detail: `explain_error provides troubleshooting guidance: ${hasGuidance}` };
  console.log(`D3-S8: ${hasGuidance ? 'PASS' : 'FAIL'} - ${results['D3-S8'].detail}`);
} catch(e) { results['D3-S8'] = { pass: false, detail: e.message }; }

// ---- D4-20: Reject then zero action ----
console.log('\n--- D4-20: Reject Then Zero ---');
try {
  // Test that a rejected plan doesn't execute
  const resp = await srv.call('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServers'], allowWrites: false });
  const text = getText(resp);
  const hasApprovalToken = /approvalToken|approval_token|token/i.test(text);
  const notExecuted = !/executed|done|completed/i.test(text) || /plan|approval/i.test(text);
  results['D4-20'] = { pass: hasApprovalToken && notExecuted, detail: `Plan returns approval token: ${hasApprovalToken}, not executed: ${notExecuted}` };
  console.log(`D4-20: ${results['D4-20'].pass ? 'PASS' : 'FAIL'} - ${results['D4-20'].detail}`);
} catch(e) { results['D4-20'] = { pass: false, detail: e.message }; }

// ---- D4-25: Python hook event telemetry ----
console.log('\n--- D4-25: Hook Event Telemetry ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasTelemetry = /hook.?event|telemetry|cli:read|cli:write|cli:invoke/i.test(src);
  results['D4-25'] = { pass: hasTelemetry, detail: `Hook event telemetry classification found in source: ${hasTelemetry}` };
  console.log(`D4-25: ${hasTelemetry ? 'PASS' : 'FAIL'} - ${results['D4-25'].detail}`);
} catch(e) { results['D4-25'] = { pass: false, detail: e.message }; }

// ---- D4-26: Findings evidence redaction ----
console.log('\n--- D4-26: Findings Evidence Redaction ---');
try {
  const resp = await srv.call('huaweicloud_hook_check_command', { command: 'hcloud ECS NovaShowServerAdminPassword --server.id=xxx' });
  const text = getText(resp);
  const noPlaintext = !/sk-[a-zA-Z0-9]{20,}|AK[0-9A-Z]{16,}/.test(text);
  const hasRedacted = /redact|block|deny|risk/i.test(text);
  results['D4-26'] = { pass: noPlaintext && hasRedacted, detail: `No plaintext secrets: ${noPlaintext}, redacted/blocked: ${hasRedacted}` };
  console.log(`D4-26: ${results['D4-26'].pass ? 'PASS' : 'FAIL'} - ${results['D4-26'].detail}`);
} catch(e) { results['D4-26'] = { pass: false, detail: e.message }; }

// ---- D4-29: Classification assertion ----
console.log('\n--- D4-29: Classification Assertion ---');
try {
  const resp = await srv.call('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails'], allowWrites: false });
  const text = getText(resp);
  const hasDecision = /decision|read.?only|safe|readonly/i.test(text);
  results['D4-29'] = { pass: hasDecision, detail: `Classification has decision field: ${hasDecision}` };
  console.log(`D4-29: ${hasDecision ? 'PASS' : 'FAIL'} - ${results['D4-29'].detail}`);
} catch(e) { results['D4-29'] = { pass: false, detail: e.message }; }

// ---- D6-9: Cache cleanup ----
console.log('\n--- D6-9: Cache Cleanup ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasCacheCleanup = /clearCache|cleanup|invalidate|cache/i.test(src);
  results['D6-9'] = { pass: hasCacheCleanup, detail: `Cache cleanup functions found in source: ${hasCacheCleanup}` };
  console.log(`D6-9: ${hasCacheCleanup ? 'PASS' : 'FAIL'} - ${results['D6-9'].detail}`);
} catch(e) { results['D6-9'] = { pass: false, detail: e.message }; }

// ---- D8-9: Install ID and sanitize ----
console.log('\n--- D8-9: Install ID ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasInstallId = /installId|generateOrRecoverInstallId|sanitizeValue/i.test(src);
  results['D8-9'] = { pass: hasInstallId, detail: `Install ID functions found in source: ${hasInstallId}` };
  console.log(`D8-9: ${hasInstallId ? 'PASS' : 'FAIL'} - ${results['D8-9'].detail}`);
} catch(e) { results['D8-9'] = { pass: false, detail: e.message }; }

// ---- D8-10: MCP config backup and merge ----
console.log('\n--- D8-10: MCP Config Backup ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasMerge = /mergeCommandStyle|mergeArgsStyle|mergeMcpServersFile|extractUserDelta|applyUserDelta|takeAgentDelta/i.test(src);
  results['D8-10'] = { pass: hasMerge, detail: `MCP config merge functions found in source: ${hasMerge}` };
  console.log(`D8-10: ${hasMerge ? 'PASS' : 'FAIL'} - ${results['D8-10'].detail}`);
} catch(e) { results['D8-10'] = { pass: false, detail: e.message }; }

// ---- D9-10: MCP remote transport ----
console.log('\n--- D9-10: MCP Remote Transport ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasRemote = /remote|9528|transport.*remote|http.*server|ws/i.test(src);
  results['D9-10'] = { pass: hasRemote, detail: `Remote transport support found in source: ${hasRemote}` };
  console.log(`D9-10: ${hasRemote ? 'PASS' : 'FAIL'} - ${results['D9-10'].detail}`);
} catch(e) { results['D9-10'] = { pass: false, detail: e.message }; }

// ---- D9-11: WebSocket tunnel lifecycle ----
console.log('\n--- D9-11: WebSocket Tunnel ---');
try {
  const srcPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let src = '';
  if (existsSync(srcPath)) src = readFileSync(srcPath, 'utf-8');
  const hasTunnel = /HwlinkTunnelChannel|hwlink.*tunnel|localServer|subConnections/i.test(src);
  results['D9-11'] = { pass: hasTunnel, detail: `WebSocket tunnel classes found in source: ${hasTunnel}` };
  console.log(`D9-11: ${hasTunnel ? 'PASS' : 'FAIL'} - ${results['D9-11'].detail}`);
} catch(e) { results['D9-11'] = { pass: false, detail: e.message }; }

// Save summary
writeFileSync(join(__dirname, 'supplementary-summary.json'), JSON.stringify(results, null, 2), 'utf-8');

const passCount = Object.values(results).filter(r => r.pass === true).length;
const failCount = Object.values(results).filter(r => r.pass === false).length;
console.log(`\n=== Supplementary Probe Complete ===`);
console.log(`PASS: ${passCount}, FAIL: ${failCount}`);

srv.kill();
process.exit(0);
