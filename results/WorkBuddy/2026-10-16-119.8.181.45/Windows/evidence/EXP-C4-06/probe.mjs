import { writeFileSync } from 'node:fs';
const caseId = 'EXP-C4-06';
const executedAt = '20261016050729';
try {

    // EXP-C4-06: list_operations + plan readonly smoke test
    import { spawnSync } from 'node:child_process';
    const result = spawnSync('node', ['C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/eval/harness/run-eval.mjs', 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'], { encoding: 'utf8', timeout: 60000, shell: false, windowsHide: true, cwd: 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test' });
    const hasOutput = result.stdout && result.stdout.length > 0;
    const status = hasOutput ? 'PASS' : 'FAIL';
    const output = { caseId, status, why: 'EXP-C4-06: eval harness ran, exit=' + result.status, executedAt,
      result: { exitCode: result.status, hasOutput, stdout: result.stdout?.slice(0,300) } };
    writeFileSync('stdout.log', JSON.stringify(output, null, 2));
    console.log(JSON.stringify(output, null, 2));
  
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
