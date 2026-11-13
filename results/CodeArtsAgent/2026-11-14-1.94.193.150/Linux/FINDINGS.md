# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **生成时间**：2026-11-14 06:00:00（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.14-next.5`（gitHead `4fb59d76`）

## #1【P0】D4-3 明文 secret API 拦截不完整（DecryptData/DecryptDatakey 未列入 blockedSecretOperations）

- **现象**：`hcloud kms DecryptData --ciphertext x` 经 classifyTextCommand 返回 `decision=allow / risk=unknown_read`，未拦截；`ShowSecretVersion`/`GetSecretValue` 返回 `deny/secret`。
- **断言**：DecryptData（返回明文密钥数据）应与 ShowSecretVersion/GetSecretValue 一样被判定 `deny`（secret 风险）而非 `allow`。
- **根因**：`safety-policy.mjs:249`（`policy.blockedSecretOperations` 比较）+ `safety/policy.json` `blockedSecretOperations` 仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，缺 `DecryptData/DecryptDatakey`；`safety-policy.mjs:599` 文本正则 `/ShowSecretVersion|ShowSecret|GetSecretValue|secret_string|secret_binary/` 亦不含 DecryptData。
- **影响**：KMS 解密明文密钥可进入 agent 上下文，违背「明文 secret 不外泄」安全基线。
- **证据**：`evidence/D4-3/stdout.log`

## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL AdministratorFullAccess 委托角色

- **现象**：`evaluateArtifacts` 对 HCL `resource "huaweicloud_identity_agency" "x" { delegated_role { name = "AdministratorFullAccess" } }` 返回 `decision=warn`，且 findings 命中的是无关规则 `hwc-sandbox-missing-ttl`（未命中 `hwc-iam-admin-policy` deny）。JSON `{"Statement":[{"Effect":"Allow","Action":"*"}]}` 则正确 `deny`。
- **断言**：HCL 中授予 `AdministratorFullAccess` 委托角色应命中 `hwc-iam-admin-policy`（severity=deny），与 JSON broad IAM 一致。
- **根因**：`risk-rule-engine.mjs:150`（evaluateArtifacts）HCL 解析未识别 `huaweicloud_identity_agency` 的 `delegated_role/AdministratorFullAccess` 语义，落回无关 sandbox 规则。
- **影响**：IaC 制品中高权限委托角色未被 deny 拦截，最小权限基线被绕过。
- **证据**：`evidence/D4-21/stdout.log`

## #3【P1】EXP-E01 serviceCatalog 中文意图「云主机」未路由到 ECS

- **现象**：`huaweicloud_service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回 `recommendedServices=["Run hcloud --help to list available services."]`（未命中 ECS）；「云服务器」「弹性云服务器」均命中。
- **断言**：中文意图含「云主机」应命中 `ECS`（查询类），与「云服务器」一致。
- **根因**：`tools.mjs:2358-2371`（serviceCatalog 路由表）ECS 别名仅含「弹性云服务器」「云服务器」，缺「云主机」。
- **影响**：D10 评测集 E01 路由 MISS，中文意图路由覆盖不足。
- **证据**：`evidence/EXP-E01/stdout.log`

## #4【P2】D4-26 findings 证据未脱敏（--key value 空格形态泄露明文凭证）

- **现象**：`evaluateCommandRisk('hcloud ecs DeleteServer --force --admin-pass Secret123')` 的 `findings[].evidence` 存原始命令 `hcloud ecs DeleteServer --force --admin-pass Secret123`，明文 `Secret123` 未脱敏。
- **断言**：findings `evidence` 字段应经 redactSecrets 脱敏，不含明文密码/凭证。
- **根因**：`risk-rule-engine.mjs:97`（`evidence: excerpt(context.text)` 未脱敏）；且 `safety-policy.mjs:34`（redactString）正则仅匹配 `key[:=]value`，不匹配 `--key value` 空格形态。
- **影响**：含凭证命令进入 findings 证据时明文泄露。
- **证据**：`evidence/D4-26/stdout.log`

## #5【P2】D4-25 Python hook 遥测把写操作误分类为 cli:invoke

- **现象**：Python hook 记录 `hcloud ECS CreateVpc --name x`、`hcloud ecs DeleteServer` 为 `key=cli:invoke`，仅 `hcloud VPC ListVpcs` 正确 `cli:read`；缺少 `cli:write`。
- **断言**：写操作（Create/Delete）应分类 `cli:write`，只读 → `cli:read`，其他 → `cli:invoke`。
- **根因**：`hooks/huaweicloud-safety.py:57`（WRITE_OPERATION_RE 定义 `r"(^|[A-Za-z0-9])(" + ... + r")\w*"`）前缀 `(^|[A-Za-z0-9])` 无法匹配空格分隔的命令（如 ` ECS CreateVpc`），导致 `is_write` 恒 False。
- **影响**：hook 事件遥测三键分类中写操作缺失，审计/统计失真。
- **证据**：`evidence/D4-25/stdout.log`

## #6【P2】D8-9 sanitizeValue 未脱敏敏感值

- **现象**：`sanitizeValue('AK=AKID1234567890 token=abc123')` 返回原文（仅 trim/换行替换/截断），未移除 AK/token 敏感值。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值（预期「移除敏感值与非法字符，不改变合法值」）。
- **根因**：`telemetry/telemetry.mjs:190`（sanitizeValue 仅 `replace(/[\r\n\t]+/g,' ').trim()` + 截断，无敏感值脱敏逻辑）。
- **影响**：安装 ID/遥测值进入 telemetry 时明文敏感值未被清洗。
- **证据**：`evidence/D8-9/stdout.log`
