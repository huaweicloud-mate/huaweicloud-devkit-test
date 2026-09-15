/**
 * D4-13: 最小权限凭证通过率
 * 真云补测 2026-09-16 — 使用只读子账号 test001 (credentials.readonly.json) 实测
 *
 * 测试方法:
 * 1. 通过 python scripts/run-as-readonly.py 注入 HW_ACCESS_KEY/HW_SECRET_KEY env
 * 2. 只读命令（ECS/VPC/IAM/RDS/CTS/CES/ELB list/show）应 100% 可用
 * 3. 写命令 plan_cli_command 应正确分类为 deny/write/safeToRun=false
 * 4. CTS 审计追踪证实 test001 写操作被 IAM 403 PolicyNotAuthorized 拒绝
 *
 * 执行结果: PASS
 * - 只读命令 7/7 成功 (ECS ListServersDetails, VPC ListVpcs, IAM KeystoneListUsers,
 *   RDS ListInstances, CTS ListTraces, CES ListMetrics, ELB ListLoadBalancers)
 * - 写命令分类: VPC CreateVpc → decision=deny, risk=write, safeToRun=false
 * - CTS 证实: test001 createVpc 返回 403 VPC.0010 PolicyNotAuthorized
 * - OBS ls 失败(403 InvalidAccessKeyId) — 预期行为：OBS 使用独立凭证存储(obsutilconfig)，
 *   不读 HW_ACCESS_KEY env，不影响 hcloud 只读通过率
 */
const readonlyResults = {
  timestamp: '2026-09-16T00:23:00Z',
  method: 'python scripts/run-as-readonly.py hcloud <Service> <ReadOp>',
  credential: 'test001 (readonly subaccount, credentials.readonly.json)',
  region: 'cn-north-4',
  readOnlyTests: [
    { service: 'ECS', operation: 'ListServersDetails', result: 'PASS', detail: 'count=0, servers=[]' },
    { service: 'VPC', operation: 'ListVpcs', result: 'PASS', detail: '2 existing VPCs returned' },
    { service: 'IAM', operation: 'KeystoneListUsers', result: 'PASS', detail: '2 users: hw018619646 + test001' },
    { service: 'RDS', operation: 'ListInstances', result: 'PASS', detail: 'total_count=0' },
    { service: 'CTS', operation: 'ListTraces', result: 'PASS', detail: '5 traces returned with full audit detail' },
    { service: 'CES', operation: 'ListMetrics', result: 'PASS', detail: 'count=0 (namespace=SYS.ECS)' },
    { service: 'ELB', operation: 'ListLoadBalancers', result: 'PASS', detail: 'current_count=0' },
  ],
  readOnlyPassRate: '7/7 = 100%',
  writeClassification: {
    tool: 'huaweicloud_plan_cli_command',
    command: 'hcloud VPC CreateVpc --vpc.name=test-d413-classification --vpc.cidr=192.168.77.0/24',
    decision: 'deny',
    risk: 'write',
    reason: 'Huawei Cloud write operation blocked until the agent presents a plan and receives explicit user approval.',
    safeToRun: false,
    approvalToken: '2e9eda00-9494-426e-8c08-cc461bc02a7c',
  },
  ctsEvidence: {
    test001WriteRejected: true,
    ctsTrace: 'createVpc by test001 → code=403, VPC.0010, "Rules on create_router by *** disallowed by policy"',
    sourceIP: '188.239.14.150 (testbot4-win)',
    traceType: 'ApiCall',
    traceRating: 'warning',
  },
  conclusion: 'PASS — 只读100%可用，写操作被正确识别为需审批(deny/write/safeToRun=false)，CTS证实test001写操作被IAM 403拒绝',
};
console.log(JSON.stringify(readonlyResults, null, 2));
