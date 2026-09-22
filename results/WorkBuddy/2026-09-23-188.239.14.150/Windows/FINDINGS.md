# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-23-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-23 21:30:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D4-23 huawei-agent-rules.md 全局规则文件缺失

- **现象**：在 hdk 源码仓库（`plugins/huaweicloud-core/`）和已安装 npm 包中均未找到 `huawei-agent-rules.md` 文件。搜索所有 .md 文件，仅发现 SKILL.md 文件和 safety 目录下的 `policy.json` + `rules/cloud-risk-rules.json`。源码中无任何 `agent-rules`、`agentRules`、`rules.md` 引用。
- **断言**：安装后 `huawei-agent-rules.md` 应存在于插件目录，包含 MUST 约束（禁止直连 csms/kms 等），11 个安装目标均注入且约束可执行。
- **根因**：`plugins/huaweicloud-core/` 目录下无 `huawei-agent-rules.md` 文件（源码和已安装包均缺失）。该功能可能未实现或已被移除。
- **影响**：全局安全规则未注入到 Agent 系统提示/规则中，MUST 约束（如禁止直连 csms/kms）无法生效。P0 安全用例无法通过。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：待提单

## #2【P2】D4-27 redactSecrets 未脱敏 accessKeyId 字段名

- **现象**：`redactSecrets('accessKeyId: AKNABCD123456789')` 返回 `accessKeyId: AKNABCD123456789`（未脱敏）。而 `redactSecrets('AK: AKNABCD123456789')` 返回 `AK=<redacted>`（正确脱敏）。`redactSecrets('secretAccessKey: abc123def456')` 返回 `secretAccessKey: <redacted>`（正确脱敏）。
- **断言**：`redactSecrets` 应脱敏所有凭证字段名变体，包括 `accessKeyId`、`AK`、`access_key` 等，输出不含明文凭证值。
- **根因**：`src/safety-policy.mjs` `redactSecrets` 函数的正则模式未覆盖 `accessKeyId` 字段名变体。仅匹配 `AK:` 前缀格式，不匹配 `accessKeyId:` 格式。
- **影响**：使用 `accessKeyId` 字段名的凭证值可能泄露到 Agent 上下文中。双路径脱敏（redactSecrets + redactOutput）不一致。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01~E14 serviceCatalog 中文意图路由准确率仅 21.4%（11/14 MISS）

- **现象**：eval harness（`run-eval.mjs`）对 15 条中文意图调用 `huaweicloud_service_catalog`，仅 3 条 HIT（DCS、CCE、Voucher），11 条 MISS（返回 "Run hcloud --help" 而非正确服务路由），1 条 N/A（诊断意图）。准确率 21.4%（3/14）。
  - EXP-E01: 期望 ECS，实际 "Run hcloud --help" — MISS
  - EXP-E02: 期望 ECS，实际 "Run hcloud --help" — MISS
  - EXP-E03: 期望 OBS，实际 "Sandbox+DevStation" — MISS
  - EXP-E04: 期望 EIP，实际 "Run hcloud --help" — MISS
  - EXP-E05: 期望 RDS，实际 "Run hcloud --help" — MISS
  - EXP-E07: 期望 CBR，实际 "Run hcloud --help" — MISS
  - EXP-E10: 期望 FunctionGraph，实际 "Run hcloud --help" — MISS
  - EXP-E11: 期望 BSS，实际 "Run hcloud --help" — MISS
  - EXP-E12: 期望 CES，实际 "Run hcloud --help" — MISS
  - EXP-E13: 期望 ELB，实际 "Run hcloud --help" — MISS
  - EXP-E14: 期望 IAM，实际 "Run hcloud --help" — MISS
- **断言**：serviceCatalog 应将中文意图正确路由到对应华为云服务（ECS/VPC/OBS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM），准确率应显著高于 21.4%。
- **根因**：`src/tools.mjs` `serviceCatalog` 函数的中文意图匹配逻辑覆盖不全。多数中文意图（如"云主机"、"云服务器"、"弹性公网IP"、"云数据库"等）未匹配到正确的服务路由条目，返回兜底 "Run hcloud --help" 而非服务名称。
- **影响**：Agent 无法正确路由中文用户意图到华为云服务，导致用户体验差、需手动指定服务名。影响所有使用中文交互的场景。
- **证据**：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E14/stdout.log`；eval 结果：`eval/results/eval-run-20260922211231.csv`
- **状态**：待提单
