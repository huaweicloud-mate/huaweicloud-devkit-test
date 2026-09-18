# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro）

> **落盘路径**：`results/AtomCode/2026-09-19-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：`2026-09-19 05:14:52`（北京时间）
> **被测版本**：`v1.1.5`（npm latest，gitHead `e7ed6f6`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

## 格式铁律（给 agent）

1. 每个缺陷一行标题，严格格式：`## #序号【级别】标题`，标题必须带用例 ID。
   - 级别 = `P0` / `P1` / `P2`；非产品缺陷级别写 `【非产品缺陷】` / `【测试侧】`，提单脚本自动过滤。
2. 每段至少写 `- **根因**：`（必须含【文件:行号】+ 原因）与 `- **断言**：`（唯一可判定断言）。

---

## #1【P0】D4-2 凭证 env 打印拦截仍不完整 — `env | grep HW_*` 形态未覆盖（v1.1.5 部分修复）

- **现象**：`printenv HW_ACCESS_KEY` 在 v1.1.5 已返回 `deny`（已修复）；但 `env | grep HW_SECRET_KEY` 实测仍返回 `allow`（应 `deny`）。同命令 `env | grep HUAWEICLOUD_ACCESS_KEY` 可正确 `deny`（对比验证）。
- **断言**：`env | grep HW_SECRET_KEY` 应返回 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399`（env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 仍缺 `HW_` 前缀）；`:419` 新增的 `printenv HW_*` 规则只覆盖 `printenv` 形态，未覆盖 `env | grep HW_*` 管道形态
- **影响**：攻击者可借 `env | grep HW_SECRET_KEY` 提取华为云凭证，安全红线（凭证防泄漏）仍有缺口
- **证据**：`evidence/d4-security/stdout.log` + `evidence/d4-security-core/stdout-probe-p0-security.log`
- **状态**：历史问题（v1.1.5 已修 printenv 形态，`env|grep` 形态仍复现）

## #2【P0】D4-16 命令包裹穿透 — `sh -c "env | grep ..."` 内层 env 未解包

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 实测返回 `allow`（应 `deny`），内层 `env` 未被识别；`bash -c "cat ~/.hcloud/config"` 可正确 `deny`（对比验证，仅 env-dump 分支漏）。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398`（env-dump 用 `(^|\s)(env|printenv|...)` 单词边界匹配原始文本），`sh -c "env ..."` 内层 `env` 前为引号未命中；`stripExecutable` 解包只作用于 hcloud 命令分支，未覆盖 env-dump 分支
- **影响**：命令包裹绕过检测，凭证 dump 可穿透 hook
- **证据**：`evidence/d4-security/stdout.log` + `evidence/d4-security-core/stdout-probe-p0-security.log`
- **状态**：历史问题（v1.1.5 部分修复；env-dump 包裹形态仍复现）

## #3【P0】D4-21 IaC 制品 broad IAM 拦截缺口 — Terraform HCL `actions = ["*"]` 未命中

- **现象**：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" … statement { actions = ["*"] }'}])` 返回 findings 为空、未检出 broad IAM；JSON 形态 `"Action":"*"`+`"Effect":"Allow"` 可正确 `deny`（对比验证）。
- **断言**：broad IAM 制品（HCL `actions = ["*"]`）应被拦截（deny / findings 非空）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179,192`（规则 `hwc-iam-admin-policy`）的 IAM 正则 `:192` 只覆盖 JSON 形态 `"Action"`，未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法
- **影响**：IaC 制品 broad IAM（授予所有动作）绕过 hook_check_artifacts 预检，存在越权授予风险
- **证据**：`evidence/d4-security-core/stdout-probe-p0-security.log`
- **状态**：历史问题（v1.1.5 复测仍复现）

## #4【P0】D4-23 全局规则 huawei-agent-rules 注入生效性 — kms Decrypt 直连未识别为 secret

- **现象**：`classifyTextCommand('hcloud kms Decrypt --ciphertext-blob x')` 实测返回 `{decision:"allow", risk:"unknown_read"}`（应 `deny`/`secret`）；同源 `hcloud csms ShowSecretVersion` 可正确 `deny`（对比验证）。
- **断言**：`hcloud kms Decrypt` 应被识别为 secret 并 `deny`（decision=deny 或 risk 含 secret）
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26`（`blockedSecretOperations` 仅含 ShowSecretVersion/DownloadSecret/GetSecretValue，未含 `Decrypt`）
- **影响**：KMS 解密明文回显可绕过 secret 拦截进上下文，违背全局规则「禁直连 kms decrypt」契约
- **证据**：`evidence/d4-rules/stdout-probe.log`
- **状态**：历史问题（v1.1.5 复测仍复现）

