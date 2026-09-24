/**
 * WorkBuddy daily test probe - EXP-D5-5-1/3 WorkBuddy client matrix
 * Covers: EXP-D5-5-1 (WorkBuddy client tool discovery), EXP-D5-5-3 (WorkBuddy tool enumeration)
 */
import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/WorkBuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const evDir = 'C:/Users/Administrator/devkit-test/WorkBuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-24-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// EXP-D5-5-1: WorkBuddy client - tool discovery and loading
const toolCount = TOOL_DEFINITIONS.length;
test('EXP-D5-5-1', 'workbuddy-tool-count', toolCount >= 40, toolCount, '>=40', `WorkBuddy tools: ${toolCount}`, `WorkBuddy tools insufficient: ${toolCount}`);

const workbuddyMcpPath = join(homedir(), '.workbuddy', 'mcp.json');
test('EXP-D5-5-1', 'workbuddy-mcp-config', existsSync(workbuddyMcpPath), existsSync(workbuddyMcpPath), true, 'WorkBuddy MCP config exists', 'WorkBuddy MCP config missing');

const workbuddyPluginsDir = join(homedir(), '.workbuddy', 'huaweicloud-plugins');
test('EXP-D5-5-1', 'workbuddy-plugins-dir', existsSync(workbuddyPluginsDir), existsSync(workbuddyPluginsDir), true, 'WorkBuddy plugins dir exists', 'WorkBuddy plugins dir missing');

// EXP-D5-5-3: WorkBuddy tool enumeration - all tools have name + description + schema
let allValid = true;
let invalidTools = [];
for (const tool of TOOL_DEFINITIONS) {
  if (!tool.name || typeof tool.name !== 'string') { allValid = false; invalidTools.push('missing-name'); continue; }
  if (!tool.description || typeof tool.description !== 'string') { allValid = false; invalidTools.push(`${tool.name}-no-desc`); continue; }
  if (!tool.inputSchema || typeof tool.inputSchema !== 'object') { allValid = false; invalidTools.push(`${tool.name}-no-schema`); continue; }
}
test('EXP-D5-5-3', 'workbuddy-all-valid', allValid, invalidTools.length === 0 ? 'all valid' : invalidTools.join(','), 'all valid', `All ${TOOL_DEFINITIONS.length} tools valid`, `Invalid: ${invalidTools.join(',')}`);

const names = TOOL_DEFINITIONS.map(t => t.name);
const uniqueNames = new Set(names);
test('EXP-D5-5-3', 'workbuddy-unique-names', uniqueNames.size === names.length, `${uniqueNames.size}/${names.length}`, 'equal', 'All tool names unique', 'Duplicate tool names');

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd5-workbuddy', 'stdout.log'), output, 'utf8');
console.log(output);
