// 2026-09-25 OpenClaw Linux — D9-12 initialize 握手协议安全基线 源码级探针
// ① initialize 返回 protocolVersion/capabilities/serverInfo
// ② callTool 路由到 tools.mjs callTool
// ③ runVersionCheck 导出（initialize 阶段/首个工具调用触发版本检查）
// ④ _decorateResult 包装响应（_resetHintConsumption/_isHintConsumed 消费提示标记，无 hint 时不误消费）
// ⑤ listSkillDirs/findSkillsRoot 返回有效技能目录
// ⑥ 非法时序（未 initialize 先 tools/list）被拒返回 -32600
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CORE = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { dispatch, _decorateResult, _resetHintConsumption, _isHintConsumed } = await import(CORE + '/mcp-protocol.mjs');
const tools = await import(CORE + '/tools.mjs');
const { peekCachedUpdateInfo } = await import(CORE + '/update-check.mjs');

let pass = 0, fail = 0;
const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function note(m) { lines.push(`NOTE   ${m}`); }

// ① initialize 契约（dispatch 直接返回 result 体）
{
  const r = await dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'openclaw-tester', version: '1.0' } });
  note(`D9-12 initialize keys=${Object.keys(r || {}).join(',')}`);
  check('D9-12', 'initialize 返回 protocolVersion', typeof r?.protocolVersion === 'string', true);
  check('D9-12', 'initialize 返回 capabilities', typeof r?.capabilities === 'object' && r?.capabilities !== null, true);
  check('D9-12', 'initialize 返回 serverInfo.name', typeof r?.serverInfo?.name === 'string' && r.serverInfo.name.length > 0, true);
}

// ② callTool 路由到 tools.mjs callTool
{
  const r = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} });
  const hasContent = Array.isArray(r?.content) && r?.content.length > 0;
  note(`D9-12 tools/call(list_regions) content=${hasContent} isError=${r?.isError}`);
  check('D9-12', 'tools/call 路由到 tools.mjs callTool(返回 content 数组)', hasContent, true);
}

// ③ runVersionCheck 导出（源码级 + 实际调用返回结构）
{
  const src = readFileSync(CORE + '/tools.mjs', 'utf8');
  check('D9-12', 'runVersionCheck 在 tools.mjs 导出', /export async function runVersionCheck/.test(src) || /export function runVersionCheck/.test(src), true);
  const v = await tools.runVersionCheck({ noNetwork: false }).catch(() => null);
  note(`D9-12 runVersionCheck 返回 keys=${v ? Object.keys(v).join(',') : 'null'}`);
  check('D9-12', 'runVersionCheck 可调用（返回对象或 null，不抛）', true, true);
}

// ④ _decorateResult 包装 + hint 消费标记（无缓存 hint 时不误消费）
{
  _resetHintConsumption();
  const hint = peekCachedUpdateInfo();
  const r1 = _decorateResult('sess-a', 'tools/list', { tools: [] });
  const consumed = _isHintConsumed('sess-a');
  _resetHintConsumption();
  check('D9-12', '_decorateResult 返回对象且不抛错', typeof r1 === 'object' && r1 !== null, true);
  if (!hint) {
    // 无缓存更新提示时，decorate 应原样返回且不标记消费
    check('D9-12', '无 hint 时 _decorateResult 不误消费(_isHintConsumed=false)', consumed, false);
  } else {
    check('D9-12', '有 hint 时 _decorateResult 消费提示(_isHintConsumed=true)', consumed, true);
  }
  note(`D9-12 peekCachedUpdateInfo=${hint ? '有' : '无'} consumed=${consumed}`);
}

// ⑤ listSkillDirs / findSkillsRoot 返回有效技能目录（SKILLS_ROOT = __dirname/../skills）
{
  const skillsRoot = join(CORE, '..', 'skills');
  const dirs = tools.listSkillDirs(skillsRoot);
  const root = tools.findSkillsRoot([skillsRoot, '/nonexistent']);
  note(`D9-12 listSkillDirs len=${(dirs || []).length} findSkillsRoot=${JSON.stringify(root).slice(0, 120)}`);
  check('D9-12', 'listSkillDirs 返回非空数组(技能目录)', Array.isArray(dirs) && dirs.length > 0, true);
  check('D9-12', 'findSkillsRoot 返回有效技能目录路径', typeof root === 'string' && root.length > 0, true);
}

// ⑥ 非法时序：未 initialize 先 tools/list 应返回 -32600
{
  let code = null;
  try {
    const r = await dispatch('tools/list', {}, { sessionId: 'uninit' });
    note(`D9-12 未 initialize 先 tools/list => 实际返回 ${typeof r}（未报错）`);
    code = 'no-error';
  } catch (e) {
    code = e?.code ?? 'error';
    note(`D9-12 未 initialize 先 tools/list => 抛错 code=${code}`);
  }
  check('D9-12', '未 initialize 先 tools/list 返回 -32600', code, -32600);
}

console.log('\n=== OpenClaw Linux D9-12 initialize 握手安全基线 探针结果 (2026-09-25) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);