## #5【P0】D9-2 JSON-RPC 错误码补齐后仍缺 -32602 — invalid params 无 error 对象

- **现象**：v1.1.5 已修复 -32601（未知 method 端到端返回 -32601 正确）；但向 `tools/list` 传非法 params（非 object）时，服务端**无 error 对象返回**（应返回 `-32602 Invalid params`）。
- **断言**：tools/list 非法 params 应返回 `-32602`（Invalid params）
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:73`（`method === 'tools/list'` 分支直接返回 tools，未校验 `params` 类型为 object，因此不抛 Invalid params）
- **影响**：JSON-RPC 2.0 错误码语义仍不完整（-32601 已修，-32602 未修），客户端无法区分「参数非法」错误
- **证据**：`evidence/protocol/stdout.log`（protocol-probe D9-2b）

## #6【P1】D10-3 服务目录中文意图路由准确率仅 21.4%（评测集 15 条）

- **现象**：`eval/harness/run-eval.mjs` 对 15 条中文意图逐条调 `huaweicloud_service_catalog`，实测 HIT=3 MISS=11 N/A=1，路由准确率 21.4%（分母 HIT+MISS=14），远低于评测级目标 ≥90%。
- **断言**：serviceCatalog 中/英文意图均应命中对应服务，路由准确率 ≥90%
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776`（`serviceCatalog(intent)` 意图→服务关键词匹配规则不足，中文意图几乎全部 MISS 落到通用 help）
- **影响**：真实 Agent 无法按中文意图路由到具体 Huawei Cloud 服务，严重削弱「意图驱动」能力
- **证据**：`evidence/eval/stdout.log`（eval-set-v1.csv 15 条）

## #7【P1】D9-9 SPEC-MISMATCH — capabilities.notifications.cancellation 未声明

- **现象**：`initialize` 返回 `capabilities: { tools: {} }`，`notifications.cancellation` 缺失（protocol-probe D9-9a 实测「未声明」）。
- **断言**：支持取消能力应在 capabilities 声明 `notifications.cancellation`（MCP 取消能力契约）
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:63`（initialize `capabilities` 仅声明 `tools`，未声明 `notifications.cancellation`）
- **影响**：客户端无法通过 capabilities 判断服务端是否支持取消通知，属契约漂移（非崩溃型缺陷）
- **证据**：`evidence/protocol/stdout.log`

## #8【测试侧】D3-C4 hcloud CLI 服务覆盖差异 — OBS/DMS/DEW 不可 `--help` 执行（19/22）

- **现象**：真云账号实测 22 服务 `hcloud <svc> --help`，OBS（需 `obs help` 语法）、DMS/DEW（`Unsupported service`）3 项不可执行；devkit `list_operations` 源层级 22/22 路由正常（EXP-C4 证据）。
- **断言**：D3-C4「22 服务可执行」在 hcloud CLI 层不完全成立（19/22）
- **根因**：hcloud CLI 7.2.12 对 OBS 用 `obs help` 语法、DMS/DEW 服务未启用（非 devkit 代码缺陷）
- **影响**：真云层「可执行」口径 19/22；devkit 路由层正常
- **证据**：`evidence/real-cloud/stdout.log`
- **状态**：【测试侧】非产品缺陷，不向产品仓提单（hcloud CLI 环境/服务覆盖差异）