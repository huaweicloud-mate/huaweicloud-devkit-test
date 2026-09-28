import { callTool } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';
// D4-17 hook 三工具 畸形输入 fail-closed 检查（v1.1.6 应已修复 #564：deny 而非 allow）
let pass = 0, fail = 0;
const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

const cases = [
  ['huaweicloud_hook_check_command', 'command', null],
  ['huaweicloud_hook_check_command', 'command', ''],
  ['huaweicloud_hook_check_artifacts', 'artifacts', null],
  ['huaweicloud_hook_check_artifacts', 'artifacts', 'not-an-array'],
  ['huaweicloud_hook_check_deploy_plan', 'plan', null],
  ['huaweicloud_hook_check_deploy_plan', 'plan', 12345],
];
for (const [tool, key, val] of cases) {
  let r;
  try { r = await callTool(tool, { [key]: val }); }
  catch (e) { r = { decision: 'deny', error: e.message }; }
  check('D4-17', `${tool}(${key}=${JSON.stringify(val)}) fail-closed=deny`, r?.decision, 'deny');
  // 熔断语义：必须带 invalid findings 提示，不得是空 allow
  const hasFinding = Array.isArray(r?.findings) && r.findings.length > 0;
  check('D4-17', `${tool}(${key}=${JSON.stringify(val)}) 带 invalid 提示(findings 非空)`, hasFinding, true);
}

console.log('\n=== D4-17 hook 畸形输入 fail-closed 探针结果 (v1.1.6) ===');
for (const line of lines) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);