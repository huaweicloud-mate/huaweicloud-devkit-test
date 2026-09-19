# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-20 05:15:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-20-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 且 P0 有 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + GLM-5.2 |
| OS / 架构 | Windows Server (x86_64) |
| Node / npm / Python | Node v22.22.2 / npm / Python 3.11.9 |
| 被测版本（SUT） | `v1.1.5`（npm @latest，gitHead `e7ed6f66`，PR #696） |
| 工具全集 | `40`（tools/list 实测确认） |
| hcloud / 依赖 | doctor 确认已配置 |
| 真云凭证 | 已配置（AKSK cn-north-4） |
| 测试类型 | 源码级探针 / MCP 协议 / eval harness / CLI 真机 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 MCP server 工具，决策/结果落 `stdout.txt`；eval harness 跑 serviceCatalog 路由核对；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计级 100 + 展开级 39） |
| 已执行 | 139 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 123 / 14 / 2 / 0 / 0 |
| 通过率（分母 = PASS+FAIL = 137） | 89.8% |
| P0 / P1 / P2 新增缺陷 | 0 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 无真云资源创建（本轮无真云 E2E 用例） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 96 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D1-27, D1-31, D10-3（根因见缺陷清单） |
| BLOCKED | 1 | D10-4（需真实 Agent 会话评测） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 27 | D5-C4 全部 PASS + EXP-E06/E09/E15 HIT |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（serviceCatalog MISS） |
| BLOCKED | 1 | EXP-E08（explain_error 是工具非服务） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | D10-3/EXP-E01~E14 | serviceCatalog 中文意图路由准确率低 | 准确率≥90%（14条可判定≥13 HIT） | 21.4%（3/14 HIT） | `mcp-server.mjs` serviceCatalog 中文意图匹配覆盖不足 | P | 待提单 |
| 2 | P1 | D1-27/D1-31 | check_update Windows 下返回 check_failed | result=up_to_date (current=latest) | result=check_failed | `update-check.mjs` queryDistTagsSync Windows npm registry 查询失败 | P | 待提单 |

### 根因详情

**#1 [P1] D10-3 / EXP-E01~E14 serviceCatalog 中文意图路由准确率低**

- 期望：serviceCatalog 中文意图路由准确率≥90%
- 实际：21.4%（3 HIT / 14 可判定）
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 函数对中文自然语言意图的路由匹配覆盖不足
- 证据：`evidence/EXP-E01/stdout.txt`，eval harness：`node eval/harness/run-eval.mjs <mcp-server.mjs>`

**#2 [P1] D1-27 / D1-31 check_update 在 Windows 下返回 check_failed**

- 期望：current=1.1.5（=latest）时 result=up_to_date
- 实际：result=check_failed
- 根因：`plugins/huaweicloud-core/src/update-check.mjs` queryDistTagsSync 在 Windows 下 npm registry 查询失败
- 证据：`evidence/D1-27/stdout.txt`，`evidence/D1-31/stdout.txt`

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 需真实 Agent 会话行为评测（LLM harness），serviceCatalog 路由层无法代理安全干预行为。WorkBuddy 非 DSH 客户端，无 dsh 工具，无法运行 run-agent-eval.mjs。 | — |
| EXP-E08 | 展开级 | P1 | BLOCKED | 改用例 | explain_error 是工具而非服务，serviceCatalog 路由层无法代理诊断意图。用例预期 serviceCatalog 命中 explain_error→诊断，但 explain_error 本身是 MCP 工具不是云服务。 | 用例应改为直接调用 huaweicloud_explain_error 工具验证诊断能力，而非通过 serviceCatalog 路由 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | — | 本轮无真云 E2E 用例，无资源创建 |

---

## 八、遗留与建议

- D10-4 (P0 BLOCKED)：需真实 Agent 会话评测环境（dsh 或 CDP 自动化），建议为非 DSH 客户端提供 CDP 会话自动化方案
- D1-27/D1-31 (P1 FAIL)：Windows 下 check_update 功能不可用，建议修复 queryDistTagsSync 在 Windows 下的 npm registry 查询
- D10-3/EXP-E01~E14 (P1 FAIL)：serviceCatalog 中文意图路由准确率 21.4%，建议增强中文关键词匹配覆盖
- EXP-E08 (BLOCKED)：用例设计需调整，explain_error 是工具非服务
