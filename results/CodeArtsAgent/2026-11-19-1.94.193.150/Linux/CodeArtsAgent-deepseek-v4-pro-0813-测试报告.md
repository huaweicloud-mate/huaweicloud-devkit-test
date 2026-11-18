# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-19 05:48:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-19-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷：P0×1 / P1×1 / P2×2，均历史已知不重复开单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `2.0.0-next.4 (gitHead 16a24814)` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（`import` 全局包 `dist/*.js` 模块直调 `classifyTextCommand`/`redactSecrets`/`evaluateCommandRisk`/`callTool` 等）+ MCP 协议真机（`node dist/mcp-server.js` stdio 帧协议）+ hook 实测（Python/Node `huaweicloud-safety`）+ 真云 E2E（`hcloud` 建删归零 + 只读子账号 + CTS 审计）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 4 / 0 / 5 / 1` |
| 通过率（分母 = PASS+FAIL = 140） | `97.1%` |
| P0 / P1 / P2 新增缺陷 | `1 / 1 / 2` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零`（VPC hdk-s3-* 残留=0，OBS hdk-s3-* 已删） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `99` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `4` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `safety/rules/cloud-risk-rules.json` hwc-iam-admin-policy 仅匹配 Action:* 通配符，不匹配 HCL delegated_role{AdministratorFullAccess} | 历史已知 #1066 |
| 2 | P2 | `D4-26` | D4安全 | findings 证据脱敏 | `src/risk-rule-engine.ts:136` redactEvidence 仅匹配 key[:=]value，不匹配 --key value 空格形态 | 历史已知 #896 |
| 3 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `src/telemetry/telemetry-values.ts:27` sanitizeValue 仅 trim/截断，无敏感值脱敏 | 历史已知 #1055 |
| 4 | P1 | `EXP-E01` | D10评测 | serviceCatalog「云主机」未路由 ECS | `src/capability-catalog.ts:25-37` ECS keywords 缺「云主机」 | 历史已知 #1065 |

### 根因详情

1. **D4-21（P0）**：HCL `resource "huaweicloud_identity_agency" ... delegated_role { name = "AdministratorFullAccess" }` 仅 `warn(hwc-sandbox-missing-ttl)`，未命中 `hwc-iam-admin-policy` deny。根因 `safety/rules/cloud-risk-rules.json` 的 `hwc-iam-admin-policy` 正则仅覆盖 `Action : *` 通配符形态，未覆盖 delegated_role 委托角色授予形态。证据 `evidence/D4-21/stdout.log`。
2. **D4-26（P2）**：`evaluateCommandRisk('hcloud ecs DeleteServer --force --admin-pass Secret123')` 的 findings.evidence 保留明文 `Secret123`。根因 `src/risk-rule-engine.ts:136` `redactEvidence` 正则仅匹配 `key[:=]value`，不匹配 `--key value` 空格形态。证据 `evidence/D4-26/stdout.log`。
3. **D8-9（P2）**：`sanitizeValue('AK=AKID1234567890 token=abc123')` 返回原文。根因 `src/telemetry/telemetry-values.ts:27` `sanitizeValue` 仅 `replace(/[\r\n\t]+/g,' ').trim()` + 截断，无敏感值脱敏。证据 `evidence/D8-9/stdout.log`。
4. **EXP-E01（P1）**：`service_catalog(intent="帮我查...云主机")` 返回 `["Run hcloud --help..."]`。根因 `src/capability-catalog.ts:25-37` ECS keywords 缺「云主机」（仅含云服务器/弹性云服务器/服务器/虚拟机/镜像）。证据 `evidence/EXP-E01/stdout.log`。

> 以上 4 项均经 `file_issue.py` 历史查重命中既有 open issue，属**历史已知缺陷在 2.0.0-next.4 的稳定复现**，不重复开单，已在既有单补复核评论，详见 `HISTORY_LINKS.md`。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 专属用例（OS 列标注 Windows 专属），本机 Linux 结构性不适用；Linux 由 D1-40 反向提醒覆盖 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D2-4 / D4-2 / D4-27 / D9-13 脱敏与拦截均 PASS，无真实凭证外泄）
- [x] 写操作误判 read-only：`无`（D4-5 DeleteServer→deny/write、D4-18 confirm-not-deny 均 PASS，写操作正确识别）
- [x] 红线（I 类）违规：`无`（真云建删归零，只删本次创建资源）
- [x] 脱敏复核：`2 项已知脱敏缺口`（D4-26 findings 明文 --admin-pass、D8-9 sanitizeValue 未脱敏，均历史已知见 HISTORY_LINKS.md，非本轮新增）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC（hdk-s3-*） | 3 次（c1/s2/audit/deny 探针） | DeleteVpc 全部删除 | 归零核实 `hdk-s3- VPC 残留=0` |
| OBS（hdk-s3-obs/web-*） | 2 次（obs / web 桶） | `obs rm -f` 全部删除 | 删除成功 |

> 真云用例 D3-C1/D3-C2/D3-C13/D3-S2/D4-14/D4-20 均真机执行，建删归零，仅删本次创建资源（VPC 前缀 hdk-s3-*，OBS 前缀 hdk-s3-*）。realcloud 探针末尾归零核实输出 `归零核实: hdk-s3- VPC 残留=0`。

---

## 八、遗留与建议

- **4 项 FAIL 均历史已知**（D4-21 P0 + EXP-E01 P1 + D4-26/P2 + D8-9/P2）在 `2.0.0-next.4` 稳定复现，较昨日 `1.1.15-next.1` 无变化，已查重不重复开单，见 `HISTORY_LINKS.md`。
- **v2 修复确认**：昨日 P0 FAIL `D4-3`（DecryptData/DecryptDatakey 明文 secret API 未拦截）在 `2.0.0-next.4` **已修复**（今日 PASS）；昨日 P2 `D4-25`（Python hook 遥测 cli:write 误分类）在 `2.0.0-next.4` **已修复**（遥测落位 core/telemetry/hook-events.jsonl，cli:read/cli:write 正确，今日 PASS）。
- **5 项 SPEC-MISMATCH 为 2.0.0 预期重构契约漂移**（非缺陷，见 FINDINGS.md SM 段）：SM-1 D5-3/EXP-D5-3-3（TOOL_DEFINITIONS inputSchema 迁至 tool-schemas.ts zod，MCP 协议层 D9-1/D9-8 已验证 58 工具 schema type=object 正常）；SM-2 D3-C3/D3-S3（sandbox_connect 新增 confirm-not-deny 审批门）；SM-3 D3-C13（obs_set_website_config set 新增审批门）。建议将相应用例断言适配审批流 / 以 MCP 协议层 schema 为据。
- **环境提示**：被测包 engines 声明 `node ^22.19.0 || >=23.4.0`，本机 Node v22.13.0 触发 EBADENGINE 警告（不影响本轮执行）。
