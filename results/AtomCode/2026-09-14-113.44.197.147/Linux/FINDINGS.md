# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro）

> **落盘路径**：`results/AtomCode/2026-09-14-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：`2026-09-14 23:00:00`（北京时间）
> **被测版本**：`v1.1.4-next.6`（npm @next，gitHead `69ac7279`，PR #663）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。

## 格式铁律（给 agent）

1. 每个缺陷一行标题，严格格式：`## #序号【级别】标题`
   - 级别 = `P0` / `P1` / `P2`；**非产品缺陷**（环境/测试侧/不予提单）级别写 `【非产品缺陷】` 或 `【测试侧】`，提单脚本会自动过滤。
2. 每段至少写 `- **根因**：`（必须含【文件:行号】+ 原因）与 `- **断言**：`（唯一可判定断言）；可选补 `- **现象**：`、`- **影响**：`。
3. 根因定位方法见技能 `huaweicloud-devkit-source-coverage`（源码文件地图 + 核对四步）。

---

## #1【P0】凭证 env 打印拦截不完整 — HW_ 前缀未覆盖

- **现象**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow`（应 `deny`）；而 `HUAWEICLOUD_ACCESS_KEY` 同命令可正被 `deny`（对比验证）。
- **断言**：`printenv HW_ACCESS_KEY` 应返回 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` + env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY` / `HW_SECRET_KEY` 的 `HW_` 前缀
- **影响**：攻击者可借 env 打印提取华为云凭证，安全红线（凭证防泄漏）失效
- **证据**：`evidence/d4-security/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#650 / #651 / #652（去重，不重复拆单）

## #2【P0】命令包裹穿透 — sh -c 内层命令未解包

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 返回 `allow`（应 `deny`），内层 `env` 未被识别；`bash -c` 包裹凭证文件读取可被 `deny`（对比验证，仅 env-dump 分支漏）。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` + env-dump 用 `(^|\s)(env|printenv|...)` 单词边界匹配原始文本，`sh -c "env ..."` 内层 `env` 前是引号未命中；未递归解包 shell 包裹检查内层命令
- **影响**：命令包裹绕过检测，凭证 dump 与高危命令可穿透 hook
- **证据**：`evidence/d4-security/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#650 / #652（去重）

## #3【P0】IaC 制品 broad IAM 拦截缺口 — Terraform HCL actions=["*"] 未命中

- **现象**：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" … statement { actions = ["*"] }'}])` 返回 findings 为空、decision=allow（应 block broad IAM）；JSON 形态 `"Action":"*"`+`"Effect":"Allow"` 可正确 `deny`（对比验证）。
- **断言**：broad IAM 制品应被拦截（deny）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:192` + 规则 `hwc-iam-admin-policy`（L179）的 IAM 正则只覆盖 JSON 形态 `"Action"\s*:\s*"*"` / `Action\s*[=:]`，未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法
- **影响**：IaC 制品 broad IAM（授予所有动作）绕过 hook_check_artifacts 预检，存在越权授予风险
- **证据**：`evidence/d4-security-core/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#651（第 1 项）/ #652（第 3 项）（去重）

## #4【P0】全局规则 huawei-agent-rules 注入生效性 — kms Decrypt 直连未识别为 secret

- **现象**：`classifyTextCommand('hcloud kms Decrypt --ciphertext-blob x')` 返回 `{decision:"allow", risk:"unknown_read"}`（应 `deny`/`secret`）；同源 `hcloud csms ShowSecretVersion` 可正被 `deny`（对比验证）。
- **断言**：`hcloud kms Decrypt` 应被识别为 secret 并 `deny`（decision=deny 或 risk 含 secret）
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` + `blockedSecretOperations` 仅含 `["ShowSecretVersion","DownloadSecret","GetSecretValue"]`，未含 `Decrypt`；`plugins/huaweicloud-core/src/safety-policy.mjs:177` 的 secret 正则 `/secret…|showsecretversion|getsecretvalue/i` 亦未含 `decrypt`，故 `kms Decrypt` 落入 `safety-policy.mjs:300` 的 `unknown_read`（allow）。全局规则 `rules/huawei-agent-rules.mdc` 的「MUST NOT call kms decrypt」未被安全策略强制执行。
- **影响**：KMS 解密明文回显可绕过 secret 拦截进上下文，违背全局规则「禁直连 kms decrypt」契约
- **证据**：`evidence/d4-rules/stdout.log`
- **状态**：已跟踪 huaweicloud/huaweicloud-devkit#650（D4-23）/ #651（第 3 项 blockedSecretOperations 不全类）（去重，本项为 next.6 下 enforcement 缺口细化）

## #5【P1】JSON-RPC 错误码未区分 -32601 与 -32603

- **现象**：`dispatch('nonexistent/method')` 抛 `Unsupported method`，但 stdio 层 catch 统一返回 `code: -32603`（Internal error），未知方法应返回 `-32601`（Method not found）。
- **断言**：未知 method 应返回 `-32601`（Method not found）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` + runStdioServer 的 `catch(error)` 对所有异常统一映射 `code: -32603`，未按 JSON-RPC 规范区分方法不存在（-32601）
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，协议错误码语义不符合规范
- **证据**：`evidence/d9-protocol/stdout-d9-mcp-protocol.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#650 / #652（去重）