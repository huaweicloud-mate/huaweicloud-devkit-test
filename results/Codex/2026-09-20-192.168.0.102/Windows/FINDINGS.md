# FINDINGS — Codex-gpt-5 Windows

## #1【P0】D4-16 命令包裹穿透

- **现象**：MCP hook probe 对 `sh -c` 包裹的高危命令返回 `decision=allow`。
- **断言**：对 shell 包裹的删除/高危命令，唯一可判定结果必须为 `decision=deny`；实测为 `allow`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:70-88` 的 shell wrapper 解包路径未覆盖本次输入形态。
- **影响**：高危命令可通过 shell 包裹绕过安全拦截。
- **证据**：`evidence/mcp-tools/stdout.log`（D4-16）
- **状态**：待提单

## #2【P1】D2-4/D4-27 JSON 凭证字段未完成脱敏

- **现象**：`redactSecrets` 对含 `ak/sk/token` 的 JSON 返回中仍出现原始值。
- **断言**：含凭证字段的 JSON 输出不得包含原始 secret；实测 `AKIDTEST...`、`SKTEST...` 仍可见。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49-64` 的对象键识别未覆盖本次 `ak/sk/token` 字段。
- **影响**：凭证可能出现在工具结果或日志中。
- **证据**：`evidence/d2-auth/stdout.log`（D2-4、D4-27）
- **状态**：待提单

## #3【P1】D10-3/EXP-E01~E15 service catalog 路由准确率低

- **现象**：评测 harness 实测 `HIT=3 MISS=11 N/A=1`，准确率 21.4%。
- **断言**：14 个可判定意图应命中对应服务；实测仅 3 个命中。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1845` 的 `serviceCatalog` 关键词路由未覆盖中文意图。
- **影响**：Agent 可能无法选择正确云服务工具。
- **证据**：`evidence/D10-3/stdout.log`
- **状态**：待提单

## #4【P1】D9-2 MCP invalid params 错误码缺失

- **现象**：协议探针对非法参数请求未得到 error 对象。
- **断言**：非法参数必须返回 JSON-RPC `error.code=-32602`；实测 `error.code` 缺失。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46-100` 的 dispatch 未对方法参数执行 JSON-RPC invalid-params 校验。
- **影响**：客户端无法按标准错误码处理参数错误。
- **证据**：`evidence/D9-9/protocol-probe.json`
- **状态**：待提单

## #5【P1】D9-9 MCP capabilities 缺少 cancellation

- **现象**：initialize 返回的 capabilities 只有 `tools`。
- **断言**：`initialize.result.capabilities.notifications.cancellation` 应声明；实测字段缺失。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:61-65` 只返回 `tools` capability。
- **影响**：客户端无法发现服务端的取消通知能力。
- **证据**：`evidence/D9-9/protocol-probe.json`
- **状态**：待提单

