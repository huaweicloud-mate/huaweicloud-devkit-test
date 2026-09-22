# FINDINGS — Codex-Windows

生成时间：2026-09-22 14:48:00（北京时间）
被测版本：huaweicloud-devkit@1.1.6-next.1，源码 `10e5243`

## #1【P0】D4-16 命令包裹穿透

- **现象**：`classifyTextCommand("sh -c 'hcloud ECS CreateServers ...'")` 返回 `allow`；同一风险通过 MCP `hook_check_command` 也返回 `allow`。`bash -c` 与直接 hcloud 路径可拦截，`sh -c` 路径未拦截。
- **断言**：包含 Huawei Cloud 写操作的 `sh -c` 包裹命令必须返回 `deny`，不得返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:428-430` 仅在原始文本匹配 `(^|\s)hcloud` 时进入 `classifyHcloudArgs()`；`sh -c` 的命令文本不满足该入口条件，虽然 `stripExecutable()` 在 `:67-100` 支持 `sh` 解包，实际入口未调用。
- **影响**：攻击者可用 `sh -c` 包装写操作绕过命令风险判断。
- **证据**：`evidence/D4-16/stdout.log`、`evidence/d4-security/stdout.log`、`evidence/mcp-tools/stdout.log`
- **状态**：待提单

## #2【P1】D2-4/D4-27 字符串化 JSON 凭证未脱敏

- **现象**：`redactSecrets()` 对对象字段可脱敏，但对字符串化 JSON `{"ak":"AKID...","sk":"SK..."}` 返回包含原始 AK/SK；双路径输出复核同样失败。
- **断言**：任何通过输出脱敏路径处理的字符串化 JSON 中不得出现原始 `ak`/`sk`/`token` 值。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-46` 的 `redactString()` 只匹配 `key:value` 形式，未覆盖 JSON 引号键形式；`redactSecrets()` 在 `:61-62` 对字符串直接调用该正则，不先解析 JSON 或匹配带引号的键。
- **影响**：工具输出若以 JSON 字符串传递，可能泄漏云凭证。
- **证据**：`evidence/D2-4/stdout.log`、`evidence/D4-27/stdout.log`、`evidence/d2-auth/stdout.log`
- **状态**：待提单

## #3【P1】D10-3 服务路由评测命中率不足

- **现象**：确定性 serviceCatalog 评测中 EXP-E01~E05、E07、E10~E14 共 11 条返回 `MISS`，预期均为 `HIT`；EXP-E06、E09、E15 命中，EXP-E08 按设计为 N/A。
- **断言**：评测集 15 条意图中，除标记 N/A 的 EXP-E08 外，每条应路由到预期服务，不能返回 `MISS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815-1905` 的 `serviceCatalog()` 使用固定关键词表进行单次路由；失败意图所用同义表达未覆盖，导致没有任何 route keyword 命中。
- **影响**：真实用户的中文/复合意图可能无法得到对应服务技能与服务建议。
- **证据**：`evidence/EXP-E01/stdout.log` 至 `evidence/EXP-E15/stdout.log`、`evidence/c4-service-matrix/stdout.log`
- **状态**：待提单
