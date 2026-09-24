/**
 * WorkBuddy daily test probe - D9 protocol source-level
 * Covers: D9-12 initialize handshake, D9-13 tools/call credential safety
 */
import {
  TOOL_DEFINITIONS, callTool, listSkillDirs, findSkillsRoot, runVersionCheck,
} from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import {
  _decorateResult, _resetHintConsumption, _isHintConsumed, dispatch,
} from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import {
  globalCredentialsPath, readGlobalCredentials, isPlaceholder,
  setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials,
  resolveCredentialsWithRuntime,
} from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { classifyHcloudArgs, loadPolicy } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import {
  hashArgs, createApprovalToken, consumeApprovalToken,
  readServiceCatalogs, classifyUnsupported, planHcloudCommand,
} from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';
import {
  evaluateArtifacts, evaluateDeployPlan, mergeRiskDecision,
} from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const evDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-25-188.239.14.150/Windows/evidence';
const results = [];
function test(id, name, pass, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass, actual: String(actual).substring(0,120), expected: String(expected).substring(0,120), passMsg, failMsg });
}

// ===== D9-12: initialize handshake protocol security baseline =====

// ① dispatch('initialize') returns protocolVersion + capabilities + serverInfo
let initOk = false, initResult = null;
try {
  initResult = await dispatch('initialize', { clientInfo: { name: 'probe', version: '1' } }, { sessionId: 'd9-12-test' });
  initOk = Boolean(initResult && initResult.protocolVersion && initResult.capabilities && initResult.serverInfo);
} catch (e) { initResult = String(e); }
test('D9-12', 'initialize-returns', initOk, JSON.stringify(initResult).substring(0,80), 'protocolVersion+capabilities+serverInfo', 'initialize returns complete handshake', 'initialize missing fields');

// ② callTool routes to tools.mjs callTool function
test('D9-12', 'callTool-fn', typeof callTool === 'function', typeof callTool, 'function', 'callTool is function', 'callTool not function');

// ③ runVersionCheck exists and is callable
test('D9-12', 'runVersionCheck-fn', typeof runVersionCheck === 'function', typeof runVersionCheck, 'function', 'runVersionCheck is function', 'runVersionCheck not function');

// ④ _decorateResult wraps response without throwing
_resetHintConsumption();
const sampleResult = { ok: true, data: 'test' };
let decoratedOk = false, decoratedVal = null;
try {
  decoratedVal = _decorateResult('d9-12-session', 'huaweicloud_list_operations', sampleResult);
  decoratedOk = true;
} catch (e) { decoratedVal = String(e); }
test('D9-12', 'decorateResult-nothrow', decoratedOk, JSON.stringify(decoratedVal).substring(0,60), 'result', '_decorateResult no throw', '_decorateResult throws');

// _resetHintConsumption / _isHintConsumed
_resetHintConsumption();
test('D9-12', 'resetHintConsumption-fn', typeof _resetHintConsumption === 'function', typeof _resetHintConsumption, 'function', '_resetHintConsumption is function', '_resetHintConsumption not function');
test('D9-12', 'isHintConsumed-fn', typeof _isHintConsumed === 'function', typeof _isHintConsumed, 'function', '_isHintConsumed is function', '_isHintConsumed not function');

// ⑤ listSkillDirs / findSkillsRoot return valid skill directories
const skillCandidates = [
  join(homedir(), '.workbuddy', 'skills'),
  join(homedir(), '.claude', 'skills'),
  join(homedir(), '.codebuddy', 'skills'),
];
const skillsRoot = findSkillsRoot(skillCandidates);
const skillDirs = skillsRoot ? listSkillDirs(skillsRoot) : [];
test('D9-12', 'listSkillDirs-fn', typeof listSkillDirs === 'function', typeof listSkillDirs, 'function', 'listSkillDirs is function', 'listSkillDirs not function');
test('D9-12', 'findSkillsRoot-fn', typeof findSkillsRoot === 'function', typeof findSkillsRoot, 'function', 'findSkillsRoot is function', 'findSkillsRoot not function');
test('D9-12', 'skill-dirs-valid', Array.isArray(skillDirs), JSON.stringify(skillDirs).substring(0,60), 'array', `skill dirs: ${skillDirs.length}`, 'skill dirs not array');

