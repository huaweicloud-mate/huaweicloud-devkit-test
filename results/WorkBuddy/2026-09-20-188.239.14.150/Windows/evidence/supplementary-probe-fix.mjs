// supplementary-probe-fix.mjs: Fixed version searching all source files
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = 'C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-2\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src\\mcp-server.mjs';
const hdkPath = 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk';
const pluginPath = join(hdkPath, 'plugins', 'huaweicloud-core');

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

// Search all .mjs and .js files in plugin for a pattern
function searchSource(pattern) {
  const regex = new RegExp(pattern, 'i');
  function searchDir(dir) {
    if (!existsSync(dir)) return false;
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry === 'node_modules' || entry === '.git') continue;
        if (searchDir(fullPath)) return true;
      } else if (entry.endsWith('.mjs') || entry.endsWith('.js') || entry.endsWith('.cjs') || entry === 'hooks.json') {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          if (regex.test(content)) return true;
        } catch {}
      }
    }
    return false;
  }
  return searchDir(pluginPath);
}

const srv = makeServer(serverPath);
const results = {};

await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'sup-fix', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
console.log('=== Supplementary Fix Probe Start ===');

// ---- D4-28: Node hook chain (P0) ----
console.log('\n--- D4-28: Node Security Hook Chain ---');
try {
  const hooksJsonPath = join(pluginPath, 'hooks', 'hooks.json');
  let hooksJson = '';
  if (existsSync(hooksJsonPath)) {
    hooksJson = readFileSync(hooksJsonPath, 'utf-8');
  }
  const hasMjs = /\.mjs/.test(hooksJson);
  const hasNodeSafety = /huaweicloud-safety/i.test(hooksJson);
  const hasPreToolUse = /PreToolUse/i.test(hooksJson);
  const hasMatcher = /matcher|Bash|mcp__/i.test(hooksJson);
  
  // Also check the safety hook file exists
  const safetyPath = join(pluginPath, 'hooks', 'huaweicloud-safety.mjs');
  const safetyExists = existsSync(safetyPath);
  let safetyContent = '';
  if (safetyExists) safetyContent = readFileSync(safetyPath, 'utf-8');
  const hasCommandText = /commandText|classifyTextCommand|tool_input|command|cmd|script|args/i.test(safetyContent);
  const hasDenyOutput = /deny|hookSpecificOutput|decision/i.test(safetyContent);
  
  const pass = hasMjs && hasNodeSafety && hasPreToolUse && safetyExists && hasCommandText && hasDenyOutput;
  results['D4-28'] = { pass, detail: `hooks.json .mjs: ${hasMjs}, safety ref: ${hasNodeSafety}, PreToolUse: ${hasPreToolUse}, safety file: ${safetyExists}, commandText extraction: ${hasCommandText}, deny output: ${hasDenyOutput}` };
  console.log(`D4-28: ${pass ? 'PASS' : 'FAIL'} - ${results['D4-28'].detail}`);
} catch(e) { results['D4-28'] = { pass: false, detail: e.message }; console.log(`D4-28: FAIL - ${e.message}`); }

// ---- D1-65: Debug mode env var ----
console.log('\n--- D1-65: Debug Mode ---');
try {
  const found = searchSource('HUAWEICLOUD_DEVKIT_DEBUG');
  results['D1-65'] = { pass: found, detail: `HUAWEICLOUD_DEVKIT_DEBUG env var found in source: ${found}` };
  console.log(`D1-65: ${found ? 'PASS' : 'FAIL'} - ${results['D1-65'].detail}`);
} catch(e) { results['D1-65'] = { pass: false, detail: e.message }; }

// ---- D1-67: Agent toolkit mode ----
console.log('\n--- D1-67: Agent Toolkit Mode ---');
try {
  const hasToolkit = searchSource('AGENT_TOOLKIT_MODE');
  const hasSkipDsh = searchSource('SKIP_DSH');
  const hasRequiredEnv = searchSource('REQUIRED_ENV_KEYS');
  const hasHcloudBin = searchSource('HCLOUD_BIN');
  const pass = hasToolkit && hasSkipDsh && hasRequiredEnv && hasHcloudBin;
  results['D1-67'] = { pass, detail: `AGENT_TOOLKIT_MODE: ${hasToolkit}, SKIP_DSH: ${hasSkipDsh}, REQUIRED_ENV_KEYS: ${hasRequiredEnv}, HCLOUD_BIN: ${hasHcloudBin}` };
  console.log(`D1-67: ${pass ? 'PASS' : 'FAIL'} - ${results['D1-67'].detail}`);
} catch(e) { results['D1-67'] = { pass: false, detail: e.message }; }

