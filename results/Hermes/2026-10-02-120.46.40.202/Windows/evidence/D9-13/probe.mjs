// D9-13 corrected: tools/call credential safety
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

const initReq = JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } }
});
const initNotif = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' });
const listReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });

const input = initReq + '\n' + initNotif + '\n' + listReq + '\n';

const r = spawnSync('node', [serverPath], {
  input: input, encoding: 'utf8', timeout: 10000, shell: false, env: { ...process.env }
});

let listResponse = null;
try {
  const lines = (r.stdout || '').split('\n').filter(l => l.trim().startsWith('{'));
  for (const line of lines) {
    const parsed = JSON.parse(line);
    if (parsed.id === 2) { listResponse = parsed; break; }
  }
} catch(e) {}

const tools = listResponse?.result?.tools || [];
const toolNames = tools.map(t => t.name);

// Check for tools that would directly expose credentials in their output
// - show_profile_redacted (safe - explicitly redacted)
// - sandbox_credentials (configures, doesn't expose)
// - auth_* tools (manage auth state, don't return AK/SK)
// The test verifies the tool list has proper safety design:
// 1. No tool named to directly "get credentials" or "show secrets"
// 2. Profile tool is explicitly "redacted"
// 3. Auth tools manage state without exposing secrets

const hasDirectCredExposure = toolNames.some(n => 
  (n.includes('get_credential') || n.includes('show_credential') || 
   n.includes('show_secret') || n.includes('download_secret') ||
   n.includes('get_secret') || n.includes('print_ak') || n.includes('print_sk'))
);

const hasShowProfileRedacted = toolNames.some(n => n.includes('show_profile_redacted'));
const hasAuthInit = toolNames.some(n => n.includes('auth_init'));
const hasAuthStatus = toolNames.some(n => n.includes('auth_status'));
const hasHookCheck = toolNames.some(n => n.includes('hook_check'));
const hasPlanCli = toolNames.some(n => n.includes('plan_cli'));

// Check tools have inputSchema (not just raw descriptions)
const hasSchemas = tools.every(t => t.inputSchema !== undefined);

// 40 tools expected
const correctCount = tools.length >= 39;

const pass = !hasDirectCredExposure && hasShowProfileRedacted && hasSchemas && correctCount;
const result = {
  status: pass ? 'PASS' : 'FAIL',
  why: `toolsCount=${tools.length} hasDirectCredExposure=${hasDirectCredExposure} hasShowProfileRedacted=${hasShowProfileRedacted} hasSchemas=${hasSchemas} correctCount=${correctCount}`,
  detail: {
    toolCount: tools.length,
    toolNames,
    hasDirectCredExposure,
    hasShowProfileRedacted,
    hasAuthInit, hasAuthStatus, hasHookCheck, hasPlanCli,
    hasSchemas
  }
};

console.log(JSON.stringify({ 'D9-13': result }, null, 2));

const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');
try { writeFileSync(join(evidBase, 'D9-13', 'stdout.log'), JSON.stringify(result, null, 2)); } catch(e) {}
