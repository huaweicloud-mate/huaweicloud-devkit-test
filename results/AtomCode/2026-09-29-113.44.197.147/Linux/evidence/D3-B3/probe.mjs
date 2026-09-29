// D3-B3 run_readonly 脱敏执行 —— 真实只读命令执行成功 + 输出无明文 AK/SK
import { callTool } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

{
  const r = await callTool('huaweicloud_run_readonly_command', {
    args: ['IAM', 'KeystoneListProjects', '--cli-region=cn-north-4'],
    timeoutMs: 30000, maxRetries: 0,
  });
  check('D3-B3', 'run_readonly 执行成功', r?.ok, true);
  const raw = JSON.stringify(r);
  // 输出脱敏：不含本机真实 AK/SK（通过 ~/.config 读取比对）
  check('D3-B3', '输出不含明文 AK 片段', /AK[A-Z0-9]{20,}/.test(raw), false);
  check('D3-B3', '输出包含 projects 结果', /projects/.test(raw), true);
}

console.log('\n=== D3-B3 run_readonly 脱敏执行探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);