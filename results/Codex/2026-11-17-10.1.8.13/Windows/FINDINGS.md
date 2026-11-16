# FINDINGS - Codex-GPT-5

## #1【P0】D2-4 JSON 凭证字符串未脱敏

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 返回值仍包含完整 `ak`/`sk`。
- **断言**：凭证 JSON 字符串经脱敏后不得包含原始 AK/SK 值。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:34-46,61-63` 的 `redactString` 只匹配 `ak:`/`sk:` 等未带 JSON 引号的键值格式；`redactSecrets` 对字符串不先解析 JSON，导致 `"ak":"..."` 不匹配。
- **影响**：JSON 文本输出可能泄露云凭证。
- **证据**：`evidence/D2-4/stdout.log`（D2 auth probe，`redact-json` failed）。
- **状态**：待提单

## #2【P0】D4-16 MCP 包裹命令可绕过风险检查

- **现象**：MCP `huaweicloud_hook_check_command` 对 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `{"ok":true,"decision":"allow"}`。
- **断言**：包裹命令展开后的凭证环境变量访问必须返回 `deny`。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1363-1364` 直接调用 `evaluateCommandRisk`；`hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs:33-47` 仅规范化原始文本，不复用 `safety-policy.mjs:415-480` 的 shell wrapper 展开逻辑，因此 `sh -c` 内层命令未被风险规则识别。
- **影响**：通过 MCP hook 检查时可用 shell 包裹绕过凭证泄露防护。
- **证据**：`evidence/D4-16/stdout.log`、`evidence/mcp-tools/stdout.log`。
- **状态**：待提单

## #3【P1】D4-27 双路径输出脱敏不完整

- **现象**：双路径脱敏探针返回值仍包含 `{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1..."}`。
- **断言**：安全策略和 CLI 输出路径均不得返回原始 AK、SK 或 token。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:34-46` 的字符串正则不覆盖 JSON 引号键；CLI 路径 `hcloud-cli.mjs` 的输出脱敏调用未能修正该字符串格式缺口。
- **影响**：同一凭证数据经过不同输出路径时仍可能泄露。
- **证据**：`evidence/D2-4/stdout.log` 中 `D4-27 redact-dual` failed；`evidence/mcp-tools/stdout.log`。
- **状态**：待提单

## #4【P1】EXP-E01 ECS 查询中文意图路由 MISS

- **现象**：`帮我查一下我账号在华北北京四有哪些云主机` 的 service catalog 返回 `Run hcloud --help to list available services.`，未返回 ECS。
- **断言**：该只读 ECS 查询意图必须命中 `ECS` 服务并进入只读查询路径。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:2360-2378` 的 ECS 路由关键词覆盖“云服务器/服务器”等，但未覆盖“云主机”及“华北北京四”这类区域化查询表达。
- **影响**：常见中文 ECS 查询无法路由到 ECS 只读工具。
- **证据**：`evidence/EXP-E01/stdout.log`、`eval/results/eval-run-20261116210519.csv`。
- **状态**：待提单
