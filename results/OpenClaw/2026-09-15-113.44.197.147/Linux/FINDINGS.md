# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-09-15-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-15 09:35（北京时间）
> **被测版本**：`v1.1.4`（npm latest 正式版，gitHead `9b67256`，PR #669 release-1.1.4）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。
>
> **提单状态**：本轮 7 项缺陷与既有 open issue 逐条对应，属**已提单**缺陷（同一 SUT 缺陷族在 1.1.4 正式版中仍未修复，无新增缺陷），故依据「勿重复拆单」红线不重复提单。各缺陷标注对应单号。

---

## #1【P0】凭证 env 打印拦截不完整（HW_ 前缀未覆盖）

- **现象**：`classifyTextCommand('printenv HW_ACCESS_KEY')` 与 `classifyTextCommand('env | grep HW_SECRET_KEY')` 均返回 `decision=allow`（应拦截）；`HUAWEICLOUD_ACCESS_KEY_ID` 前缀可正常拦截。
- **断言**：`classifyTextCommand('printenv HW_ACCESS_KEY').decision` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` env-dump 判定正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖华为云 Terraform 官方凭证 env 前缀 `HW_ACCESS_KEY`/`HW_SECRET_KEY`。
- **影响**：运行态 AK/SK 可经 `env`/`printenv` 明文打印，凭证泄漏安全风险（红线 I 类）。
- **证据**：`evidence/d4-security-core/probe-p0-security.mjs.stdout.log`
- **状态**：已提单 #651(项5)/#652(项1)/#673(项1)/#674(项1)/#676(项2)/#679(项1)/#681(项1)

## #2【P0】命令包裹穿透（sh -c wrapper 内层命令未二次检测）

- **现象**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD"')` 返回 `decision=allow`（应 `deny`）；`bash -c "cat ~/.config/huaweicloud/credentials.json"` 可正常拦截。
- **断言**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD"').decision` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` 的 `(^|\s)(env|printenv|...)` 不命中 wrapper 引号内 `env`，且函数未抽取 wrapper 内层命令二次检测。
- **影响**：攻击者可用 `sh -c`/`bash -c` 包裹规避凭证 dump 拦截，安全绕过。
- **证据**：`evidence/d4-security-core/probe-p0-security.mjs.stdout.log`
- **状态**：已提单 #651(项6)/#652(项2)/#674(项2)/#676(项4)/#681(项2)/#682(项2)

## #3【P0】制品预检未检出 broad IAM policy（Terraform HCL `actions = ["*"]` 未覆盖）

- **现象**：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }'}])` 返回 `findings=[]`（未检出）；JSON 形式 `"Action":"*"` 可检出。
- **断言**：broad IAM policy 制品（Terraform HCL `actions = ["*"]`）应检出 findings 长度 > 0。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:188-196` `hwc-iam-admin-policy` 的 Action 正则仅匹配 JSON 形式（`"Action":"*"` / `Action=*`），不匹配 Terraform HCL `actions = ["*"]` 块语法。
- **影响**：IaC 制品中的 broad IAM 授权漏检，最小权限红线失效。
- **证据**：`evidence/d4-security-core/probe-p0-security.mjs.stdout.log`
- **状态**：已提单 #651(项1)/#652(项3)

## #4【P0】全局规则 huawei-agent-rules.mdc 注入失效（11 安装目标）

- **现象**：`package.json` `files` 白名单（`package.json:8-18`）不含 `rules/`；安装目标无注入的规则文件；`setup-cli.mjs` 0 处引用 `rules/`/`.mdc`/`agent-rules`。
- **断言**：`package.json` `files` 白名单应含 `rules`，且安装目标应注入 `huawei-agent-rules`。
- **根因**：`package.json:8-18`（files 白名单缺 `rules`）+ `plugins/huaweicloud-core/src/setup-cli.mjs`（无 `rules/`/`.mdc` 引用）。
- **影响**：全局安全规则未注入任何 agent 客户端，安全引导失效。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.mjs.stdout.log`
- **状态**：已提单 #651(项8)/#673(项3)/#674(项4)/#676(项6)/#679(项3)

## #5【P1】adminPass 空格形式回显未脱敏

- **现象**：`huaweicloud_plan_cli_command(['ECS','CreateServers','--adminPass','Secret123',...])` 返回的 args 含明文 `Secret123`；`--adminPass=Secret123`（等号）可正常脱敏。
- **断言**：`plan_cli_command` 对 `--adminPass Secret123` 返回的 args 不应含明文 `Secret123`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 正则 `((?:...|adminPass)...)\s*[:=]\s*(...)` 只覆盖 `=`/`:` 分隔，KooCLI 空格形式 `--adminPass xxx` 不命中。
- **影响**：口令参数明文回显，弱化脱敏保护。
- **证据**：`evidence/d4-security-core/probe-d4-6-adminpass.mjs.stdout.log`
- **状态**：已提单 #651(项2 hook 层同族)/#673(项4 hook 层同族)/#679(项5 hook 层)

## #6【P1】hook 三工具之一（hook_check_artifacts）broad IAM 失效

- **现象**：`huaweicloud_hook_check_artifacts` 对 `actions = ["*"]` 制品返回 `decision=allow`（应 `deny`）。
- **断言**：`hook_check_artifacts` 对 broad IAM 制品（HCL `actions = ["*"]`）应返回 `decision=deny`。
- **根因**：同 #3，`cloud-risk-rules.json:188-196` 未覆盖 HCL 形式。
- **证据**：`evidence/d4-security-core/probe-d4-7-hooks.mjs.stdout.log`
- **状态**：已提单 #651(项1)/#652(项3)

## #7【P1】JSON-RPC 未知方法错误码未区分（-32601 缺失）

- **现象**：未知方法 `nonexistent/method` 被服务端统一捕获返回 `code: -32603`（Internal Error），未映射 `-32601`（Method not found）。
- **断言**：未知方法应返回 `-32601`（Method not found）而非 `-32603`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` catch 统一硬编码 `code: -32603`；`mcp-protocol.mjs:95` `dispatch()` 抛 `Unsupported method` 但未映射 `-32601`。
- **影响**：客户端无法区分「方法不存在」与其他内部错误，协议合规性差。
- **证据**：`evidence/d9-protocol/probe-d9-mcp-protocol.mjs.stdout.log`
- **状态**：已提单 #651(项9)/#652(项4)/#674(项7)/#676(项7)

---

## 补充说明：缺陷去重结论

本轮 7 项 FAIL（4 P0 + 3 P1）均有明确根因（`文件:行号`）+ 复现证据，与已开出的 open issue 逐条对应，属**同一 SUT 缺陷族在 v1.1.4 正式版中仍未修复**（非新增），故依据红线「勿重复拆单」不重复提单。已通过网络逐条核对 open issue（#651/#652/#673/#674/#676/#679/#681/#682）的标题与根因字段，映射见各条「状态」标注。