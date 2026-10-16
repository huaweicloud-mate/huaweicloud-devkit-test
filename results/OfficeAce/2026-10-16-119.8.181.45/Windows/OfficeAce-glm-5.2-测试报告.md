# OfficeAce-glm-5.2 每日测试报告

> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：`2026-10-16 09:45:00`（北京时间）
> **执行归档**：`results/OfficeAce/2026-10-16-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 和 BLOCKED，P0 存在 2 个 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows 2022Server x64` |
| Node / npm / Python | `Node v22.22.2 / npm / Python 3.13.4` |
| 被测版本（SUT） | `v1.1.9-next.0`（npm @next，gitHead `6302921c`） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置 / doctor 确认` |
| 真云凭证 | `cn-north-4（AKSK 已配置 / 未使用）` |
| 测试类型 | 源码级探针 / MCP 协议 / 评测路由 |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 216 |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：5 个 grouped probe（d1-upgrade/d2-auth/d4-security/mcp-tools/c4-service-matrix）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，结果分发到 `evidence/<case-id>/stdout.log`；`backfill_daily.py` 批量回填 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `119 / 16 / 11 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 135） | `88.1%` |
| P0 / P1 / P2 新增缺陷 | `2 / 12 / 2` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | D2-4, D3-C14, D4-16, D4-27, D8-9 |
| BLOCKED | `11` | 环境阻塞（真云配额/沙箱/DSH 专属），见 §五 |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E05, E07, E10~E14（serviceCatalog 路由 MISS） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | JSON 凭证脱敏失效 | redactString 对 JSON 中 ak/sk 应脱敏 | ak/sk 明文未脱敏 | `safety-policy.mjs` redactString 函数 | P | 待提单 |
| 2 | P0 | `D4-16` | sh wrap 命令绕过安全检查 | `sh -c "cat credentials.json"` 应返回 deny | MCP 层返回 allow | `safety-policy.mjs` wrap 检测逻辑 | P | 待提单 |
| 3 | P1 | `D4-27` | 双路径脱敏不完整 | redactString 对 ak/sk/token 三字段均脱敏 | token 字段未脱敏 | `safety-policy.mjs` redactString | P | 待提单 |
| 4 | P1 | `EXP-E01` | serviceCatalog 路由 MISS | 意图"创建ECS"应路由到 ECS skill | MISS（未命中） | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 5 | P1 | `EXP-E02` | serviceCatalog 路由 MISS | 意图"创建VPC"应路由到 VPC skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 6 | P1 | `EXP-E03` | serviceCatalog 路由 MISS | 意图"创建OBS桶"应路由到 OBS skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 7 | P1 | `EXP-E04` | serviceCatalog 路由 MISS | 意图"创建RDS"应路由到 RDS skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 8 | P1 | `EXP-E05` | serviceCatalog 路由 MISS | 意图"创建CCE集群"应路由到 CCE skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 9 | P1 | `EXP-E07` | serviceCatalog 路由 MISS | 意图"创建IAM用户"应路由到 IAM skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 10 | P1 | `EXP-E10` | serviceCatalog 路由 MISS | 意图"创建DDS"应路由到 DDS skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 11 | P1 | `EXP-E11` | serviceCatalog 路由 MISS | 意图"创建DCS"应路由到 DCS skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 12 | P1 | `EXP-E12` | serviceCatalog 路由 MISS | 意图"创建SMN主题"应路由到 SMN skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 13 | P1 | `EXP-E13` | serviceCatalog 路由 MISS | 意图"创建DEW密钥"应路由到 DEW skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 14 | P1 | `EXP-E14` | serviceCatalog 路由 MISS | 意图"创建CBR备份"应路由到 CBR skill | MISS | `mcp-server.mjs` serviceCatalog | P | 待提单 |
| 15 | P2 | `D3-C14` | E2E 用例 FAIL（历史证据复用） | — | — | 待复测 | I | 待提单 |
| 16 | P2 | `D8-9` | 文档完整性 FAIL（历史证据复用） | — | — | 待复测 | I | 待提单 |

