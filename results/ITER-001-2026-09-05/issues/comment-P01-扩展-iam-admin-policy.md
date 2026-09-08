**P0-1 缺陷族扩展（规则盲区第 8 个操作——IAM 管理员策略创建，2026-09-07 实测）**：

在正式版 1.1.1 环境实测：`hcloud IAM CreatePolicy --policy.name=admin-all --policy.action='*:*:*' --policy.effect=Allow --policy.resources='*'`（IAM admin 策略创建，全权限授予）

- **risk-rule-engine（evaluateCommandRisk）**: findings 空 → **allow**
- **hook_check_command（MCP 安全层）**: `decision: allow, "No Huawei Cloud hook risk rule matched"` → 同上无告警
- 兜底：plan 层按 write 操作 deny → 审批门拦截（安全仍有效，与 P0-1 同模式）

与 #501 已报 P0-1 的 4 个盲区操作（NovaDeleteServer/Keypair 删除/ServerGroup 删除/ResetServerPassword）同类：**规则集未覆盖"提权/管理面"操作**（此处为 IAM 管理员策略创建——风险语义更重：全量授权动作）。建议规则集补充 IAM CreatePolicy/AttachPolicy(admin `*:*:*`) 类告警（warn 级即可，配合现有审批门）。