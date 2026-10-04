# FINDINGS — 缺陷发现清单（Codex-GPT-5-Codex）

> **落盘路径**：`results/Codex/2026-10-05-192.168.0.102/Windows/FINDINGS.md`
> **生成时间**：2026-10-05 05:12:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1

## #1【P0】D2-4/D4-27 凭证脱敏不完整

- **现象**：JSON/object 凭证载荷中的 `ak`、`sk`、`token` 明文仍出现在输出中。
- **断言**：`redactSecrets` 输出不得包含任何 AK/SK/token 明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49` 脱敏依赖 key 匹配，未覆盖短别名和双路径 token 载荷。
- **影响**：凭证可能进入 MCP/tool 输出或 findings 证据。
- **证据**：`evidence/D2-4/stdout.log`、`evidence/D4-27/stdout.log`
- **状态**：待提单

## #2【P0】D4-16/D4-28 包裹命令和 hook 输入提取存在绕过

- **现象**：`bash -c "hcloud CSMS show-secret..."` 及部分 `command/cmd/script/args/arguments` hook 输入未全部判定为 `deny`。
- **断言**：所有 secret/CSMS 高危命令包裹形态均必须返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:401`、`plugins/huaweicloud-core/src/safety-policy.mjs:489` 对 shell wrapper/命令文本归一化不完整；hook 入口在 `plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:7`。
- **影响**：PreToolUse 安全 hook 可能放行读取密钥的包裹命令。
- **证据**：`evidence/D4-16/stdout.log`、`evidence/D4-28/stdout.log`
- **状态**：待提单

## #3【P0】D9-12 MCP tools/list 未强制 initialize 前置

- **现象**：未 initialize 的情况下调用 `tools/list` 返回 `listed:41`。
- **断言**：`tools/list` 在 initialize 前必须返回 JSON-RPC `-32600`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` 处理 `tools/list` 时未检查会话初始化状态。
- **影响**：MCP 协议状态机不符合安全基线。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #4【P1】EXP-E01/02/03/04/05/07/10/11/12/13/14 service catalog 路由 MISS

- **现象**：确定性评测集中 11 条服务路由用例返回 `MISS`。
- **断言**：列出的 EXP-E 用例均应命中预期华为云服务路由。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1966`、`plugins/huaweicloud-core/src/tools.mjs:1968`、`plugins/huaweicloud-core/src/tools.mjs:2193` 的 routeMap 关键词覆盖不足，缺少评测集中的中文同义表达。
- **影响**：用户自然语言意图可能无法发现正确服务。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E02/stdout.log`、`evidence/EXP-E03/stdout.log`、`evidence/EXP-E04/stdout.log`、`evidence/EXP-E05/stdout.log`、`evidence/EXP-E07/stdout.log`、`evidence/EXP-E10/stdout.log`、`evidence/EXP-E11/stdout.log`、`evidence/EXP-E12/stdout.log`、`evidence/EXP-E13/stdout.log`、`evidence/EXP-E14/stdout.log`
- **状态**：待提单

## #5【P1】D3-S2/D3-S6/D3-S8 规划和错误指导结果缺失

- **现象**：删 VPC 规划未触发确认、FunctionGraph 定时触发规划无结果、错误解释无指导。
- **断言**：删除类计划必须要求确认；FunctionGraph 定时触发计划必须返回结果；错误解释必须返回可执行指导。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 中 `huaweicloud_plan_cli_command` / `huaweicloud_explain_error` 的场景响应覆盖不足。
- **影响**：真实用户场景下写操作确认和故障自助指导不稳定。
- **证据**：`evidence/D3-S2/stdout.log`、`evidence/D3-S6/stdout.log`、`evidence/D3-S8/stdout.log`
- **状态**：待提单

## #6【P2】D1-68/D1-69/D2-27/D4-26/D9-11 辅助能力缺口

- **现象**：图标库加载失败、`setup.cjs` 缺少帮助/命令标记、KooCLI doctor/version 工具不可用、findings 输出含明文凭证、WebSocket tunnel 模块缺失。
- **断言**：上述辅助能力均应存在且输出满足脱敏/协议要求。
- **根因**：`bin/setup.cjs`、`plugins/huaweicloud-core/src/tools.mjs` 以及预期 WebSocket tunnel 实现路径的包装和辅助能力覆盖不完整。
- **影响**：安装诊断、证据脱敏和远程/隧道协议能力存在可用性风险。
- **证据**：`evidence/D1-68/stdout.log`、`evidence/D1-69/stdout.log`、`evidence/D2-27/stdout.log`、`evidence/D4-26/stdout.log`、`evidence/D9-11/stdout.log`
- **状态**：待提单
