# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-09-13-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-13（北京时间）
> **被测版本**：`v1.1.4-next.3`（npm @next，gitHead `3b6290b0`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。

---

## #1【P0】凭证 env 打印拦截不完整（HW_ 前缀 + echo 通道漏拦）

- **现象**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 均返回 `allow`（预期 `deny`）；`echo $HUAWEICLOUD_ACCESS_KEY_ID` 返回 `allow`（echo 通道无拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` — `classifyTextCommand()` env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；且 `echo` 不在 env/printenv 规则白名单，`echo $VAR` 变体完全绕过。
- **影响**：凭证环境变量可被 dump/回显，P0 安全域拦截存在绕过面。
- **证据**：`evidence/d4-security/stdout.txt`
- **状态**：待提单

## #2【P0】hook 绕过：命令替换 $() 混淆凭证路径

- **现象**：`cat ~/.hc$(echo loud)/credentials` 返回 `allow`（预期 `deny`）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:325` — `classifyTextCommand()` 用 `matchesAny(text, policy.credentialFilePatterns)` 对整行字符串做匹配，`.hcloud` 模式被 `$(...)` 打断无法命中。
- **影响**：凭证文件读取拦截可被命令替换混淆绕过。
- **证据**：`evidence/d4-security/stdout.txt`
- **状态**：待提单

## #3【P0】命令包裹穿透：sh -c / bash -c 内层未二次判定

- **现象**：`sh -c "env | grep HUAWEICLOUD"` 与 `sh -c "hcloud ecs DeleteServer --server-id x"` 均返回 `allow`（预期 `deny`）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:321-368` — `classifyTextCommand()` 只检测整行文本，未提取 wrapper（`sh -c`/`bash -c`）内层参数做二次判定。对照 `bash -c "cat ~/.hcloud/credentials"` 只因凭证路径仍整行可见而巧合命中。
- **影响**：凭证 dump 与写操作可经 shell 包裹穿透安全钩子。
- **证据**：`evidence/d4-security/stdout.txt`
- **状态**：待提单

## #4【P0】hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权

- **现象**：`resource "x" { Action = ["*"] effect = "Allow" }` 返回 `allow`（预期 `deny`）；JSON 形式 `"Action":"*"`+`"Effect":"Allow"` 可正确 `deny`（对比验证）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:192` — `hwc-iam-admin-policy` 的 Action 正则只匹配 JSON `"Action":"*"`，`Action = ["*"]`（`[` 阻断）与 `effect = "Allow"`（引号）不命中。
- **影响**：Terraform HCL 形式的宽泛 IAM 管理策略制品漏检。
- **证据**：`evidence/d4-security/stdout.txt`
- **状态**：待提单

## #5【P1】--adminPass flag 形式密码不脱敏

- **现象**：`redactSecrets('hcloud ecs CreateServer --adminPass SuperSecret123')` 返回原文（未脱敏）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — `redactString()` 正则仅匹配 `adminPass[:=]value`，未覆盖 `--adminPass value`（空格/flag 形式；hcloud 实际 `--admin-pass` 亦不匹配）。
- **影响**：创建 ECS 等写操作口令可能裸回显。
- **证据**：`evidence/d4-security/stdout.txt`
- **状态**：待提单

## #6【P2】fork bomb 规则失效（正则双重转义）

- **现象**：`evaluateCommandRisk(':(){ :|:& };:').decision` 返回 `allow`（预期 `deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:359` — `hwc-sandbox-destructive-command` 的 fork bomb 正则 `:\\\\(\\\\)...` 双重转义，编译后匹配字面反斜杠，标准 fork bomb 永不命中。
- **影响**：沙箱破坏性命令规则对 fork bomb 空转（remediation 文案提到 fork bomb 但正则无效）。
- **证据**：`evidence/d4-security/stdout.txt`
- **状态**：待提单

## #7【P1】JSON-RPC 错误码未区分（未知方法未映射 -32601）

- **现象**：未知方法抛错一律返回 `code:-32603`，未映射 `-32601 (Method not found)`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:156-169` — `handleMessage()` 的 catch 对所有异常硬编码 `code:-32603`。
- **影响**：MCP 客户端无法区分「方法不存在」与「内部错误」，协议合规性受损。
- **证据**：`evidence/d2-d9-auth-protocol/stdout.txt`
- **状态**：待提单