// ⑥ illegal sequence (tools/list before initialize) - dispatch still works since it's stateless per call,
// but unknown method returns -32601
let methodNotFound = false, notFoundErr = null;
try {
  await dispatch('unknown/method', {}, {});
} catch (e) {
  notFoundErr = e;
  methodNotFound = e.code === -32601;
}
test('D9-12', 'unknown-method-code', methodNotFound, notFoundErr?.code, -32601, 'unknown method returns -32601', 'unknown method wrong code');

// tools/list works
let toolsListOk = false, toolsListResult = null;
try {
  toolsListResult = await dispatch('tools/list', {}, {});
  toolsListOk = Boolean(toolsListResult && Array.isArray(toolsListResult.tools) && toolsListResult.tools.length > 0);
} catch (e) { toolsListResult = String(e); }
test('D9-12', 'tools-list', toolsListOk, toolsListResult?.tools?.length, '>0', `tools: ${toolsListResult?.tools?.length}`, 'tools/list failed');

// ===== D9-13: tools/call credential non-leak + permission check =====

// ① setRuntimeCredentials / hasRuntimeCredentials / clearRuntimeCredentials
setRuntimeCredentials('AKID_TEST_D913', 'SK_TEST_D913', 'TOKEN_TEST_D913', 'cn-north-4');
test('D9-13', 'hasRuntimeCredentials', hasRuntimeCredentials(), hasRuntimeCredentials(), true, 'runtime credentials set', 'runtime credentials not set');

// ② resolveCredentialsWithRuntime resolves runtime creds
let resolvedCreds = null, resolveOk = false;
try {
  resolvedCreds = resolveCredentialsWithRuntime({ skipCache: true });
  resolveOk = Boolean(resolvedCreds && typeof resolvedCreds === 'object');
} catch (e) { resolvedCreds = String(e); }
test('D9-13', 'resolveRuntimeCreds', resolveOk, typeof resolvedCreds, 'object', 'runtime creds resolved', 'runtime creds resolve failed');

// clearRuntimeCredentials and verify
clearRuntimeCredentials();
test('D9-13', 'clearRuntimeCredentials', !hasRuntimeCredentials(), hasRuntimeCredentials(), false, 'runtime cleared', 'runtime not cleared');

// ③ loadPolicy + classifyHcloudArgs
const policy = loadPolicy();
test('D9-13', 'loadPolicy', policy !== null && typeof policy === 'object', typeof policy, 'object', 'policy loaded', 'policy not loaded');
const cls = classifyHcloudArgs(['ECS', 'DeleteServers', '--server-ids', 'test']);
test('D9-13', 'classifyHcloudArgs', typeof cls === 'object' && typeof cls.decision === 'string', cls.decision, 'string', `decision: ${cls.decision}`, 'classifyHcloudArgs failed');

// ④ evaluateArtifacts / evaluateDeployPlan / mergeRiskDecision
const artRes = evaluateArtifacts([{ path: 'test.tf', content: 'resource "huaweicloud_vpc" "test" { cidr = "0.0.0.0/0" }' }]);
test('D9-13', 'evaluateArtifacts', artRes !== null && typeof artRes === 'object', typeof artRes, 'object', 'evaluateArtifacts returns result', 'evaluateArtifacts error');
const depRes = evaluateDeployPlan({ action: 'create', resource: 'ecs', config: { publicIp: true, securityGroup: '0.0.0.0/0' } });
test('D9-13', 'evaluateDeployPlan', depRes !== null && typeof depRes === 'object', typeof depRes, 'object', 'evaluateDeployPlan returns result', 'evaluateDeployPlan error');
const merged = mergeRiskDecision({ decision: 'allow' }, { decision: 'deny', reason: 'test' });
test('D9-13', 'mergeRiskDecision', merged !== null && typeof merged === 'object', typeof merged, 'object', 'mergeRiskDecision returns result', 'mergeRiskDecision error');

