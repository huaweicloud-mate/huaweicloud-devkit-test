// D1-39 / EXP-NR3-10 (Linux) 升级检测链可用性 —— Linux 侧负向断言
// Windows 专测 D1-39（npm.cmd EINVAL）；Linux 无 .cmd/EINVAL 语义，断言 queryDistTagsSync 真实可用。
import { queryDistTagsSync } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/update-check.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// 关键：Linux 下 spawnSync(NPM_BIN=['view',...]) 不得抛 EINVAL，应返回非 null dist-tags
const dist = queryDistTagsSync({ timeoutMs: 20000 });
check('D1-39', 'Linux queryDistTagsSync 返回非 null dist-tags', dist && typeof dist === 'object', true);
check('D1-39', 'dist-tags 含 latest', typeof dist?.latest, 'string');
check('D1-39', 'dist-tags 含 next (预发布通道)', typeof dist?.next, 'string');

console.log('\n=== D1-39 / EXP-NR3-10 (Linux) 升级检测链探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);