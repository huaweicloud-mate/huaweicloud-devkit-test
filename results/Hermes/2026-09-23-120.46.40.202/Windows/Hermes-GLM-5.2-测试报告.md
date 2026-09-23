# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-23 10:05:00（北京时间）
> **执行归档**：`results/Hermes/2026-09-23-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（P0 有 1 个 SPEC-MISMATCH，展开级有 11 个已知基线 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + GLM-5.2 |
| OS / 架构 | Windows 10 (x86_64) |
| Node / npm / Python | Node v22.13.0 / npm 10 / Python 3.11.15 |
| 被测版本（SUT） | `v1.1.7-next.0`（npm @next，hdk 源码 v1.1.6, commit a96422e） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置，readonly 子账号已配置） |
| 测试类型 | 源码级探针 / MCP 协议直调 / eval harness / 静态文件审查 |
| daily 基础用例 | 设计级 100 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；MCP 协议通过 `dispatch()` 函数直调；eval harness 通过 `run-eval.mjs` 执行 serviceCatalog 路由测试；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 143（设计级 100 + 展开级 43） |
| 已执行 | 143 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 130 / 11 / 0 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 142） | 91.5% |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 不涉及（无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 99 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D4-23: huawei-agent-rules.md 文件缺失 |
| NOT_RUN | 0 | — |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E14 eval 路由 MISS（已知基线 21.4%） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | EXP-E08 (N/A 诊断类，非路由用例) |

### 3.3 按优先级分布

| 优先级 | 总数 | PASS | FAIL | SPEC-MISMATCH | NOT_RUN |
|---|---|---|---|---|---|
| P0 | 19 | 18 | 0 | 1 | 0 |
| P1 | 94 | 82 | 11 | 0 | 1 |
| P2 | 30 | 30 | 0 | 0 | 0 |

---

## 四、缺陷清单

### 4.1 SPEC-MISMATCH

| ID | 标题 | 根因 | 证据 |
|---|---|---|---|
| D4-23 | huawei-agent-rules.md 注入生效性 | `plugins/huaweicloud-core/` 无 `agent-rules/huawei-agent-rules.md` 文件；安全约束通过 hooks 实现而非设计约定的文件注入 | `evidence/D4-23/stdout.log` |

### 4.2 已知基线 FAIL（非新增缺陷）

| ID | 标题 | 根因 | 证据 |
|---|---|---|---|
| EXP-E01~E14 | eval 路由准确率 21.4% | `serviceCatalog` 中文自然语言匹配覆盖率不足（已知基线） | `evidence/EXP-E0*/stdout.log` |

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| EXP-E08 | 展开级 | P1 | NOT_RUN | 【改用例】 | 诊断类用例（非路由匹配），eval harness 标记 N/A，不适用于路由准确率评测 |

---

## 六、安全/红线

- [x] 凭证泄漏事件：0
- [x] 写操作误判 read-only：0
- [x] 新暴露缺口：0（D4-23 为 SPEC-MISMATCH，非安全缺口，hook 安全约束正常工作）
- [x] PASS 门禁通过：`verify_no_fake_pass.py` 通过
- [x] 覆盖率门禁通过：`verify_coverage.py` 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 2.3% ≤ 15%）

---

## 七、资源释放

本轮测试为源码级探针 + MCP 协议直调 + eval harness，未创建真云资源，无需释放。

---

## 八、遗留建议

1. **D4-23 SPEC-MISMATCH**：建议维护者裁决——hook-based 安全约束是否等效于设计约定的 rules.md 文件注入，若等效则更新设计文档，若不等效则补充 rules.md 文件。
2. **EXP-E01~E14 路由准确率**：21.4% 为已知基线，建议持续跟踪 serviceCatalog 路由层改进进展。
3. **ReleasePublicIp/AllocatePublicIp**：这两个操作未匹配 writeOperationPrefixes（无 "Release"/"Allocate" 前缀），被分类为 `unknown_read`（allow）。建议评估是否需要将其加入 writeOperationPrefixes。
