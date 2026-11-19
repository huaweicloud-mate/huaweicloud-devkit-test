# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-20 05:30:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-20-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷：P0×1 / P1×1 / P2×2，均为历史已知缺陷，不重复开单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.12.3` |
| 被测版本（SUT） | `2.0.0-next.4 (gitHead 16a24814)` |
| 工具全集 | `58`（MCP tools/list，D9-1/D9-8 已验证 schema type=object） |
| hcloud / 依赖 | `hcloud 7.2.12 / 真云凭证 cn-north-4 已配置` |
| 测试类型 | 源码级直调 / hook 实测（Python+Node）/ MCP 协议帧 / 真云 E2E（建删归零） |
| daily 基础用例 | 设计级 107 / 展开级 39（建包已按 agent+OS 预筛） |

> **执行方法**：源码级直调（`import` 全局包 `dist/*.js` 模块直调 `classifyTextCommand`/`redactSecrets`/`evaluateCommandRisk`/`callTool` 等）+ MCP 协议真机（`node dist/mcp-server.js` stdio 帧协议）+ hook 实测（Python/Node `huaweicloud-safety`）+ 真云 E2E（`hcloud` 建删归零 + 只读子账号 + CTS 审计）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 4 / 0 / 5 / 1` |
| 通过率（分母 = PASS+FAIL = 140） | `97.1%` |
| P0 / P1 / P2 缺陷 | `1 / 1 / 2`（全部历史已知，见 HISTORY_LINKS.md） |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零`（VPC hdk-s3-* 残留=0，OBS hdk-s3-* 已删） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `99` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单（历史已知） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `4` | 契约漂移（2.0.0 审批门/TS 重构，非产品缺陷） |
| NOT_RUN | `1` | D1-39 Windows 专属（OS 列标注） |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 云主机路由 MISS（历史已知） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `1` | EXP-D5-3-3 工具 schema 契约漂移（非产品缺陷） |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（均历史已知，不重复开单）

| # | 级别 | 用例ID | 标题 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-21` | hook_check_artifacts 未拦截 HCL AdministratorFullAccess 委托角色 | HCL `delegated_role { name = "AdministratorFullAccess" }` 应命中 `hwc-iam-admin-policy`（deny） | 返回 `warn`，命中无关规则 `hwc-sandbox-missing-ttl`；JSON broad IAM 正确 deny | `safety/rules/cloud-risk-rules.json`（`hwc-iam-admin-policy` 仅匹配 Action `*` 通配符，缺 delegated_role 形态）+ `src/risk-rule-engine.ts:136` | 历史已知 |
| 2 | P1 | `EXP-E01` | serviceCatalog 中文意图「云主机」未路由到 ECS | 中文意图含「云主机」应命中 `ECS` | 返回 `["Run hcloud --help ..."]` MISS（「云服务器」命中） | `src/capability-catalog.ts:25-37`（ECS keywords 缺「云主机」） | 历史已知 |
| 3 | P2 | `D4-26` | findings 证据未脱敏（--key value 空格形态泄露明文凭证） | findings `evidence` 应经 redactEvidence 脱敏 | `evidence` 存原始命令，明文 `Secret123` 未脱敏 | `src/risk-rule-engine.ts:136-146`（redactEvidence 正则仅匹配 `key[:=]value`，不匹配 `--key value`） | 历史已知 |
| 4 | P2 | `D8-9` | sanitizeValue 未脱敏敏感值 | `sanitizeValue` 应移除 AK/SK/token 敏感值 | 返回原文仅去换行/截断，`AK=AKID1234567890 token=abc123` 未脱敏 | `src/telemetry/telemetry-values.ts:27-33`（无敏感值脱敏逻辑） | 历史已知 |

### 根因详情

**#1 [P0] D4-21 hook_check_artifacts 未拦截 HCL AdministratorFullAccess 委托角色**
- 期望：HCL 中授予 `AdministratorFullAccess` 委托角色应命中 `hwc-iam-admin-policy`（severity=deny），与 JSON broad IAM 一致
- 实际：`evaluateArtifacts` 返回 `decision=warn`，findings 命中无关规则 `hwc-sandbox-missing-ttl`
- 根因：`safety/rules/cloud-risk-rules.json`（`hwc-iam-admin-policy` 规则 regex 仅匹配 `Action "*"` / `Action:*` 通配符，不含 `delegated_role { name = "AdministratorFullAccess" }` 委托角色）+ `src/risk-rule-engine.ts:136`
- 影响：IaC 制品中高权限委托角色未被 deny 拦截，最小权限基线被绕过（I 类红线）
- 证据：`evidence/D4-21/stdout.log`

