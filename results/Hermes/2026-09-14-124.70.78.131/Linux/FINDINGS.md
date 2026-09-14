# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-14-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-14 22:35:00`（北京时间）
> **被测版本**：`v1.1.4-next.3`（npm @next，gitHead `3b6290bca0`，PR `#647`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。每项均含「级别 + 现象 + 断言 + 根因（文件:行号）+ 证据」，根因已源码级定位（safety-policy.mjs / cloud-risk-rules.json / mcp-server.mjs / mcp-protocol.mjs / tools.mjs）。

---

## #1【P0】凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类）

- **现象**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=not_huaweicloud`（应 `deny`）；正对照 `env | grep HUAWEICLOUD_SDK_AK` 正确返回 `deny`。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`（发现华为云凭证 env 并拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` + `plugins/huaweicloud-core/hooks/huaweicloud-safety.py:54` + `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39` — 三处 env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；而 `plugins/huaweicloud-core/src/auth/credentials.mjs:102-104` 恰从 `HW_ACCESS_KEY` / `HW_SECRET_KEY` / `HW_SECURITY_TOKEN` 读取真实凭证。
- **影响**：攻击者可借 env 打印提取华为云凭证明文 AK/SK，凭证红线（I 类）失效。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：已跟踪 #652-1

## #2【P0】env-dump 规则被 shell 包裹穿透（D4-16）

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 均返回 `allow, risk=not_huaweicloud`（应 `deny`）；对照组 `sh -c "hcloud csms ShowSecretVersion ..."`、`sh -c "cat ~/.config/huaweicloud/credentials.json"`、`sh -c "hcloud ecs DeleteServer --force"` 均正确 `deny`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应返回 `deny`（解开 shell 包裹后识别内层 env-dump）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` + `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:33` — env-dump 检测用 `(^|\s)(env|printenv|...)` 词边界匹配原始文本，`sh -c "..."` 包裹使内层 `env` 前为引号而非词边界，正则漏命中；而 destructive-delete / secret-read / credential-file 规则用子串/模式匹配，天然抗包裹，故仅 env-dump 规则被穿透。
- **影响**：shell 包裹绕过 hook，高危 env-dump 凭证提取可穿透预检。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：已跟踪 #652-2

## #3【P0】hook_check_artifacts 未拦截 Terraform HCL 形态 broad IAM 制品（D4-21 补充探针）

- **现象**：`hook_check_artifacts` 对 `resource "huaweicloud_iam_policy" "adm" { ... statement { effect="Allow" actions = ["*"] resources=["*"] } }` 返回 `decision=allow`、`findings` 为空（应 `deny`）；`data "huaweicloud_iam_policy" ... { name = "AdministratorFullAccess" }` 同样 `allow`。对照 JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`（D4-21 主断言 PASS）。
- **断言**：Terraform HCL `actions = ["*"]` 的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179`（规则 `hwc-iam-admin-policy`）+ 其 regex `(\"Action\"\s*:\s*(\"(\*|\*:\*)\"|\[...)|Action\s*[=:]\s*(\*|\*:\*)|AdministratorAccess|FullAccess)` 只覆盖 JSON 大小写匹配的 `"Action":"*"` / `Action=*` / `AdministratorAccess` / `FullAccess`，未覆盖 HCL 小写复数 `actions = ["*"]` 及 `AdministratorFullAccess` 后缀。
- **影响**：Terraform IaC 制品 broad IAM（授予所有动作 / 管理员权限）绕过 `hook_check_artifacts` 预检。
- **证据**：`evidence/D4-21/hcl-probe.mjs` + `evidence/D4-21/stdout.log`
- **状态**：已跟踪 #652-3

## #4【P1】JSON-RPC 错误码未区分 -32601 / -32602（D9-2）

- **现象**：`tools/call` 未知 method 返回 `{"code":-32603,"message":"Unsupported method: ..."}`；未知 tool 返回 `{"code":-32603,"message":"Unknown tool: ..."}`（应分别 `-32601` / `-32602`）。
- **断言**：未知 method 应返回 `-32601`（Method not found）；未知 tool 应返回 `-32602`（Invalid params）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` + `plugins/huaweicloud-core/src/mcp-protocol.mjs:95` + `plugins/huaweicloud-core/src/tools.mjs:1455` — `handleMessage` 的 catch 对所有 `dispatch` 异常硬编码 `code:-32603`，`Unsupported method` / `Unknown tool` 抛出的异常未携带可区分错误码，被统一吞成 `-32603`。
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，错误处理语义失真。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：已跟踪 #652-4 / #638