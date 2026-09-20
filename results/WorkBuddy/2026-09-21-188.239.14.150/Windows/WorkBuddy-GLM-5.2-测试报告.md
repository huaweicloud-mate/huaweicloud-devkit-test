# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-21 05:10:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-21-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL，无 BLOCKED）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | WorkBuddy + GLM-5.2 |
| OS / 架构 | Windows Server (x86_64) |
| Node / npm / Python | Node v22.22.2 / npm 10.9.7 / Python 3.11.9 |
| 被测版本（SUT） | `v1.1.5`（npm @latest，gitHead `e7ed6f66`，PR #696） |
| 工具全集 | `40`（tools/list 实测确认） |
| hcloud / 依赖 | doctor 确认已配置 |
| 真云凭证 | 已配置（AKSK cn-north-4） |
| 测试类型 | 源码级探针 / MCP 协议 / eval harness / CLI 真机 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 MCP server 工具 + 源码直调 risk-rule-engine，决策/结果落 `stdout.log`；eval harness 跑 serviceCatalog 路由核对；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 139（设计级 100 + 展开级 39） |
| 已执行 | 139 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 125 / 14 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL = 139） | 89.9% |
| P0 / P1 / P2 新增缺陷 | 0 / 2 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 无真云资源创建（本轮无真云 E2E 用例） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 97 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D1-27, D1-31, D10-3（根因见缺陷清单） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | D5-C4 全部 PASS + EXP-E06/E09/E15 HIT + EXP-E08 N/A |
| FAIL | 11 | EXP-E01~E05, E07, E10~E14（serviceCatalog MISS） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | D10-3/EXP-E01~E14 | serviceCatalog 中文意图路由准确率低 | 准确率≥90%（14条可判定≥13 HIT） | 21.4%（3/14 HIT） | `mcp-server.mjs` serviceCatalog 中文意图匹配覆盖不足 | P | 历史问题 |
| 2 | P1 | D1-27/D1-31 | check_update Windows 下返回 check_failed | result=up_to_date (current=latest) | result=check_failed | `update-check.mjs` queryDistTagsSync Windows npm registry 查询失败 | P | 历史问题 |

### 根因详情

**#1 [P1] D10-3 / EXP-E01~E14 serviceCatalog 中文意图路由准确率低**

- 期望：serviceCatalog 中文意图路由准确率≥90%
- 实际：21.4%（3/14 HIT，11 MISS）
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 函数对中文自然语言意图的路由匹配覆盖不足，多数返回 fallback "Run hcloud --help"
- 历史关联：#762, #761, #752, #733, #689, #683, #674（详见 HISTORY_LINKS.md）

**#2 [P1] D1-27 / D1-31 check_update Windows 下返回 check_failed**

- 期望：current=1.1.5（=latest）时 result=up_to_date；dismiss=true 时 result=dismissed
- 实际：result=check_failed（两种场景均失败）
- 根因：`plugins/huaweicloud-core/src/update-check.mjs` queryDistTagsSync 在 Windows 下查询 npm registry 失败
- 历史关联：#746, #679, #673（详见 HISTORY_LINKS.md）

---

## 五、未执行用例与原因

无未执行用例。所有 139 条用例均已执行，无 NOT_RUN/BLOCKED。

---

## 六、安全/红线

| 红线项 | 状态 | 说明 |
|---|---|---|
| 真云用例执行 | N/A | 本轮无真云 E2E 用例需执行 |
| PASS 门禁 | ✅ 通过 | 所有 PASS 用例均有 evidencePath 且证据存在 |
| 覆盖率门禁 | ✅ 通过 | P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0% |
| 凭证泄露检查 | ✅ 安全 | 探针输出无明文 AK/SK |
| 缺陷提单 | ✅ 完成 | 2 项缺陷均为历史问题，已生成 HISTORY_LINKS.md 关联清单 |
| 目录权限 | ✅ 合规 | 只提交 results/WorkBuddy/ 目录 |

---

## 七、资源释放

本轮测试无真云资源创建，无需清理。

---

## 八、遗留建议

1. **D10-4 改进**：今日 D10-4 从 BLOCKED 改为 PASS（通过源码直调 risk-rule-engine.mjs 的 loadRiskRules + evaluateCommandRisk 验证规则库 16 条 + 三态判定 deny/warn/allow）。建议后续保持源码直调方式。
2. **D10-3 路由准确率**：serviceCatalog 中文意图路由准确率持续为 21.4%，建议优先修复中文关键词匹配逻辑。
3. **D1-27/D1-31 check_update**：Windows 下 check_update 持续返回 check_failed，建议修复 queryDistTagsSync 在 Windows 下的 npm registry 查询问题。
4. **源码搜索改进**：今日修复了昨日多个误判 FAIL（D1-65/D1-67/D1-68/D8-9/D8-10/D9-11），原因是昨日探针只搜 mcp-server.mjs 单文件，今日改为搜索 src/ 目录全部 .mjs/.js 文件。

---

## 证据索引

| 探针脚本 | 覆盖用例 | 结果文件 |
|---|---|---|
| `evidence/p0-design-probe.mjs` | P0 设计级 19 条 + D9-1/D9-2 | `evidence/p0-design-summary.json` |
| `evidence/d10-4-probe.mjs` | D10-4 源码直调 | `evidence/d10-4-summary.json` |
| `evidence/non-p0-design-probe.mjs` | P1/P2 设计级 81 条 | `evidence/non-p0-design-summary.json` |
| `evidence/expanded-probe.mjs` | 展开级 39 条 (D5+C4+E) | `evidence/expanded-summary.json` |
| `evidence/eval-run-result.csv` | EXP-E01~E15 路由评测 | CSV 格式 |

> 每条用例的证据（probe + stdout.log）统一落 `evidence/<case-id>/` 目录。
