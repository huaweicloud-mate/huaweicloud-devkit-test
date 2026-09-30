// D4-16 命令包裹穿透 聚焦探针 — Hermes/Linux/1.1.8-next.1 (ffd7b47)
// 执行: HDK_PLUGIN_SRC=<plugin-src> node D4-16/probe.mjs
const HDK = process.env.HDK_PLUGIN_SRC || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const { classifyTextCommand } = await import(`file://${HDK}/src/safety-policy.mjs`);
const tests = [
  ['sh -c "hcloud ecs DeleteServer"', 'deny'],
  ["bash -c 'hcloud ecs DeleteServer'", 'deny'],
  ['eval "hcloud ecs DeleteServer"', 'deny'],
  ['$(hcloud ecs DeleteServer)', 'deny'],
];
let blocked = 0;
for (const [cmd, exp] of tests) {
  let got; try { got = classifyTextCommand(cmd).decision; } catch (e) { got = 'THROW:' + e.message; }
  const ok = got === exp;
  if (ok) blocked++;
  console.log(`  ${cmd} -> ${got} (exp ${exp}) ${ok ? '' : '<<<MISMATCH'}`);
}
const status = blocked === tests.length ? 'PASS' : 'FAIL';
console.log(`=== D4-16 命令包裹穿透 ===  ${status}`);
console.log(`  expected: sh/bash/eval/$() 包裹均检测内层写操作 | actual: ${blocked}/${tests.length} 拦截`);
console.log(`RESULT: ${status} ${blocked}/${tests.length} 拦截`);
