import { mcpTool, writeEvidence, writeProbe, VC_QUOTE } from './lib.mjs';
const cases = [];
cases.push({ id: 'D4-4', title: '四类写操作预检 deny', fn: async () => {
  const cmds = [['ECS','CreateServers'],['VPC','DeleteVpc','--vpc_id=abc'],['RDS','DeleteInstance','--instance_id=abc'],['EIP','DeletePublicip','--publicip_id=abc']];
  const out = [];
  for (const a of cmds) { const r = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: a, allowWrites: false }, 45000); const p = r.parsed || {}; out.push({ cmd: a.join(' '), decision: p.classification && p.classification.decision, safeToRun: p.safeToRun, token: !!p.approvalToken }); }
  const ok = out.every((x) => x.decision === 'deny' && x.safeToRun === false && x.token);
  return { status: ok ? 'PASS' : 'FAIL', why: '四类写操作均 deny+safeToRun=false+approvalToken：' + out.map((x) => x.cmd + '=' + x.decision).join(', '), result: out };
} });
const blk = [
  ['D3-C3','沙箱部署 E2E','2026-11-22 05:57 实测 huaweicloud_sandbox_check_user 返回 ok=false（无会话体），本机无 DevStation 沙箱 workspace 配额/登录态','影响：sandbox upload/deploy_nginx 部署链路无法真实执行','解除条件：提供沙箱配额与已签署协议的有效会话'],
  ['D3-C6','沙箱 7 隐式工具','同上，本机无沙箱会话','影响：sandbox_deploy_check/expose_tunnel 等 7 工具无法实测','解除条件：提供 DevStation 沙箱会话'],
  ['D3-S3','沙箱预览出 URL','同上，本机无沙箱会话，expose_tunnel 无法建立','影响：公网预览 URL 无法验证','解除条件：提供沙箱 workspace 与隧道配额'],
  ['D3-S7','跨服务 Web+RDS 并归零','本次窗口已真机完成 VPC/ECS/OBS 建删，RDS 实例创建需 10-20 分钟且需部署目标；未在窗口内完成','影响：RDS+Web 多服务编排与连接串注入未端到端验证','解除条件：预留 30 分钟 RDS 建删窗口 + 沙箱/ECS 部署目标'],
  ['D4-11','提示注入防护','需真实 LLM Agent 读取工具返回后行为判定，本客户端无 dsh headless / LLM harness','影响：无法判定 Agent 是否执行注入指令','解除条件：提供 Agent 会话自动化（CDP）或 LLM harness 环境'],
];
for (const [id, title, why, impact, fix] of blk) cases.push({ id, title, status: 'BLOCKED', why: why + '；' + impact + '；' + fix, result: { blockedReason: why + '；' + impact + '；' + fix } });
for (const c of cases) {
  let r;
  if (c.fn) { try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: {} }; } }
  else r = { status: c.status, why: c.why, result: c.result };
  writeEvidence(c.id, r); if (c.fn) { try { writeProbe(c.id, c.title, c.fn); } catch {} }
  console.log(c.id.padEnd(8), r.status.padEnd(8), '|', String(r.why || '').slice(0, 200));
}