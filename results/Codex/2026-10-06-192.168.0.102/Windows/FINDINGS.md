# FINDINGS - Codex-GPT-5-Codex

## #1【P0】D4-16 shell-wrapped command is allowed by MCP hook path

- **现象**：huaweicloud_hook_check_command allowed a shell-wrapped risky command in the MCP hook path.
- **断言**：Wrapped high-risk command must return deny; actual result returned llow.
- **根因**：plugins/huaweicloud-core/src/tools.mjs:2624 delegates raw command classification, while wrapper extraction/classification in plugins/huaweicloud-core/src/safety-policy.mjs:459 and plugins/huaweicloud-core/src/safety-policy.mjs:489 does not deny this MCP wrapper case.
- **影响**：Wrapped destructive or credential-reading commands can bypass the hook decision path.
- **证据**：evidence/D4-16/stdout.log; evidence/mcp-tools/stdout.log
- **状态**：待提单

## #2【P1】D4-27 D2-4 credential redaction misses JSON/string credential forms

- **现象**：Redaction probes retained AKID.../SKTEST... style plaintext in JSON/string evidence.
- **断言**：AK/SK/token/password in JSON/string evidence must be replaced with <redacted>.
- **根因**：plugins/huaweicloud-core/src/safety-policy.mjs:34 applies selected string patterns; regexes at plugins/huaweicloud-core/src/safety-policy.mjs:42 and plugins/huaweicloud-core/src/safety-policy.mjs:45 miss lowercase JSON keys like k/sk and quoted JSON strings when handled as plain text.
- **影响**：Credential material can appear in tool output, findings, or evidence logs.
- **证据**：evidence/D4-27/stdout.log; evidence/D2-4/stdout.log; evidence/d2-auth/stdout.log
- **状态**：待提单

## #3【P0】D9-12 tools/list invalid params does not return JSON-RPC -32602

- **现象**：Protocol probe sent 	ools/list with invalid params and received no JSON-RPC error object.
- **断言**：Invalid params must return JSON-RPC error code -32602.
- **根因**：plugins/huaweicloud-core/src/mcp-server.mjs:187 coerces params with message.params || {}, and plugins/huaweicloud-core/src/mcp-protocol.mjs:57 returns 	ools/list without validating params type.
- **影响**：MCP protocol clients cannot rely on standard error semantics for invalid requests.
- **证据**：evidence/D9-12/stdout.log; evidence/D9-12/protocol-probe-20261005211107.json
- **状态**：待提单

## #4【P0】D9-13 tools/call credential safety baseline fails due redaction leak

- **现象**：Credential safety baseline failed because redaction probes exposed credential-like plaintext.
- **断言**：	ools/call safety baseline must not expose AK/SK/token plaintext and must preserve deny/warn/allow checks.
- **根因**：Shared redaction helper gap in plugins/huaweicloud-core/src/safety-policy.mjs:34 and plugins/huaweicloud-core/src/safety-policy.mjs:49 affects tools/call result safety when outputs are redacted through policy helpers.
- **影响**：Sensitive values may leak through MCP tool results or generated diagnostic evidence.
- **证据**：evidence/D9-13/stdout.log; evidence/D2-4/stdout.log; evidence/D4-27/stdout.log
- **状态**：待提单

## #5【P1】EXP-E01 EXP-E02 EXP-E03 EXP-E04 EXP-E05 EXP-E07 EXP-E10 EXP-E11 EXP-E12 EXP-E13 EXP-E14 service catalog eval routes miss prompts

- **现象**：Service catalog eval route returned MISS for 11 Chinese scenario prompts.
- **断言**：Each eval prompt must route to the expected Huawei Cloud service; actual route was MISS for the listed EXP-E cases.
- **根因**：Keyword service routing in plugins/huaweicloud-core/src/tools.mjs:2191 and plugins/huaweicloud-core/src/tools.mjs:2195 relies on token/keyword matching and misses multiple Chinese scenario prompts.
- **影响**：Agent may choose no skill or wrong skill for common Chinese Huawei Cloud scenarios.
- **证据**：evidence/EXP-E01/stdout.log through evidence/EXP-E14/stdout.log; evidence/c4-service-matrix/stdout.log
- **状态**：待提单
