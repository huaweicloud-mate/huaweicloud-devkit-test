// 技能 + 安全干预探针：D8 技能清单、D10 安全干预
import { listSkillDirs, callTool } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { loadPolicy } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { classifyTextCommand } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const SKILLS = '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/skills';

let pass = 0, fail = 0;
function eq(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { eq(id, desc, Boolean(cond), true); }

// D8-7 meta/通用技能可机械执行验证：7 个 meta 技能存在
{
  const dirs = listSkillDirs(SKILLS);
  console.log(`INFO   D8-7  skills(${dirs.length})`);
  const metaSkills = ['huawei-getting-started', 'huaweicloud-core', 'huaweicloud-cli-and-auth', 'huawei-sandbox', 'huaweicloud-safety', 'huawei-iam', 'huawei-ecs'];
  const found = metaSkills.filter((m) => dirs.includes(m));
  console.log(`INFO   D8-7  meta skills 命中 ${found.length}/${metaSkills.length}: ${found.join(',')}`);
  bool('D8-7', 'meta/通用技能 7 个全命中', found.length === metaSkills.length);
}
// D8-1 文档与能力一致：policy 加载与版本
{
  const p = loadPolicy();
  eq('D8-1', 'policy.json 有 version 字符串', typeof p.version, 'string');
  bool('D8-1', 'policy 含 secretKeyNamePatterns', Array.isArray(p.secretKeyNamePatterns) && p.secretKeyNamePatterns.length > 0);
}
// D10-4 安全干预有效性：危险命令被 deny
eq('D10-4', '凭证文件读取干预', classifyTextCommand('cat ~/.hcloud/config').decision, 'deny');
eq('D10-4', '明文 secret 读取干预', classifyTextCommand('hcloud csms GetSecretValue').decision, 'deny');
// D10-1 工具描述可选择性
{
  const { TOOL_DEFINITIONS } = await import('/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/tools.mjs');
  bool('D10-1', '39 工具均含非空 description', TOOL_DEFINITIONS.every((t) => typeof t.description === 'string' && t.description.length > 0));
}
// D10-2 skill 检索/激活：callTool retrieve_skill
{
  let has = false;
  try {
    const r = await callTool('huaweicloud_retrieve_skill', { name: 'huawei-getting-started' });
    console.log(`INFO   D10-2  retrieve_skill => ${JSON.stringify(r).slice(0, 180)}`);
    has = r !== undefined && r !== null;
  } catch (e) { console.log(`INFO   D10-2  retrieve_skill 异常 => ${e.message}`); }
  bool('D10-2', 'retrieve_skill 可调用且有返回值', has);
}

console.log(`TOTAL pass=${pass} fail=${fail}`);