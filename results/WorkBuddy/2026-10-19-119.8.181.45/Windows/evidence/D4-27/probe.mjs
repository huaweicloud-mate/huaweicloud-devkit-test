import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { spawnSync } from 'node:child_process';
// Run a command that may leak credentials in stderr
const r = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'listServers', '--region', 'cn-north-4'], timeoutMs: 30000 });
const stdoutText = JSON.stringify(r?.stdout || r?.output || '');
const stderrText = JSON.stringify(r?.stderr || r?.error || '');
// Check for AK/SK patterns
const akPattern = /AK[A-Z0-9]{10,}/;
const skPattern = /SK[A-Za-z0-9]{10,}/;
const stdoutLeak = akPattern.test(stdoutText) || skPattern.test(stdoutText);
const stderrLeak = akPattern.test(stderrText) || skPattern.test(stderrText);
const status = (!stdoutLeak && !stderrLeak) ? 'PASS' : 'FAIL';
const why = 'stdoutLeak=' + stdoutLeak + ' stderrLeak=' + stderrLeak;
const output = { caseId: 'D4-27', status, why, executedAt: '20261019051813', result: { stdoutLeak, stderrLeak, stdoutLen: stdoutText.length, stderrLen: stderrText.length } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
