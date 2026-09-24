# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-24-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-24 10:30:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。
> **被测版本**：v1.1.6（gitHead 46152dd）

---

## #1【P0】D4-16 命令包裹穿透（sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID" 未被拦截）

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision=allow`（应为 `deny`）；同一函数对 `powershell -Command "Get-Content ...credentials.json"` 可正确拦截（返回 `deny`）。MCP `hook_check_command` 对 `sh -c` 包裹的 env dump 同样返回 `allow`。
- **断言**：`classifyTextCommand` 对 `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 应返回 `decision=deny`（命令包裹穿透检测，内层 `printenv` 凭证 env 应被发现并拦截），不得返回 `allow`。
- **根因**：`src/safety-policy.mjs` `classifyTextCommand` 函数的 `sh -c` 包裹检测正则未覆盖 `sh -c "..."` 形式（仅覆盖 `bash -c`），导致 `sh` 包裹的凭证 env dump 命令穿透。
- **影响**：Agent 可通过 `sh -c` 包裹绕过安全 hook 读取凭证环境变量，凭证泄露风险；D4-16（P0 命令包裹穿透）不达标。
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 测试项，actual=allow, expected=deny）、`evidence/mcp-tools/stdout.log`（D4-16 wrap-mcp 测试项）
- **状态**：历史问题（上游已存在，重复不复开；关联清单见 `HISTORY_LINKS.md`）

## #2【P0】D4-23 huawei-agent-rules.md 全局规则文件未注入安装目标

- **现象**：`rules/huawei-agent-rules.mdc` 文件存在于源码 `rules/` 目录，但 `setup-cli.mjs`（5145 行）中无任何 `huawei-agent-rules`/`agent-rules`/`rules/huawei` 字符串引用，无注入/复制逻辑；已安装的 `~/.workbuddy/huaweicloud-plugins/rules/` 目录不存在。11 个安装目标均未注入规则文件。
- **断言**：安装后插件目录应存在 `huawei-agent-rules.md`（或 `.mdc`），含 MUST 约束（如禁止直连 csms/kms），11 个安装目标均注入且约束可执行，无孤儿文件；`setup-cli.mjs` 应有引用/注入逻辑。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs` 无 `huawei-agent-rules` 字符串引用，规则文件 `rules/huawei-agent-rules.mdc` 存在但未被任何安装逻辑引用/复制到目标目录。
- **影响**：全局安全规则未注入 Agent 系统提示/规则，MUST 约束（禁止直连 csms/kms 等）无法生效；D4-23（P0 全局规则注入）不达标。
- **证据**：`evidence/d4-install-rules/stdout.log`（D4-23 rules-injected-in-setup=false, installed-rules=false）
- **状态**：历史问题（上游已存在，重复不复开；关联清单见 `HISTORY_LINKS.md`）

## #3【P1】D4-27 双路径输出脱敏不一致（redactSecrets 未脱敏 accessKeyId/sk 字段名格式）

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef","token":"STSTOKEN123"}')` 返回原文未脱敏（ak/sk 明文保留）；而 `redactSecrets('AK: AKID...')` 前缀格式可正常脱敏。同一函数对 JSON 字段名格式（`"ak":`/`"sk":`/`"accessKeyId":`）不脱敏。
- **断言**：`redactSecrets` 应将 `accessKeyId`/`AK`/`access_key`/`sk`/`secretAccessKey` 等所有凭证字段名变体的明文值替换为 `<redacted>`，且不误伤非敏感字段；双路径（策略正则路径 + CLI 输出路径）脱敏一致。
- **根因**：`src/safety-policy.mjs` `redactSecrets` 函数的字段名正则仅覆盖 `AK:`/`SK:` 等前缀形式，未覆盖 `"ak":`/`"sk":`/`"accessKeyId":` 等 JSON 字段名变体，导致双路径脱敏不一致。
- **影响**：以 `"ak":`/`"sk":` 形式出现的凭证值可明文泄露到 Agent 上下文与工具输出；D4-27（P1 双路径输出脱敏）不达标。
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json FAIL）、`evidence/d4-misc/stdout.log`（D4-26 findings-redact-ak/sk FAIL）
- **状态**：历史问题（上游已存在，重复不复开；关联清单见 `HISTORY_LINKS.md`）

## #4【P2】D4-26 findings 证据脱敏不完整（同 #3 根因）

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef","token":"STSTOKEN123"}')` 返回原文未脱敏；findings 证据中 `ak`/`sk` 字段名格式未脱敏（同 #3 根因）。
- **断言**：findings 证据中的凭证字段应被脱敏，`ak`/`sk`/`accessKeyId` 等字段名变体的明文值替换为 `<redacted>`。
- **根因**：`src/safety-policy.mjs` `redactSecrets` 函数（同 #3 根因），字段名正则覆盖不全。
- **证据**：`evidence/d4-misc/stdout.log`（D4-26 findings-redact-ak/sk FAIL）
- **状态**：历史问题（上游已存在，重复不复开；关联清单见 `HISTORY_LINKS.md`）

## #5【P1】EXP-E01~E14 / D10-3 serviceCatalog 中文意图路由准确率仅 21.4%

- **现象**：eval harness（`run-eval.mjs`）对 15 条中文意图经 `serviceCatalog` 实测：仅 3 条 HIT（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 Voucher），11 条 MISS（返回兜底 "Run hcloud --help to list available services."），1 条 N/A（诊断）。准确率 21.4%（3/14）。MISS：EXP-E01/02(期望 ECS)、E03(OBS)、E04(EIP)、E05(RDS)、E07(CBR)、E10(FunctionGraph)、E11(BSS)、E12(CES)、E13(ELB)、E14(IAM)。
- **断言**：`huaweicloud_service_catalog(intent)` 应将中文意图正确路由到对应服务（ECS/VPC/OBS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM），准确率显著高于 21.4%，而非返回兜底提示。
- **根因**：`src/tools.mjs` `serviceCatalog` 的中文意图匹配词表覆盖不全（"云主机"/"云服务器"/"弹性公网IP"/"云数据库"/"函数"/"费用"/"用户权限"等未命中），回落至 `Run hcloud --help` 兜底分支。
- **影响**：Agent 无法将中文用户意图路由到对应华为云服务，中文交互需用户手动指定服务，体验显著下降。
- **证据**：`evidence/c4-service-matrix/stdout.log`（EXP-E01~E15 eval-route 测试项）
- **状态**：历史问题（上游已存在，重复不复开；关联清单见 `HISTORY_LINKS.md`）
