# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-15-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-15 20:20:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**，否则自动提单解析失败/漏缺陷。

## #1【P0】D4-15 URL 编码命令绕过安全策略检测

- **现象**：URL 编码的 hcloud 危险命令 `hcloud%20ecs%20DeleteServers%20--instance_ids=x` 通过 `classifyTextCommand()` 和 `evaluateCommandRisk()` 均返回 `allow`，未被拦截。
- **断言**：`classifyTextCommand('hcloud%20ecs%20DeleteServers%20--instance_ids=x').decision` 应返回 `deny`（或 `evaluateCommandRisk` 返回 `deny`/`warn`），实际返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:345` — `classifyTextCommand()` 使用正则 `/(^|\s)hcloud(\.exe)?\s+/i` 检测 hcloud 命令，但 URL 编码的空格 `%20` 不匹配 `\s`，导致编码后的命令绕过检测。函数在分类前未对输入进行 URL 解码（`decodeURIComponent`）。同样，`risk-rule-engine.mjs:35` 的 `evaluationContext()` 也未对命令进行 URL 解码。
- **影响**：攻击者可通过 URL 编码绕过安全策略，执行危险的 hcloud 写操作（如 `DeleteServers`），存在安全风险。
- **证据**：`evidence/D4-15/stdout.log`，`evidence/D4-15/probe.mjs`
- **状态**：待提单

## #2【P0】D4-16 Shell 包裹命令绕过安全策略检测

- **现象**：Shell 包裹命令 `bash -c "env | grep HUAWEICLOUD"` 通过 `classifyTextCommand()` 和 `evaluateCommandRisk()` 均返回 `allow`，未被拦截。`sh -c "hcloud ecs DeleteServers --instance_ids=x"` 的 `classifyTextCommand` 也返回 `allow`（仅 `evaluateCommandRisk` 返回 `warn`）。
- **断言**：`classifyTextCommand('bash -c "env | grep HUAWEICLOUD"').decision` 应返回 `deny`，实际返回 `allow`。`classifyTextCommand('sh -c "hcloud ecs DeleteServers --instance_ids=x"').decision` 应返回 `deny`，实际返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335` — env-dump 检测正则 `/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i` 要求 `env` 前必须是空白字符 `\s`，但当命令被 `bash -c "..."` 包裹时，`env` 前是引号 `"` 而非空白，导致正则不匹配。函数未对 shell 包裹命令进行解包（提取 `sh -c`/`bash -c` 内部命令）再检测。同样，`safety-policy.mjs:345` 的 hcloud 检测正则 `/(^|\s)hcloud(\.exe)?\s+/i` 也因 `hcloud` 前是引号 `"` 而未匹配。
- **影响**：攻击者可通过 `sh -c`/`bash -c` 包裹危险命令绕过安全策略，执行凭证窃取或资源删除操作。
- **证据**：`evidence/D4-16/stdout.log`，`evidence/D4-16/probe.mjs`
- **状态**：待提单
