// D9-12, D9-13: MCP protocol initialize + tools/list
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

const serverPath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

// D9-12: initialize handshake
function testD9_12() {
  const initReq = JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test-probe', version: '1.0.0' } }
  });
  
  const r = spawnSync('node', [serverPath], {
    input: initReq + '\n',
    encoding: 'utf8',
    timeout: 10000,
    shell: false,
    env: { ...process.env }
  });
  
  let response = null;
  try {
    const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
    if (lines.length > 0) {
      response = JSON.parse(lines[0]);
    }
  } catch(e) { return { status: 'FAIL', why: 'parse error: ' + e.message, detail: { stdout: r.stdout?.substring(0, 300), stderr: r.stderr?.substring(0, 300) } }; }
  
  const hasResult = response?.result !== undefined;
  const hasProtocolVersion = response?.result?.protocolVersion !== undefined;
  const hasServerInfo = response?.result?.serverInfo !== undefined;
  const hasCapabilities = response?.result?.capabilities !== undefined;
  
  const pass = hasResult && hasProtocolVersion && hasServerInfo && hasCapabilities;
  return {
    status: pass ? 'PASS' : 'FAIL',
    why: `hasResult=${hasResult} hasProtocolVersion=${hasProtocolVersion} hasServerInfo=${hasServerInfo} hasCapabilities=${hasCapabilities}`,
    detail: {
      protocolVersion: response?.result?.protocolVersion,
      serverInfo: response?.result?.serverInfo,
      capabilities: response?.result?.capabilities ? Object.keys(response.result.capabilities) : [],
      stderr: (r.stderr || '').substring(0, 200)
    }
  };
}

// D9-13: tools/list — check no credential-exposing tools
function testD9_13() {
  const initReq = JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } }
  });
  const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const listReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  
  const input = initReq + '\n' + initNotif + '\n' + listReq + '\n';
  
  const r = spawnSync('node', [serverPath], {
    input: input,
    encoding: 'utf8',
    timeout: 10000,
    shell: false,
    env: { ...process.env }
  });
  
  let listResponse = null;
  try {
    const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
    for (const line of lines) {
      const parsed = JSON.parse(line);
      if (parsed.id === 2) {
        listResponse = parsed;
        break;
      }
    }
  } catch(e) { return { status: 'FAIL', why: 'parse error: ' + e.message, detail: { stdout: r.stdout?.substring(0, 300), stderr: r.stderr?.substring(0, 300) } }; }
  
  const tools = listResponse?.result?.tools || [];
  const toolNames = tools.map(t => t.name);
  
  // Check no tool directly exposes credentials in name
  const hasCredentialTools = toolNames.some(n => 
    n.toLowerCase().includes('credential') && !n.includes('redacted') && !n.includes('readonly')
  );
  
  const hasShowProfileRedacted = toolNames.some(n => n.includes('show_profile_redacted'));
  const hasAuthInit = toolNames.some(n => n.includes('auth_init'));
  const hasAuthStatus = toolNames.some(n => n.includes('auth_status'));
  const hasHookCheck = toolNames.some(n => n.includes('hook_check'));
  const hasPlanCli = toolNames.some(n => n.includes('plan_cli'));
  
  const pass = tools.length > 0 && !hasCredentialTools && hasShowProfileRedacted;
  return {
    status: pass ? 'PASS' : 'FAIL',
    why: `toolsCount=${tools.length} hasCredentialTools=${hasCredentialTools} hasShowProfileRedacted=${hasShowProfileRedacted}`,
    detail: {
      toolCount: tools.length,
      toolNames: toolNames,
      hasShowProfileRedacted,
      hasAuthInit,
      hasAuthStatus,
      hasHookCheck,
      hasPlanCli
    }
  };
}

results['D9-12'] = testD9_12();
results['D9-13'] = testD9_13();

console.log(JSON.stringify(results, null, 2));

const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');
for (const [caseId, result] of Object.entries(results)) {
  try { writeFileSync(join(evidBase, caseId, 'stdout.log'), JSON.stringify(result, null, 2)); } catch(e) {}
}
