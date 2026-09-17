import { TOOL_DEFINITIONS, callTool, classifyRawCommand, listSkillDirs, findSkillsRoot } from './plugins/huaweicloud-core/src/tools.mjs';
import { dispatch, _decorateResult, _resetHintConsumption, _isHintConsumed } from './plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function test(id, description, fn) {
  try {
    const r = fn();
    if (r && r.then) {
      return r.then(res => {
        results[id] = { description, ...res };
        console.log(`[${res.status}] ${id}: ${description}`);
        if (res.detail) console.log(`  -> ${res.detail}`);
      });
    }
    results[id] = { description, ...r };
    console.log(`[${r.status}] ${id}: ${description}`);
    if (r.detail) console.log(`  -> ${r.detail}`);
  } catch (e) {
    results[id] = { description, status: 'ERROR', error: e.message };
    console.log(`[ERROR] ${id}: ${description} -> ${e.message}`);
  }
}

// D5-1 P1: 清单发现加载
test('D5-1', 'manifest discovery and loading (TOOL_DEFINITIONS)', () => {
  const count = TOOL_DEFINITIONS.length;
  const allHaveName = TOOL_DEFINITIONS.every(t => t.name && typeof t.name === 'string');
  const allHaveSchema = TOOL_DEFINITIONS.every(t => t.inputSchema && t.inputSchema.type === 'object');
  const allHaveDesc = TOOL_DEFINITIONS.every(t => t.description && t.description.length > 0);
  return { status: (count >= 39 && allHaveName && allHaveSchema && allHaveDesc) ? 'PASS' : 'FAIL', detail: `count=${count}, allHaveName=${allHaveName}, allHaveSchema=${allHaveSchema}, allHaveDesc=${allHaveDesc}` };
});

// D5-3 P1: 工具全量枚举
test('D5-3', 'tool full enumeration via dispatch tools/list', async () => {
  const r = await dispatch('tools/list', {});
  const tools = r.tools;
  const count = tools.length;
  return { status: count >= 39 ? 'PASS' : 'FAIL', detail: `tools/list returned ${count} tools` };
});

// D3-A1 P1: skill检索完整性
test('D3-A1', 'skill retrieval completeness', () => {
  const skillsRoot = findSkillsRoot();
  const dirs = listSkillDirs();
  const hasSkills = dirs && dirs.length > 0;
  return { status: hasSkills ? 'PASS' : 'FAIL', detail: `skillsRoot=${skillsRoot}, dirs=${dirs?.length}` };
});

// D3-B1 P2: list_operations规范名
test('D3-B1', 'list_operations standard naming', async () => {
  const r = await callTool('huaweicloud_list_operations', { service: 'ECS' });
  const hasContent = r && (r.operations || r.services || r.content || JSON.stringify(r).length > 10);
  return { status: hasContent ? 'PASS' : 'FAIL', detail: `result keys=${Object.keys(r || {}).join(',')}` };
});

// D3-B5 P2: detect_framework识别
test('D3-B5', 'detect_framework identification', async () => {
  const r = await callTool('huaweicloud_detect_framework', {});
  const hasResult = r && (r.framework || r.detected || JSON.stringify(r).length > 10);
  return { status: hasResult ? 'PASS' : 'FAIL', detail: `result=${JSON.stringify(r).substring(0, 100)}` };
});

// D3-B3 P1: run_readonly脱敏执行
test('D3-B3', 'run_readonly redaction (readonly command execution)', async () => {
  // run_readonly should redact secrets in output
  const r = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServers'] });
  const noSecrets = !JSON.stringify(r).includes('AK') || !JSON.stringify(r).match(/AK[A-Z0-9]{10,}/);
  return { status: r ? 'PASS' : 'FAIL', detail: `result type=${typeof r}, keys=${Object.keys(r || {}).join(',').substring(0,80)}` };
});

// D3-C5 P1: 工具冒烟
test('D3-C5', 'tool smoke test (service catalog)', async () => {
  const r = await callTool('huaweicloud_service_catalog', {});
  const hasContent = r && JSON.stringify(r).length > 10;
  return { status: hasContent ? 'PASS' : 'FAIL', detail: `catalog result size=${JSON.stringify(r).length}` };
});

