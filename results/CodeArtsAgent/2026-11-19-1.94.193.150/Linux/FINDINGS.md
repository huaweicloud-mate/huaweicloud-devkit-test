# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-11-19-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-11-19 05:50:00（北京时间）
> **被测版本**：`huaweicloud-devkit@2.0.0-next.4`（gitHead `16a248141fa6a771fd894dfabeaa97267d0d4e82`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格。
> **说明**：本轮 4 项 FAIL 均为历史已知缺陷在 2.0.0-next.4 的稳定复现（与昨日 1.1.15-next.1 完全一致），已历史查重，**不重复开单**，见 HISTORY_LINKS.md。另有 5 项 SPEC-MISMATCH 为 2.0.0 TS 重构/审批门引入的契约漂移（非产品缺陷）。

## #1【P0】D4-21 hook_check_artifacts 未拦截 HCL AdministratorFullAccess 委托角色

- **现象**：`evaluateArtifacts` 对 HCL `resource "huaweicloud_identity_agency" "x" { delegated_role { name = "AdministratorFullAccess" } }` 返回 `decision=warn`，findings 命中无关规则 `hwc-sandbox-missing-ttl`（未命中 `hwc-iam-admin-policy` deny）。JSON `{"Statement":[{"Effect":"Allow","Action":"*"}]}` 则正确 `deny`。
- **断言**：HCL 中授予 `AdministratorFullAccess` 委托角色应命中 `hwc-iam-admin-policy`（severity=deny），与 JSON broad IAM 一致。
- **根因**：`safety/rules/cloud-risk-rules.json`（`hwc-iam-admin-policy` 规则 match.regex 仅匹配 `Action "*"` / `Action:*` 通配符形态，不含 `delegated_role { name = "AdministratorFullAccess" }` 委托角色授予形态）+ `src/risk-rule-engine.ts:136`（`redactEvidence`/`evaluate` 对 HCL 无针对 agency delegated_role 的解析）。
- **影响**：IaC 制品中高权限委托角色未被 deny 拦截，最小权限基线被绕过（I 类红线）。
- **证据**：`evidence/D4-21/stdout.log`

## #2【P1】EXP-E01 serviceCatalog 中文意图「云主机」未路由到 ECS

- **现象**：`huaweicloud_service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回 `recommendedServices=["Run hcloud --help to list available services."]`（未命中 ECS）；「云服务器」「弹性云服务器」均命中。
- **断言**：中文意图含「云主机」应命中 `ECS`（查询类），与「云服务器」一致。
- **根因**：`src/capability-catalog.ts:25-37`（ECS keywords 仅含「弹性云服务器」「云服务器」「服务器」「虚拟机」「镜像」等，缺「云主机」）。
- **影响**：D10 评测集 E01 路由 MISS，中文意图路由覆盖不足。
- **证据**：`evidence/EXP-E01/stdout.log`

## #3【P2】D4-26 findings 证据未脱敏（--key value 空格形态泄露明文凭证）

- **现象**：`evaluateCommandRisk('hcloud ecs DeleteServer --force --admin-pass Secret123')` 的 `findings[].evidence` 存原始命令，明文 `Secret123` 未脱敏。
- **断言**：findings `evidence` 字段应经 redactEvidence 脱敏，不含明文密码/凭证。
- **根因**：`src/risk-rule-engine.ts:136-146`（`redactEvidence` 正则仅匹配 `key[:=]value`，不匹配 `--key value` 空格形态）。
- **影响**：含凭证命令进入 findings 证据时明文泄露。
- **证据**：`evidence/D4-26/stdout.log`

## #4【P2】D8-9 sanitizeValue 未脱敏敏感值

- **现象**：`sanitizeValue('AK=AKID1234567890 token=abc123')` 返回原文（仅去换行/截断），未移除 AK/token 敏感值。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值，不改变合法值。
- **根因**：`src/telemetry/telemetry-values.ts:27-33`（`sanitizeValue` 仅 `replace(/[\r\n\t]+/g,' ').trim()` + 截断，无敏感值脱敏逻辑）。
- **影响**：遥测值进入 telemetry 时明文敏感值未被清洗。
- **证据**：`evidence/D8-9/stdout.log`

---

## SPEC-MISMATCH 契约漂移记录（2.0.0 非产品缺陷，不予提单）

> 以下为 2.0.0-next.4 TS 重构 / confirm-not-deny 审批门引入的结构或行为契约漂移，属预期重构，非缺陷。

### SM-1 D5-3 / EXP-D5-3-3 工具 schema 字段迁移（TOOL_DEFINITIONS 移除 inputSchema）
- **漂移点**：2.0.0 `TOOL_DEFINITIONS`（`src/tool-definitions.ts`）仅剩 `name`/`description`，`inputSchema` 字段迁移至 `src/tool-schemas.ts`（zod 定义），运行时经 MCP `z.toJSONSchema()` 生成。D9-1/D9-8 已验证 58 工具 schema `type=object` 全部正常，仅「源码层直读 inputSchema」断言不再适用。

### SM-2 D3-C3 / D3-S3 沙箱连接新增审批门
- **漂移点**：2.0.0 `huaweicloud_sandbox_connect` 直调返回 `status=rejected/code=USER_CONFIRMATION_REQUIRED/approvalToken`，需先走审批流（confirm-not-deny）再连接；不再是直调即连。

### SM-3 D3-C13 OBS 网站配置新增审批门
- **漂移点**：2.0.0 `huaweicloud_obs_set_website_config(action=set)` 直调返回 `status=rejected/code=USER_CONFIRMATION_REQUIRED`；`mb`（建桶）与 `action=get`（读配置）正常，`set` 写操作需审批。
