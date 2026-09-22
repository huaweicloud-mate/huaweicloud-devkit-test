// AI生成
/**
 * D5-3: OfficeAce MCP配置
 * 验证: OfficeAce MCP 配置正确，MCP server 可启动
 */
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

console.log('=== D5-3: OfficeAce MCP配置 ===');

const officeAceRoot = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce';
const nodePath = 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node\\node.exe';
const devkitRoot = join(officeAceRoot, 'tools', 'node', 'node_modules', 'huaweicloud-devkit');

// T1: .mcp.json 配置文件存在且有效
const mcpConfigPath = join(officeAceRoot, '.mcp.json');
let mcpConfig = null;
try { mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf8')); } catch {}
check('T1.1 .mcp.json 存在', existsSync(mcpConfigPath), mcpConfigPath);
check('T1.2 .mcp.json 有效JSON', !!mcpConfig && typeof mcpConfig === 'object', 'parsed OK');
check('T1.3 .mcp.json 含 mcpServers', !!mcpConfig?.mcpServers, `servers: ${Object.keys(mcpConfig?.mcpServers || {}).join(', ')}`);

// T2: huaweicloud-devkit MCP 配置
const pkgPath = join(devkitRoot, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const mcpServerPath = join(devkitRoot, pkg.bin['huaweicloud-devkit-mcp']);
check('T2.1 MCP server 脚本存在', existsSync(mcpServerPath), mcpServerPath);

// T3: MCP server 可以启动 (tools/list)
const env = { ...process.env, PATH: 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\OfficeAce\\tools\\node;' + (process.env.PATH || '') };

// Start MCP server as stdio process and send tools/list
let mcpStarted = false;
let toolsList = null;
let mcpError = null;

try {
  const child = spawn(nodePath, [mcpServerPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
    timeout: 15000
  });

  const initMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'd5-3-probe', version: '1.0.0' }
    }
  }) + '\n';

  const listMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  }) + '\n';

  let buffer = '';
  const startTime = Date.now();

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
          if (msg.id === 1) {
            mcpStarted = true;
            // Send tools/list after init
            child.stdin.write(listMsg);
          }
          if (msg.id === 2) {
            toolsList = msg.result;
            child.kill();
            done();
          }
        } catch {}
      }
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      if (!mcpError) mcpError = text.slice(0, 200);
    });
    
    child.on('error', (e) => { mcpError = e.message; done(); });
    child.on('exit', () => done());
    
    // Send init
    child.stdin.write(initMsg);
    
    // Timeout
    setTimeout(() => { child.kill(); done(); }, 12000);
  });
} catch(e) {
  mcpError = e.message;
}

check('T3.1 MCP server 可启动', mcpStarted, mcpStarted ? 'started OK' : `error: ${mcpError}`);
check('T3.2 MCP server 响应 tools/list', !!toolsList, toolsList ? `${toolsList.tools?.length || 0} tools` : 'no response');

// T4: 工具列表包含核心工具
if (toolsList?.tools) {
  const toolNames = toolsList.tools.map(t => t.name);
  const expectedTools = [
    'huaweicloud_auth_init',
    'huaweicloud_auth_status',
    'huaweicloud_show_profile_redacted'
  ];
  for (const expected of expectedTools) {
    check(`T4.${expected} 存在`, toolNames.includes(expected), `found in ${toolNames.length} tools`);
  }
  check('T4.4 工具数量 >= 10', toolNames.length >= 10, `${toolNames.length} tools`);
} else {
  check('T4.1 工具列表可获取', false, 'tools/list failed');
}

// T5: MCP config 在 status 中显示
let statusOutput = '';
try {
  statusOutput = execSync('huaweicloud-devkit status', { encoding: 'utf8', timeout: 30000, env });
} catch(e) {
  statusOutput = e.stdout || '';
}
check('T5.1 status 含 OfficeAce MCP config', /OfficeAce[\s\S]*?MCP config/.test(statusOutput), 'MCP config line found');

// T6: mcp-connectors.sqlite 存在 (OfficeAce 内置 MCP 连接器数据库)
const mcpDbPath = join(officeAceRoot, 'data', 'mcp-connectors.sqlite');
check('T6.1 mcp-connectors.sqlite 存在', existsSync(mcpDbPath), 'MCP connectors DB');

// T7: builtin-mcp-connectors.json 存在且有效
const builtinConnectorsPath = join(officeAceRoot, 'builtin-mcp-connectors.json');
let builtinConnectors = null;
try { builtinConnectors = JSON.parse(readFileSync(builtinConnectorsPath, 'utf8')); } catch {}
check('T7.1 builtin-mcp-connectors.json 有效', !!builtinConnectors?.connectors, `${builtinConnectors?.connectors?.length || 0} connectors`);

console.log('\n=== 汇总 ===');
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(`Total: ${results.length}, PASS: ${passed}, FAIL: ${failed}`);
console.log(`Overall: ${overallPass ? 'PASS' : 'FAIL'}`);

console.log('\n=== RESULT ===');
console.log(JSON.stringify({ testCase: 'D5-3', result: overallPass ? 'PASS' : 'FAIL', checks: results, timestamp: new Date().toISOString() }));
process.exit(overallPass ? 0 : 1);