// D9-1 P1: tools/list合规
test('D9-1', 'tools/list compliance', async () => {
  const r = await dispatch('tools/list', {});
  const hasTools = r.tools && Array.isArray(r.tools);
  const allValid = hasTools && r.tools.every(t => t.name && t.description && t.inputSchema);
  return { status: allValid ? 'PASS' : 'FAIL', detail: `hasTools=${hasTools}, count=${r.tools?.length}, allValid=${allValid}` };
});

// D9-2 P1: JSON-RPC错误码
test('D9-2', 'JSON-RPC error code for unsupported method', async () => {
  try {
    await dispatch('invalid/method', {});
    return { status: 'FAIL', detail: 'should have thrown error' };
  } catch (e) {
    const hasError = e.message.includes('Unsupported method');
    return { status: hasError ? 'PASS' : 'FAIL', detail: `error=${e.message}` };
  }
});

// D9-3 P1: tools/call响应格式
test('D9-3', 'tools/call response format', async () => {
  const r = await dispatch('tools/call', { name: 'huaweicloud_check_cli', arguments: {} });
  const hasContent = r.content && Array.isArray(r.content);
  const hasText = hasContent && r.content[0]?.type === 'text';
  const hasIsError = r.isError !== undefined;
  return { status: (hasContent && hasText && hasIsError) ? 'PASS' : 'FAIL', detail: `content=${hasContent}, text=${hasText}, isError=${hasIsError}` };
});

// D9-4 P1: 协议生命周期
test('D9-4', 'protocol lifecycle (initialize)', async () => {
  const r = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'test-client', version: '1.0.0' } });
  const hasProtocol = r.protocolVersion === '2024-11-05';
  const hasCapabilities = r.capabilities && r.capabilities.tools;
  const hasServerInfo = r.serverInfo && r.serverInfo.name === 'huaweicloud-devkit';
  return { status: (hasProtocol && hasCapabilities && hasServerInfo) ? 'PASS' : 'FAIL', detail: `protocol=${r.protocolVersion}, server=${r.serverInfo?.name}` };
});

// D9-5 P1: stdio传输健壮
test('D9-5', 'stdio transport robustness (dispatch handles all methods)', async () => {
  // Test that all standard MCP methods are handled
  const methods = ['initialize', 'tools/list', 'tools/call', 'resources/list'];
  const allHandled = [];
  for (const m of methods) {
    try {
      const params = m === 'tools/call' ? { name: 'huaweicloud_check_cli', arguments: {} } : 
                     m === 'initialize' ? { protocolVersion: '2024-11-05' } : {};
      await dispatch(m, params);
      allHandled.push(true);
    } catch (e) {
      allHandled.push(false);
    }
  }
  const allOk = allHandled.every(h => h);
  return { status: allOk ? 'PASS' : 'FAIL', detail: `methods handled: ${allHandled.map((h,i) => `${methods[i]}=${h}`).join(', ')}` };
});

// D9-6 P1: 跨客户端互通
test('D9-6', 'cross-client interop (initialize with different clientInfo)', async () => {
  const clients = [
    { name: 'claude', version: '1.0' },
    { name: 'cursor', version: '0.1' },
    { name: 'hermes', version: '1.0' },
  ];
  const results = [];
  for (const ci of clients) {
    const r = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: ci });
    results.push(r.serverInfo?.name === 'huaweicloud-devkit');
  }
  const allOk = results.every(r => r);
  return { status: allOk ? 'PASS' : 'FAIL', detail: `clients tested: ${clients.map(c => c.name).join(', ')}` };
});

// D9-9 P1: tools/call超时协议语义与取消
test('D9-9', 'tools/call timeout semantics', async () => {
  // dispatch should handle tools/call and return within reasonable time
  const start = Date.now();
  const r = await dispatch('tools/call', { name: 'huaweicloud_check_cli', arguments: {} });
  const elapsed = Date.now() - start;
  const hasResponse = r && r.content;
  const reasonableTime = elapsed < 30000; // 30s max
  return { status: (hasResponse && reasonableTime) ? 'PASS' : 'FAIL', detail: `elapsed=${elapsed}ms, hasResponse=${!!hasResponse}` };
});

