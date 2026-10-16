import { writeFileSync, readFileSync } from 'node:fs';

const caseId = 'D2-11';
const executedAt = '20261017052200';

try {
  const { callTool } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');
  const { readGlobalCredentials } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');

  // Read stored S1 credentials to use same AK (avoid conflict path → go straight to persistCredentials)
  const s1Before = readGlobalCredentials();
  const storedAk = s1Before?.ak || 'AKIDTEST';
  const storedSk = s1Before?.sk || 'SKTEST';

  // D2-11: R3 STS token rejection — auth_switch persist WITH securityToken
  // Using same AK as S1 to avoid conflict → goes directly to persistCredentials
  // which should reject STS token (R3).
  const result = await callTool('huaweicloud_auth_switch', {
    action: 'persist',
    ak: storedAk,
    sk: storedSk,
    securityToken: 'STS.TOKEN.FAKE.TEST.1234567890',
    region: s1Before?.region || 'cn-north-4',
  });

  // Real assertion on returned fields
  const isRejected = result && result.status === 'error' && result.scope === 'rejected';
  const mentionsR3 = String(result?.error || '').includes('R3') || String(result?.error || '').includes('STS');

  // Verify S1 was NOT written with the test token
  const s1After = readGlobalCredentials();
  const tokenNotPersisted = !String(s1After?.securityToken || '').includes('STS.TOKEN.FAKE.TEST');

  const status = (isRejected && mentionsR3 && tokenNotPersisted) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: `auth_switch persist+token (same AK, no conflict) returned status=${result?.status} scope=${result?.scope} error=${result?.error}; R3 reject=${isRejected && mentionsR3}; S1 token not persisted=${tokenNotPersisted}`,
    executedAt,
    result: {
      authSwitchResult: { status: result?.status, scope: result?.scope, error: result?.error, note: result?.note },
      isRejected,
      mentionsR3,
      tokenNotPersisted,
    },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
