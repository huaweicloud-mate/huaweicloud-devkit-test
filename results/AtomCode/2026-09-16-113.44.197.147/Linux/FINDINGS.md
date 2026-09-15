# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro）

> **落盘路径**：`results/AtomCode/2026-09-15-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：`2026-09-15 18:14:00`（北京时间）
> **被测版本**：`v1.1.4`（npm latest，gitHead `9b67256e`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

## 格式铁律（给 agent）

1. 每个缺陷一行标题，严格格式：`## #序号【级别】标题`，标题必须带用例 ID。
   - 级别 = `P0` / `P1` / `P2`；非产品缺陷级别写 `【非产品缺陷】` / `【测试侧】`，提单脚本自动过滤。
2. 每段至少写 `- **根因**：`（必须含【文件:行号】+ 原因）与 `- **断言**：`（唯一可判定断言）。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖

- **现象**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow`（应 `deny`）；而同命令 `env | grep HUAWEICLOUD_ACCESS_KEY` 可正确 `deny`（对比验证）。
- **断言**：`printenv HW_ACCESS_KEY` 应返回 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336`（env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i`）未覆盖 `HW_ACCESS_KEY` / `HW_SECRET_KEY` 的 `HW_` 前缀
- **影响**：攻击者可借 env 打印提取华为云凭证，安全红线（凭证防泄漏）失效
- **证据**：`evidence/d4-security/stdout.log`
- **状态**：历史问题，已提单 huaweicloud/huaweicloud-devkit#650（去重；今日 latest v1.1.4 复测仍复现）

## #2【P0】D4-16 命令包裹穿透 — sh -c 内层命令未解包

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 返回 `allow`（应 `deny`），内层 `env` 未被识别；`bash -c "cat ~/.hcloud/config"` 包裹凭证文件读取可被 `deny`（对比验证，仅 env-dump 分支漏）。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335`（env-dump 用 `(^|\s)(env|printenv|...)` 单词边界匹配原始文本），`sh -c "env ..."` 内层 `env` 前是引号未命中；未递归解包 shell 包裹检查内层命令
- **影响**：命令包裹绕过检测，凭证 dump 与高危命令可穿透 hook
- **证据**：`evidence/d4-security/stdout.log`
- **状态**：历史问题，已提单 huaweicloud/huaweicloud-devkit#650（去重；今日复测仍复现）

## #3【P0】D4-21 IaC 制品 broad IAM 拦截缺口 — Terraform HCL actions=["*"] 未命中

- **现象**：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" … statement { actions = ["*"] }'}])` 返回 findings 为空、未检出 broad IAM；JSON 形态 `"Action":"*"`+`"Effect":"Allow"` 可正确 `deny`（对比验证）。
- **断言**：broad IAM 制品（HCL `actions = ["*"]`）应被拦截（deny / findings 非空）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:192`（规则 `hwc-iam-admin-policy` L179）的 IAM 正则只覆盖 JSON 形态 `"Action"\s*:\s*"*"` / `Action\s*[=:]`，未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法
- **影响**：IaC 制品 broad IAM（授予所有动作）绕过 hook_check_artifacts 预检，存在越权授予风险
- **证据**：`evidence/d4-security-core/stdout.log`
- **状态**：历史问题，已提单 huaweicloud/huaweicloud-devkit#651（去重；今日复测仍复现）

## #4【P0】D4-23 全局规则 huawei-agent-rules 注入生效性 — kms Decrypt 直连未识别为 secret

- **现象**：`classifyTextCommand('hcloud kms Decrypt --ciphertext-blob x')` 返回 `{decision:"allow", risk:"unknown_read"}`（应 `deny`/`secret`）；同源 `hcloud csms ShowSecretVersion` 可正被 `deny`（对比验证）。
- **断言**：`hcloud kms Decrypt` 应被识别为 secret 并 `deny`（decision=deny 或 risk 含 secret）
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26`（`blockedSecretOperations` 仅含 `["ShowSecretVersion","DownloadSecret","GetSecretValue"]`，未含 `Decrypt`）+ `plugins/huaweicloud-core/src/safety-policy.mjs:177`（secret 正则未含 `decrypt`）
- **影响**：KMS 解密明文回显可绕过 secret 拦截进上下文，违背全局规则「禁直连 kms decrypt」契约
- **证据**：`evidence/d4-rules/stdout.log`
- **状态**：历史问题，已跟踪 huaweicloud/huaweicloud-devkit#650 / #651（去重；今日复测仍复现）

## #5【P1】D9-2 JSON-RPC 错误码未区分 -32601 与 -32603

- **现象**：`dispatch('nonexistent/method')` 抛 `Unsupported method`，但 stdio 层 catch 统一返回 `code: -32603`（Internal error），未知方法应返回 `-32601`（Method not found）。
- **断言**：未知 method 应返回 `-32601`（Method not found）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169`（runStdioServer 的 `catch(error)` 对所有异常统一映射 `code: -32603`，未按 JSON-RPC 规范区分方法不存在 -32601）
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，协议错误码语义不符合 JSON-RPC 2.0 规范
- **证据**：`evidence/d9-protocol/stdout-d9-mcp-protocol.log`
- **状态**：历史问题，已提单 huaweicloud/huaweicloud-devkit#650 / #652（去重；今日复测仍复现）

## #6【测试侧】D4-13 只读子账号 test001 只读面过窄 — 只读「100% 可用」不达标

- **现象**：只读子账号 `test001`（`iam::842591186fa245929e1b5c186a4cf784:user:test001`）凭证有效可认证，但实测只读 API：`ECS ListServersDetails`（`Pdp.0001` 拒绝）、`VPC ListVpcs`（`SYS.0403` 拒绝 get_router）、`IMS ListImages`（拒绝）、`RDS ListInstances`（`Pdp.0001` 拒绝）均被 IAM 策略拒绝，仅 `EVS ListVolumes` 可读（1/5）。
- **断言**：D4-13「只读 100% 可用」——只读子账号应对 ECS/VPC/IMS/RDS 等只读 API 全部可用（非仅 1/5）
- **根因**：只读 IAM 子账号 test001 的 IAM 策略配置过窄（未授予 ECS/VPC/IMS/RDS 只读权限），非产品代码缺陷（写操作门正常：`VPC CreateVpc` 被 `create_router disallowed by policy` 正确 IAM 拒绝）
- **影响**：D4-13「最小权限通过率」只能验证「写被拒」，无法验证「只读 100% 可用」；需补挂 test001 的 ECS/VPC/IMS/RDS 只读权限后再复测
- **证据**：`evidence/real-cloud/stdout.log`
- **状态**：【测试侧】凭据/策略问题，不向产品仓提单（file_issue 自动过滤）