// AI生成
// D1-26: 升级提醒工具注册与协议暴露
// Probe: directly import dispatch and TOOL_DEFINITIONS, check for check_update/upgrade tools
import { dispatch } from 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { TOOL_DEFINITIONS } from 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';

console.log('=== D1-26: 升级提醒工具注册与协议暴露 ===\n');

// Step 1: initialize
const initResult = await dispatch('initialize', {
  protocolVersion: '2024-11-05',
  clientInfo: { name: 'test-probe', version: '1.0.0' }
}, { sessionId: 'test' });
console.log('Initialize result:');
console.log(JSON.stringify(initResult, null, 2));

// Step 2: tools/list
const toolsResult = await dispatch('tools/list', {}, { sessionId: 'test' });
const tools = toolsResult.tools || [];
console.log(`\nTotal tools registered: ${tools.length}`);

// Step 3: Check for huaweicloud_check_update
const checkUpdate = tools.find(t => t.name === 'huaweicloud_check_update');
console.log(`\n--- huaweicloud_check_update ---`);
console.log(`Found: ${!!checkUpdate}`);
if (checkUpdate) {
  console.log(`Has description: ${!!checkUpdate.description}`);
  console.log(`Has inputSchema: ${!!checkUpdate.inputSchema}`);
  console.log(`inputSchema.type: ${checkUpdate.inputSchema?.type}`);
  console.log(`Has dismiss property: ${!!checkUpdate.inputSchema?.properties?.dismiss}`);
  console.log(`Has dismissVersion property: ${!!checkUpdate.inputSchema?.properties?.dismissVersion}`);
  console.log(`Description: ${checkUpdate.description}`);
  console.log(`Full schema: ${JSON.stringify(checkUpdate.inputSchema, null, 2)}`);
}

// Step 4: Check for huaweicloud_upgrade
const upgrade = tools.find(t => t.name === 'huaweicloud_upgrade');
console.log(`\n--- huaweicloud_upgrade ---`);
console.log(`Found: ${!!upgrade}`);
if (upgrade) {
  console.log(`Has description: ${!!upgrade.description}`);
  console.log(`Has inputSchema: ${!!upgrade.inputSchema}`);
  console.log(`inputSchema.type: ${upgrade.inputSchema?.type}`);
  console.log(`Has version property: ${!!upgrade.inputSchema?.properties?.version}`);
  console.log(`Has target property: ${!!upgrade.inputSchema?.properties?.target}`);
  console.log(`Description: ${upgrade.description}`);
  console.log(`Full schema: ${JSON.stringify(upgrade.inputSchema, null, 2)}`);
}

// Verification
const pass = !!checkUpdate && !!checkUpdate.description && !!checkUpdate.inputSchema &&
             !!upgrade && !!upgrade.description && !!upgrade.inputSchema;
console.log(`\n--- VERIFICATION ---`);
console.log(`Both tools registered with description+inputSchema: ${pass}`);
console.log(`VERDICT: ${pass ? 'PASS' : 'FAIL'}`);

process.exit(0);
