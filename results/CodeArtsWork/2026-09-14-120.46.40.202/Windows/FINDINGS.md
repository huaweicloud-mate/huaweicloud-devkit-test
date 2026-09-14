# FINDINGS — 缺陷发现清单（CodeArtsWork-GLM-5.2）

> **落盘路径**：`results/CodeArtsWork/2026-09-14-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-14 23:50:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】明文 secret API 未被 hook 拦截

- **现象**：`hcloud DEW CSMS ShowSecret --plaintext=true` 返回 `{"ok":true,"decision":"allow","findings":[]}`，明文 secret 读取操作未被安全策略拦截
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 的 `classifyTextCommand()` 未覆盖 `DEW CSMS ShowSecret --plaintext=true` 模式，未识别为 secret 类操作
- **影响**：Agent 可能通过 hook_check_command 放行明文 secret 读取命令，导致 secret 值进入对话上下文
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #2【P1】adminPass 明文密码未触发回显警告

- **现象**：`hcloud ECS CreateServers --adminPass=MyPassword123!` 返回 `{"ok":true,"decision":"allow","findings":[]}`，明文密码参数未触发 shell history 警告
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 的 `classifyTextCommand()` 未检测 `--adminPass=` 参数模式，未发出 plaintext password 警告
- **影响**：明文密码可能留在 shell history 中，存在凭证泄漏风险
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：待提单