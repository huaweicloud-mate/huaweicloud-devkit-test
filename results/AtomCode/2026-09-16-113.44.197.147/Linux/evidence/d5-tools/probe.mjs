// 工具/能力/技能探针：TOOL_DEFINITIONS 枚举 + callTool 调用 + detectFramework + listSkillDirs
import { TOOL_DEFINITIONS, callTool, listSkillDirs } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { detectFramework } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/detect-framework.mjs';

const SKILLS = '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/skills';

let pass = 0, fail = 0;
function eq(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { eq(id, desc, Boolean(cond), true); }

// D5-3 工具全量枚举
eq('D5-3', '工具全集数量 = 40', TOOL_DEFINITIONS.length, 40);
bool('D5-3', '含 huaweicloud_hook_check_command', TOOL_DEFINITIONS.some((t) => t.name === 'huaweicloud_hook_check_command'));
bool('D5-3', '含 huaweicloud_auth_status', TOOL_DEFINITIONS.some((t) => t.name === 'huaweicloud_auth_status'));
bool('D5-3', '含 huaweicloud_list_operations', TOOL_DEFINITIONS.some((t) => t.name === 'huaweicloud_list_operations'));
// D5-1 清单发现加载：callTool list_operations
{
  let r;
  try { r = await callTool('huaweicloud_list_operations', { service: 'ecs' }); } catch (e) { r = { error: e.message }; }
  console.log(`INFO   D5-1  list_operations('ecs') => ${JSON.stringify(r).slice(0, 220)}`);
  bool('D5-1', 'list_operations 返回 command+selectionRule+examples', r && typeof r.command === 'string' && typeof r.selectionRule === 'string' && r.examples && typeof r.examples === 'object');
}
// D3-B1 list_operations 规范名：服务名大小写/别名
{
  let r;
  try { r = await callTool('huaweicloud_list_operations', { service: 'ECS' }); } catch (e) { r = { error: e.message }; }
  console.log(`INFO   D3-B1  list_operations('ECS') => ${JSON.stringify(r).slice(0, 200)}`);
  bool('D3-B1', 'list_operations 大小写不敏感不抛致命错误', r !== undefined && !r.error);
}
// D3-B5 detect_framework 识别（负向：非框架目录 → null；正向：vue 依赖 → ok:true）
{
  const neg = await detectFramework('/home/testbot1/devkit-test/AtomCode/test');
  console.log(`INFO   D3-B5  负向 detectFramework(无框架) => ${JSON.stringify(neg)}`);
  bool('D3-B5', 'detectFramework 非框架目录返回 null', neg === null);

  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const d = mkdtempSync(join(tmpdir(), 'hdk-fw-'));
  writeFileSync(join(d, 'package.json'), JSON.stringify({ dependencies: { next: '^14.0.0' } }));
  writeFileSync(join(d, 'next.config.js'), 'module.exports = {};');
  const pos = await detectFramework(d);
  console.log(`INFO   D3-B5  正向 detectFramework(next) => ${JSON.stringify(pos).slice(0, 160)}`);
  bool('D3-B5', 'detectFramework 正确识别 Next.js 框架', pos && pos.framework === 'Next.js');
}
// D3-A1 skill 检索完整性：listSkillDirs(真实 skills 根)
{
  const dirs = listSkillDirs(SKILLS);
  console.log(`INFO   D3-A1  listSkillDirs => ${JSON.stringify(dirs).slice(0, 300)}`);
  bool('D3-A1', 'listSkillDirs 返回非空技能数组', Array.isArray(dirs) && dirs.length > 0);
}

console.log(`TOTAL pass=${pass} fail=${fail}`);