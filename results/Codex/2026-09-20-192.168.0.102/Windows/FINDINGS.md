# FINDINGS

## [P0] D4-16
- 描述：shell 包裹命令未被安全策略识别
- 断言：对 sh -c 包裹的删除/高危命令，唯一断言应为 decision=deny；实测 decision=allow。
- 根因：hdk/plugins/huaweicloud-core/src/safety-policy.mjs: command classification path; evidence/mcp-tools/stdout.log

## [P1] D2-4/D4-27
- 描述：JSON 凭证字段未完成脱敏
- 断言：对含 ak/sk/token 的 JSON，输出不得包含原始 secret；实测原值仍可见。
- 根因：hdk/plugins/huaweicloud-core/src/safety-policy.mjs: redactSecrets; evidence/d2-auth/stdout.log

## [P1] D10-3 / EXP-E01~E15
- 描述：service catalog 路由准确率低
- 断言：14 个可判定意图中应命中对应服务；实测 HIT=3, MISS=11, accuracy=21.4%。
- 根因：hdk/plugins/huaweicloud-core/src/mcp-server.mjs: service catalog route; evidence/D10-3/stdout.log

## [P1] D9-2
- 描述：MCP invalid params 未返回标准错误码
- 断言：非法参数请求应返回 JSON-RPC error.code=-32602；实测 error 对象缺失。
- 根因：hdk/plugins/huaweicloud-core/src/mcp-server.mjs: request validation; evidence/D9-9/protocol-probe.json

## [P1] D9-9
- 描述：MCP capabilities 缺少 cancellation 声明
- 断言：initialize.result.capabilities.notifications.cancellation 应声明；实测字段缺失。
- 根因：hdk/plugins/huaweicloud-core/src/mcp-server.mjs: initialize capabilities; evidence/D9-9/protocol-probe.json

