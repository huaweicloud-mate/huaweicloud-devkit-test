# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：`results/Hermes/2026-09-22-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-22 05:35:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.6-next.0（npm @next）

## #1【P0】D2-4 凭证脱敏正确性 — JSON 字符串中短键名 ak/sk/token 未脱敏

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","region":"cn-north-4"}')` 返回原始字符串，`sk` 值未被替换为 `<redacted>`
- **断言**：`redactSecrets` 输入含 `ak`/`sk`/`token` 短键名的 JSON 字符串时，对应值必须被替换为 `<redacted>`，原始密钥值不得出现在输出中
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-48` — `redactString()` 的正则匹配 `access[_-]?key|secret[_-]?key|security[_-]?token` 等长格式键名，但不匹配 `ak`/`sk`/`token` 等短键名；`isSecretKeyName()` 的正则 `/access.*key|secret.*key|security.*token/` 同样不匹配 `ak`/`sk`（normalized 后 `ak` 不含 `access` 子串）。当 `redactSecrets` 收到 JSON 字符串（非对象）时走 `redactString` 路径，短键名密钥值未被脱敏
- **影响**：凭证文件以 JSON 字符串形式（非对象）传入脱敏函数时，AK/SK 明文泄漏到日志/输出中
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json 测试项）
- **状态**：待提单

## #2【P0】D4-16 命令包裹穿透 — sh -c "printenv HW_*" 未被拦截

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision: 'allow'`，sh 包裹的凭证环境变量打印命令未被拦截
- **断言**：`classifyTextCommand` 输入 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 时应返回 `decision: 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:392-396` — env-dump 正则 `/(^|\s)(env|printenv|Get-ChildItem\s+Env:|gci\s+Env:|dir\s+Env:)/i` 要求 `printenv` 前是行首 `^` 或空白 `\s`，但在 `sh -c "printenv..."` 中 `printenv` 前是双引号 `"`，不匹配 `(^|\s)` 边界。同样 `printenv + HW_` 正则 `(?:^|\s)printenv\s+...` 也有相同问题。`classifyHcloudArgs` 的 `stripExecutable()` 能处理 `sh -c` 包裹的 hcloud 命令（line 70-104），但 `classifyTextCommand` 的文本路径未调用 `stripExecutable` 做引号内内容提取
- **影响**：攻击者可通过 `sh -c "printenv HW_ACCESS_KEY"` 绕过安全策略读取凭证环境变量
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 测试项）、`evidence/mcp-tools/stdout.log`（D4-16 wrap-mcp 测试项）
- **状态**：待提单

## #3【P1】D4-27 双路径输出脱敏 — JSON 字符串中短键名未脱敏（与 #1 同源）

- **现象**：`redactSecrets('{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN123"}')` 返回原始字符串，`sk` 和 `token` 值未被替换
- **断言**：`redactSecrets` 输入含 `ak`/`sk`/`token` 短键名的 JSON 字符串时，所有密钥值必须被替换为 `<redacted>`
- **根因**：与 #1 相同 — `plugins/huaweicloud-core/src/safety-policy.mjs:34-48` `redactString()` 不匹配短键名
- **影响**：双路径（对象+字符串）脱敏不一致，字符串路径存在泄漏
- **证据**：`evidence/d2-auth/stdout.log`（D4-27 redact-dual 测试项）
- **状态**：待提单

## #4【P1】EXP-E01~E05,E07,E10~E14 serviceCatalog 路由层评测 — 10/15 条中文意图路由 MISS

- **现象**：`eval/harness/run-eval.mjs` 跑 15 条中文意图评测集，10 条返回 MISS（serviceCatalog 未路由到正确服务），5 条 HIT。MISS 的意图包括：ECS查询、ECS创建、OBS静态站部署、EIP绑定、RDS查询、CCE查询、ELB查询、DDS查询、DCS查询、SMN查询
- **断言**：serviceCatalog 对 eval-set-v1.csv 中 15 条中文意图应全部路由到期望服务（HIT）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由匹配逻辑对中文自然语言意图的覆盖不完整 — 部分中文服务名/意图关键词未纳入路由规则（如"云主机"未映射到 ECS、"云数据库MySQL"未映射到 RDS）。基线 MISS 率 21.4%（3/15→本机 10/15 MISS，与历史结论一致：路由层确定性调用但不覆盖全部中文意图变体）
- **影响**：用户用中文描述云服务需求时，serviceCatalog 无法正确路由到对应服务工具，影响用户体验
- **证据**：`evidence/c4-service-matrix/stdout.log`（EXP-E01~E15 eval-route 测试项）
- **状态**：待提单（历史已知，与基线一致）
