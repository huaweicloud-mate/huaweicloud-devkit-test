## #1【P0】D4-16 命令包裹穿透

- **现象**：MCP `hook_check_command` 对 shell 包裹的高危 hcloud 写命令返回 `decision=allow`，期望为 deny。
- **断言**：`bash -c`/PowerShell 等 wrapper 内的 hcloud 写命令必须被提取并拒绝。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:401-466` 的 wrapper 提取与 `classifyTextCommand`/MCP 入口组合未覆盖本次传入的 wrapper 形态，导致 `mcp-tools` 路径实际放行。
- **影响**：高危写操作可能绕过 Node/MCP 安全边界。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P1】D4-27 双路径输出未完整脱敏

- **现象**：双路径凭证输入的实际结果仍包含 `AKID123`、`SK1234567890abcdef`、`STSTOKEN1`，期望全部为 `<redacted>`。
- **断言**：`redactSecrets` 对对象字段和字符串化输出中的 AK/SK/token 均不得保留明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:25-63` 的字符串脱敏规则未覆盖本次双路径样本的字段/格式组合。
- **影响**：MCP 返回或审计证据可能泄露凭证。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01~EXP-E14 serviceCatalog 路由命中率不足

- **现象**：确定性路由 harness 中 EXP-E01、02、03、04、05、07、10、11、12、13、14 返回 `MISS`，期望为 `HIT`；仅部分评测意图命中。
- **断言**：`eval/prompts/eval-set-v1.csv` 的每条预期服务意图必须由 `huaweicloud_service_catalog` 命中对应服务路由。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1966-2015` 的 `serviceCatalog` 静态关键词路由表未覆盖评测集中使用的意图表达。
- **影响**：中文服务意图可能被错误路由或无法路由，影响后续工具选择。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E02/stdout.log`、`evidence/EXP-E14/stdout.log`
- **状态**：待提单
