// D4-6 adminPass 回显警告 —— 明文字段是否被脱敏
import { callTool } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// 等号形式 --adminPass=xxx 应脱敏
{
  const r = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--adminPass=Secret123', '--server.flavorRef=f', '--server.imageRef=i', '--server.nics.1.subnet_id=s'] });
  check('D4-6', '警告触发(等号形式)', (r.warnings || []).some((w) => /password|secret/i.test(w)), true);
  check('D4-6', '等号形式 adminPass 值脱敏', r.args.includes('Secret123'), false);
  check('D4-6', '等号形式 args 含 <redacted>', r.args.some((a) => String(a).includes('<redacted>')), true);
}

// 空格形式 --adminPass xxx 应脱敏（缺陷探测）
{
  const r = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--adminPass', 'Secret123', '--server.flavorRef=f', '--server.imageRef=i', '--server.nics.1.subnet_id=s'] });
  check('D4-6', '警告触发(空格形式)', (r.warnings || []).some((w) => /password|secret/i.test(w)), true);
  // 预期：明文 Secret123 不应出现在 returned args 中
  check('D4-6', '空格形式 adminPass 值脱敏', r.args.includes('Secret123'), false);
}

console.log('\n=== D4-6 adminPass 回显脱敏探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);