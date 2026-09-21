# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-22-113.44.143.91/Linux/FINDINGS.md`
> **生成时间**：2026-09-22 05:30 CST（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.6-next.0（npm @next，gitHead faaefb8f）
> **本清单是统一提单脚本的解析输入**，格式严格遵循 `## #N【级别】标题`（标题必带用例号）+ `- **根因**：` + `- **断言**：`。
> **相对 v1.1.5 变化**：D4-17（hook 模糊 fail-open）已被 #564「risk engine fails closed on malformed input」修复 → 本轮 PASS，不再列入。

---

## #1【P0】D2-4 凭证脱敏不完整（小写 ak=/sk= 明文泄漏）

- **现象**：`redactSecrets({ak:'AKID12345678', sk:'SKTEST1234567890abcdef1234'})` 对裸 `ak`/`sk` 键不脱敏；字符串 `ak=AKID12345678 sk=SK1234567890abcdef` 返回原文（`show_profile_redacted` 路径输出明文 AK/SK）。
- **断言**：`redactSecrets` 输出不得含明文 AK/SK（`ak=`/`sk=` 小写与裸键均须 `<redacted>`）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45` — `redactString` 的 `(AK|SK)\s*[:=]` 正则大小写敏感（缺 `i`），且 `isSecretKeyName`(20-32) 的 secretKeyNamePatterns 不含裸 `ak`/`sk` 键名。
- **影响**：凭证明文进入 agent 上下文，违反「输出无明文凭证」安全基线（P0）。
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json 实测泄漏）。

## #2【P0】D4-16 命令包裹穿透（sh -c 包裹 env-dump 未拦截）

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision=allow`；直接 `printenv HUAWEICLOUD_ACCESS_KEY_ID` 才返回 `deny`。
- **断言**：`sh -c`/`bash -c` 包裹的凭证 env-dump 命令仍须被拦截（deny），不得 allow。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:384-419` — `classifyTextCommand` 的 env-dump 门 `(^|\s)(env|printenv…)` 不拆 shell 包裹（未覆盖文本命令 env-dump 的 shell 缠绕）。
- **影响**：凭证环境变量可经 shell 包裹绕过安全钩子读取（P0）。
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh FAIL=allow）。

## #3【P0】D4-23 全局规则 huawei-agent-rules 注入未生效

- **现象**：`rules/huawei-agent-rules.mdc` 仅存在于仓库根，`install`/hook 代码无任何 `agent-rules`/`huawei-agent-rules` 注入引用，11 个安装目标均不写盘注入该全局规则。
- **断言**：11 个 Agent 安装目标均须注入 `huawei-agent-rules.md` 且约束可执行。
- **根因**：`plugins/huaweicloud-core/src|bin` 无 agent-rules 注入逻辑（grep 零引用）；文件以 `.mdc` 静置仓库根，未接入 install/setup 流程。
- **影响**：全局安全规则对 11 客户端不生效，禁直连 csms/kms 等 MUST 约束落空（P0）。
- **证据**：`evidence/_p0remaining-probe.mjs`（injection-wired FAIL=无注入引用）。

## #4【P1】D4-27 双路径输出脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets` 与 `redactOutput` 双路径对小写 `ak=`/`sk=` 均不脱敏（大写 `AK=`/`SK=` 可脱敏、小写 `ak=` 泄漏）。
- **断言**：redactSecrets(策略正则) 与 redactOutput(CLI 输出) 双路径均替换明文凭证占位符，不对非敏感字段误伤。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45` + `hcloud-cli.mjs` redactOutput — 与 D2-4 同源（`(AK|SK)` 正则缺 `i`）。
- **影响**：只读命令输出中的小写 ak/sk 明文泄漏（P1，与 D2-4 同根因）。
- **证据**：`evidence/deep-probe.stdout.log`（redactSecrets-lower-ak FAIL）。

## #5【P1】D10-3 路由准确率 21.4%（中文意图路由大面积缺失）

- **现象**：`run-eval.mjs` 评测集 15 条中文意图，HIT=3 / MISS=11 / N/A=1，准确率 21.4%（<90%）；EXP-E01~E15 中 11 条 MISS。
- **断言**：serviceCatalog 中/英文意图均命中对应服务，路由准确率 ≥90%，错路由可定位。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1778-1886` — routeMap 中文自然语言意图路由规则缺失（多返回 "Run hcloud --help to list available services."）。
- **影响**：Agent 无法正确路由中文任务到服务，复合意图不拆多服务（P1）。展开级 11 条 EXP-E（E01/02/03/04/05/07/10/11/12/13/14）为本缺陷的展开级表现。
- **证据**：`eval/results/eval-run-20260921210948.csv`（MISS=11，准确率 21.4%）。

## #6【P1】D9-2 JSON-RPC 非法参数无 -32602 错误对象

