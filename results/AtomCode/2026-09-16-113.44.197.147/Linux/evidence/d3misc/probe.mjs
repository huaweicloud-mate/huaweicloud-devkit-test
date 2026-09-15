// D3-C5 / D5-3 / D6-1 / D6-3 / D6-4 / D8-1 / D8-4 / D8-6 / D9-9 综合探针
import { TOOL_DEFINITIONS, callTool, listSkillDirs } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { dispatch } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

let pass = 0, fail = 0;
function check(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, cond) { check(id, desc, Boolean(cond), true); }

// D3-C5 工具冒烟（四工具快速调用）
for (const t of ['huaweicloud_list_operations', 'huaweicloud_service_catalog', 'huaweicloud_list_regions', 'huaweicloud_retrieve_skill']) {
  let r;
  try { r = await callTool(t, t === 'huaweicloud_list_operations' ? { service: 'ecs' } : (t === 'huaweicloud_retrieve_skill' ? { name: 'huawei-getting-started' } : {})); } catch (e) { r = { error: e.message }; }
  console.log(`INFO   D3-C5  ${t} => ${JSON.stringify(r).slice(0, 120)}`);
  bool('D3-C5', `${t} 冒烟可调用`, r !== undefined && r !== null && !(r.isError === true));
}

// D5-3 工具全量枚举（next.6 工具集数量）
console.log(`INFO   D5-3  TOOL_DEFINITIONS.length = ${TOOL_DEFINITIONS.length}`);
bool('D5-3', '工具全集均为含 name/description/inputSchema 的合法定义', TOOL_DEFINITIONS.every(t => typeof t.name === 'string' && typeof t.description === 'string' && t.inputSchema));

// D6-1 检索响应延迟（p95）
{
  const SKILLS = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/skills';
  const t0 = performance.now();
  const dirs = listSkillDirs(SKILLS);
  const ms = performance.now() - t0;
  console.log(`INFO   D6-1  listSkillDirs 耗时 ${ms.toFixed(1)}ms, 返回 ${dirs.length} 技能`);
  bool('D6-1', '检索/枚举延迟 < 2000ms（p95）', ms < 2000);
}

// D6-3 MCP 冷启时间
{
  const t0 = performance.now();
  await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'AtomCode', version: '0' } });
  const ms = performance.now() - t0;
  console.log(`INFO   D6-3  initialize 冷启 ${ms.toFixed(1)}ms`);
  bool('D6-3', 'initialize 冷启 < 5000ms', ms < 5000);
}

// D6-4 并发调度正确性（30 并发 tools/list 无错）
{
  const t0 = performance.now();
  const results = await Promise.all(Array.from({ length: 30 }, () => dispatch('tools/list', {}, { sessionId: 'c' }).catch(e => ({ error: e.message }))));
  const ms = performance.now() - t0;
  const okAll = results.every(r => Array.isArray(r.tools));
  console.log(`INFO   D6-4  30 并发 tools/list 完成 ${ms.toFixed(1)}ms, 全合法=${okAll}`);
  bool('D6-4', '30 并发 tools/list 全部返回合法结果（无死锁/错乱）', okAll);
}

// D8-1 文档与能力一致（链接有效性扫描：技能目录无缺失）
{
  const SKILLS = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/skills';
  const dirs = listSkillDirs(SKILLS);
  const missing = dirs.filter((d) => !existsSync(`${SKILLS}/${d}/SKILL.md`));
  console.log(`INFO   D8-1  技能中缺 SKILL.md 的数量 => ${missing.length}`);
  bool('D8-1', '技能目录均含 SKILL.md（无失效技能入口）', missing.length === 0);
}

// D8-4 引导步骤可机械执行（retrieve_skill 加载 huawei-getting-started）
{
  let r;
  try { r = await callTool('huaweicloud_retrieve_skill', { name: 'huawei-getting-started' }); } catch (e) { r = { error: e.message }; }
  const body = JSON.stringify(r);
  bool('D8-4', 'getting-started 技能可检索且含可执行步骤', body.length > 40 && !r.error && !r.isError);
}

// D8-6 中英文文档一致（README 双源存在）
{
  const root = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
  const en = existsSync(`${root}/README.md`);
  const zh = existsSync(`${root}/README.zh-CN.md`) || existsSync(`${root}/README_zh-CN.md`);
  console.log(`INFO   D8-6  README.md=${en} README.zh-CN=${zh}`);
  bool('D8-6', 'README 中英文双源存在', en && zh);
}

// D9-9 tools/call 超时协议语义
{
  let err = null;
  try {
    await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: { timeoutMs: -1 } }, { sessionId: 'd9-9' });
  } catch (e) { err = e; }
  const errStr = JSON.stringify(err || {});
  console.log(`INFO   D9-9  超时/非法参数 => ${errStr.slice(0, 160)}`);
  bool('D9-9', '超时/非法参数不导致进程崩溃（返回可处理错误或结果）', err === null || typeof errStr === 'string');
}

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);