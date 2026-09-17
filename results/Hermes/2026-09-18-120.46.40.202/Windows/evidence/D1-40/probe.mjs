// P0 Batch 2: D1-39, D1-40, D2-11, D4-23, D8-7, D9-1, D9-2
import { queryDistTagsSync, queryDistTags, judgeUpdate, readInstalledVersion, semverCompare, determineTarget, writeSkipState, readSkipState, resolveSkipFilePath, skipFilePath } from './plugins/huaweicloud-core/src/update-check.mjs';
import { classifyHcloudArgs, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { TOOL_DEFINITIONS, callTool } from './plugins/huaweicloud-core/src/tools.mjs';
import { dispatch } from './plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { readFileSync } from 'fs';
import { join } from 'path';

const results = {};

// D1-39: Windows upgrade detection chain usability
results['D1-39'] = [];
try {
  const tags = queryDistTagsSync({ timeoutMs: 15000 });
  results['D1-39'].push({ desc: 'queryDistTagsSync', result: JSON.stringify(tags).substring(0, 300), success: !tags?.error });
} catch(e) {
  results['D1-39'].push({ desc: 'queryDistTagsSync', error: e.message });
}

// Also test async version
try {
  const tagsAsync = await queryDistTags({ timeoutMs: 15000 });
  results['D1-39'].push({ desc: 'queryDistTags (async)', result: JSON.stringify(tagsAsync).substring(0, 300), success: !tagsAsync?.error });
} catch(e) {
  results['D1-39'].push({ desc: 'queryDistTags (async)', error: e.message });
}

// D1-40: Mirror lag detection correctness
results['D1-40'] = [];
try {
  const installed = readInstalledVersion();
  // Simulate mirror with old version
  const distTags = { latest: '1.0.0', next: '1.0.0-next.1' };
  const target = determineTarget(installed, distTags);
  const judge = judgeUpdate(installed, distTags, null);
  results['D1-40'].push({ 
    desc: 'mirror lag - remote older than local',
    installed: installed,
    target: target,
    judge: JSON.stringify(judge).substring(0, 200),
    // Should NOT suggest downgrade when remote <= local
    noDowngrade: judge?.action !== 'update_available' || target !== '1.0.0'
  });
} catch(e) {
  results['D1-40'].push({ desc: 'mirror lag', error: e.message });
}

// Test with newer version
try {
  const installed = readInstalledVersion();
  const distTagsNew = { latest: '1.2.0', next: '1.2.0-next.1' };
  const judgeNew = judgeUpdate(installed, distTagsNew, null);
  results['D1-40'].push({
    desc: 'real update available',
    installed: installed,
    judge: JSON.stringify(judgeNew).substring(0, 200),
    shouldSuggestUpdate: judgeNew?.action === 'update_available'
  });
} catch(e) {
  results['D1-40'].push({ desc: 'real update', error: e.message });
}

// D2-11: R3 STS token rejection - no persistence
results['D2-11'] = [];
try {
  // STS token should never be persisted - check classifyHcloudArgs for auth_switch with token
  const r = classifyHcloudArgs(['IAM', 'CreateTemporaryAccessKey', '--duration_seconds=3600']);
  results['D2-11'].push({ desc: 'STS token creation', decision: r.decision, risk: r.risk, reason: r.reason?.substring(0, 200) });
} catch(e) {
  results['D2-11'].push({ desc: 'STS token creation', error: e.message });
}

// Check text command for STS token operations
try {
  const r2 = classifyTextCommand('hcloud IAM CreateTemporaryAccessKey --duration_seconds=3600');
  results['D2-11'].push({ desc: 'STS token via text cmd', decision: r2.decision, risk: r2.risk, reason: r2.reason?.substring(0, 200) });
} catch(e) {
  results['D2-11'].push({ desc: 'STS token via text cmd', error: e.message });
}

// D4-23: Global rules injection
results['D4-23'] = [];
try {
  // Check if huawei-agent-rules.md exists in the installed package
  const rulesPath = './plugins/huaweicloud-core/huawei-agent-rules.md';
  let rulesContent = '';
  try {
    rulesContent = readFileSync(rulesPath, 'utf8');
    results['D4-23'].push({ desc: 'huawei-agent-rules.md exists', found: true, size: rulesContent.length, preview: rulesContent.substring(0, 200) });
  } catch {
    results['D4-23'].push({ desc: 'huawei-agent-rules.md exists', found: false, error: 'File not found' });
  }
} catch(e) {
  results['D4-23'].push({ desc: 'rules injection', error: e.message });
}

// D8-7: Meta skills mechanically executable
results['D8-7'] = [];
try {
  // Check skill directories
  const skillDirs = [
    'plugins/huaweicloud-core/skills',
    'skills'
  ];
  let totalSkills = 0;
  for (const dir of skillDirs) {
    try {
      const entries = readFileSync(join(dir, 'README.md'), 'utf8');
      results['D8-7'].push({ desc: `skills dir ${dir}`, hasReadme: true });
      totalSkills++;
    } catch {
      // No readme
    }
  }
  
  // Try retrieve_skill tool
  try {
    const r = await callTool('retrieve_skill', { skill_name: 'huaweicloud_ecs' });
    results['D8-7'].push({ desc: 'retrieve_skill ECS', hasContent: !!r?.content, result: JSON.stringify(r).substring(0, 200) });
  } catch(e) {
    results['D8-7'].push({ desc: 'retrieve_skill ECS', error: e.message });
  }
} catch(e) {
  results['D8-7'].push({ desc: 'meta skills', error: e.message });
}

// D9-1: tools/list compliance - 40 tools, valid schema
results['D9-1'] = [];
try {
  const toolCount = TOOL_DEFINITIONS.length;
  results['D9-1'].push({ 
    desc: 'tool count', 
    count: toolCount,
    expectedMin: 39,
    pass: toolCount >= 39
  });
  
  // Check each tool has valid inputSchema
  let validSchemas = 0;
  let invalidTools = [];
  for (const tool of TOOL_DEFINITIONS) {
    if (tool.inputSchema && typeof tool.inputSchema === 'object') {
      validSchemas++;
    } else {
      invalidTools.push(tool.name);
    }
  }
  results['D9-1'].push({
    desc: 'schema validation',
    total: toolCount,
    valid: validSchemas,
    invalid: invalidTools,
    pass: invalidTools.length === 0
  });
  
  // Check for duplicates
  const names = TOOL_DEFINITIONS.map(t => t.name);
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  results['D9-1'].push({
    desc: 'no duplicates',
    duplicates: duplicates,
    pass: duplicates.length === 0
  });
} catch(e) {
  results['D9-1'].push({ desc: 'tools/list', error: e.message });
}

// D9-2: JSON-RPC error codes
results['D9-2'] = [];
try {
  // Test unknown method
  const r1 = await dispatch('unknown_method', {});
  results['D9-2'].push({ desc: 'unknown method', result: JSON.stringify(r1).substring(0, 300) });
} catch(e) {
  results['D9-2'].push({ desc: 'unknown method', error: e.message, code: e.code });
}

try {
  // Test invalid params
  const r2 = await dispatch('tools/call', null);
  results['D9-2'].push({ desc: 'invalid params (null)', result: JSON.stringify(r2).substring(0, 300) });
} catch(e) {
  results['D9-2'].push({ desc: 'invalid params (null)', error: e.message, code: e.code });
}

try {
  // Test tools/list with extra params
  const r3 = await dispatch('tools/list', { extra: 'param' });
  results['D9-2'].push({ desc: 'tools/list with extra params', result: JSON.stringify(r3).substring(0, 300) });
} catch(e) {
  results['D9-2'].push({ desc: 'tools/list with extra params', error: e.message, code: e.code });
}

console.log(JSON.stringify(results, null, 2));
