# FINDINGS — 缺陷发现清单（Codex）

> **生成时间**：`2026-09-24 14:14:44`（北京时间）

## #1【P0】D9-12 initialize 握手协议安全基线断言失败

- **现象**：invalid params 未返回 `-32602`；`callTool('huaweicloud_service_catalog')` 未返回可用 content；`_decorateResult` 后 `_isHintConsumed('s1')` 仍为 false。
- **断言**：initialize 返回协议字段，非法 params 返回 `-32602`，工具路由可用，提示包装消费状态正确。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:178` 用 `message.params || {}` 弱化非法 params；`plugins/huaweicloud-core/src/mcp-protocol.mjs:11` 的提示消费只在特定 tool/result 形态生效。
- **影响**：MCP 协议错误码和提示消费状态不满足 daily P0 基线。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #2【P0】D9-13 tools/call 凭证不泄露与权限校验基线失败

- **现象**：运行时凭证 set/resolve 形参不匹配；artifact 风险合并未把含 AK 文本提升为非 allow；审批 token 消费断言失败。
- **断言**：运行时凭证解析应返回扁平 AK/SK/token；风险引擎应拦截含凭证 artifact；审批 token 应可创建且一次性消费。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:299` 的 `setRuntimeCredentials(ak, sk, securityToken, region)` 不接受对象形参；`plugins/huaweicloud-core/src/risk-rule-engine.mjs:150` 对 artifact content 的凭证模式覆盖不足；`plugins/huaweicloud-core/src/hcloud-cli.mjs:71` token 结构需与调用方严格对齐。
- **影响**：P0 安全基线部分能力不可由统一对象参数和 artifact 风险路径验证。
- **证据**：`evidence/D9-13/stdout.log`
- **状态**：待提单

## #3【P1】D4-16 shell 包裹命令穿透

- **现象**：`sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 在 MCP hook 探针中返回 `allow`。
- **断言**：读取华为云凭证环境变量的 shell 包裹命令必须返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:384` 的 `classifyTextCommand()` 对非 hcloud shell wrapper 中的 `printenv HUAWEICLOUD_ACCESS_KEY_ID` 未完整解包拦截。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #4【P2】D4-27 双路径脱敏不完整

- **现象**：包含 `ak/sk/token` 的 JSON 字符串在脱敏后仍出现 `AKID123`、`SK1234567890abcdef` 或 token 片段。
- **断言**：AK/SK/token/password 字段和值都必须被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34` 的 `redactString()` 只覆盖部分 key/value 形态，未覆盖当前 dual-path JSON 字符串。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E01~EXP-E14 serviceCatalog 多服务路由 MISS

- **现象**：D10 路由评测中 ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 等 11 条返回 `MISS`。
- **断言**：EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14 应命中对应服务，返回 `HIT`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815` 的 `serviceCatalog()` routeMap/关键词覆盖不足，多数中文意图回退到 generic help。
- **证据**：`evidence/EXP-E01/stdout.log` 至 `evidence/EXP-E14/stdout.log`
- **状态**：待提单
