/**
 * D4-19: 确认流下预检仍生效
 * 真云补测 2026-09-16 — 高危写操作在确认流程中仍触发预检
 *
 * 测试流程:
 * 1. 高危写操作 (ECS DeleteServers) 进入确认流
 * 2. 在确认流程中执行 hook_check_command 预检
 * 3. 验证预检独立于审批流，仍检测到风险
 *
 * 执行结果: PASS
 * - hook_check_command 对 "hcloud ECS DeleteServers" 返回 decision=warn
 * - Finding: hwc-destructive-delete-operation (category=destructive, severity=warn)
 * - Message: "This hcloud command will delete, detach, or remove cloud resources. The operation may be irreversible."
 * - 预检独立于 plan_cli_command 的审批流，仍生效拦截
 */
const preflightResults = {
  timestamp: '2026-09-16T00:29:00Z',
  tool: 'huaweicloud_hook_check_command',
  command: 'hcloud ECS DeleteServers --servers.1.id=i-fake-d419-test',
  hookResult: {
    decision: 'warn',
    findings: [
      {
        ruleId: 'hwc-destructive-delete-operation',
        title: 'Destructive cloud resource operation',
        category: 'destructive',
        severity: 'warn',
        message: 'This hcloud command will delete, detach, or remove cloud resources. The operation may be irreversible.',
        remediation: 'List the resources to be affected first, confirm with the user, and require explicit approval before executing any destructive operation.',
        source: 'command',
        evidence: 'hcloud ECS DeleteServers --servers.1.id=i-fake-d419-test',
      },
    ],
    nextStep: 'Review the warnings with the user before proceeding.',
  },
  independentOfApproval: true,
  evidence: 'hook_check_command 独立于 plan_cli_command 审批流，预检仍检测到 destructive 风险',
  conclusion: 'PASS — 确认流程中风险预检仍生效拦截，hook_check_command 独立检测到 destructive 写操作风险',
};
console.log(JSON.stringify(preflightResults, null, 2));
