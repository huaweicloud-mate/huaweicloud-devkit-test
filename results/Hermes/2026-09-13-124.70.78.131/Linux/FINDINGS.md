# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-13-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-13 17:12:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。

## #1【P0】凭证 env 打印拦截不完整（HW_ 前缀未覆盖，可 dump 真实 AK/SK）

- **现象**：`classifyTextCommand('env | grep HW_ACCESS_KEY')` 实测返回 `decision=allow, risk=not_huaweicloud`；`printenv HW_SECRET_KEY`、`env | grep -i access_key` 同样放行。正对照 `env | grep HUAWEICLOUD` 被正确拦截（deny）。工具链本身用 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 作为凭证环境变量名，即「可打印出真实明文 AK/SK」。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:334-337` `classifyTextCommand` 的 env-dump 拦截正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；而 `plugins/huaweicloud-core/src/auth/credentials.mjs:102-104` 正是从 `process.env.HW_ACCESS_KEY` / `HW_SECRET_KEY` 读取真实凭证。
- **影响**：安全 hook 对「凭证环境变量打印」存在盲区，agent 可通过 `env | grep HW_ACCESS_KEY` 绕过拦截拿到明文 AK/SK，违反凭证红线（I 类）。P/G=G。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P1】JSON-RPC 错误码不规范（未知 method/未知 tool 均返回 -32603）

- **现象**：`tools/call` 未知 method → `{"code":-32603,"message":"Unsupported method: __no_such_method__"}`；`tools/call` 未知 tool → `{"code":-32603,"message":"Unknown tool: __no_such_tool__"}`。规范要求未知 method = `-32601`（Method not found）、未知 tool = `-32602`（Invalid params，tool 名为参数），客户端无法据此分类处理。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` `handleMessage` 的 catch 分支对**所有** `dispatch` 异常硬编码 `code: -32603`；`mcp-protocol.mjs:95` 抛 `Unsupported method`、`tools.mjs:1455` 抛 `Unknown tool`，两者均未携带可区分的错误码，catch 层统一吞成 -32603。
- **影响**：MCP 客户端错误分类/重试/告警逻辑失效，跨客户端互操作（D9-6）依赖错误码语义时受影响。P/G=P。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：待提单