// ⑤ hashArgs + createApprovalToken + consumeApprovalToken (non-replayable)
const testArgs = ['ECS', 'DeleteServers', '--server-ids', 'test-123'];
const argsHash = hashArgs(testArgs);
test('D9-13', 'hashArgs', typeof argsHash === 'string' && argsHash.length > 0, argsHash?.substring(0,16), 'string', `hash: ${argsHash?.substring(0,16)}`, 'hashArgs failed');

const token = createApprovalToken(testArgs);
test('D9-13', 'createApprovalToken', typeof token === 'string' && token.length > 0, token?.substring(0,16), 'string', 'token created', 'token not created');

const consumed = consumeApprovalToken(token);
test('D9-13', 'consumeApprovalToken-first', consumed !== null, typeof consumed, 'object', 'token consumed', 'token not consumed');

// replay attempt should fail (return null)
const replay = consumeApprovalToken(token);
test('D9-13', 'token-no-replay', replay === null, String(replay), 'null', 'token non-replayable', 'token replayable (defect)');

// ⑥ readServiceCatalogs / classifyUnsupported / planHcloudCommand
const catalogs = readServiceCatalogs();
test('D9-13', 'readServiceCatalogs', catalogs !== null && typeof catalogs === 'object', typeof catalogs, 'object', 'catalogs read', 'catalogs read failed');

const unsupp = classifyUnsupported('FAKE_SERVICE');
test('D9-13', 'classifyUnsupported', typeof unsupp === 'string' && unsupp.length > 0, unsupp, 'string', `classification: ${unsupp}`, 'classifyUnsupported failed');

const plan = planHcloudCommand(['ECS', 'ListServers']);
test('D9-13', 'planHcloudCommand', plan !== null && typeof plan === 'object', typeof plan, 'object', 'planHcloudCommand returns', 'planHcloudCommand failed');

// ⑦ tools/call returns no AK/SK/token plaintext - call a safe tool and check output
let callResultStr = '';
try {
  const r = await dispatch('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'ECS' } }, { sessionId: 'd9-13-test' });
  callResultStr = JSON.stringify(r);
} catch (e) { callResultStr = String(e); }
const hasPlaintext = /AKID[A-Z0-9]{10,}|SK[A-Z0-9]{10,}/.test(callResultStr);
test('D9-13', 'no-plaintext-leak', !hasPlaintext, hasPlaintext ? 'LEAKED' : 'clean', 'clean', 'no AK/SK plaintext in response', 'AK/SK plaintext leaked');

// ⑧ readGlobalCredentials / writeGlobalCredentials persistence
const credsPath = globalCredentialsPath();
test('D9-13', 'globalCredentialsPath', typeof credsPath === 'string' && credsPath.length > 0, credsPath, 'string', `path: ${credsPath}`, 'no credentials path');
const existingCreds = readGlobalCredentials();
test('D9-13', 'readGlobalCredentials', typeof existingCreds === 'object', typeof existingCreds, 'object', 'creds readable', 'creds not readable');

// ⑨ isPlaceholder: empty string not placeholder (returns false), template strings are placeholders
test('D9-13', 'isPlaceholder-empty', isPlaceholder('') === false, isPlaceholder(''), false, 'empty not placeholder', 'empty marked placeholder');
test('D9-13', 'isPlaceholder-template', isPlaceholder('<your-ak>') === true, isPlaceholder('<your-ak>'), true, 'template is placeholder', 'template not placeholder');
test('D9-13', 'isPlaceholder-real', isPlaceholder('AKID12345678') === false, isPlaceholder('AKID12345678'), false, 'real AK not placeholder', 'real AK marked placeholder');

// permission check three-state
const denyRes = classifyHcloudArgs(['ECS', 'DeleteServers', '--server-ids', 'x']);
const allowRes = classifyHcloudArgs(['ECS', 'ListServers']);
test('D9-13', 'three-state-deny', denyRes.decision === 'deny' || denyRes.decision === 'confirm', denyRes.decision, 'deny/confirm', 'write denied', 'write allowed');
test('D9-13', 'three-state-allow', allowRes.decision === 'allow', allowRes.decision, 'allow', 'read allowed', 'read denied');

const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
const output = JSON.stringify({ total: results.length, passed, failed, results }, null, 2);
writeFileSync(join(evDir, 'd9-protocol', 'stdout.log'), output, 'utf8');
console.log(output);
