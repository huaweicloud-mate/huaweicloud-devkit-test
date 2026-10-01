import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readGlobalCredentials } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';

const caseId = 'D2-11';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D2-11: R3 STS token 拒绝落盘
// Spec: auth_switch persist+token → 返回 {status:error, scope:rejected}，token 永不落盘
// Key assertion: persistCredentials with securityToken returns {status:'error', scope:'rejected'} and S1 never contains token.

try {
  // Snapshot S1 before
  const before = readGlobalCredentials() || {};
  result.s1Before = { ak: before.ak, hasToken: Boolean(before.securityToken) };

  // Use the SAME ak as S1 to avoid conflict-confirmation flow; only add a securityToken.
  // This exercises the persistCredentials path directly (no conflict branch).
  const ak = before.ak || 'AKIDTEST';
  const sk = before.sk || 'SKTEST';
  const securityToken = 'FAKETOKEN.' + Buffer.from(JSON.stringify({ exp: Date.now() + 3600000 })).toString('base64url');

  const r = await callTool('huaweicloud_auth_switch', {
    action: 'persist',
    ak,
    sk,
    securityToken,
    region: before.region || 'cn-north-4',
  });

  result.callResult = r;

  // Read S1 after
  const after = readGlobalCredentials() || {};
  result.s1After = { ak: after.ak, hasToken: Boolean(after.securityToken), token: after.securityToken || '' };

  // Assertion: status error + scope rejected
  const isRejected = r.status === 'error' && r.scope === 'rejected';
  // Token must never be in S1
  const tokenNotPersisted = !after.securityToken || after.securityToken === '';

  if (isRejected && tokenNotPersisted) {
    result.status = 'PASS';
    result.why = `auth_switch persist with securityToken returned {status:error, scope:rejected}; S1 securityToken is empty — STS token never persisted (R3 enforced)`;
  } else {
    result.status = 'FAIL';
    result.why = `Expected {status:error, scope:rejected} and empty token in S1; got status=${r.status}, scope=${r.scope}, s1Token=${after.securityToken || '(empty)'}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}\n${e?.stack?.slice(0, 300)}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
