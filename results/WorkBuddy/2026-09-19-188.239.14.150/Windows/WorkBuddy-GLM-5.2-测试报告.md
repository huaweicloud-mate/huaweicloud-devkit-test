# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-19 05:15:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-19-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 但无 P0 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + GLM-5.2 |
| OS / 架构 | Windows Server 2022 (10.0.20348) x64 |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.5（npm latest, gitHead e7ed6f6, PR #696） |
| 工具全集 | 40（tools/list 实测） |
| hcloud / 依赖 | hcloud 已配置 / doctor 确认 |
| 真云凭证 | cn-north-4（AKSK 已配置，本轮源码级+MCP工具级测试） |
| 测试类型 | MCP 工具级探针 / 源码级直调 / MCP 协议级 / eval harness |
| daily 基础用例 | 设计级 81 / 展开级 71（预筛后 39 归本客户端） |

> **执行方法**：MCP server JSON-RPC 探针（.mjs）直调 huaweicloud_* 工具；eval harness 跑 serviceCatalog 路由评测；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 80 + 展开级 39 = 119 |
| 已执行 | 119 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 103 / 14 / 2 / 0 / 0 |
| 通过率（分母 = PASS+FAIL = 117） | 88.0% |
| P0 / P1 / P2 新增缺陷 | 0 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮无真云资源创建/删除） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 76 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D1-27, D1-31, D10-3（根因见缺陷清单） |
| BLOCKED | 1 | D10-4（需 LLM harness） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **80** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | D5×2 + C4×22 + E×3 |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（serviceCatalog MISS） |
| BLOCKED | 1 | EXP-E08（explain_error 为工具非服务，需 LLM harness） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | D10-3 / EXP-E01~E14 | serviceCatalog 中文意图路由准确率低 | 路由准确率≥90%（14条中≥13条HIT） | 21.4%（3 HIT / 11 MISS / 1 N/A） | `plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由逻辑 | P | 待提单 |
| 2 | P1 | D1-27 / D1-31 | check_update 返回 check_failed 而非 up_to_date | result=up_to_date, updateAvailable=false | result=check_failed, updateAvailable=false | `plugins/huaweicloud-core/src/update-check.mjs` queryDistTagsSync 网络请求失败 | P | 待提单 |

### 根因详情

**#1 [P1] D10-3 / EXP-E01~E14 serviceCatalog 中文意图路由准确率低**

- 期望：serviceCatalog 中文意图命中对应服务（14条中≥13条HIT，准确率≥90%）
- 实际：3 HIT / 11 MISS / 1 N/A，准确率 21.4%
- MISS 明细：
  - EXP-E01: 期望ECS, 实际"Run hcloud --help to list available services"
  - EXP-E02: 期望ECS, 实际"Run hcloud --help to list available services"
  - EXP-E03: 期望OBS, 实际"Sandbox+DevStation"
  - EXP-E04: 期望EIP, 实际"Run hcloud --help to list available services"
  - EXP-E05: 期望RDS, 实际"Run hcloud --help to list available services"
  - EXP-E07: 期望CBR, 实际"Run hcloud --help to list available services"
  - EXP-E10: 期望FunctionGraph, 实际"Run hcloud --help to list available services"
  - EXP-E11: 期望BSS, 实际"Run hcloud --help to list available services"
  - EXP-E12: 期望CES, 实际"Run hcloud --help to list available services"
  - EXP-E13: 期望ELB, 实际"Run hcloud --help to list available services"
  - EXP-E14: 期望IAM, 实际"Run hcloud --help to list available services"
- HIT 明细：EXP-E06(DCS), EXP-E09(CCE), EXP-E15(Voucher)
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 函数对中文自然语言意图的路由匹配覆盖不足，多数中文意图返回 fallback "Run hcloud --help" 而非匹配到对应服务
- 证据：`evidence/EXP-E01/eval-run.csv`（全量15条评测结果），`evidence/d5-c4-probe.mjs`

**#2 [P1] D1-27 / D1-31 check_update 返回 check_failed**

- 期望：current=1.1.5（latest）时 result=up_to_date, updateAvailable=false
- 实际：result=check_failed, updateAvailable=false
- 根因：`plugins/huaweicloud-core/src/update-check.mjs` queryDistTagsSync 在 Windows 环境下查询 npm registry 失败（可能网络/DNS/registry 配置问题），返回 check_failed 而非正确判定 up_to_date
- 证据：`evidence/D1-27/probe.txt`, `evidence/D1-31/probe.txt`

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 需真实Agent会话行为评测(LLM harness), serviceCatalog路由层无法代理安全干预有效性 | — |
| EXP-E08 | 展开级 | P1 | BLOCKED | 补环境 | explain_error是工具非服务, serviceCatalog无法路由; Agent行为层需LLM harness | — |

> 无 NOT_RUN 用例。所有 BLOCKED 均为真·外部依赖（LLM harness），blockedReason 已写明四要素。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0（D4-5 PASS: DeleteServers 正确识别为写操作）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-4 PASS: show_profile_redacted 无明文SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | N/A | N/A（本轮源码级+MCP工具级测试，无真云资源创建） |

> 本轮测试方法为 MCP 工具级探针和 eval harness，未创建真云资源，无需清理。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：真云 E2E（建删资源归零验证）、真实 Agent 会话行为评测（LLM harness 层）
- 建议：
  1. serviceCatalog 中文意图路由需增强（当前 21.4% 准确率远低于 90% 目标），建议增加中文关键词匹配规则或接入 NLP 意图识别
  2. check_update 在 Windows 环境下的 npm registry 查询需排查网络/DNS 问题，确保返回 up_to_date 而非 check_failed
  3. D10-4 安全干预有效性评测需建设 LLM harness，当前为唯一 BLOCKED 项
