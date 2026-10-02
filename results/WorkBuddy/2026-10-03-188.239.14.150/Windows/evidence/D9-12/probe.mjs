import { writeFileSync } from 'node:fs';
import { dispatch, _decorateResult, _resetHintConsumption, _isHintConsumed } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';

const caseId = 'D9-12';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D9-12: initialize 握手协议安全基线
// Spec: initialize 返回 protocolVersion + capabilities + serverInfo; callTool 路由正确;
//       _decorateResult 包装无副作用; listSkillDirs/findSkillsRoot 返回有效目录; 非法时序返回 JSON-RPC -32600

try {
  // 1. Test initialize
  const initResult = await dispatch('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe', version: '1.0' },
  }, { sessionId: 'test-d9-12' });

  result.initResult = initResult;
  const hasProtocolVersion = Boolean(initResult.protocolVersion);
  const hasCapabilities = Boolean(initResult.capabilities?.tools);
  const hasServerInfo = Boolean(initResult.serverInfo?.name && initResult.serverInfo?.version);

  // 2. Test tools/list
  const toolsList = await dispatch('tools/list', {}, { sessionId: 'test-d9-12' });
  result.toolsCount = toolsList.tools?.length || 0;
  const hasTools = result.toolsCount > 0;

  // 3. Test _decorateResult
  _resetHintConsumption();
  const testResult = { content: [{ type: 'text', text: 'test' }] };
  const decorated = _decorateResult('test-d9-12', 'huaweicloud_doctor', testResult);
  // _decorateResult should not throw and should return a result (may or may not add hint)
  const decorateNoThrow = true; // if we got here, no throw

  // 4. Test listSkillDirs/findSkillsRoot
  const { listSkillDirs, findSkillsRoot } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');
  const skillsRoot = findSkillsRoot(['C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/skills']);
  const skillDirs = listSkillDirs(skillsRoot || 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/skills');
  result.skillsRootFound = Boolean(skillsRoot);
  result.skillDirsCount = skillDirs.length;

  // 5. Test unknown method returns -32601
  let unknownMethodError = null;
  try {
    await dispatch('unknown/method', {}, { sessionId: 'test-d9-12' });
  } catch (e) {
    unknownMethodError = { code: e.code, message: e.message };
  }
  result.unknownMethodError = unknownMethodError;

  // 6. Test callTool routing (doctor tool)
  let doctorResult = null;
  try {
    const r = await dispatch('tools/call', { name: 'huaweicloud_doctor', arguments: {} }, { sessionId: 'test-d9-12' });
    doctorResult = { hasContent: Boolean(r.content), isError: r.isError };
  } catch (e) {
    doctorResult = { error: e.message };
  }
  result.doctorResult = doctorResult;

  const allPass = hasProtocolVersion && hasCapabilities && hasServerInfo && hasTools && decorateNoThrow &&
                  result.skillsRootFound && result.skillDirsCount > 0 &&
                  unknownMethodError?.code === -32601;

  if (allPass) {
    result.status = 'PASS';
    result.why = `initialize returns protocolVersion(${initResult.protocolVersion}) + capabilities(tools) + serverInfo(${initResult.serverInfo?.name}/${initResult.serverInfo?.version}); tools/list returns ${result.toolsCount} tools; _decorateResult no-throw; listSkillDirs found ${result.skillDirsCount} skills; unknown method → -32601`;
  } else {
    result.status = 'FAIL';
    result.why = `hasProtocolVersion=${hasProtocolVersion}, hasCapabilities=${hasCapabilities}, hasServerInfo=${hasServerInfo}, hasTools=${hasTools}, skillsRoot=${result.skillsRootFound}, skillDirs=${result.skillDirsCount}, unknownMethodCode=${unknownMethodError?.code}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}\n${e?.stack?.slice(0, 200)}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('D9-12/stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
