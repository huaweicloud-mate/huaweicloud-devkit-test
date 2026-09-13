# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro）

> **落盘路径**：`results/AtomCode/2026-09-14-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：`2026-09-14 07:15:25`（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。

## #1【P0】凭证 env 打印拦截不完整 — HW_ 前缀未覆盖

- **现象**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` + env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY` / `HW_SECRET_KEY` 的 `HW_` 前缀
- **影响**：攻击者可借 env 打印提取华为云凭证，安全红线（凭证防泄漏）失效
- **证据**：`evidence/d4-security/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#652

## #2【P0】命令包裹穿透 — sh -c 内层命令未解包

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 返回 `allow`（应 `deny`），内层 `env` 未被识别
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` + env-dump 用 `(^|\s)(env|printenv|...)` 单词边界匹配原始文本，`sh -c "env ..."` 内层 `env` 前是引号未命中；未递归解包 shell 包裹检查内层命令
- **影响**：命令包裹绕过检测，凭证 dump 与高危命令可穿透 hook
- **证据**：`evidence/d4-security/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#652

## #3【P0】IaC 制品 broad IAM 拦截缺口 — Terraform HCL actions=["*"] 未命中

- **现象**：`evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" ... statement { actions = ["*"] }'}])` 返回 findings 为空、decision=allow（应 block broad IAM）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:179` + 规则 `hwc-iam-admin-policy` 的 IAM 正则只覆盖 JSON 形态 `"Action"\s*:\s*"*"` / `Action\s*[=:]`，未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法
- **影响**：IaC 制品中的 broad IAM（授予所有动作）绕过 hook_check_artifacts 预检，存在越权授予风险
- **证据**：`evidence/d4-security-core/stdout.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#652

## #4【P1】JSON-RPC 错误码未区分 -32601 与 -32603

- **现象**：`dispatch('nonexistent/method')` 抛 `Unsupported method`，但 stdio 层 catch 统一返回 `code: -32603`（Internal error），未知方法应返回 `-32601`（Method not found）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` + runStdioServer 的 `} catch (error) { ... code: -32603 }` 对所有异常统一映射 -32603，未按 JSON-RPC 规范区分方法不存在（-32601）
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，协议错误码语义不符合规范
- **证据**：`evidence/d9-protocol/stdout-d9-mcp-protocol.log`
- **状态**：已提单 huaweicloud/huaweicloud-devkit#652