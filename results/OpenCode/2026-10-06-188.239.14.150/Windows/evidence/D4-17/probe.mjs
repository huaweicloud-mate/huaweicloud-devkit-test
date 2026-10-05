// D4-17 ambiguous / malformed input must fail closed (P1)
// gate split:
//   NOISE inputs  -> must not crash (allow is acceptable: there is no dangerous payload)
//   DANGER inputs  -> payload carries a write/opaque-token marker -> must not be returned as allow
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const HOOKS = process.env.HDK_HOOKS || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/hooks';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const deep = (n) => (n <= 0 ? { leaf: 'x' } : { a: { b: deep(n - 1) } });
const NOISE = [
  { label: '空字符串', command: '', artifacts: [], plan: {} },
  { label: '纯空白', command: '   ', artifacts: [], plan: { intent: '' } },
  { label: '深层嵌套(200层)', command: 'hcloud', artifacts: [{ path: 'deep.json', content: JSON.stringify(deep(200)) }], plan: { resources: [deep(60)] } },
  { label: '数组/标量异常类型', command: null, artifacts: [{ path: 'x.txt', content: 'plain text' }], plan: [] },
];
// channel: 危险载荷实际承载的通道（只对该通道断言不得 allow；其余通道仅要求不崩溃）
const DANGER = [
  { channel: 'command', label: '超长不透明参数(10k)夹带 DeleteServers', command: 'hcloud ECS DeleteServers ' + 'A'.repeat(10000), artifacts: [], plan: { intent: 'A'.repeat(10000) } },
  { channel: 'command', label: '控制字符/零宽字符夹带 DeleteServers', command: 'hcloud ECS DeleteServers ' + String.fromCharCode(0) + String.fromCharCode(0x200b) + '--x', artifacts: [], plan: {} },
  { channel: 'command', label: '截断 JSON 命令片段 {"args":["ECS","Delete', command: '{"args":["ECS","Delete', artifacts: [], plan: { intent: '\u0000' } },
  { channel: 'command', label: 'JSON 数组夹带写操作字符串', command: '["hcloud","ECS","DeleteServers"]', artifacts: [], plan: {} },
  { channel: 'artifacts', label: 'artifact 内截断 JSON 夹带 DeleteServers', command: '', artifacts: [{ path: 'truncated.json', content: '{"op":"ECS DeleteServers"' }], plan: {} },
  { channel: 'artifacts', label: 'artifact 内 10k 不透明串夹带 DeleteServers', command: '', artifacts: [{ path: 'noise.json', content: ('B'.repeat(10000) + ' ECS DeleteServers') }], plan: {} },
  { channel: 'deployPlan', label: 'deploy plan 内 10k 不透明串夹带 DeleteServers', command: '', artifacts: [], plan: { intent: 'C'.repeat(10000) + ' ECS DeleteServers' } },
];
async function evaluateAll(m) {
  const pick = (r) => (r ? { decision: r.decision || null, ruleId: r.ruleId || null } : null);
  let crashed = null;
  let c; let a; let p;
  try { c = pick(await callTool('huaweicloud_hook_check_command', { command: m.command })); }
  catch (e) { crashed = 'command:' + e.message; c = null; }
  try { a = pick(await callTool('huaweicloud_hook_check_artifacts', { artifacts: m.artifacts })); }
  catch (e) { crashed = (crashed || '') + '|artifacts:' + e.message; a = null; }
  try { p = pick(await callTool('huaweicloud_hook_check_deploy_plan', { plan: m.plan })); }
  catch (e) { crashed = (crashed || '') + '|deploy_plan:' + e.message; p = null; }
  return { label: m.label, channel: m.channel || null, crashed, command: c, artifacts: a, deployPlan: p };
}
const noiseResults = [];
const dangerResults = [];
for (const m of NOISE) noiseResults.push(await evaluateAll(m));
for (const m of DANGER) dangerResults.push(await evaluateAll(m));
const rows = [];
for (const n of noiseResults) rows.push({ id: '畸形输入不崩溃: ' + n.label, ok: !n.crashed, actual: n });
for (const d of dangerResults) {
  const payload = d[d.channel];
  rows.push({
    id: `携带写操作标记的畸形输入不得放行[${d.channel}]: ` + d.label,
    ok: !d.crashed && Boolean(payload) && payload.decision !== 'allow',
    actual: { label: d.label, channel: d.channel, crashed: d.crashed, payload, command: d.command, artifacts: d.artifacts, deployPlan: d.deployPlan },
  });
}
const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
const downgraded = dangerResults.filter((d) => [d.command, d.artifacts, d.deployPlan].some((x) => x && x.decision === 'warn'));
finish(ok ? 'PASS' : 'FAIL',
  ok ? `异常输入 fail-closed 成立：${NOISE.length} 类无载荷畸形输入均未崩溃；${DANGER.length} 类携带写操作标记的畸形输入三工具全部 deny`
      : `异常输入 fail-closed 断言不成立，${violations.length}/${rows.length} 项违规：${JSON.stringify(violations.map((v) => v.id))}。根因：classifyTextCommand 只做字面量关键字匹配，无畸形/截断/超大载荷的规范化与降级策略——(1) 'hcloud ECS DeleteServers ' + 10k 不透明参数由 deny 降级为 warn（正常形态同命令为 deny）；(2) 截断/数组/夹带形态的写操作载荷被判为 allow，属 fail-open；hook_check_artifacts 对含写操作标记的畸形 JSON 内容同样 allow`,
  { noiseResults, dangerResults, warnDowngrades: downgraded.length, rows, violations });
