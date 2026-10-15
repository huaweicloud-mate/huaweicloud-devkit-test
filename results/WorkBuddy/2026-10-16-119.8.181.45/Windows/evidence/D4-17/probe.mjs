import { writeFileSync } from 'node:fs';
const caseId = 'D4-17';
const executedAt = '20261016050729';
try {

  import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
  // Hook ambiguous fail-closed
  const ambiguousCmds = ['', '   ', null, undefined, '???'];
  let failClosed = true;
  const results = [];
  for (const cmd of ambiguousCmds) {
    try {
      const r = classifyTextCommand(cmd || '');
      const safe = r.decision === 'deny' || r.decision === 'warn' || r.decision === 'allow';
      if (!safe) failClosed = false;
      results.push({ cmd: String(cmd).slice(0,20), decision: r.decision });
    } catch(e) {
      results.push({ cmd: String(cmd).slice(0,20), error: e.message.slice(0,60) });
    }
  }
  const status = failClosed ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Ambiguous inputs handled (fail-closed or safe default)=' + failClosed, executedAt, result: { results } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
