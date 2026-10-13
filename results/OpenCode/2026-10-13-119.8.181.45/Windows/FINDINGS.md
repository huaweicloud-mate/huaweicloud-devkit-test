# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-13-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-13 20:34:49（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D4-16 命令包裹穿透（sh -c/eval 内层凭证泄露命令未被识别）

- **现象**：构造 shell 包裹命令 `sh -c "printenv HW_ACCESS_KEY"`、`sh -c "cat credentials.json"`、`eval "env"` 时，risk-rule-engine `evaluateCommandRisk` 与 `hook_check_command` 内层命令未被识别，未返回 `deny`
- **断言**：risk-rule-engine / hook_check_command 对 `sh -c "..."` / `eval "..."` 包裹的内层凭证泄露命令必须返回 `deny`（识别内层命令）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:14/35` — 规则锚点 `^|\s` 不匹配 `sh -c "..."` 内层命令；`risk-rule-engine.mjs` `evaluate` 未复用 `safety-policy.mjs` `extractInnerCommand` 做 shell 包裹拆解
- **影响**：攻击者可通过 shell 包裹绕过安全检查执行任意高危命令，安全风险高
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P0】D4-17 hook 对非法/截断 stdin JSON fail-open

- **现象**：hook `huaweicloud-safety.mjs` 收到非法（`not-json`）或截断（`{"tool_input":`）的 stdin JSON 时，catch 块静默 `return`，不输出 `permissionDecision: deny`
- **断言**：异常输入应 fail-closed（输出 deny 决策），不得静默放行
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:47` — `catch { return; }` 未 fail-closed
- **影响**：恶意构造非法 JSON 可绕过 hook 安全检查
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单

## #3【P0】D4-3 csms show-secret/download-secret 被分类为 read_only 未拦截（SPEC-MISMATCH）

- **现象**：`hcloud csms download-secret --secret-id 123` / `hcloud csms show-secret --secret-name xx` 被 `safety-policy.classifyTextCommand` 分类为 read_only/unknown，未被 deny。agent-rules.md 规定 MUST NOT call csms show-secret/download-secret
- **断言**：`hcloud csms show-secret` / `hcloud csms download-secret` 应被 safety-policy deny
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` `classifyTextCommand` — csms show-secret/download-secret 未列入 deny 规则集
- **影响**：可通过 csms 命令读取密钥明文，绕过安全策略
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #4【P1】D2-12 R10 设计预期 sync 返回 ok:false+suppressed，实际返回 needs_confirmation（SPEC-MISMATCH）

- **现象**：runtime 凭据激活（auth_init）状态下 `auth_switch persist` 返回 `needs_confirmation`（R2 冲突确认流），而非 R10 设计的 `ok:false + auto-sync suppressed`
- **断言**：runtime 非空时 persist/sync 应返回 `ok:false + "auto-sync suppressed (R10)"`，不写 S1、不触发冲突确认流
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` auth_switch handler — runtime 非空时走 R2 冲突确认流而非 R10 直接拒绝（但 S1 未被写入，R10 仍部分生效）
- **影响**：runtime 激活时 auth_switch 行为与设计契约不一致
- **证据**：`evidence/D2-12/stdout.log`
- **状态**：待提单

## #5【P2】D8-9 sanitizeValue 不脱敏 AK/SK（SPEC-MISMATCH）

- **现象**：`sanitizeValue("AKABCDEFGHIJKLMNOP")` 返回原文，仅 `replace(/[\r\n\t]+/g," ").trim()+slice(0,255)`，不脱敏敏感值
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值（设计预期「移除 AK/SK/token 等敏感值与非法字符」）
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue` — 无敏感字段识别与脱敏逻辑
- **影响**：遥测数据中可能含 AK/SK 明文，存在信息泄漏风险
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #6【P1】EXP-E01 serviceCatalog 路由未命中「云主机」意图

- **现象**：`huaweicloud_service_catalog` 对意图「帮我查一下我账号在华北北京四有哪些云主机」返回兜底 `recommendedServices: ["Run hcloud --help to list available services."]`，未路由到 ECS
- **断言**：意图含「云主机」时，`recommendedServices` 应包含 `"ECS"`
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1987-2000` — `routeMap` ECS 路由 keywords 含 `'弹性云服务器'`、`'云服务器'`、`'服务器'`、`'虚拟机'`、`'镜像'`，缺少 `'云主机'`（华为云控制台及用户常用同义词）
- **影响**：用户使用「云主机」一词时无法路由到 ECS，降级为兜底提示
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单