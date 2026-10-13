# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-09-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-09 10:56:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1（gitHead ffd7b474）
> **客户端/OS**：OpenCode / Linux aarch64（ECS cn-north-4）

---

## #1【P0】D4-16 命令包裹穿透：risk-rule-engine 未解包 sh -c/eval 内层命令

- **现象**：`huaweicloud_hook_check_command` 底层的 `risk-rule-engine.evaluateCommandRisk` 对 `sh -c "printenv HW_ACCESS_KEY"`、`sh -c "cat credentials.json"` 返回 `decision=allow`（findings 为空），内层高危命令未被识别。非 hook 客户端（OpenCode 为「非 Hook」端）依赖该 MCP 工具做命令预检，可借此绕过凭证泄露拦截。
- **断言**：`evaluateCommandRisk('sh -c "printenv HW_ACCESS_KEY"')` 与 `evaluateCommandRisk('sh -c "cat credentials.json"')` 必须返回 `deny`（发现并拦截内层命令）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:14`（`hwc-command-credential-file` 正则 `(^|\s)(cat|type|...)\s+...`）与 `:35`（`hwc-command-env-dump` 正则 `(^|\s)(env|printenv|...)`）使用 `(^|\s)` 锚点，要求命令动词前是行首/空白；`sh -c "..."` 中动词前是双引号（非空白），故不命中。同时 `risk-rule-engine.mjs` 的 `evaluate()` 仅对原始命令文本做正则匹配，未调用 `safety-policy.mjs:405` 的 `extractInnerCommand` 解包内层命令（safety-policy 层的 `classifyTextCommand` 能解包并 deny，但 MCP 工具路径已切到 risk-rule-engine）。
- **影响**：非 hook 客户端通过 `sh -c`/`eval` 包裹可绕过云凭证环境变量泄露拦截（P0 安全红线）。
- **证据**：`evidence/D4-16/stdout.log`（`sh -c "printenv HW_ACCESS_KEY"` -> allow）
- **状态**：待提单

## #2【P1】D4-17 hook 模糊 fail-open：huaweicloud-safety.mjs 解析畸形输入静默放行

- **现象**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs` 读 stdin JSON 的 `main()` 用 `try { data = JSON.parse(input); } catch { return; }`，当输入为畸形 JSON 或空 tool_input 时静默 `return`，不输出 `permissionDecision=deny`，调用方将空输出视作「放行」。违背「异常输入默认拒绝（fail-closed）」。
- **断言**：畸形 JSON（如 `not-json`）或空 tool_input 输入时应输出 `hookSpecificOutput.permissionDecision=deny`（fail-closed），不得静默放行。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:47-49` — `catch { return; }` 未对解析失败输出 deny 决策。
- **影响**：hook-capable 客户端下，攻击者向 hook 投递畸形/空输入即可令安全 hook 失效放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.log`（`echo 'not-json' | node huaweicloud-safety.mjs` 输出为空）
- **状态**：待提单

## #3【P1】EXP-E01 路由层中文"云主机"关键词缺失（ECS 查询未命中）

- **现象**：D10-3 路由层评测 15 条中 `EXP-E01（帮我查一下我账号在华北北京四有哪些云主机）` 判 MISS，`huaweicloud_service_catalog` 返回默认提示 `Run hcloud --help to list available services.`，未路由到 ECS（本轮准确率 92.9%=13/14，仅此 1 条 MISS）。
- **断言**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 的 `recommendedServices` 应含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1970-1983` — ECS routeMap 的 keywords 含 `弹性云服务器/云服务器/服务器/虚拟机/镜像` 等，但缺「云主机」；意图文本含「云主机」时 `keyword.some(...)` 不命中。
- **影响**：用户以「云主机」表述 ECS 查询时路由层识别失败，需手动指定服务名，体验受影响。
- **证据**：`evidence/EXP-E01/stdout.log`；`eval/results/eval-run-20261009024138.csv`
- **状态**：待提单