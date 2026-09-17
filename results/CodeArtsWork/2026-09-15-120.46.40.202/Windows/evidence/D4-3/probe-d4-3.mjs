// D4-3: 明文secret API拦截 — 源码级直调 classifyTextCommand
// 预期: 被阻断 (decision='deny')
import { pathToFileURL } from 'node:url';
const srcBase = 'C:/Users/Administrator/devkit-test/CodeArtsWork/hdk/plugins/huaweicloud-core/src';
const { classifyTextCommand } = await import(pathToFileURL(srcBase + '/safety-policy.mjs').href);

// Test multiple secret-retrieval patterns that should be blocked
const tests = [
  { cmd: 'hcloud KMS ShowSecretVersion --version-id v1', pattern: 'ShowSecretVersion' },
  { cmd: 'hcloud DEW GetSecretValue --secret-name db.password', pattern: 'GetSecretValue' },
  { cmd: 'hcloud KMS show-secret-data --secret_string', pattern: 'secret_string' },
  { cmd: 'hcloud KMS describe-secret --secret_binary', pattern: 'secret_binary' },
];

const results = tests.map(t => {
  const r = classifyTextCommand(t.cmd);
  return { ...t, decision: r.decision, risk: r.risk, reason: r.reason, pass: r.decision === 'deny' };
});

const allBlocked = results.every(r => r.pass);
console.log(JSON.stringify({
  case: 'D4-3',
  test: '明文secret API拦截',
  results,
  allBlocked,
  pass: allBlocked,
  evidence: allBlocked 
    ? 'All 4 secret-retrieval command patterns blocked (decision=deny, risk=secret) at safety-policy.mjs:432-438'
    : 'Some secret patterns NOT blocked — FAIL'
}, null, 2));
process.exit(allBlocked ? 0 : 1);
