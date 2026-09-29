import { callTool } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';
// hook 三工具 畸形输入 fail-closed 检查
const cases = [
  ['hook_check_command', 'command', null],
  ['hook_check_command', 'command', ''],
  ['hook_check_artifacts', 'artifacts', null],
  ['hook_check_artifacts', 'artifacts', 'not-an-array'],
  ['hook_check_deploy_plan', 'plan', null],
  ['hook_check_deploy_plan', 'plan', 12345],
];
for (const [tool, key, val] of cases) {
  let r;
  try { r = await callTool('huaweicloud_' + tool, { [key]: val }); }
  catch (e) { r = 'THROW:' + e.message; }
  console.log(`${tool}(${key}=${JSON.stringify(val)}) =>`, JSON.stringify(r));
}
