# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）

> **落盘路径**：`results/OpenCode/2026-09-21-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-21 05:20:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.5（gitHead e7ed6f6）

## #1【P0】D4-2 凭证env打印拦截不完整（Windows风格%HW_SECRET_KEY%未拦截）

- **现象**：`echo %HW_SECRET_KEY%`（Windows风格环境变量引用）经 `classifyTextCommand()` 判定为 `allow`，未拦截。Unix风格 `$HW_SECRET_KEY` 和 `printenv HW_SECRET_KEY` 正确拦截为 `deny`。
- **断言**：`classifyTextCommand('echo %HW_SECRET_KEY%')` 应返回 `{ decision: 'deny' }`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:417-419` — env变量拦截正则 `/(?<!['\\])\$\{?(?:HUAWEICLOUD|HWC|HW|OS)_(?:ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN)/i` 仅匹配 `$HW_*`（Unix风格），未覆盖 Windows `%HW_*%` 格式。Windows cmd/PowerShell 用户可通过 `echo %HW_SECRET_KEY%` 绕过拦截。
- **影响**：Windows环境下凭证环境变量可被打印泄露，安全红线违规。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文secret API拦截不完整（ShowServerPassword未拦截）

- **现象**：`hcloud ECS ShowServerPassword --cli-region=cn-north-4 --server_id=xxx` 经 `classifyTextCommand()` 判定为 `allow`，未拦截。`ShowSecretVersion` 和 `GetSecretValue` 正确拦截为 `deny`。
- **断言**：`classifyTextCommand('hcloud ECS ShowServerPassword ...')` 应返回 `{ decision: 'deny', risk: 'secret' }`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:232-246` — `blockedSecretOperations` 列表和正则 `/secret[_-]?string|secret[_-]?binary|showsecretversion|getsecretvalue/i` 未包含 `ShowServerPassword`。`Show` 前缀被 `hasReadPrefix` 匹配为只读操作，导致密码暴露API未被拦截。
- **影响**：ECS实例初始密码可通过 `ShowServerPassword` API泄露到agent上下文。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】D4-16 命令包裹穿透（bash -c "hcloud..." 未拦截）

- **现象**：`bash -c "hcloud ECS DeleteServers --cli-region=cn-north-4"` 经 `classifyTextCommand()` 判定为 `allow`（通过 `applyRawCommandRiskRules` 路径），写操作未被拦截。`sh -c "cat ~/.huaweicloud/credentials.json"` 正确拦截为 `deny`（因为 credentialFilePatterns 匹配）。
- **断言**：`classifyTextCommand('bash -c "hcloud ECS DeleteServers ..."')` 应返回 `{ decision: 'deny', risk: 'write' }`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:428-430` — `classifyTextCommand()` 仅当文本匹配 `/(^|\s)hcloud(\.exe)?\s+/i` 时才调用 `classifyHcloudArgs()`。`bash -c "hcloud..."` 中 hcloud 在引号内，前面是 `"` 非空白字符，正则不匹配。`classifyHcloudArgs()` 内部的 `stripExecutable()` 和 `findHcloudCommandSegments()` 有shell解包逻辑，但从未被调用。`findHcloudCommandSegments()` (line 156-166) 按 `||/&&/;/|` 分割后 `splitSimpleCommand` 得到 `['bash', '-c', 'hcloud...']`，但 `tokens[0]` 是 `bash` 不是 `hcloud`，被过滤掉。
- **影响**：攻击者可通过 `bash -c "hcloud <写操作>"` 绕过安全hook执行写操作。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #4【非产品缺陷】EXP-E01~E05/E07/E10~E14 serviceCatalog路由准确率21.4%（已知基线）

- **现象**：eval harness 实测 serviceCatalog 中文意图路由准确率 21.4%（3 HIT / 11 MISS / 1 N/A），与文档基线一致。
- **说明**：这是已知的 serviceCatalog 路由能力限制，非本轮新发现缺陷。基线 MISS 率已记录在 eval/harness 文档中。11条 MISS 用例（EXP-E01~E05/E07/E10~E14）的 serviceCatalog 路由未命中期望服务，多数返回 "Run hcloud --help to list available services." 默认提示。
- **证据**：`evidence/EXP-E01~E15/stdout.log`，`eval/results/eval-run-20260920211124.csv`
