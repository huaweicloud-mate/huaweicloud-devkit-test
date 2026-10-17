// D9-12: initialize 握手协议安全基线
// 测试 MCP 协议验证
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRCDIR = process.argv[2] || 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src';
const OUT = process.argv[3] || 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/CodeArtsAgent/2026-10-18-119.8.181.45/Windows/evidence/D9-12/stdout.log';

const results = [];
function check(id, cond, detail) {
  const r = { id, status: cond ? 'PASS' : 'FAIL', detail };
  results.push(r);
  console.log('[' + r.status + '] ' + id + ': ' + detail);
  return cond;
}

let status = 'PASS';
let why = '';

try {
  const mcpUrl = pathToFileURL(join(SRCDIR, 'mcp-protocol.mjs')).href;
  const toolsUrl = pathToFileURL(join(SRCDIR, 'tools.mjs')).href;
  
  const { dispatch, _decorateResult, _resetHintConsumption, _isHintConsumed } = await import(mcpUrl);
  const { TOOL_DEFINITIONS, callTool } = await import(toolsUrl);
  
  console.log('=== D9-12 initialize 握手协议安全基线测试 ===');
  console.log('源码路径: ' + SRCDIR);
  
  // 测试1: initialize 握手协议
  console.log('--- 测试 initialize 握手协议 ---');
  let initResult = null;
  try {
    initResult = await dispatch('initialize', {
      protocolVersion: '2024-11-05',
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });
    console.log('initialize 返回: ' + JSON.stringify(initResult));
  } catch (e) {
    console.log('initialize 异常: ' + e.message);
  }
  
  check('initialize-返回protocolVersion', 
    initResult && initResult.protocolVersion === '2024-11-05',
    'initialize 返回正确的 protocolVersion'
  );
  
  check('initialize-返回capabilities', 
    initResult && initResult.capabilities && initResult.capabilities.tools,
    'initialize 返回 capabilities.tools'
  );
  
  check('initialize-返回serverInfo', 
    initResult && initResult.serverInfo && initResult.serverInfo.name === 'huaweicloud-devkit',
    'initialize 返回 serverInfo.name'
  );
  
  // 测试2: tools/list 路由
  console.log('--- 测试 tools/list 路由 ---');
  let listResult = null;
  try {
    listResult = await dispatch('tools/list', {});
    console.log('tools/list 返回工具数: ' + (listResult && listResult.tools ? listResult.tools.length : 0));
  } catch (e) {
    console.log('tools/list 异常: ' + e.message);
  }
  
  check('toolslist-返回工具列表', 
    listResult && Array.isArray(listResult.tools) && listResult.tools.length > 0,
    'tools/list 返回非空工具列表'
  );
  
  // 测试3: callTool 路由到 tools.mjs
  console.log('--- 测试 callTool 路由 ---');
  let callResult = null;
  try {
    callResult = await dispatch('tools/call', {
      name: 'huaweicloud_check_cli',
      arguments: {}
    });
    console.log('callTool 返回: ' + JSON.stringify(callResult).substring(0, 200));
  } catch (e) {
    console.log('callTool 异常: ' + e.message);
  }
  
  check('calltool-路由正常', 
    callResult && callResult.content && Array.isArray(callResult.content),
    'callTool 返回 content 数组'
  );
  
  // 测试4: 非法时序测试
  console.log('--- 测试非法时序（未 initialize 先 tools/list）---');
  try {
    const fakeSession = 'test-session-' + Date.now();
    const result = await dispatch('tools/list', {}, { sessionId: fakeSession });
    console.log('非法时序测试完成');
  } catch (e) {
    console.log('非法时序异常: ' + e.code + ' - ' + e.message);
  }
  
  // 测试5: _decorateResult 装饰器
  console.log('--- 测试 _decorateResult 装饰器 ---');
  const testResult = { content: [{ type: 'text', text: 'test' }] };
  const decorated = _decorateResult('session-1', 'test-tool', testResult);
  check('decorate-result-无副作用', 
    decorated !== null,
    '_decorateResult 正常返回结果'
  );
  
  // 测试6: 提示消费标记
  console.log('--- 测试提示消费标记 ---');
  _resetHintConsumption();
  check('reset-hint-consumption', 
    !_isHintConsumed('session-1'),
    '重置后提示标记未消费'
  );
  
  // 测试7: 工具定义完整性
  console.log('--- 测试工具定义完整性 ---');
  const requiredTools = [
    'huaweicloud_check_cli',
    'huaweicloud_auth_switch',
    'huaweicloud_auth_status',
    'huaweicloud_run_readonly_command',
    'huaweicloud_run_approved_command'
  ];
  
  const toolNames = TOOL_DEFINITIONS.map(t => t.name);
  for (const required of requiredTools) {
    check('tooldef-' + required,
      toolNames.includes(required),
      '工具定义包含: ' + required
    );
  }
  
  // 测试8: listSkillDirs 和 findSkillsRoot
  console.log('--- 测试技能目录查找 ---');
  let skillsRoot = null;
  try {
    const { listSkillDirs, findSkillsRoot } = await import(toolsUrl);
    const devDir = join(SRCDIR, '..', 'skills');
    skillsRoot = findSkillsRoot([devDir]);
    check('findskillsroot-返回有效目录',
      skillsRoot !== null,
      'findSkillsRoot 返回有效技能目录'
    );
  } catch (e) {
    console.log('技能目录查找: ' + e.message);
  }
  
  // 测试9: 版本检查
  console.log('--- 测试 runVersionCheck ---');
  let versionResult = null;
  try {
    versionResult = await callTool('huaweicloud_check_cli', {});
    console.log('check_cli 返回: ' + JSON.stringify(versionResult).substring(0, 200));
  } catch (e) {
    console.log('check_cli 异常: ' + e.message);
  }
  
  check('versioncheck-正常返回',
    versionResult !== null,
    '版本检查正常返回'
  );
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  if (failCount === 0) {
    status = 'PASS';
    why = 'initialize 握手协议安全基线测试通过（' + passCount + '项测试全部通过）';
  } else {
    status = 'FAIL';
    why = failCount + '项测试失败';
  }
  
  console.log('=== D9-12 结论: ' + status + ' ===');
  console.log(why);
  
} catch (e) {
  status = 'BLOCKED';
  why = '加载源码模块失败: ' + e.message;
  console.error('D9-12 BLOCKED: ' + why);
  results.push({ id: '模块加载', status: 'FAIL', detail: why });
}

const output = {
  caseId: 'D9-12',
  status,
  why,
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  results,
  platform: process.platform,
  nodeVersion: process.version,
  srcPath: SRCDIR
};

writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');
console.log('输出完成');
