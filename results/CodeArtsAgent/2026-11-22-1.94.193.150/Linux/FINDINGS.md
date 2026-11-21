# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-11-22-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-11-22 05:15:00（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.15`（gitHead `bf79b643a1941ef8665548a209683435a2b7a2af`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格。

## #1【P0】D4-3 明文 secret API 拦截缺 DecryptData/DecryptDatakey

- **现象**：`classifyTextCommand('hcloud kms DecryptData --ciphertext x')` 返回 `decision=allow`；`ShowSecretVersion`/`GetSecretValue` 均 `deny`，唯 `DecryptData` 未拦截。
- **断言**：`hcloud kms DecryptData`、`hcloud kms DecryptDatakey` 等明文解密类 API 应命中 `decision=deny`（risk=secret），与 ShowSecretVersion/GetSecretValue 一致。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:599` 文本正则未覆盖 `DecryptData`/`DecryptDatakey` 类离线解密形态。
- **影响**：离线解密/解密的 secret API 未纳入安全拦截，明文凭据类操作可绕过安全策略（凭据红线）。
- **证据**：`evidence/D4-3/stdout.log`

## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL AdministratorFullAccess 委托角色

- **现象**：`evaluateArtifacts` 对 HCL `resource "huaweicloud_identity_agency" "x" { delegated_role { name = "AdministratorFullAccess" } }` 返回 `decision=warn`；JSON broad IAM 则正确 `deny`。
- **断言**：HCL 中授予 `AdministratorFullAccess` 委托角色应命中 `hwc-iam-admin-policy`（severity=deny），与 JSON broad IAM 一致。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196` 的 `hwc-iam-admin-policy` 规则 regex 仅匹配 `AdministratorAccess|FullAccess` 字面量，不含 `AdministratorFullAccess` 委托角色授予形态。
- **影响**：IaC 制品中高权限委托角色未被 deny 拦截，最小权限基线被绕过（I 类红线）。
- **证据**：`evidence/D4-21/stdout.log`

## #3【P1】EXP-E01 serviceCatalog 中文意图「云主机」未路由到 ECS

- **现象**：`huaweicloud_service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回 `recommendedServices=["Run hcloud --help to list available services."]`（未命中 ECS）。
- **断言**：中文意图含「云主机」应命中 `ECS`（查询类），与「云服务器」一致。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2586-2587` ECS 关键词集仅含「弹性云服务器」「云服务器」等，缺「云主机」。
- **影响**：D10 评测集 E01 路由 MISS，中文意图路由覆盖不足。
- **证据**：`evidence/EXP-E01/stdout.log`

## #4【P2】D4-25 Python hook 遥测事件分类 CreateVpc 误判为 cli:invoke

- **现象**：`pyHook('hcloud ECS CreateVpc --name x')` 后 `hook-events.jsonl` 记录 `keys=["cli:read","cli:invoke"]`，缺失 `cli:write`。
- **断言**：`hcloud` 写类命令（CreateVpc）应分类为 `cli:write`，遥测事件应含 `cli:read` 与 `cli:write` 两类。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:112` 的 `WRITE_OPERATION_RE` 未匹配 `CreateVpc` 类写操作动名词。
- **影响**：写操作遥测被低估，安全审计/分类统计失真。
- **证据**：`evidence/D4-25/stdout.log`

## #5【P2】D4-26 findings 证据未脱敏（--key value 空格形态泄露明文凭证）

- **现象**：`evaluateCommandRisk('hcloud ecs DeleteServer --force --admin-pass Secret123')` 的 `findings[].evidence` 存原始命令，明文未脱敏。
- **断言**：findings `evidence` 字段应经 redactEvidence 脱敏，不含明文密码/凭证。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-25` `redactEvidence` 正则仅匹配 `key[:=]value`，不匹配 `--key value` 空格形态。
- **影响**：含凭证命令进入 findings 证据时明文泄露。
- **证据**：`evidence/D4-26/stdout.log`

## #6【P2】D8-9 sanitizeValue 未脱敏敏感值

- **现象**：`sanitizeValue('AK=AKID1234567890 token=abc123')` 返回原文（仅去换行/截断），未移除敏感值。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` `sanitizeValue` 仅截断清洗，无敏感值脱敏逻辑。
- **影响**：遥测值进入 telemetry 时明文敏感值未被清洗。
- **证据**：`evidence/D8-9/stdout.log`
