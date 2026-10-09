# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-10-09-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-09（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D4-16 命令包裹穿透

- **现象**：构造 shell 包裹命令 `sh -c "printenv HW_ACCESS_KEY"`、`sh -c "cat credentials.json"`、`eval "env"` 执行时，risk-rule-engine 返回 `riskDecision=allow`，未检测内层命令
- **断言**：risk-rule-engine 对 `sh -c "..."` / `eval "..."` 包裹命令必须返回 deny（识别内层命令）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:14/35` — 规则锚点 `^|\s` 不匹配 `sh -c "..."` 内层命令；`risk-rule-engine.mjs evaluate` 未复用 `safety-policy.mjs extractInnerCommand` 做 shell 包裹拆解
- **影响**：攻击者可通过 shell 包裹绕过安全检查执行任意高危命令，安全风险高
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：历史复现（见 HISTORY_LINKS.md，关联 #852/#677/#674 等），不重复开单

## #2【P0】D4-3 csms show-secret 被分类为 read_only 未拦截（SPEC-MISMATCH）

- **现象**：`hcloud csms download-secret --secret-id 123` 被 `safetyDecision` 分类为 `decision=allow, risk=unknown_read`，未被拦截。agent-rules.md 规定 MUST NOT call csms show-secret/download-secret
- **断言**：`hcloud csms show-secret` / `hcloud csms download-secret` 应被 safety-policy deny
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs classifyTextCommand` — csms show-secret/download-secret 未列入 deny 规则集
- **影响**：可通过 csms 命令读取密钥明文，绕过安全策略
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待查重

## #3【P1】D4-17 hook 对非法/截断 stdin JSON fail-open

- **现象**：hook 收到非法（空）或截断的 stdin JSON 时，catch 块静默 `return`（不 deny），不输出 permissionDecision
- **断言**：异常输入应 fail-closed（输出 deny 决策），不得静默放行
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:47-49` — `catch { return; }` 未 fail-closed
- **影响**：恶意构造非法 JSON 可绕过 hook 安全检查
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待查重

## #4【P1】EXP-E01 serviceCatalog 路由未命中"云主机"意图

- **现象**：`huaweicloud_service_catalog` 工具对意图"帮我查一下我账号在华北北京四有哪些云主机"返回 `recommendedServices: ["Run hcloud --help to list available services."]`（兜底），未路由到 ECS
- **断言**：意图含"云主机"时，`recommendedServices` 应包含 `"ECS"`
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1978-1981` — `serviceCatalog()` 函数 ECS 路由的 keywords 列表含 `'弹性云服务器'`、`'云服务器'`、`'服务器'`，但缺少 `'云主机'`（华为云控制台及用户常用同义词）
- **影响**：用户使用"云主机"一词时无法正确路由到 ECS 服务，降级为兜底提示
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史复现（见 HISTORY_LINKS.md，关联 #858/#852/#844 等），不重复开单

## #5【P1】D2-12 R10 设计预期 sync 返回 ok:false+suppressed（SPEC-MISMATCH）

- **现象**：runtime 凭据激活（auth_init）状态下 `auth_sync` 返回 `needs_confirmation`（R2 冲突确认流），而非 `ok:false + suppressed`（R10 设计）
- **断言**：runtime 非空时 `auth_sync` 返回 `ok:false + "auto-sync suppressed (R10)"`，不写 S1
- **根因**：`tools.mjs auth_switch handler` — runtime 非空时走 R2 冲突确认流而非 R10 直接拒绝。但 S1 未被写入（R10 仍部分生效）
- **影响**：runtime 激活时 auth_sync 行为与设计契约不一致（应直接拒绝而非触发冲突确认流）
- **证据**：`evidence/D2-12/stdout.log`
- **状态**：待查重

## #6【P2】D8-9 sanitizeValue 不脱敏 AK/SK（SPEC-MISMATCH）

- **现象**：`sanitizeValue("AKABCDEFGHIJKLMNOP")` 返回原文 `"AKABCDEFGHIJKLMNOP"`，仅截断长度/去空白，不脱敏敏感值
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值（设计预期"移除 AK/SK/token 等敏感值与非法字符"）
- **根因**：`telemetry/telemetry.mjs:sanitizeValue` — 仅 `replace(/[\r\n\t]+/g," ").trim()+slice(0,255)`，无敏感字段识别与脱敏逻辑
- **影响**：遥测数据中可能包含 AK/SK 明文，存在信息泄漏风险
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待查重
