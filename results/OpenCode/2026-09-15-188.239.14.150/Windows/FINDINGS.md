# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-15-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-15 20:27:40（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】凭证 env 打印拦截规则未覆盖实际 HW_ACCESS_KEY/HW_SECRET_ACCESS_KEY 变量名

- **现象**：`hook_check_command("printenv HW_ACCESS_KEY HW_SECRET_ACCESS_KEY")` 返回 `{"ok": true, "decision": "allow"}`，未被拦截。同样 `echo %HUAWEICLOUD_ACCESS_KEY%` 也未被拦截（echo 命令不在检测模式中）。而 `printenv HUAWEICLOUD_ACCESS_KEY`（含 HUAWEICLOUD 关键字）则正确返回 `deny`。
- **断言**：`hook_check_command` 对包含 `HW_ACCESS_KEY`、`HW_SECRET_ACCESS_KEY`、`HW_SECURITY_TOKEN` 的 `printenv`/`env` 命令应返回 `decision=deny`（与 `HUAWEICLOUD_ACCESS_KEY` 一致）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` + `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39`
  - safety-policy.mjs 第 336 行关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未包含 `HW_ACCESS_KEY` / `HW_SECRET_ACCESS_KEY` / `HW_SECURITY_TOKEN` 前缀
  - 实际华为云凭证环境变量名（credentials.mjs:130-132 使用 `process.env.HW_ACCESS_KEY` / `process.env.HW_SECRET_ACCESS_KEY` / `process.env.HW_SECURITY_TOKEN`）不匹配上述正则
  - 另外，`echo` 命令不在第 335 行的命令检测模式 `/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i` 中，`echo %HW_ACCESS_KEY%` 也能绕过
- **影响**：Agent 可通过 `printenv HW_ACCESS_KEY` 或 `echo %HW_ACCESS_KEY%` 将真实华为云 AK/SK 环境变量打印到上下文中，绕过安全策略的凭证泄露防护
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单
