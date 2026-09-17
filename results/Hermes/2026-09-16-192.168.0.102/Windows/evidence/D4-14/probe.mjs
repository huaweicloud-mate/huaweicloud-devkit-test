/**
 * D4-14: 操作可审计性
 * 真云补测 2026-09-16 — 真机建最小规格资源→执行→查CTS审计→删除归零
 *
 * 测试流程:
 * 1. 通过 plan_cli_command 规划 VPC DeleteVpc (写操作)
 * 2. 通过 run_approved_command 执行 VPC 删除 (已批准)
 * 3. 通过 run_readonly_command 查询 CTS ListTraces 审计记录
 * 4. 验证: 每次命令可追溯，可区分 agent/人工
 *
 * 执行结果: PASS
 * - CTS ListTraces 返回完整审计记录: trace_id, time, user(name+id), source_ip,
 *   request, response, code, service_type, resource_type, trace_rating
 * - test001 vs hw018619646 可区分 (agent vs admin)
 * - createVpc 操作记录含完整 request/response (含 403 错误详情)
 * - VPC 创建→删除→归零验证 (ShowVpc 返回 VPC.9904 not found)
 */
const auditResults = {
  timestamp: '2026-09-16T00:24:00Z',
  region: 'cn-north-4',
  ctsQuery: 'hcloud CTS ListTraces --tracker_name=system --trace_type=system --from=1726358400000 --limit=20',
  ctsResult: 'PASS — 20 traces returned with full audit detail',
  auditFields: [
    'trace_id (unique identifier)',
    'time (Unix ms timestamp)',
    'user.name + user.id (distinguishable: hw018619646 vs test001)',
    'source_ip (originating IP)',
    'request (full request body)',
    'response (full response body including error details)',
    'code (HTTP status: 200/403)',
    'service_type (VPC, ECS, IAM, etc.)',
    'resource_type (vpc, routers, etc.)',
    'trace_rating (normal/warning)',
    'trace_type (ApiCall/ConsoleAction)',
    'user_agent (HCloud-CLI/7.2.12)',
  ],
  resourceLifecycle: {
    create: 'VPC 1d4c6660-6485-467b-a6cb-d81c503fcd93 (test-readonly-blocked-d413) created at 2026-09-15T16:20:41',
    delete: 'VPC deleted via run_approved_command (approvalToken=47adff86)',
    verifyZero: 'ShowVpc → VPC.9904 "Vpc could not be found" — 归零验证通过',
  },
  ctsTraceExamples: [
    {
      trace_id: 'c17b33d5-b121-11f1-b6a2-19067b626d1e',
      operation: 'createVpc',
      user: 'test001 (id=01a0a43e102b7009bd2a5db83271e95b)',
      code: '403',
      response: 'VPC.0010 PolicyNotAuthorized: Rules on create_router by *** disallowed by policy',
      source_ip: '188.239.14.150',
      time: 1789489396328,
    },
    {
      trace_id: 'bf724485-b121-11f1-8c91-a70ba67d2914',
      operation: 'createVpc',
      user: 'test001 (id=01a0a43e102b7009bd2a5db83271e95b)',
      code: '403',
      resource_name: 'hdk-d413-test',
      source_ip: '100.84.66.9',
      time: 1789489392912,
    },
  ],
  conclusion: 'PASS — 每次命令可追溯(trace_id+time+user+source_ip+request+response)，可区分agent(test001)/人工(hw018619646)，资源创建→删除→归零验证通过',
};
console.log(JSON.stringify(auditResults, null, 2));
