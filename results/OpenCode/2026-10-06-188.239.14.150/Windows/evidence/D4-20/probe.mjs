// D4-20 reject path must execute zero operations (P1, real cloud snapshot comparison)
const CASE = process.env.PROBE_CASE;
const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const HOOKS = process.env.HDK_HOOKS || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/hooks';
import { writeFileSync, readFileSync, existsSync, rmSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

async function snapshot() {
  const snap = {};
  try {
    const ecs = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails'], timeoutMs: 120000 });
    const s1 = JSON.stringify(ecs);
    snap.ecsIds = Array.from(new Set((s1.match(/"id"\s*:\s*"[^"]+"/g) || []).map((x) => x.replace(/.*:\s*"|"$/g, '')))).sort();
    snap.ecsCount = snap.ecsIds.length;
  } catch (e) { snap.ecsError = String(e.message).slice(0, 200); }
  try {
    const vpc = await callTool('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs'], timeoutMs: 120000 });
    const s2 = JSON.stringify(vpc);
    snap.vpcIds = Array.from(new Set((s2.match(/"id"\s*:\s*"[^"]+"/g) || []).map((x) => x.replace(/.*:\s*"|"$/g, '')))).sort();
    snap.vpcCount = snap.vpcIds.length;
  } catch (e) { snap.vpcError = String(e.message).slice(0, 200); }
  return snap;
}
import { createHash } from 'node:crypto';
function require$hash(s) { return createHash('sha256').update(String(s)).digest('hex'); }

const before = await snapshot();
const BOGUS_VPC = '00000000-0000-0000-0000-000000000000';
const planArgs = ['VPC', 'DeleteVpc', '--vpc_id=' + BOGUS_VPC];
const plan = await callTool('huaweicloud_plan_cli_command', { args: planArgs });
// 拒绝路径：用户明确拒绝 -> 只保留 plan 产物，不调用任何执行类工具
const tokenIssued = typeof plan.approvalToken === 'string' && plan.approvalToken.length > 0;
const afterReject = await snapshot();

// 负向对照 1：未标记用户批准时执行必须被拒
let noApprovalError = null;
try { await callTool('huaweicloud_run_approved_command', { args: planArgs, approvalToken: plan.approvalToken, approvedByUser: false }); }
catch (e) { noApprovalError = String(e.message).slice(0, 200); }
// 负向对照 2：伪造 token 不得执行
let fakeToken = null;
try { fakeToken = await callTool('huaweicloud_run_approved_command', { args: planArgs, approvalToken: '00000000-0000-0000-0000-000000000000', approvedByUser: true }); }
catch (e) { fakeToken = { error: String(e.message).slice(0, 200) }; }
const afterNegative = await snapshot();

const rows = [
  { id: 'plan 阶段签发 approvalToken 且 safeToRun=false', ok: tokenIssued && plan.safeToRun === false, actual: { tokenIssued, safeToRun: plan.safeToRun, decision: plan.classification && plan.classification.decision } },
  { id: '拒绝前后 ECS 实例身份集合一致(零执行)', ok: JSON.stringify(before.ecsIds || []) === JSON.stringify(afterReject.ecsIds || []), actual: { before: before.ecsIds, after: afterReject.ecsIds } },
  { id: '拒绝前后 VPC 身份集合一致(零执行)', ok: JSON.stringify(before.vpcIds || []) === JSON.stringify(afterReject.vpcIds || []), actual: { beforeCount: before.vpcCount, afterCount: afterReject.vpcCount, before: before.vpcIds, after: afterReject.vpcIds } },
  { id: 'approvedByUser=false 时执行被拒', ok: Boolean(noApprovalError), actual: noApprovalError },
  { id: '伪造 approvalToken 执行被拒且零副作用', ok: Boolean(fakeToken) && (fakeToken.status === 'rejected' || fakeToken.error) && JSON.stringify(before.vpcIds || []) === JSON.stringify(afterNegative.vpcIds || []), actual: { fakeToken, vpcBefore: before.vpcIds, vpcAfter: afterNegative.vpcIds } },
];

const violations = rows.filter((x) => !x.ok);
const ok = violations.length === 0;
finish(ok ? 'PASS' : 'FAIL',
  ok ? '拒绝路径零执行成立：plan 阶段仅产出计划与 approvalToken，用户拒绝后 ECS/VPC 资源身份集合完全一致；approvedByUser=false 与伪造 token 两条负向路径均被拒且无副作用'
      : `拒绝路径零执行断言不成立：${JSON.stringify(violations.map((v) => v.id))}`,
  { bogusVpc: BOGUS_VPC, before, afterReject, afterNegative, fakeToken, noApprovalError, rows, violations });
