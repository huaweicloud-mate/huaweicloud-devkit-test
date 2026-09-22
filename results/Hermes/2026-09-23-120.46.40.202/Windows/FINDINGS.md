# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：`results/Hermes/2026-09-23-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-23 05:55:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**，否则自动提单解析失败/漏缺陷。

---

## #1【P0】D4-16 命令包裹穿透 — 命令替换 $(...) 和反引号未拦截

- **现象**：`classifyTextCommand('$(hcloud ECS DeleteServer --server_id=test)')` 返回 `decision: 'allow', risk: 'not_huaweicloud'`；``classifyTextCommand('`hcloud ECS DeleteServer --server_id=test`')`` 同样返回 `allow`。命令替换语法未被识别为 hcloud 命令，写操作绕过了审批门禁。
- **断言**：`classifyTextCommand('$(hcloud ECS DeleteServer --server_id=test)')` 应返回 `decision: 'deny'`（写操作需审批，不可通过命令替换绕过）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:428-430` — `classifyTextCommand` 在匹配 `hcloud` 前缀时使用 `/(^|\s)hcloud(\.exe)?\s+/i.test(text)`，但 `$(` 和反引号前缀不匹配 `^` 或 `\s`，导致命令替换内的 hcloud 命令被归类为 `not_huaweicloud` 并放行。
- **影响**：攻击者可通过命令替换语法 `$(hcloud ...)` 或反引号 `` `hcloud ...` `` 绕过写操作审批门禁，执行未授权的云资源变更操作。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P1】D9-9 tools/call 超时协议语义与取消 — capabilities.cancellation 未声明

- **现象**：MCP initialize 返回的 `capabilities` 对象中未声明 `notifications.cancellation`。protocol-probe.mjs 输出：`D9-9a-capabilities.cancellation | SPEC-MISMATCH | 期望=声明 notifications.cancellation | 实际=未声明 | initialize.result.capabilities.notifications = "(缺失)"`
- **断言**：`initialize.result.capabilities.notifications.cancellation` 应存在且为 truthy 值（声明服务端支持取消通知）
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46-52` — initialize 响应的 capabilities 对象未包含 `notifications.cancellation` 字段。MCP 协议规范要求服务端在 capabilities 中声明支持的取消能力。
- **影响**：MCP 客户端无法得知服务端是否支持取消操作，无法在超时场景下发送取消通知。客户端与服务端之间的取消协议无法建立。
- **证据**：`evidence/D9-9/stdout.log`（protocol-probe.mjs 输出）
- **状态**：待提单

## #3【P1】D9-2 JSON-RPC错误码 — invalid params 未返回 -32602

- **现象**：向 MCP 服务端发送 `tools/call` 请求时传入非法参数，服务端未返回 JSON-RPC 标准错误码 `-32602 (Invalid params)`。protocol-probe.mjs 输出：`D9-2b-invalid-params | FAIL | 期望=-32602 (Invalid params) | 实际=无 error 对象 | error.code`
- **断言**：`tools/call` 请求传入非法参数时，响应应包含 `error.code = -32602`（Invalid params）
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` — `dispatch` 函数在处理 `tools/call` 时，对参数校验失败的情况未返回标准 JSON-RPC 错误对象，而是直接返回无 error 字段的响应。
- **影响**：MCP 客户端无法根据标准错误码进行错误处理，违反 JSON-RPC 2.0 规范。
- **证据**：`evidence/D9-2/stdout.log`（protocol-probe.mjs 输出）
- **状态**：待提单

## #4【P1】D10-3 / EXP-E01~E15 serviceCatalog 路由准确率 — 中文意图路由 MISS

- **现象**：eval harness `run-eval.mjs` 跑 15 条中文意图评测集，serviceCatalog 路由命中率为 0/15（全部 MISS）。例如：`帮我查一下我账号在华北北京四有哪些云主机` 期望路由到 ECS，实际路由到 `Run hcloud --help to list available services`。
- **断言**：serviceCatalog 对中文自然语言意图的路由准确率应 ≥90%（15 条中至少命中 14 条）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` — `serviceCatalog` 函数对中文自然语言意图的解析能力不足，未能将中文描述映射到对应的华为云服务。当前实现可能依赖英文关键词匹配，缺乏中文语义理解。
- **影响**：用户使用中文自然语言查询云服务时，serviceCatalog 无法正确路由到对应服务，导致工具调用失败或路由到错误服务。
- **证据**：`evidence/D10-3/stdout.log`（run-eval.mjs 输出，15 条评测集全部 MISS）
- **状态**：待提单（已知基线 21.4% MISS，本轮 100% MISS 可能与版本/环境有关）
