# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-09-15-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-15 18:30（北京时间）
> **被测版本**：`v1.1.4`（npm latest 正式版，gitHead `9b67256`，PR #669 release-1.1.4）
> **工具全集**：40（`tools.mjs` TOOL_DEFINITIONS）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格。

## 去重结论（本轮先读）

8 项 FAIL（设计级）均在 `v1.1.4` 正式版实测复现。经上游 `huaweicloud/huaweicloud-devkit` open issue 逐条核对：

- **历史同源（不重复提单）**：`D4-2`/`D4-16`/`D4-21`/`D4-23`/`D4-6`/`D4-7`/`D9-2` 共 7 项，与既有 open issue #651/#652/#673/#674/#676/#679/#681/#682 对应（同根因字段）。
- **已提单**：`D10-3` 中文意图路由缺陷，与 Hermes 客户端已开出的 **#689**（"中文意图路由未命中（serviceCatalog 英文关键词）"）为同根因，本客户端复核复现（准确率 21.4%），按红线「勿重复拆单」不新开单。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整（HW_ 前缀未覆盖）

- **现象**：`classifyTextCommand('printenv HW_ACCESS_KEY')` 与 `classifyTextCommand('env | grep HW_SECRET_KEY')` 均返回 `decision=allow`（应拦截）；`HUAWEICLOUD_ACCESS_KEY_ID` 前缀可正常拦截。
- **断言**：`classifyTextCommand('printenv HW_ACCESS_KEY').decision` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` env-dump 判定正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖华为云 Terraform 官方凭证 env 前缀 `HW_ACCESS_KEY`/`HW_SECRET_KEY`。
- **影响**：运行态 AK/SK 可经 `env`/`printenv` 明文打印，凭证泄漏安全风险（红线 I 类）。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：已跟踪 #651(项5)/#652(项1)/#673(项1)/#674(项1)/#676(项2)/#679(项1)/#681(项1)

## #2【P0】D4-16 命令包裹穿透（sh -c wrapper 内层命令未二次检测）

- **现象**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD"')` 返回 `decision=allow`（应 `deny`）；`bash -c "cat ~/.config/huaweicloud/credentials.json"` 可正常拦截。
- **断言**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD"').decision` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` 的 `(^|\s)(env|printenv|...)` 不命中 wrapper 引号内 `env`，且函数未抽取 wrapper 内层命令二次检测。
- **影响**：攻击者可用 `sh -c`/`bash -c` 包裹规避凭证 dump 拦截，安全绕过。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：已跟踪 #651(项6)/#652(项2)/#674(项2)/#676(项4)/#681(项2)/#682(项2)

## #3【P0】D4-21 制品预检未检出 broad IAM policy（Terraform HCL `actions = ["*"]` 未覆盖）

- **现象**：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }'}])` 返回 `findings=[]`（未检出）；JSON 形式 `"Action":"*"` 可检出。
- **断言**：broad IAM policy 制品（Terraform HCL `actions = ["*"]`）应检出 findings 长度 > 0。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:188-196` `hwc-iam-admin-policy` 的 Action 正则仅匹配 JSON 形式（`"Action":"*"` / `Action=*`），不匹配 Terraform HCL `actions = ["*"]` 块语法。
- **影响**：IaC 制品中的 broad IAM 授权漏检，最小权限红线失效。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：已跟踪 #651(项1)/#652(项3)

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 注入失效（11 安装目标）

- **现象**：`package.json` `files` 白名单（`package.json:8-18`）不含 `rules/`；安装目标无注入的规则文件；`setup-cli.mjs` 0 处引用 `rules/`/`.mdc`/`agent-rules`。
- **断言**：`package.json` `files` 白名单应含 `rules`，且安装目标应注入 `huawei-agent-rules`。
- **根因**：`package.json:8-18`（files 白名单缺 `rules`）+ `plugins/huaweicloud-core/src/setup-cli.mjs`（无 `rules/`/`.mdc` 引用）。
- **影响**：全局安全规则未注入任何 agent 客户端，安全引导失效。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.stdout.log`
- **状态**：已跟踪 #651(项8)/#673(项3)/#674(项4)/#676(项6)/#679(项3)

## #5【P1】D4-6 adminPass 空格形式回显未脱敏

