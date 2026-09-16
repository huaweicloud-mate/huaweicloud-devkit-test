// D4-19 确认流下预检仍生效（Hermes Linux 2026-09-16）
// 验证：写操作进入确认流时，风险预检（safety-policy + hook risk 规则）仍生效拦截公开暴露/破坏性操作。
// ① 建最小安全组 ② 添加公网 22 端口规则 → 应被预检拦截（deny，拒绝暴露管理端口）
// ③ hook_check_command 破坏性删除 → warn 命中 ④ plan ECS 创建（确认流）→ 分类/预检字段生效 ⑤ 清理归零
import { pathToFileURL } from 'node:url';
const HDK = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);
const REGION = 'cn-north-4';
const redact = (v) => JSON.stringify(v).replace(/(HPUA|AKIA|ASIA)[A-Za-z0-9]{12,}/g, '$1***');

const out = [];
function rec(name, ok, d) { out.push({ name, ok, detail: redact(d).slice(0, 500) }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`); }
async function runWrite(args) {
  const plan = await callTool('huaweicloud_plan_cli_command', { args });
  const r = await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  return { plan, r };
}

const sgName = 'tctest-hermes-sg-pf-' + Date.now().toString(36).slice(-6);
let sgId = '';

try {
  // ① 建安全组
  const s1 = await runWrite(['VPC', 'CreateSecurityGroup/v3', '--cli-region=' + REGION, '--security_group.name=' + sgName]);
  const m1 = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(s1.r.stdout || '');
  sgId = m1 ? m1[1] : '';
  rec('① 创建安全组', !!sgId, { sgId });

  // ② 添加公网 22 端口规则（期望被预检拦截）
  let interceptMsg = '';
  try {
    const ruleArgs = ['VPC', 'CreateSecurityGroupRule/v3', '--cli-region=' + REGION, '--security_group_rule.direction=ingress', '--security_group_rule.security_group_id=' + sgId, '--security_group_rule.ethertype=IPv4', '--security_group_rule.protocol=tcp', '--security_group_rule.multiport=22', '--security_group_rule.remote_ip_prefix=0.0.0.0/0'];
    await runWrite(ruleArgs);
    interceptMsg = '';
  } catch (e) {
    interceptMsg = String(e.message || e);
  }
  const intercepted = /expose|public internet|admin|database port/i.test(interceptMsg);
  rec('② 预检拦截公开 22 端口规则', intercepted, { interceptMsg });

  // ③ hook_check_command 破坏性操作
  const hook = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --cli-region=cn-north-4 --servers.1.id=abc' });
  rec('③ hook 破坏性操作命中 warn', hook.decision === 'warn' && (hook.findings || []).length > 0, { decision: hook.decision, rules: (hook.findings || []).map((f) => f.ruleId) });

  // ④ plan ECS 创建（写操作确认流），确认 preflight 字段仍在（sgFindings + classification）
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--cli-region=' + REGION, '--server.count=1', '--server.name=tctest-pf-ecs', '--server.flavorRef=s6.small.1', '--server.imageRef=', '--server.security_groups.1.id=' + sgId] });
  rec('④ 确认流 plan 预检字段生效', plan.classification?.decision === 'deny' && Array.isArray(plan.sgFindings), { decision: plan.classification?.decision, risk: plan.classification?.risk, sgFindings: plan.sgFindings });
} catch (e) {
  rec('异常', false, e.message);
} finally {
  // ⑤ 归零
  try {
    if (sgId) { const d = await runWrite(['VPC', 'DeleteSecurityGroup/v3', '--cli-region=' + REGION, '--security_group_id=' + sgId]); rec('⑤ 删除安全组', d.r.ok === true, {}); }
    const list = await callTool('huaweicloud_run_readonly_command', { args: ['VPC', 'ListSecurityGroups/v3', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
    rec('⑤ 归零核实(不含本次 SG)', !(list.stdout || '').includes(sgName), {});
  } catch (e) { rec('清理异常', false, e.message); }
}

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), total: out.length, passed: out.filter((o) => o.ok).length, results: out }, null, 2));
process.exit(0);