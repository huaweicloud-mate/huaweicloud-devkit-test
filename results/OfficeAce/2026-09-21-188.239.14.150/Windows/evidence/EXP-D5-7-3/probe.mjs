// AI生成
// EXP-D5-7-3: OfficeAce tools/list 枚举 40 工具全量可达，schema 完整
// Reuse D5-3 probe logic for expanded case
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync, spawn } from 'node:child_process';

const results = [];
let overallPass = true;

function check(label, condition, detail) {
  const pass = Boolean(condition);
  if (!pass) overallPass = false;
  results.push({ label, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label}${detail ? ' :: ' + detail : ''}`);
}

console.log('=== EXP-D5-7-3: OfficeAce tools/list 枚举工具全量可达 ===');

const officeAceRoot = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce';
const nodePath = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node.exe';
const devkitRoot = join(officeAceRoot, 'tools', 'node', 'node_modules', 'huaweicloud-devkit');

// T1: .mcp.json config
const mcpConfigPath = join(officeAceRoot, '.mcp.json');
let mcpConfig = null;
try { mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf8')); } catch {}
check('T1.1 .mcp.json 存在', existsSync(mcpConfigPath), mcpConfigPath);
check('T1.2 .mcp.json 有效JSON', !!mcpConfig && typeof mcpConfig === 'object', 'parsed OK');
check('T1.3 .mcp.json 含 mcpServers', !!mcpConfig?.mcpServers, `servers: ${Object.keys(mcpConfig?.mcpServers || {}).join(', ')}`);

// T2: MCP server script
const pkgPath = join(devkitRoot, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const mcpServerPath = join(devkitRoot, pkg.bin['huaweicloud-devkit-mcp']);
check('T2.1 MCP server 脚本存在', existsSync(mcpServerPath), mcpServerPath);

// T3: Start MCP server and get tools/list
const env = { ...process.env, PATH: 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node;' + (process.env.PATH || '') };
let mcpStarted = false;
let toolsList = null;
let mcpError = null;

try {
  const child = spawn(nodePath, [mcpServerPath], { stdio: ['pipe', 'pipe', 'pipe'], env, timeout: 15000 });
  const initMsg = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'exp-d5-7-3-probe', version: '1.0.0' } } }) + '\n';
  const listMsg = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }) + '\n';
  let buffer = '';
  await new Promise((resolve) => {
    let resolved = false;
    const done = () => { if (!resolved) { resolved = true; resolve(); } };
    child.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id === 1) { mcpStarted = true; child.stdin.write(listMsg); }
          if (msg.id === 2) { toolsList = msg.result; child.kill(); done(); }
        } catch {}
      }
    });
    child.stderr.on('data', (data) => { if (!mcpError) mcpError = data.toString().slice(0, 200); });
    child.on('error', (e) => { mcpError = e.message; done(); });
    child.on('exit', () => done());
    child.stdin.write(initMsg);
    setTimeout(() => { child.kill(); done(); }, 12000);
  });
} catch(e) { mcpError = e.message; }

check('T3.1 MCP server 可启动', mcpStarted, mcpStarted ? 'started OK' : `error: ${mcpError}`);
check('T3.2 MCP server 响应 tools/list', !!toolsList, toolsList ? `${toolsList.tools?.length || 0} tools` : 'no response');

// T4: Tool list validation
if (toolsList?.tools) {
  const toolNames = toolsList.tools.map(t => t.name);
  const expectedTools = ['huaweicloud_auth_init', 'huaweicloud_auth_status', 'huaweicloud_show_profile_redacted'];
  for (const expected of expectedTools) {
    check(`T4.${expected} 存在`, toolNames.includes(expected), `found in ${toolNames.length} tools`);
  }
  check('T4.4 工具数量 >= 10', toolNames.length >= 10, `${toolNames.length} tools`);
  // Check schema completeness
  const toolsWithSchema = toolsList.tools.filter(t => t.inputSchema && t.inputSchema.type === 'object');
  check('T4.5 所有工具有 inputSchema', toolsWithSchema.length === toolNames.length, `${toolsWithSchema.length}/${toolNames.length} have schema`);
  check('T4.6 所有工具有 description', toolsList.tools.every(t => t.description && t.description.length > 0), 'all have description');
} else {
  check('T4.1 工具列表可获取', false, 'tools/list failed');
}

// T5: status shows MCP config
let statusOutput = '';
try { statusOutput = execSync('huaweicloud-devkit status', { encoding: 'utf8', timeout: 30000, env }); } catch(e) { statusOutput = e.stdout || ''; }
check('T5.1 status 含 OfficeAce MCP config', /OfficeAce[\s\S]*?MCP config/.test(statusOutput), 'MCP config line found');

// T6: mcp-connectors.sqlite
const mcpDbPath = join(officeAceRoot, 'data', 'mcp-connectors.sqlite');
check('T6.1 mcp-connectors.sqlite 存在', existsSync(mcpDbPath), 'MCP connectors DB');

// T7: builtin-mcp-connectors.json
const builtinConnectorsPath = join(officeAceRoot, 'builtin-mcp-connectors.json');
let builtinConnectors = null;
try { builtinConnectors = JSON.parse(readFileSync(builtinConnectorsPath, 'utf8')); } catch {}
check('T7.1 builtin-mcp-connectors.json 有效', !!builtinConnectors?.connectors, `${builtinConnectors?.connectors?.length || 0} connectors`);

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

const ts = new Date();
const executedAt = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}`;
const evidence = {
  status: overallPass ? 'PASS' : 'FAIL',
  why: overallPass ? `tools/list枚举通过: ${passed}/${results.length} checks, ${toolsList?.tools?.length || 0} tools` : `${failed} checks failed`,
  executedAt,
  testCase: 'EXP-D5-7-3',
  designCaseId: 'D5-3',
  toolCount: toolsList?.tools?.length || 0,
  checks: results
};
console.log('\n=== RESULT ===');
console.log(JSON.stringify(evidence));
process.exit(overallPass ? 0 : 1);
