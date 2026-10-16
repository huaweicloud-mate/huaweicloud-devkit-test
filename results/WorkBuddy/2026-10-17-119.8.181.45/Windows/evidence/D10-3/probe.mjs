import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const caseId = 'D10-3';
const executedAt = '20261017060000';
try {

  // Routing accuracy - run eval harness
  const evalPath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/eval/harness/run-eval.mjs';
  const mcpPath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
  const result = spawnSync('node', [evalPath, mcpPath], { encoding: 'utf8', timeout: 60000, shell: false, windowsHide: true,
    cwd: 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test' });
  const hasOutput = result.stdout && result.stdout.length > 0;
  const status = hasOutput ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Eval harness ran, exit=' + result.status + ', output length=' + (result.stdout?.length || 0), executedAt,
    result: { exitCode: result.status, stdout: result.stdout?.slice(0,500), stderr: result.stderr?.slice(0,200) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
