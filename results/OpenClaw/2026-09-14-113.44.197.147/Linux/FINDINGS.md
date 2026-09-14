# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-09-14-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-14 23:58（北京时间）
> **SUT 版本**：`v1.1.4-next.6`（npm @next，gitHead `69ac7279`，PR #663）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。
>
> **提单状态**：本轮 7 项缺陷与 next.3 合并单 `#650/#651/#652` 及 next.6 合并单 `#673/#674/#675/#676` 逐条对应，属**已提单**缺陷（同一 SUT，非新增），故不重复拆单。各缺陷标注对应单号。

---

## #1【P0】凭证 env 打印拦截不完整（HW_ 前缀未覆盖）

- **现象**：`printenv HW_ACCESS_KEY` 与 `env | grep HW_SECRET_KEY` 均返回 `allow`（应拦截）；`HUAWEICLOUD_ACCESS_KEY_ID` 前缀可正常拦截。
- **断言**：`classifyTextCommand('printenv HW_ACCESS_KEY')` 应返回 `decision=deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀（STS 临时凭证环境变量名 `HW_ACCESS_KEY`/`HW_SECRET_KEY`）。
- **影响**：运行态 STS 临时凭证可被 `env`/`printenv` 明文打印，凭证泄漏安全风险（红线 I 类）。
- **证据**：`evidence/d4-security-core/probe-p0-security.log`
- **状态**：已提单 #651（项5）/ #652（项1）/ #673（项1）/ #674（项1）/ #676（项2）

## #2【P0】命令包裹穿透（sh -c wrapper 内层命令未二次检测）

- **现象**：`sh -c "env | grep HUAWEICLOUD"` 返回 `allow`（应 `deny`）；`bash -c "cat ~/.config/huaweicloud/credentials.json"` 可正常拦截。
- **断言**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD"')` 应返回 `decision=deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:334-337` 的 `(^|\s)(env|printenv|...)` 不命中 wrapper 引号内 `env`，且函数未抽取 wrapper 内层命令二次检测。
- **影响**：攻击者可用 `sh -c`/`bash -c` 包裹规避凭证 dump 拦截，安全绕过。
- **证据**：`evidence/d4-security-core/probe-p0-security.log`
- **状态**：已提单 #651（项6）/ #652（项2）/ #674（项2）

## #3【P0】制品预检未检出 broad IAM policy（HCL actions=["*"] 未覆盖）

- **现象**：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }'}])` 返回 `findings=[]`（未检出）；JSON 形式 `"Action":"*"` 可检出。
- **断言**：broad IAM policy 制品（Terraform HCL `actions = ["*"]`）应检出 findings 长度 > 0。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:188-196` `hwc-iam-admin-policy` 的 Action 正则仅匹配 JSON 形式（`"Action":"*"` / `Action = *`），不匹配 Terraform HCL `actions = ["*"]` 块语法。
- **影响**：IaC 制品中的 broad IAM 授权漏检，最小权限红线失效。
- **证据**：`evidence/d4-security-core/probe-p0-security.log`
- **状态**：已提单 #651（项1）/ #673（项3）/ #674（项3）

## #4【P0】全局规则 huawei-agent-rules.mdc 注入失效（11 安装目标）

- **现象**：`package.json` `files` 白名单（`package.json:8-18`）不含 `rules/`，npm 包及全局安装目录均无 `huawei-agent-rules.mdc`；`setup-cli.mjs` 0 处引用 `rules/`/`.mdc`/`agent-rules`；安装目标无注入的规则文件。
- **断言**：`package.json` `files` 白名单应含 `rules`，且 `setup-cli` 应引用并注入 `huawei-agent-rules.mdc` 到 11 个安装目标。
- **根因**：`package.json:8-18`（files 白名单缺 `rules`）+ `plugins/huaweicloud-core/src/setup-cli.mjs`（无 `rules/`/`.mdc` 引用）。
- **影响**：全局安全规则未注入任何 agent 客户端，安全引导失效。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.log`
- **状态**：已提单 #651（项8）/ #673（项3）/ #674（项4）/ #676（项6）

## #5【P1】adminPass 空格形式回显未脱敏

- **现象**：`--adminPass Secret123`（空格分隔）未脱敏，明文 `Secret123` 出现在 `plan_cli_command` 返回的 args；`--adminPass=Secret123`（等号）可正常脱敏。
- **断言**：`huaweicloud_plan_cli_command` 对 `--adminPass Secret123` 返回的 args 不应含明文 `Secret123`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 正则 `((?:...|adminPass)...)\s*[:=]\s*(...)` 只覆盖 `=`/`:` 分隔，KooCLI 空格形式 `--adminPass xxx` 不命中。
- **影响**：口令参数明文回显，弱化脱敏保护。
- **证据**：`evidence/d4-security-core/probe-d4-6-adminpass.log`
- **状态**：已提单 #651（项2 hook 层同族）/ #673（项4 hook 层，触发路径不同）

## #6【P1】hook 三工具之一（hook_check_artifacts）broad IAM 失效

- **现象**：`huaweicloud_hook_check_artifacts` 对 `actions = ["*"]` 返回 `decision=allow`（应 `deny`）。
- **断言**：`hook_check_artifacts` 对 broad IAM 制品（HCL `actions = ["*"]`）应返回 `decision=deny`。
- **根因**：同 #3，`cloud-risk-rules.json:188-196` 未覆盖 HCL 形式。
- **证据**：`evidence/d4-security-core/probe-d4-7-hooks.log`
- **状态**：已提单 #651（项1）/ #673（项3）/ #674（项3）

## #7【P1】JSON-RPC 未知方法错误码未区分（-32601 缺失）

- **现象**：未知方法 `nonexistent/method` 被服务端统一捕获返回 `code: -32603`（Internal Error），未映射 `-32601`（Method not found）。
- **断言**：未知方法应返回 `-32601`（Method not found）而非 `-32603`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` catch 统一硬编码 `code: -32603`；`mcp-protocol.mjs:95` `dispatch()` 抛 `Unsupported method` 但未映射 `-32601`。
- **影响**：客户端无法区分「方法不存在」与其他内部错误，协议合规性差。
- **证据**：`evidence/d9-protocol/probe-d9-mcp-protocol.log`
- **状态**：已提单 #651（项9）/ #652（项4）/ #676（项7）

---

## 补充说明：缺陷去重结论

本轮 7 项 FAIL 缺陷均有明确根因（`文件:行号`）+ 复现证据，与早期 next.3 合并单（`#650/#651/#652`）及同行 next.6 合并单（`#673/#674/#675/#676`）逐条对应。经核对，这些缺陷在 next.6（gitHead `69ac7279`, PR #663）中均末修复，属**同一 SUT 已在跟踪缺陷**，故不重复拆单（遵循「全量测完统一提单、勿拆单、勿重复拆单」红线）。