- **现象**：未知方法返回 `-32601` 正确；但非法参数调用（`tools/list` 传 string params）无 `error` 对象（应 `-32602`）。
- **断言**：protocol-probe 注入非法参数应返回 JSON-RPC error 对象 `{code:-32602, message}`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46-77` — invalid params 分支未构造 -32602 error 对象。
- **影响**：协议客户端无法区分参数错误与其它失败（P1）。
- **证据**：`eval/results/protocol-probe-20260921210953.json`（D9-2b-invalid-params FAIL=无 error 对象）。

## #7【P1】D3-S3 沙箱预览 URL 未就绪（deploy_check nginx_serving FAIL）

- **现象**：sandbox connect 成功（ws 建立），deploy_nginx ok=true，但 `deploy_check` 返回 `checks.nginx_serving.status=FAIL`、`complete=false`，公网预览 URL 未确认可访问。
- **断言**：终点必返回可访问公网 URL（HTTP 200 / nginx_serving PASS）。
- **根因**：沙箱 deploy 链 `deploy_check` nginx_serving 状态 FAIL（预览服务未就绪）。
- **影响**：沙箱预览场景终点不可达（P1）。
- **证据**：`evidence/_scenarios3-probe.mjs` 输出（deploy-check-url nginx_serving=FAIL）。

## #8【P2】D4-25 Python hook 写命令遥测分类错误（cli:invoke ≠ cli:write）

- **现象**：`hcloud ECS DeleteServers`、`hcloud VPC CreateVpc` 被 `record_cli_event` 分类为 `cli:invoke`，预期 `cli:write`。
- **断言**：只读→cli:read、写→cli:write、其他→cli:invoke 三态正确。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46/95` — write 分类正则未匹配 service 前缀命令。
- **影响**：hook-events.jsonl 遥测写命令分类失真（P2）。
- **证据**：`evidence/_d4s25-probe.py` 输出（write-delete/write-create FAIL=cli:invoke）。

## #9【P2】D4-26 findings 证据脱敏漏小写 ak=/sk=

- **现象**：`risk-rule-engine.mjs` 的 `redactEvidence`（内部函数，非导出）对小写 `ak=`/`sk=` 不脱敏，findings.evidence 含明文。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:25` — `(AK|SK)\s*[:=]` 正则缺 `i`（与 D2-4 同源）。
- **影响**：高危触发证据中第三凭证明文泄漏（P2）。
- **证据**：`evidence/deep-probe.stdout.log`（redactEvidence 逻辑同 D2-4 根因，lower ak/sk 泄漏实测）。

## #10【P2】D8-9 sanitizeValue 不脱敏凭证

- **现象**：`sanitizeValue('ak=AKID12345678 token=abc')` 返回原文（仅 trim/截断），AK/token 明文未移除。
- **断言**：sanitizeValue 移除 AK/SK/token 等敏感值，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` — 仅 `replace/trim/截断`，无凭证脱敏。
- **影响**：遥测事件值中第三凭证明文上报（P2）。
- **证据**：`evidence/deep-probe.stdout.log`（sanitize-cred FAIL）。

## #11【P2】D8-1 文档与实现工具数漂移（39 vs 40）

- **现象**：`AGENTS.md`/文档声称 "39 tools in tools.mjs"，实际 `tools/list` 返回 40 工具。
- **断言**：文档与能力一致，无失效链接/过时命令/工具数漂移。
- **根因**：文档未随 tools.mjs 增加第 40 个工具同步更新。
- **影响**：文档误导代理对工具集规模的认知（P2）。
- **证据**：`evidence/_p0remaining-probe.mjs`（tool-count-doc-vs-impl FAIL doc=39 actual=40）。

## #12【P2】D3-S5 复合意图分层路由不拆多服务

- **现象**：复合意图「存储+网站托管」只命中 Sandbox/DevStation，漏 OBS；单一 ECS 意图返回 "Run hcloud --help"（MISS）。
- **断言**：复合意图正确拆分并命中多个对应 service，分层推荐按预览/生产分流。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap（与 D10-3 同源：中文意图路由缺失 + 复合意图不拆分）。
- **影响**：复合意图只路由到单一服务，多服务编排能力缺失（P2）。
- **证据**：`evidence/_d3s5-probe.mjs` 输出（composite-obs+sandbox FAIL、single-ecs FAIL）。

## #13【P1】D9-9 tools/call 取消能力未声明（SPEC-MISMATCH）

- **现象**：`initialize.result.capabilities` 未声明 `notifications.cancellation`。
- **断言**：能力探测读 initialize.result.capabilities.notifications/cancellation 是否存在（不存在→SPEC-MISMATCH）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:63` — capabilities 未声明 cancellation。
- **影响**：协议客户端无法依赖取消能力（契约漂移，待裁决）。
- **证据**：`eval/results/protocol-probe-20260921210953.json`（D9-9a-capabilities.cancellation SPEC-MISMATCH）。

## #14【P1】D4-24 确认令牌精确 JSON 契约未实现（SPEC-MISMATCH）

- **现象**：`auth_confirm` 过期/重复确认均抛通用 `Error('confirmToken not found or expired.')`，未返回精确 JSON（`{status:'rejected', code:'CONFIRM_TOKEN_EXPIRED'}` / `{outcome:'already_processed'}`）。
- **断言**：过期提交→`{status:'rejected', code:'CONFIRM_TOKEN_EXPIRED'}`；同 token 重复→第二次 `{status:'ok', outcome:'already_processed'}`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` auth_confirm 分支 — 无 CONFIRM_TOKEN_EXPIRED/already_processed 字段实现，仅 `pendingConfirms.get` 未命中即抛通用 Error。
- **影响**：审批流令牌过期/重放的机器可断言契约缺失（契约漂移，待裁决）。
- **证据**：`evidence/d4-security/stdout.log`（D4-24 confirm-write 浅层通过）+ 源码 tools.mjs auth_confirm 分支 vs 用例预期契约。

---

> 合计 14 项缺陷（P0×3 / P1×4 / P2×5 / SPEC-MISMATCH×2）；其中 D2-4 / D4-26 / D4-27 三项同根因（大小写敏感脱敏正则缺 `i`），D10-3 / D3-S5 两项同根因（routeMap 中文路由缺失）。相对 v1.1.5，D4-17（fail-open）已修复不再列出。