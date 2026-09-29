# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-30-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-30 05:10:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

## #1【P0】D4-16 命令包裹穿透 — hook_check_command 不检测 shell 包裹内层命令

- **现象**：`huaweicloud_hook_check_command` MCP 工具对 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `{"ok":true,"decision":"allow","findings":[],"nextStep":"No Huawei Cloud hook risk rule matched."}`，未拦截。但源码级 `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 正确返回 `{decision:"deny", risk:"credential"}`，且 `extractInnerCommand` 成功提取内层命令 `printenv HUAWEICLOUD_ACCESS_KEY_ID`。
- **断言**：`huaweicloud_hook_check_command({ command: 'sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"' })` 应返回 `decision: "deny"`（与 `classifyTextCommand` 一致），实际返回 `decision: "allow"`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1146-1147` — `hook_check_command` 的 callTool 实现仅调用 `evaluateCommandRisk(args.command)`（来自 `risk-rule-engine.mjs`，基于 `cloud-risk-rules.json` 正则匹配），未调用 `classifyTextCommand()`（来自 `safety-policy.mjs`，包含 `extractInnerCommand()` 内层命令提取逻辑）。`evaluateCommandRisk` 对完整命令字符串做正则匹配，`sh -c "printenv ..."` 整体不匹配任何规则；而 `classifyTextCommand` 先用 `extractInnerCommand` 提取 `printenv HUAWEICLOUD_ACCESS_KEY_ID`，再匹配 env-dump 规则，正确判 deny。
- **影响**：攻击者可通过 `sh -c`/`bash -c`/`cmd /c` 等 shell 包裹绕过 hook 检查，执行凭证窃取命令（`printenv`、`cat credentials.json` 等），安全防线被穿透。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单
