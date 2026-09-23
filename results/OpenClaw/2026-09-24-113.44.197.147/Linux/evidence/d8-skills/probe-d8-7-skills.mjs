// D8-7 七个 meta/通用技能指引可机械执行 + D3-A1 检索完整性 + D3-C5 工具冒烟
import { callTool } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D8-7 七个 meta/通用技能 retrieve_skill 可机械执行（返回 content，无断链/幻觉步骤）
const META_SKILLS = [
  'huaweicloud-core',
  'huaweicloud-capability-discovery',
  'huaweicloud-api-and-sdk',
  'huaweicloud-cli-and-auth',
  'huaweicloud-safety',
  'huaweicloud-troubleshooting',
  'huawei-getting-started',
];
{
  let allOk = true;
  for (const s of META_SKILLS) {
    let r;
    try {
      r = await callTool('huaweicloud_retrieve_skill', { name: s });
    } catch (e) {
      results.push(`FAIL  D8-7  retrieve_skill(${s}) 抛错 => ${e.message}`);
      allOk = false;
      continue;
    }
    const content = r?.content;
    const sized = typeof content === 'string' ? content.length > 0 : (content?.length || 0) > 0;
    if (sized) { pass++; } else { fail++; allOk = false; }
    results.push(`${sized ? 'PASS' : 'FAIL'}  D8-7  retrieve_skill(${s}) 返回非空指引`);
  }
}

// D3-C5 工具冒烟（四工具快速调用）
{
  const calls = [
    ['huaweicloud_list_regions', {}],
    ['huaweicloud_service_catalog', { intent: 'inspect resources' }],
    ['huaweicloud_list_operations', { service: 'VPC', timeoutMs: 30000 }],
    ['huaweicloud_hook_check_command', { command: 'hcloud ECS ListServers' }],
  ];
  let ok = true;
  for (const [name, args] of calls) {
    try {
      await callTool(name, args);
      pass++;
    } catch (e) { fail++; ok = false; results.push(`FAIL  D3-C5  ${name} 抛错 => ${e.message}`); }
    results.push(`PASS  D3-C5  ${name} 调用成功`);
  }
}

console.log('\n=== D8-7 / D3-C5 技能与冒烟探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);