// AI生成
// D1-26: Upgrade reminder tool registration and protocol exposure
// Test: Start MCP server, initialize, tools/list, check for huaweicloud_check_update and huaweicloud_upgrade tools
// Expected: Both tools registered with schema

const { spawn } = require('child_process');
const path = require('path');

const SERVER_PATH = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';

const results = {
  testCase: 'D1-26',
  description: 'Upgrade reminder tool registration and protocol exposure (MCP tools/list)',
  platform: process.platform,
  nodeVersion: process.version,
  checks: {}
};

const child = spawn('node', [SERVER_PATH], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' }
});

let stdoutBuf = '';
let stderrBuf = '';
let initialized = false;
let toolsListed = false;
const timeout = setTimeout(() => {
  results.checks.error = 'TIMEOUT: MCP server did not respond within 15s';
  results.verdict = 'BLOCKED';
  results.summary = 'BLOCKED: MCP server timed out during initialization or tools/list.';
  console.log(JSON.stringify(results, null, 2));
  child.kill();
  process.exit(1);
}, 15000);

child.stderr.on('data', (d) => { stderrBuf += d; });

child.stdout.on('data', (d) => {
  stdoutBuf += d;
  const lines = stdoutBuf.split('\n');
  stdoutBuf = lines.pop(); // keep incomplete line

  for (const line of lines) {
    if (!line.trim()) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }

    // Handle initialize response
    if (msg.id === 1 && !initialized) {
      initialized = true;
      results.checks.initialize = {
        received: true,
        protocolVersion: msg.result?.protocolVersion,
        serverInfo: msg.result?.serverInfo
      };
      // Request tools/list
      child.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      }) + '\n');
    }

    // Handle tools/list response
    if (msg.id === 2 && !toolsListed) {
      toolsListed = true;
      clearTimeout(timeout);

      const allTools = msg.result?.tools || [];
      const toolNames = allTools.map(t => t.name);

      const checkUpdateTool = allTools.find(t => t.name === 'huaweicloud_check_update');
      const upgradeTool = allTools.find(t => t.name === 'huaweicloud_upgrade');

      results.checks.tools_list = {
        totalTools: allTools.length,
        hasCheckUpdate: !!checkUpdateTool,
        hasUpgrade: !!upgradeTool,
        checkUpdateHasSchema: checkUpdateTool && !!checkUpdateTool.inputSchema,
        upgradeHasSchema: upgradeTool && !!upgradeTool.inputSchema,
        checkUpdateSchema: checkUpdateTool?.inputSchema,
        upgradeSchema: upgradeTool?.inputSchema,
        updateRelatedTools: toolNames.filter(t => t.includes('update') || t.includes('upgrade'))
      };

      const bothRegistered = !!checkUpdateTool && !!upgradeTool;
      const bothHaveSchema = results.checks.tools_list.checkUpdateHasSchema && results.checks.tools_list.upgradeHasSchema;

      results.verdict = (bothRegistered && bothHaveSchema) ? 'PASS' : 'FAIL';
      results.summary = (bothRegistered && bothHaveSchema)
        ? 'PASS: Both huaweicloud_check_update and huaweicloud_upgrade tools are registered with proper inputSchema.'
        : `FAIL: Missing tools or schema. check_update=${!!checkUpdateTool}, upgrade=${!!upgradeTool}, checkUpdateSchema=${!!results.checks.tools_list.checkUpdateHasSchema}, upgradeSchema=${!!results.checks.tools_list.upgradeHasSchema}`;

      console.log(JSON.stringify(results, null, 2));
      child.kill();
      process.exit(0);
    }
  }
});

child.on('error', (err) => {
  clearTimeout(timeout);
  results.checks.error = err.message;
  results.verdict = 'BLOCKED';
  results.summary = `BLOCKED: Failed to spawn MCP server: ${err.message}`;
  console.log(JSON.stringify(results, null, 2));
  process.exit(1);
});

// Send initialize request
child.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  }
}) + '\n');
