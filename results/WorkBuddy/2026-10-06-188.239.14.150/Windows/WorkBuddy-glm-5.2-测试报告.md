# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-06 05:30:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-06-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（3 SPEC-MISMATCH + 1 FAIL，P0 缺陷 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 (MINGW64_NT-10.0-20348 x86_64)` |
| Node / npm / Python | `Node v22.22.2 / npm 12.1.0 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已安装 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| 测试类型 | 源码级探针 / MCP 协议 / eval harness / 真机 CLI |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 211 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；eval harness 跑 serviceCatalog 路由；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 1 / 0 / 3 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `137/141 = 97.2%` |
| P0 / P1 / P2 新增缺陷 | `1 / 3 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 99 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 3 | D2-12, D4-3, D8-9 契约漂移 |
| NOT_RUN | 0 | — |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 路由未命中 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-3 | 明文secret API未拦截 | `csms download-secret/show-secret` → `deny` | `allow` (read_only) | `safety-policy.mjs:489` | P | 待提单 |
| 2 | P1 | D2-12 | R10 runtime非空禁止落盘契约漂移 | runtime非空 persist → `rejected` | `needs_confirmation` (R2流) | `tools.mjs:1199-1271` | P | 待提单 |
| 3 | P1 | D8-9 | sanitizeValue不脱敏AK/SK | AK/SK输入 → `<redacted>` | 原值返回 | `telemetry/telemetry.mjs:189-196` | P | 待提单 |
| 4 | P1 | EXP-E01 | serviceCatalog路由未命中 | "云主机" → ECS | "Run hcloud --help" | `tools.mjs:360` | P | 待提单 |

### 根因详情

**#1 [P0] D4-3 明文secret API拦截不完整**
- 期望：`hcloud csms download-secret` / `hcloud csms show-secret` → `deny`
- 实际：返回 `allow`，`risk: read_only` / `unknown_read`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:489` `classifyTextCommand()` 未将 csms download-secret/show-secret/kms decrypt 列入 deny 规则
- 证据：`evidence/D4-3/stdout.log`

**#2 [P1] D2-12 R10 runtime非空禁止落盘契约漂移**
- 期望：runtime 非空时 persist → `{ok:false, suppressed:true}`
- 实际：返回 `{status:"needs_confirmation"}`（R2 冲突流），S1 未写入
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1199-1271` auth_switch handler 走 R2 确认流
- 证据：`evidence/D2-12/stdout.log`

**#3 [P1] D8-9 sanitizeValue不脱敏**
- 期望：`sanitizeValue('AKABCDEFGHIJKLMNOP')` → `<redacted>`
- 实际：返回原值 `AKABCDEFGHIJKLMNOP`
- 根因：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` 仅 replace 空白+截断
- 证据：`evidence/D8-9/stdout.log`

**#4 [P1] EXP-E01 serviceCatalog路由未命中**
- 期望：`"帮我查一下我账号在华北北京四有哪些云主机"` → ECS
- 实际：`"Run hcloud --help to list available services."`（MISS）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:360` serviceCatalog intent 路由未覆盖"云主机"关键词
- 证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

无。本轮 141 条用例全部执行，无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 写操作正确判 deny/warn）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS | 否 | N/A | N/A（本轮源码级+eval harness，无真云资源创建） |
| import 文件 | 是（D2-16 测试） | 已擦除 | credentials.json.bak 已恢复，S1 原凭证已恢复 |

> 本轮测试无真云资源创建。D2-16 测试中创建的 creds-import.json 已在 auth_confirm 后自动擦除，S1 凭证已从 backup 恢复。

---

## 八、遗留与建议

- 待裁决 SPEC：D2-12（R10 vs R2 冲突流）、D4-3（csms secret API 拦截）、D8-9（sanitizeValue 脱敏）
- EXP-E01 路由 MISS：serviceCatalog 需增加"云主机"关键词映射到 ECS
- 建议：safety-policy 应将 `csms download-secret`/`show-secret`/`kms decrypt` 列入 deny 规则，与 agent-rules.md 的 MUST NOT 约束对齐
