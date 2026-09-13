/**
 * Hermes 每日测试探针 - D2 认证 + D9 MCP 协议 (Linux, 源码级)
 * SUT: huaweicloud-devkit@1.1.4-next.3 (commit 3b6290b0)
 * 覆盖: D2-4(凭证脱敏) / D2-11(STS token 拒绝落盘) / D9-1/2/3/4/8 协议
 */
import { readFileSync } from 'node:fs';
import { redactSecrets } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { callTool, TOOL_DEFINITIONS } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { dispatch } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { readGlobalCredentials } from 'file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';

let pass = 0, fail = 0; const failures = [];
function T(id, name, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${name}  => ${JSON.stringify(actual)}${ok ? '' : '  (expected ' + JSON.stringify(expected) + ')'}`);
  if (ok) pass++; else { fail++; failures.push({ id, name, actual, expected }); }
  return ok;
}

console.log('===== D2-4 凭证脱敏正确性 =====');
T('D2-4','ak 字段脱敏', redactSecrets({ ak:'AKIA1234567890' }).ak, '<redacted>');
T('D2-4','sk 字段脱敏', redactSecrets({ sk:'secret-sk-value' }).sk, '<redacted>');
T('D2-4','securityToken 字段脱敏', redactSecrets({ securityToken:'sts-token-xyz' }).securityToken, '<redacted>');
T('D2-4','password 字段脱敏', redactSecrets({ password:'p@ssw0rd' }).password, '<redacted>');
T('D2-4','字符串 access_key=value 脱敏', redactSecrets('access_key=AKIA123'), 'access_key=<redacted>');
T('D2-4','字符串 SK=value 脱敏', redactSecrets('SK=myskvalue'), 'SK=<redacted>');
T('D2-4','嵌套对象脱敏', redactSecrets({ config:{ ak:'AK', sk:'SK' } }).config.ak, '<redacted>');
T('D2-4','credentials 键整体脱敏', redactSecrets({ credentials:{ ak:'AK' } }).credentials, '<redacted>');
T('D2-4','数组脱敏', redactSecrets([{ ak:'AK' }])[0].ak, '<redacted>');

console.log('\n===== D2-11 R3 STS token 拒绝落盘 =====');
// 用当前 S1 现有的 ak（避免触发账号冲突 needs_confirmation 分支），
// 仅验证「persist + 非空 securityToken」是否被 R3 规则拒绝且不写盘。
const cur = readGlobalCredentials();
const curAk = (cur && cur.ak) || 'placeholder-ak';
const isConflictSkipped = !(cur && cur.ak);
const stsRes = await callTool('huaweicloud_auth_switch', {
  action: 'persist', mode: 'memory',
  ak: curAk, sk: 'test-sk-not-real',
  securityToken: 'test-security-token-not-real', region: 'cn-north-4',
});
console.log('auth_switch persist + securityToken =>', JSON.stringify(stsRes));
if (isConflictSkipped) console.log('(当前无 S1 凭证，用 placeholder ak，无冲突)');
T('D2-11','status=error', stsRes.status, 'error');
T('D2-11','scope=rejected', stsRes.scope, 'rejected');
T('D2-11','错误信息含 R3 说明', /STS|persist/i.test(stsRes.error || stsRes.message || ''), true);

console.log('\n===== D9-1 tools/list 合规 =====');
const toolsList = await dispatch('tools/list', {});
T('D9-1','tools/list 返回 tools 数组', Array.isArray(toolsList.tools), true);
T('D9-1','工具数量 = 39', toolsList.tools.length, 39);
T('D9-1','每个工具含 name+inputSchema', TOOL_DEFINITIONS.every(t=>t.name && t.inputSchema && typeof t.inputSchema === 'object'), true);

console.log('\n===== D9-8 inputSchema 版本合规 =====');
const hasObjectType = TOOL_DEFINITIONS.every(t => !t.inputSchema || t.inputSchema.type === undefined || t.inputSchema.type === 'object');
T('D9-8','inputSchema.type=object (或省略)', hasObjectType, true);
const propTypes = TOOL_DEFINITIONS.every(t => {
  const props = t.inputSchema && t.inputSchema.properties;
  if (!props) return true;
  return Object.values(props).every(p => !p || !p.type || ['string','number','boolean','object','array','integer'].includes(p.type));
});
T('D9-8','properties 类型合法', propTypes, true);

console.log('\n===== D9-3 tools/call 响应格式 =====');
const versionRes = await dispatch('tools/call', { name: 'huaweicloud_check_cli', arguments: {} });
T('D9-3','返回 content 数组', Array.isArray(versionRes.content), true);
T('D9-3','content[0].type=text', versionRes.content && versionRes.content[0] && versionRes.content[0].type, 'text');
T('D9-3','isError=false', versionRes.isError, false);
T('D9-3','text 为 JSON 字符串', (()=>{ try { JSON.parse(versionRes.content[0].text); return true; } catch { return false; } })(), true);

console.log('\n===== D9-4 协议生命周期 =====');
const initRes = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'test', version: '1.0' } });
T('D9-4','initialize 返回 protocolVersion', initRes.protocolVersion, '2024-11-05');
T('D9-4','initialize 返回 capabilities', initRes.capabilities && typeof initRes.capabilities === 'object', true);
T('D9-4','serverInfo.name', initRes.serverInfo && initRes.serverInfo.name, 'huaweicloud-devkit');
T('D9-4','resources/list 返回空', (await dispatch('resources/list', {})).resources.length, 0);

console.log('\n===== D9-2 JSON-RPC 错误码 (源码级) =====');
let errMsg = '';
try { await dispatch('tools/does-not-exist', {}); } catch (e) { errMsg = e.message; }
T('D9-2','未知方法抛错 Unsupported method', errMsg.includes('Unsupported method'), true);
const serverSrc = readFileSync('/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs','utf8');
const has32603 = serverSrc.includes('-32603');
const has32601 = serverSrc.includes('-32601');
console.log('mcp-server.mjs 含 -32603:', has32603, '| 含 -32601:', has32601);
T('D9-2','错误码区分 -32601 (Method not found) 与 -32603', has32601, true);

console.log(`\n===== D2/D9 汇总: ${pass} PASS / ${fail} FAIL =====`);
if (fail) { failures.forEach(f=>console.log(`  - ${f.id} ${f.name}: actual=${JSON.stringify(f.actual)} expected=${JSON.stringify(f.expected)}`)); }
process.exitCode = fail > 0 ? 1 : 0;