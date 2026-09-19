// D2-2 auth status 判定准确性 + D2-10 R7 current 档跟随
import { callTool } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { resolveManagedProfile } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs';
import { readFileSync } from 'node:fs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D2-2 auth status 判定准确性：调用 huaweicloud_auth_status 返回结构化字段
{
  const r = await callTool('huaweicloud_auth_status', { target: 'openclaw' });
  check('D2-2', '返回 credentialsConfigured 布尔', typeof r?.credentialsConfigured, 'boolean');
  check('D2-2', '返回 kooCliInstalled 布尔', typeof r?.kooCliInstalled, 'boolean');
  check('D2-2', '返回 reconciled 对象', typeof r?.reconciled, 'object');
  check('D2-2', '返回 agents 对象', typeof r?.agents, 'object');
  results.push(`INFO  D2-2  credentialsConfigured=${r?.credentialsConfigured} kooCliInstalled=${r?.kooCliInstalled}`);
}

// D2-10 R7 current 档跟随：resolveManagedProfile 返回 KooCLI current profile 名
{
  const profile = resolveManagedProfile();
  check('D2-10', 'resolveManagedProfile 返回字符串(current)', typeof profile, 'string');
  results.push(`INFO  D2-10  resolved profile=${JSON.stringify(profile)}`);
  // runHcloudConfigure 带 --cli-profile= (源码级断言)
  const src = readFileSync('/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/auth/reconcile.mjs', 'utf8');
  check('D2-10', 'runHcloudConfigure 携带 --cli-profile=', /--cli-profile=/.test(src), true);
}

console.log('\n=== D2-2/D2-10 auth status/current 档探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);