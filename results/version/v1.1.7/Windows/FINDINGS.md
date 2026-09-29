# FINDINGS — huaweicloud-devkit v1.1.7 版本全量测试缺陷清单

> 客户端: OpenCode (glm-5.2) | OS: Windows | 版本: v1.1.7 | 日期: 2026-09-28

## #1【D4-16 P0】sh -c 包装器绕过未拦截
- 用例: D4-16 命令包裹穿透
- 现象: sh -c 'hcloud ECS DeleteServers --server-ids test' 被 hook_check_command 判定为 allow（应 deny）
- 根因: safety-policy.mjs:70-89 stripExecutable() 解包 sh -c 后未重新分类写操作
- 证据: evidence/d4-security/stdout.log

## #2【D4-27 P1】JSON 凭证双路径脱敏不完整
- 用例: D4-27 双路径输出脱敏
- 现象: JSON {"ak":"AKID123","sk":"SK1234567890abcdef"} 未被完全脱敏
- 根因: safety-policy.mjs:34-46 redactString() regex 不匹配 JSON 短键名 ak/sk
- 证据: evidence/d2-auth/stdout.log

## #3【D9-2 P1】JSON-RPC invalid params 错误码未正确返回
- 用例: D9-2 JSON-RPC错误码
- 现象: tools/call 缺少必需参数时未返回 -32602
- 根因: mcp-protocol.mjs:74-78 error.code=-32602 未序列化到 JSON-RPC 响应
- 证据: evidence/D9-protocol/stdout.log

## #4【D9-9 SPEC-MISMATCH】notifications.cancellation 未声明
- 用例: D9-9 tools/call 超时协议语义与取消
- 现象: MCP initialize capabilities 仅声明 tools:{}，缺少 notifications.cancellation
- 根因: mcp-protocol.mjs:47-49 capabilities 缺少 notifications 声明
- 证据: evidence/D9-protocol/stdout.log

## #5【EXP-E01~E14 P1】service_catalog 路由准确率低 21.4%
- 用例: EXP-E01~E15 评测集路由准确率
- 现象: 15 条中文意图中仅 3 条 HIT，11 条 MISS，准确率 21.4%
- 根因: service_catalog 中文意图路由逻辑不完善，大部分返回 Run hcloud --help
- 证据: evidence/D10-eval/stdout.log

## #6【D3-C1/C2 P1】真云 ECS/OBS E2E 认证失败
- 用例: D3-C1 ECS生命周期E2E / D3-C2 OBS静态站部署E2E
- 现象: hcloud CLI 返回 APIGW.0301 Unauthorized；OBS 返回 InvalidAccessKeyId
- 根因: hcloud AK/SK 认证失败，OBS 凭证独立存储未同步
- 证据: evidence/realcloud/stdout.log

## #7【D3-C3/C6 P1】沙箱 E2E 连接失败
- 用例: D3-C3 沙箱部署E2E / D3-C6 沙箱隐式工具冒烟
- 现象: sandbox_connect 返回空 ws；HDKIT_NOT_AGREEMENT
- 根因: 沙箱服务不可达，用户未签署最新版协议
- 证据: evidence/realcloud/stdout.log

## #8【D3-C7 P1】list_regions 返回 undefined
- 用例: D3-C7 跨区域资源操作引导
- 现象: huaweicloud_list_regions 工具调用返回 undefined
- 根因: 工具返回值序列化问题或内部调用异常
- 证据: evidence/supplement-probe.mjs
