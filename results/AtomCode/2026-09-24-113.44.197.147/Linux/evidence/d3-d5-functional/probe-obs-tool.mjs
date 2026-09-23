// D5/D3 — 新增 OBS 静态网站托管工具 + 工具全集 40 探针（v1.1.4-next.6 新增）
import { TOOL_DEFINITIONS } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
const results = [];
const defs = Object.values(TOOL_DEFINITIONS);
function check(caseId, title, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

const names = defs.map((t) => t.name);
// 工具全量枚举 = TOOL_DEFINITIONS 注册源数量（设计断言为「= tools.mjs 注册源数量」，源已增至 40）
check('D5-3', 'TOOL_DEFINITIONS 工具总数 = 40', defs.length, 40);
check('D5-3', '工具名唯一', new Set(names).size, defs.length);

// 新增 OBS 静态网站托管工具
const obs = defs.find((t) => t.name === 'huaweicloud_obs_set_website_config');
check('D3-OBS', '新增 huaweicloud_obs_set_website_config 已注册', Boolean(obs), true);
if (obs) {
  check('D3-OBS', '输入 schema 含 bucket', Boolean(obs.inputSchema?.properties?.bucket), true);
  check('D3-OBS', '输入 schema 含 region', Boolean(obs.inputSchema?.properties?.region), true);
  check('D3-OBS', '输入 schema 含 action(set/get/delete)', Boolean(obs.inputSchema?.properties?.action), true);
}

console.log('\n=== D5/D3 新增 OBS 工具 + 工具全集探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);