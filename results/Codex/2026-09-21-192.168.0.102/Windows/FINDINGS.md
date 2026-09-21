# FINDINGS — Codex-gpt-5 Windows

## #1【P0】D4-16 命令包裹穿透

- **现象**：Node 安全探针对 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `allow`；MCP 路径对同类包裹也返回 `ok=true, decision=allow`。
- **断言**：shell 包裹的凭证访问命令必须返回 `deny`；实测返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:70-94,153-180` 的 shell wrapper 解包与分段风险扫描未覆盖本次 `sh -c`/MCP 输入形态。
- **影响**：高危命令可通过 shell 包裹绕过安全拦截。
- **证据**：`evidence/D4-16/stdout.log`、`evidence/d4-security/stdout.log`、`evidence/mcp-tools/stdout.log`
- **状态**：待提单

## #2【P1】D2-4/D4-27 JSON 凭证字段未完成脱敏

- **现象**：`redactSecrets` 对含 `ak/sk/token` 的 JSON 返回中仍出现原始凭证值。
- **断言**：含凭证字段的 JSON 输出不得包含原始 secret；实测 `AKIDTEST12345678`、`SKTEST1234567890abcdef1234` 和 token 仍可见。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49-64` 的对象键识别/递归脱敏规则未覆盖本次 JSON 字段形态。
- **影响**：凭证可能出现在工具结果或日志中。
- **证据**：`evidence/D2-4/stdout.log`、`evidence/D4-27/stdout.log`、`evidence/d2-auth/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01~E05/E07/E10~E14 中文 service catalog 路由 MISS

- **现象**：确定性评测 harness 对 14 个可判定中文意图仅命中 3 个，11 个 MISS。
- **断言**：每条可判定意图应命中对应服务；实测命中率为 3/14（21.4%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1845` 的 `serviceCatalog` 关键词路由未覆盖这些中文意图表达。
- **影响**：Agent 可能无法选择正确云服务工具。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E02/stdout.log`、`evidence/EXP-E03/stdout.log`、`evidence/EXP-E04/stdout.log`、`evidence/EXP-E05/stdout.log`、`evidence/EXP-E07/stdout.log`、`evidence/EXP-E10/stdout.log`、`evidence/EXP-E11/stdout.log`、`evidence/EXP-E12/stdout.log`、`evidence/EXP-E13/stdout.log`、`evidence/EXP-E14/stdout.log`
- **状态**：待提单
