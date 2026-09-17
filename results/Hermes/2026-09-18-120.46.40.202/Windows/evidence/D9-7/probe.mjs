import { TOOL_DEFINITIONS, callTool } from './plugins/huaweicloud-core/src/tools.mjs';
import { dispatch } from './plugins/huaweicloud-core/src/mcp-protocol.mjs';

const results = {};

// D8-7: Meta skills mechanically executable - use correct tool name
results['D8-7'] = [];
const skillNames = ['huaweicloud-getting-started', 'huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-cli-and-auth', 'huaweicloud-capability-discovery', 'huaweicloud-api-and-sdk', 'huaweicloud-troubleshooting'];
for (const skill of skillNames) {
  try {
    const r = await callTool('huaweicloud_retrieve_skill', { skill_name: skill });
    const hasContent = r?.content?.length > 0 || r?.result?.length > 0;
    results['D8-7'].push({ skill, hasContent, contentLen: JSON.stringify(r).length, preview: JSON.stringify(r).substring(0, 150) });
  } catch(e) {
    results['D8-7'].push({ skill, error: e.message });
  }
}

// D9-3: tools/call response format
results['D9-3'] = [];
try {
  const r = await dispatch('tools/call', { name: 'huaweicloud_check_cli', arguments: {} });
  results['D9-3'].push({ desc: 'tools/call check_cli', hasContent: !!r?.content, hasIsError: r?.isError !== undefined, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D9-3'].push({ desc: 'tools/call check_cli', error: e.message });
}

// D9-4: Protocol lifecycle - initialize, then tools/list
results['D9-4'] = [];
try {
  const initR = await dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } });
  results['D9-4'].push({ desc: 'initialize', result: JSON.stringify(initR).substring(0, 300) });
} catch(e) {
  results['D9-4'].push({ desc: 'initialize', error: e.message });
}

// D9-5: stdio transport robustness - test multiple sequential calls
results['D9-5'] = [];
try {
  const calls = [];
  for (let i = 0; i < 3; i++) {
    const r = await dispatch('tools/list', {});
    calls.push({ hasTools: !!r?.tools, count: r?.tools?.length });
  }
  results['D9-5'].push({ desc: '3 sequential tools/list', calls, consistent: calls.every(c => c.count === calls[0].count) });
} catch(e) {
  results['D9-5'].push({ desc: 'sequential calls', error: e.message });
}

// D9-6: Cross-client interoperability - same tool definitions regardless of client
results['D9-6'] = [];
try {
  const r = await dispatch('tools/list', {});
  const toolNames = r?.tools?.map(t => t.name) || [];
  results['D9-6'].push({ desc: 'tools/list cross-client', count: toolNames.length, hasCoreTools: toolNames.includes('huaweicloud_check_cli') && toolNames.includes('huaweicloud_plan_cli_command') });
} catch(e) {
  results['D9-6'].push({ desc: 'cross-client', error: e.message });
}

// D9-9: tools/call timeout and cancel semantics
results['D9-9'] = [];
try {
  // Call a tool that might take time
  const r = await dispatch('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'ECS' } });
  results['D9-9'].push({ desc: 'list_operations ECS', hasContent: !!r?.content, result: JSON.stringify(r).substring(0, 300) });
} catch(e) {
  results['D9-9'].push({ desc: 'list_operations ECS', error: e.message });
}

// D9-7: Protocol version negotiation
results['D9-7'] = [];
try {
  const r = await dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } });
  results['D9-7'].push({ desc: 'version 2024-11-05', negotiatedVersion: r?.protocolVersion, result: JSON.stringify(r).substring(0, 200) });
} catch(e) {
  results['D9-7'].push({ desc: 'version 2024-11-05', error: e.message });
}

// Try older version
try {
  const r2 = await dispatch('initialize', { protocolVersion: '2024-09-01', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } });
  results['D9-7'].push({ desc: 'version 2024-09-01', negotiatedVersion: r2?.protocolVersion, result: JSON.stringify(r2).substring(0, 200) });
} catch(e) {
  results['D9-7'].push({ desc: 'version 2024-09-01', error: e.message });
}

// D9-8: inputSchema version compliance
results['D9-8'] = [];
try {
  const r = await dispatch('tools/list', {});
  const tools = r?.tools || [];
  let allHaveSchema = true;
  let missingSchema = [];
  for (const t of tools) {
    if (!t.inputSchema || t.inputSchema.type !== 'object') {
      allHaveSchema = false;
      missingSchema.push(t.name);
    }
  }
  results['D9-8'].push({ desc: 'inputSchema compliance', total: tools.length, allHaveSchema, missingSchema, pass: allHaveSchema });
} catch(e) {
  results['D9-8'].push({ desc: 'inputSchema compliance', error: e.message });
}

console.log(JSON.stringify(results, null, 2));
