# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-15-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-15 13:14`（北京时间）
> **被测版本**：`v1.1.4`（npm latest 正式版，gitHead `9b67256e`，release PR `#669`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。
> **结论**：5 项缺陷在 `v1.1.4` GA 复现/发现。其中 #1–#4 为已知缺陷（已跟踪 #652），#5（D4-17 fail-open）为本轮新发现，需提单。

---

## #1【P0】凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2）

- **现象**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=not_huaweicloud`（应 `deny`）；正对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确返回 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（发现华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336`（`/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀）+ `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39` + `plugins/huaweicloud-core/hooks/huaweicloud-safety.py:53-54` 三处同源缺口；而 `plugins/huaweicloud-core/src/auth/credentials.mjs:130-132` 恰从 `HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN` 读取真实凭证。
- **影响**：攻击者可借 env 打印提取华为云凭证明文 AK/SK，凭证红线（I 类）失效。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：已跟踪 #652-1（v1.1.4 复现确认，不重复提单）

## #2【P0】env-dump 规则被 shell 包裹穿透（D4-16）

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 均返回 `allow, risk=not_huaweicloud`（应 `deny`）；对照组 `sh -c "hcloud csms ShowSecretVersion ..."`、`sh -c "cat ~/.config/huaweicloud/credentials.json"`、`sh -c "hcloud ecs DeleteServer --force"` 均正确 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（解开 shell 包裹后识别内层 env-dump）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` + `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:35` — env-dump 检测 `(^|\s)(env|printenv|...)` 词边界匹配原始文本，`sh -c "..."` 包裹使内层 `env` 前为引号而非词边界，正则漏命中；而 destructive-delete/secret-read/credential-file 规则用子串/模式匹配，天然抗包裹。
- **影响**：shell 包裹绕过 hook，高危 env-dump 凭证提取可穿透预检。
- **证据**：`evidence/D4-16/stdout.log`（含 `wrap-probe.mjs` 补充探针）
- **状态**：已跟踪 #652-2（v1.1.4 复现确认，不重复提单）

## #3【P0】hook_check_artifacts 未拦截 Terraform HCL 形态 broad IAM 制品（D4-21）

- **现象**：`evaluateArtifacts` 对 `resource "huaweicloud_iam_policy" "adm" { ... statement { effect="Allow" actions = ["*"] resources=["*"] } }` 返回 `decision=allow`、`findings` 空（应 `deny`）；`data "huaweicloud_iam_policy" ... { name = "AdministratorFullAccess" }` 同样 `allow`。对照 JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179`（规则 `hwc-iam-admin-policy`）——regex 只覆盖 JSON 形态 `"Action":"*"`/`Action=*`/`AdministratorAccess`/`FullAccess`，未覆盖 HCL 小写复数 `actions = ["*"]` 与 `AdministratorFullAccess` 后缀。
- **影响**：Terraform IaC 制品 broad IAM 绕过 `hook_check_artifacts` 预检。
- **证据**：`evidence/D4-21/hcl-probe.mjs` + `evidence/D4-21/stdout.log`
- **状态**：已跟踪 #652-3（v1.1.4 复现确认，不重复提单）

## #4【P1】JSON-RPC 错误码未区分 -32601 / -32602（D9-2）

- **现象**：`tools/call` 未知 method 返回 `{"code":-32603,"message":"Unsupported method: __no_such_method__"}`；未知 tool 返回 `{"code":-32603,"message":"Unknown tool: __no_such_tool__"}`（应分别 `-32601`/`-32602`）。
- **断言**：未知 method 应返回 `-32601`（Method not found）；未知 tool 应返回 `-32602`（Invalid params）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169`（`handleMessage` catch 对所有 `dispatch` 异常硬编码 `code:-32603`）+ `plugins/huaweicloud-core/src/mcp-protocol.mjs:95` + `plugins/huaweicloud-core/src/tools.mjs:1485`——异常未携带可区分错误码，被统一吞成 -32603。
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，错误处理语义失真。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：已跟踪 #652-4 / #638（v1.1.4 复现确认，不重复提单）

## #5【P1】hook_check_artifacts 对畸形输入 fail-open（D4-17，本轮新发现）

- **现象**：`hook_check_artifacts` 对畸形 JSON `{ bad json ~~~`、超长 JSON（2000 项 Statement）、深嵌套 JSON（200 层）均返回 `decision=allow`、`findings` 空、`ok=true`（未崩溃，但默认放行）；对照组合法宽泛 IAM `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确返回 `deny`（`hwc-iam-admin-policy`）。
- **断言**：畸形/无法解析的制品输入应默认 `deny`（fail-closed，不误放行），而非 `allow`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无任何规则命中（含无法解析的畸形输入）时**默认返回 `allow`**，缺少 fail-closed 兜底（应默认 `deny` 或返回解析错误）。
- **影响**：无法解析/规则未命中的制品在预检阶段被放行（fail-open），与 #3（规则未覆盖形态）叠加放大绕过面。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单