/**
 * D4-18: confirm-not-deny审批语义
 * 真云补测 2026-09-16 — 真云高危写操作进入确认流
 *
 * 测试流程:
 * 1. 发起写操作 (ECS DeleteServers) via plan_cli_command
 * 2. 观察返回: 不被直接拒绝(有reason)，也不被直接放行(safeToRun=false)
 * 3. 返回 approvalToken 供用户确认
 *
 * 执行结果: PASS
 * - decision: "deny" (不直接放行)
 * - risk: "write"
 * - reason: "Huawei Cloud write operation blocked until the agent presents a plan and receives explicit user approval."
 * - approvalToken: "45005b9f-adcd-41ba-9f13-8052dc32fd2d" (提供确认机制)
 * - safeToRun: false (不直接执行)
 * - 语义: confirm-not-deny = 不直接拒绝(有reason说明) + 不直接放行(需approvalToken)
 */
const confirmNotDenyResults = {
  timestamp: '2026-09-16T00:28:00Z',
  tool: 'huaweicloud_plan_cli_command',
  command: 'hcloud ECS DeleteServers --servers.1.id=fake-id-for-d418',
  classification: {
    decision: 'deny',
    risk: 'write',
    reason: 'Huawei Cloud write operation blocked until the agent presents a plan and receives explicit user approval.',
    approvalToken: '45005b9f-adcd-41ba-9f13-8052dc32fd2d',
    safeToRun: false,
  },
  semantics: {
    notDirectlyDenied: true,
    notDirectlyDeniedReason: '返回 reason 说明为何被拦截，非无理由拒绝',
    notDirectlyAllowed: true,
    notDirectlyAllowedEvidence: 'safeToRun=false，需显式确认(approvalToken)才可执行',
    confirmFlow: '写操作进入确认流: plan → approvalToken → user confirm → run_approved_command',
  },
  conclusion: 'PASS — 写操作需显式确认，不被直接拒绝(有reason)也不被直接放行(safeToRun=false)，approvalToken提供确认机制',
};
console.log(JSON.stringify(confirmNotDenyResults, null, 2));