// ---- D1-68: Icons offline ----
console.log('\n--- D1-68: Icons Offline ---');
try {
  const hasIconsOffline = searchSource('ICONS_OFFLINE');
  const hasRegion = searchSource('HUAWEICLOUD_REGION|HW_REGION');
  const pass = hasIconsOffline && hasRegion;
  results['D1-68'] = { pass, detail: `ICONS_OFFLINE: ${hasIconsOffline}, HUAWEICLOUD_REGION/HW_REGION: ${hasRegion}` };
  console.log(`D1-68: ${pass ? 'PASS' : 'FAIL'} - ${results['D1-68'].detail}`);
} catch(e) { results['D1-68'] = { pass: false, detail: e.message }; }

// ---- D3-S5: Complex intent routing ----
console.log('\n--- D3-S5: Complex Intent Routing ---');
try {
  const resp = await srv.call('huaweicloud_service_catalog', { intent: 'deploy app' });
  const text = getText(resp);
  // Check if multiple services are mentioned
  const services = ['ecs', 'obs', 'rds', 'cce', 'sandbox', 'vpc', 'eip', 'elb', 'modelarts', 'functiongraph'];
  const matched = services.filter(s => new RegExp(s, 'i').test(text));
  const pass = matched.length >= 2;
  results['D3-S5'] = { pass, detail: `Complex intent matched ${matched.length} services: ${matched.join(', ')}` };
  console.log(`D3-S5: ${pass ? 'PASS' : 'FAIL'} - ${results['D3-S5'].detail}`);
} catch(e) { results['D3-S5'] = { pass: false, detail: e.message }; }

// ---- D8-9: Install ID and sanitize ----
console.log('\n--- D8-9: Install ID ---');
try {
  const hasInstallId = searchSource('generateOrRecoverInstallId');
  const hasSanitize = searchSource('sanitizeValue');
  const pass = hasInstallId && hasSanitize;
  results['D8-9'] = { pass, detail: `generateOrRecoverInstallId: ${hasInstallId}, sanitizeValue: ${hasSanitize}` };
  console.log(`D8-9: ${pass ? 'PASS' : 'FAIL'} - ${results['D8-9'].detail}`);
} catch(e) { results['D8-9'] = { pass: false, detail: e.message }; }

// ---- D8-10: MCP config backup and merge ----
console.log('\n--- D8-10: MCP Config Backup ---');
try {
  const hasMergeCmd = searchSource('mergeCommandStyle');
  const hasMergeArgs = searchSource('mergeArgsStyle');
  const hasMergeFile = searchSource('mergeMcpServersFile');
  const hasExtractDelta = searchSource('extractUserDelta');
  const hasApplyDelta = searchSource('applyUserDelta');
  const hasTakeAgentDelta = searchSource('takeAgentDelta');
  const hasPurgeBackup = searchSource('purgeBackup');
  const pass = hasMergeCmd && hasMergeArgs && hasMergeFile && hasExtractDelta && hasApplyDelta && hasTakeAgentDelta;
  results['D8-10'] = { pass, detail: `mergeCommandStyle: ${hasMergeCmd}, mergeArgsStyle: ${hasMergeArgs}, mergeMcpServersFile: ${hasMergeFile}, extractUserDelta: ${hasExtractDelta}, applyUserDelta: ${hasApplyDelta}, takeAgentDelta: ${hasTakeAgentDelta}, purgeBackup: ${hasPurgeBackup}` };
  console.log(`D8-10: ${pass ? 'PASS' : 'FAIL'} - ${results['D8-10'].detail}`);
} catch(e) { results['D8-10'] = { pass: false, detail: e.message }; }

// ---- D9-11: WebSocket tunnel lifecycle ----
console.log('\n--- D9-11: WebSocket Tunnel ---');
try {
  const hasTunnel = searchSource('HwlinkTunnelChannel');
  const hasSubConnections = searchSource('subConnections');
  const hasLocalServer = searchSource('localServer');
  const hasReadyPromise = searchSource('readyPromise|ready.*promise|onopen');
  const hasOnClose = searchSource('onClose|onclose');
  const pass = hasTunnel && hasSubConnections;
  results['D9-11'] = { pass, detail: `HwlinkTunnelChannel: ${hasTunnel}, subConnections: ${hasSubConnections}, localServer: ${hasLocalServer}, readyPromise: ${hasReadyPromise}, onClose: ${hasOnClose}` };
  console.log(`D9-11: ${pass ? 'PASS' : 'FAIL'} - ${results['D9-11'].detail}`);
} catch(e) { results['D9-11'] = { pass: false, detail: e.message }; }

// Save summary
writeFileSync(join(__dirname, 'supplementary-fix-summary.json'), JSON.stringify(results, null, 2), 'utf-8');

const passCount = Object.values(results).filter(r => r.pass === true).length;
const failCount = Object.values(results).filter(r => r.pass === false).length;
console.log(`\n=== Supplementary Fix Probe Complete ===`);
console.log(`PASS: ${passCount}, FAIL: ${failCount}`);

srv.kill();
process.exit(0);