**#2 [P1] EXP-E01 serviceCatalog 中文意图「云主机」未路由到 ECS**
- 期望：中文意图含「云主机」应命中 `ECS`（查询类）
- 实际：`recommendedServices=["Run hcloud --help ..."]`（未命中 ECS）
- 根因：`src/capability-catalog.ts:25-37`（ECS keywords 缺「云主机」）
- 证据：`evidence/EXP-E01/stdout.log`

**#3 [P2] D4-26 findings 证据未脱敏**
- 期望：`findings[].evidence` 应经 redactEvidence 脱敏，不含明文密码
- 实际：`evidence` 存原始命令，明文 `Secret123` 未脱敏
- 根因：`src/risk-rule-engine.ts:136-146`（`--key value` 空格形态未匹配）
- 证据：`evidence/D4-26/stdout.log`

**#4 [P2] D8-9 sanitizeValue 未脱敏敏感值**
- 期望：`sanitizeValue` 应移除 AK/SK/token 敏感值
- 实际：返回原文（仅去换行/截断）
- 根因：`src/telemetry/telemetry-values.ts:27-33`
- 证据：`evidence/D8-9/stdout.log`

### SPEC-MISMATCH 契约漂移记录（2.0.0 非产品缺陷，不予提单）

- **SM-1 D5-3 / EXP-D5-3-3**：2.0.0 `TOOL_DEFINITIONS`（`src/tool-definitions.ts`）仅剩 `name`/`description`，`inputSchema` 迁移至 `src/tool-schemas.ts`（zod 定义），运行时经 MCP `z.toJSONSchema()` 生成。D9-1/D9-8 已验证 58 工具 schema type=object 正常，仅源码层直读 `inputSchema` 断言不再适用。
- **SM-2 D3-C3 / D3-S3**：2.0.0 `huaweicloud_sandbox_connect` 直调新增审批门（confirm-not-deny），返回 `status=rejected/code=USER_CONFIRMATION_REQUIRED/approvalToken`，需先走审批流再连接；不再是直调即连。
- **SM-3 D3-C13**：2.0.0 `huaweicloud_obs_set_website_config(action=set)` 新增审批门，直调返回 `status=rejected/code=USER_CONFIRMATION_REQUIRED`；`mb`（建桶）与 `get`（读）正常，`set` 写操作需审批。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链 EINVAL 语义专属，本机 Linux 结构性不适用（OS 列标注 Windows 专属）；Linux 侧由 D1-40 反向提醒覆盖 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证；真云只读子账号经 `run-as-readonly.py` 隔离执行（D4-13）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC `hdk-s3-c1-*` / `s2-*` / `audit-*` | 是（D3-C1/D3-S2/D4-14） | 已删 | `ListVpcs` 过滤 `hdk-s3-*` 残留=0 |
| OBS `hdk-s3-obs-*` / `web-*` | 是（D3-C2/D3-C13） | 已删 | `rm -f` 删除，无残留桶 |
| 沙箱会话 | 尝试（审批门拦截前无 session） | 已 close（无 session） | 无残留会话 |

> 真云只删本次创建资源（前缀 `hdk-s3-`），未影响既有/他人资源。真云归零核实：`hdk-s3-` VPC 残留=0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D5-3 / EXP-D5-3-3 / D3-C3 / D3-S3 / D3-C13`（2.0.0 审批门 + TS 重构引入的契约漂移，非产品缺陷，不计入提单）
- 历史已知缺陷：`D4-21 / D4-26 / D8-9 / EXP-E01` 与 11-19 完全一致，见 `HISTORY_LINKS.md`，不重复开单
- 建议：zod 依赖在 npm 发布包根 `package.json` 缺失（仅声明 undici），运行时 `dist/tool-schemas.js` external import `zod` 需手动补装；建议发布侧将 zod 纳入 dependencies 或 bundle，避免安装即损坏。