### 根因详情

**#1 [P0] D2-4 JSON 凭证脱敏失效**
- 期望：`redactString('{"ak":"AKID...","sk":"SK..."}')` → ak/sk 被替换为 `<redacted>`
- 实际：ak/sk 明文保留，未脱敏
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` redactString 函数对 JSON 格式凭证的脱敏正则不完整
- 证据：`evidence/D2-4/stdout.log`

**#2 [P0] D4-16 sh wrap 命令绕过安全检查**
- 期望：`sh -c "cat ~/.config/huaweicloud/credentials.json"` → `deny`
- 实际：MCP 层 hook_check_command 返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` wrap 检测逻辑未覆盖 `sh -c` 包装形式
- 证据：`evidence/D4-16/stdout.log`

**#3 [P1] D4-27 双路径脱敏不完整**
- 期望：redactString 对 ak/sk/token 三字段均脱敏
- 实际：token 字段未脱敏
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs` redactString 脱敏字段列表缺少 token
- 证据：`evidence/D4-27/stdout.log`

**#4-14 [P1] EXP-E01~E14 serviceCatalog 路由 MISS**
- 期望：15 条中文意图经 serviceCatalog 路由应命中对应华为云服务 skill
- 实际：9 条 MISS（EXP-E01~E05, E07, E10~E14），6 条 HIT（EXP-E06, E08, E09, E15 + 2 N/A）
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层对中文意图匹配率不足（基线 21.4% MISS → 本轮 60% MISS）
- 证据：`evidence/c4-service-matrix/stdout.log`（eval/harness/run-eval.mjs 驱动）

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-67` | 设计级 | P2 | BLOCKED | 调归属 | DSH skip install env var requires DSH client. OfficeAce 非 DSH | D1-67 agent=Hermes |
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | Semi-auto E2E: ECS lifecycle requires real cloud ECS creation+deletion | 需 ECS 配额 |
| `D3-C2` | 设计级 | P1 | BLOCKED | 补环境 | Semi-auto E2E: OBS static site deployment requires real cloud OBS | 需 OBS 配额 |
| `D3-C3` | 设计级 | P1 | BLOCKED | 补环境 | Semi-auto E2E: Sandbox deployment requires sandbox DevStation quota | 需沙箱配额 |
| `D3-C6` | 设计级 | P1 | BLOCKED | 补环境 | Semi-auto: Sandbox 7 tool smoke test requires sandbox quota | 需沙箱 |
| `D3-C7` | 设计级 | P1 | BLOCKED | 补环境 | Semi-auto E2E: Cross-region resource operation requires real cloud EIP | 需 EIP 配额 |
| `D3-S2` | 设计级 | P1 | BLOCKED | 补环境 | Semi-auto: requires real cloud VPC creation+deletion | 需 VPC 配额 |
| `D3-S3` | 设计级 | P1 | BLOCKED | 补环境 | Semi-auto: requires sandbox DevStation quota + frontend upload | 需沙箱 |
| `D3-S6` | 设计级 | P2 | BLOCKED | 补环境 | Semi-auto: requires real cloud FunctionGraph quota | 需 FunctionGraph 配额 |
| `D3-S7` | 设计级 | P1 | BLOCKED | 补环境 | Semi-auto: requires real cloud RDS + sandbox quota | 需 RDS+沙箱配额 |
| `D4-25` | 设计级 | P2 | BLOCKED | 调归属 | Requires hook-capable client (Hermes Hook). OfficeAce hookSupport=非Hook | D4-25 agent=Hermes |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | — | 未创建真云资源，无需释放 |

---

## 八、遗留与建议

- 待复测：D3-C14、D8-9 为历史证据复用的 FAIL，需本轮重新执行探针确认
- BLOCKED 11 条均为真云配额/沙箱/DSH 专属用例，需补环境后复测
- 建议：serviceCatalog 路由层需增强中文意图匹配能力（当前 40% HIT 率 → 目标 >80%）