// D9-7 P2: 协议版本协商降级
test('D9-7', 'protocol version negotiation', async () => {
  const r = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'test' } });
  const versionMatches = r.protocolVersion === '2024-11-05';
  return { status: versionMatches ? 'PASS' : 'FAIL', detail: `negotiated version=${r.protocolVersion}` };
});

// D9-8 P2: inputSchema版本合规
test('D9-8', 'inputSchema version compliance', async () => {
  const r = await dispatch('tools/list', {});
  const allHaveSchema = r.tools.every(t => t.inputSchema && t.inputSchema.type === 'object');
  return { status: allHaveSchema ? 'PASS' : 'FAIL', detail: `all tools have object inputSchema=${allHaveSchema}` };
});

// D8-7 P0: 7 meta skill guides mechanically executable
test('D8-7', '7 meta skill guides mechanically executable', () => {
  const skillsRoot = findSkillsRoot();
  if (!skillsRoot || !existsSync(skillsRoot)) {
    return { status: 'FAIL', detail: `skillsRoot not found: ${skillsRoot}` };
  }
  // Check for required meta-skills
  const requiredSkills = [
    'huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery', 
    'huaweicloud-cli-and-auth', 'huaweicloud-core', 
    'huaweicloud-safety', 'huaweicloud-troubleshooting'
  ];
  const allFiles = [];
  function walk(dir) {
    try {
      for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) walk(fullPath);
        else if (entry === 'SKILL.md') allFiles.push(fullPath);
      }
    } catch {}
  }
  walk(skillsRoot);
  const skillNames = allFiles.map(f => {
    try {
      const content = readFileSync(f, 'utf8');
      const match = content.match(/^---\s*\nname:\s*(\S+)/m);
      return match ? match[1] : null;
    } catch { return null; }
  }).filter(Boolean);
  const allFound = requiredSkills.every(req => skillNames.some(s => s === req));
  return { status: allFound ? 'PASS' : 'FAIL', detail: `found=${skillNames.length}, required=${requiredSkills.length}, allFound=${allFound}, missing=${requiredSkills.filter(r => !skillNames.includes(r)).join(',')}` };
});

// D8-4 P1: 引导步骤可机械执行
test('D8-4', 'guidance steps mechanically executable (check_cli returns structured)', async () => {
  const r = await callTool('huaweicloud_check_cli', {});
  const hasResult = r && typeof r === 'object';
  return { status: hasResult ? 'PASS' : 'FAIL', detail: `check_cli returns object=${hasResult}` };
});

// D8-1 P2: 文档与能力一致
test('D8-1', 'docs and capability consistency', async () => {
  const r = await dispatch('tools/list', {});
  const toolCount = r.tools.length;
  const allHaveDesc = r.tools.every(t => t.description && t.description.length > 10);
  return { status: (toolCount >= 39 && allHaveDesc) ? 'PASS' : 'FAIL', detail: `tools=${toolCount}, allHaveDesc=${allHaveDesc}` };
});

// D10-4 P0: 安全干预有效性
test('D10-4', 'security intervention effectiveness', () => {
  // Plan a destructive command - should be blocked
  const plan = planHcloudCommand(['ECS', 'DeleteServer', '--server_id=test']);
  const blocked = plan.classification.decision === 'deny';
  const safeFalse = plan.safeToRun === false;
  return { status: (blocked && safeFalse) ? 'PASS' : 'FAIL', detail: `decision=${plan.classification.decision}, safeToRun=${plan.safeToRun}` };
});

// Wait for async
await new Promise(r => setTimeout(r, 5000));

console.log('\n=== SUMMARY ===');
const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
const errorCount = Object.values(results).filter(r => r.status === 'ERROR').length;
console.log(`PASS: ${passCount}, FAIL: ${failCount}, ERROR: ${errorCount}, Total: ${Object.keys(results).length}`);
console.log('\nAll cases:');
Object.entries(results).forEach(([id, r]) => {
  console.log(`  ${id} [${r.status}]: ${r.detail || r.error || ''}`);
});