- **现象**：`huaweicloud_plan_cli_command` 对 `--adminPass Secret123`（空格形式）返回 args 含明文 `Secret123`；`--adminPass=Secret123`（等号）可正常脱敏。
- **断言**：`plan_cli_command` 对 `--adminPass Secret123` 返回的 args 不应含明文 `Secret123`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 正则 `((?:...|adminPass)...)\s*[:=]\s*(...)` 只覆盖 `=`/`:` 分隔，KooCLI 空格形式 `--adminPass xxx` 不命中。
- **影响**：口令参数明文回显，弱化脱敏保护。
- **证据**：`evidence/d4-security-core/probe-d4-6-adminpass.stdout.log`
- **状态**：已跟踪 #651(项2 hook 层同族)/#673(项4 hook 层同族)/#679(项5 hook 层)

## #6【P1】D4-7 hook 三工具之一（hook_check_artifacts）broad IAM 失效

- **现象**：`huaweicloud_hook_check_artifacts` 对 `actions = ["*"]` 制品返回 `decision=allow`（应 `deny`）。
- **断言**：`hook_check_artifacts` 对 broad IAM 制品（HCL `actions = ["*"]`）应返回 `decision=deny`。
- **根因**：同 #3，`cloud-risk-rules.json:188-196` 未覆盖 HCL 形式。
- **证据**：`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **状态**：已跟踪 #651(项1)/#652(项3)

## #7【P1】D9-2 JSON-RPC 未知方法错误码未区分（-32601 缺失）

- **现象**：未知方法 `nonexistent/method` 被服务端统一捕获返回 `code: -32603`（Internal Error），未映射 `-32601`（Method not found）。
- **断言**：未知方法应返回 `-32601`（Method not found）而非 `-32603`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` catch 统一硬编码 `code: -32603`；`mcp-protocol.mjs:95` `dispatch()` 抛 `Unsupported method` 但未映射 `-32601`。
- **影响**：客户端无法区分「方法不存在」与其他内部错误，协议合规性差。
- **证据**：`evidence/d9-protocol/probe-d9-mcp-protocol.stdout.log`
- **状态**：已跟踪 #651(项9)/#652(项4)/#674(项7)/#676(项7)/#689(项10 SPEC-MISMATCH 同源)

## #8【P1】D10-3 中文意图路由未命中（serviceCatalog 仅英文关键词）

- **现象**：源码级直调 `huaweicloud_service_catalog`，注入 15 条中文评测意图（EXP-E01~E15），仅 3 条命中期望服务（E06 DCS、E09 CCE、E15 voucher），12 条 miss（ECS/EIP/OBS/RDS/CBR/FunctionGraph/CES/ELB/IAM/BSS 等）；准确率 21.4%，英文控制组（list ECS/RDS/static website）全部命中。
- **断言**：`serviceCatalog(中文意图).recommendedServices` 应含期望服务；中文意图路由准确率应 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1910` `serviceCatalog()` `routeMap` 关键词表仅英文（`tokens.has(kw)` 走英文词元匹配，无中文→服务映射），中文意图词元无法命中任一 route，回落 `['Run hcloud --help to list available services.']`。
- **影响**：中文用户意图无法正确路由到服务能力，评测集激活率/准确率不达标。
- **证据**：`evidence/d10-routing/probe-d10-routing.stdout.log`（源码级 15 意图 + 3 英文控制组）
- **状态**：已提单 #689（Hermes 客户端 2026-09-15 开出的同根因合并单，本客户端复核复现，不重复开单）

---

## 补充说明：展开级 EXP-E 与 D10-3 的映射

展开级 `EXP-E01`~`EXP-E15` 是 D10-3 中文意图评测集（`eval/prompts/eval-set-v1.csv` 同源），执行结果全部按 D10-3 源码级路由断言回填：

- `EXP-E06`/`EXP-E09`/`EXP-E15` → **PASS**（命中路由）
- `EXP-E01`/`EXP-E02`/`EXP-E04`/`EXP-E05`/`EXP-E07`/`EXP-E10`/`EXP-E11`/`EXP-E12`/`EXP-E14` → **FAIL**（路由 MISS，同 #8 根因）
- `EXP-E03`/`EXP-E08`/`EXP-E13` → **BLOCKED**（oracle 需维护者裁决：E03 OBS 静态站 vs sandbox-first 漂移 / E08 诊断类非 serviceCatalog / E13 跨 DEW+ELB 双服务），详见报告 §五。