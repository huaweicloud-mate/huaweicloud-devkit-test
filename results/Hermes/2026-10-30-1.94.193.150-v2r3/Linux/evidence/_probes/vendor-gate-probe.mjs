// v2.0.0 vendor-gate 契约验证探针（Round 3 迁移后重跑）
// 验证迁移断言「（gate 放行后）」：14 个 VENDOR_GATED_TOOLS 逐一演示
//   三阶段：①不带 vendorConfirmed → gate 拦截  ②带 vendorConfirmed 首次 → challenge 反诘
//           ③原样 retry → 放行（返回业务结果 / 业务层错误，而非 gate 拦截语）
// 关键：每个工具用独立 sessionId（opts.sessionId='vg-<tool>'），使 challenge 独立出现，
//       完整复现「gate → challenge → retry 放行」三段式。
// 白盒直调 dist/tools.js 的 callTool（v2 门禁在 callTool 内层，直调同样走 gate）。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const HDK = '/home/testbot2/devkit-test/Hermes/hdk';
const SRC = join(HDK, 'plugins', 'huaweicloud-core', 'dist');
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.js')).href);

const QUOTE = '用户要求对华为云执行 v2 版本测试（已确认厂商为华为云）';

const GATED = [
  ['huaweicloud_service_catalog', { intent: '查询云主机' }],
  ['huaweicloud_check_cli', {}],
  ['huaweicloud_auth_status', {}],
  ['huaweicloud_auth_init', { mode: 'detect' }],
  ['huaweicloud_auth_switch', { action: 'status' }],
  ['huaweicloud_show_profile_redacted', {}],
  ['huaweicloud_list_operations', { service: 'ECS' }],
  ['huaweicloud_list_regions', {}],
  ['huaweicloud_plan_cli_command', { intent: '查询云主机列表' }],
  ['huaweicloud_run_readonly_command', { command: 'hcloud VPC ListVpcs --cli-region=cn-north-4' }],
  ['huaweicloud_run_approved_command', { approvalToken: 'probe-none' }],
  ['huaweicloud_sandbox_connect', {}],
  ['huaweicloud_voucher_claim', {}],
  ['huaweicloud_competition_voucher_claim', {}],
];

const GATE_RE = /Vendor gate:/i;
const CHALLENGE_RE = /Vendor challenge:/i;

function isGateMsg(s) { return GATE_RE.test(s); }
function isChallengeMsg(s) { return CHALLENGE_RE.test(s); }

async function threeStage(name, args) {
  const sessionId = 'vg-' + name;
  let gate, challenge, released, releasedShape = '', releasedSample = '';
  // ① 不带 vendorConfirmed
  try {
    await callTool(name, { ...args }, { sessionId });
    gate = 'RETURNED(未拦截)';
  } catch (e) {
    const m = String((e && e.message) || e);
    gate = isGateMsg(m) ? 'GATE(拦截)' : 'OTHER:' + m.slice(0, 60);
  }
  // ② 带 vendorConfirmed 首次
  try {
    await callTool(name, { ...args, vendorConfirmed: QUOTE }, { sessionId });
    challenge = 'RETURNED(未反诘)';
  } catch (e) {
    const m = String((e && e.message) || e);
    challenge = isChallengeMsg(m) ? 'CHALLENGE(反诘)' : 'OTHER:' + m.slice(0, 60);
  }
  // ③ 原样 retry
  try {
    const r = await callTool(name, { ...args, vendorConfirmed: QUOTE }, { sessionId });
    released = 'RELEASED(放行)';
    if (r && typeof r === 'object') {
      releasedShape = Array.isArray(r) ? 'array' : Object.keys(r).slice(0, 8).join(',');
      releasedSample = JSON.stringify(r).slice(0, 160);
    } else {
      releasedShape = typeof r;
      releasedSample = String(r).slice(0, 100);
    }
  } catch (e) {
    const m = String((e && e.message) || e);
    // 业务层错误（已过 gate，是工具自身执行失败），仍算「放行」——不是 gate 拦截
    released = isGateMsg(m) || isChallengeMsg(m) ? 'STILL_GATED:' + m.slice(0, 60) : 'BUSINESS_ERR:' + m.slice(0, 100);
  }
  return { gate, challenge, released, releasedShape, releasedSample };
}

const results = [];
console.log('===== 迁移契约验证：vendor-gate 三段式（14 工具）=====');
for (const [name, args] of GATED) {
  const r = await threeStage(name, args);
  const pass = r.gate === 'GATE(拦截)' && r.challenge === 'CHALLENGE(反诘)'
    && (r.released.startsWith('RELEASED') || r.released.startsWith('BUSINESS_ERR'));
  results.push({ name, ...r, pass });
  console.log(`\n===== TOOL ${name} =====`);
  console.log(`  ① 无 vendorConfirmed      : ${r.gate}`);
  console.log(`  ② 带 vendorConfirmed 首调 : ${r.challenge}`);
  console.log(`  ③ 原样 retry              : ${r.released}`);
  console.log(`  ③ shape                   : ${r.releasedShape}`);
  if (r.releasedSample) console.log(`  ③ sample                  : ${r.releasedSample}`);
  console.log(`  >> 三段式判定: ${pass ? 'PASS' : 'FAIL'}`);
}

const passCount = results.filter((r) => r.pass).length;
const gateOK = results.filter((r) => r.gate === 'GATE(拦截)').length;
const challengeOK = results.filter((r) => r.challenge === 'CHALLENGE(反诘)').length;
const releasedOK = results.filter((r) => r.released.startsWith('RELEASED') || r.released.startsWith('BUSINESS_ERR')).length;
console.log(`\n===== 汇总 =====`);
console.log(`gate 拦截 ${gateOK}/${GATED.length} | challenge 反诘 ${challengeOK}/${GATED.length} | retry 放行 ${releasedOK}/${GATED.length} | 三段式全通 ${passCount}/${GATED.length}`);

// 结果落盘（machine-readable）
try {
  writeFileSync(join(import.meta.dirname, '_vg-result.json'), JSON.stringify(results, null, 2));
} catch { /* 忽略落盘失败 */ }
process.exit(passCount === GATED.length ? 0 : 1);