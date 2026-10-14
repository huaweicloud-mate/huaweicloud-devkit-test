# CodeArts-OpenPangu 每日测试报告

> **报告名**：
> **生成时间**：（北京时间）
> **执行归档**：
> **被测对象**：huaweicloud-devkit（GitHub ）
> **结论**：

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent |  +  |
| OS / 架构 |  |
| Node / npm / Python |  |
| 被测版本（SUT） | （npm @next，gitHead ） |
| 工具全集 | （ TOOL_DEFINITIONS） |
| hcloud / 依赖 | [1;91m[USE_ERROR]参数doctor的格式错误,正确格式为:--param=value[0m |
| 真云凭证 |  |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 |
| 设计真源 | 设计级 179 / 展开级 137 / 追踪表 10 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

> **执行方法**：探针脚本（.mjs）直调  导出函数，决策/结果落 ；证据统一落 。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 107（设计级） |
| 已执行 | 1 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN |  |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） |  |
| P0 / P1 / P2 新增缺陷 |  |
| 红线（I 类）违规 |  |
| 资源释放 |  |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 1 | 有证据且通过 PASS 门禁（D4-27） |
| FAIL | 0 | — |
| BLOCKED | 23 | 需 hook-capable 客户端（D4 系列） |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **24** | 已执行+阻塞，其余83条待后续执行 |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 0 | — |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **0** | 展开级用例待执行 |

---

## 四、缺陷清单

本轮测试无 FAIL/SPEC-MISMATCH 缺陷。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D4-1 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-2 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-3 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-4 | 设计级 | P1 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-5 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-6 | 设计级 | P1 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-7 | 设计级 | P1 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-8 | 设计级 | P1 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-9 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-10 | 设计级 | P2 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-11 | 设计级 | P1 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-12 | 设计级 | P2 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-15 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-16 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-17 | 设计级 | P1 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-21 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-22 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-23 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-25 | 设计级 | P2 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-26 | 设计级 | P2 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |
| D4-28 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 为非 Hook 客户端 | — |

> **说明**：D4 安全系列用例（23条）均需 Hermes（Hook 客户端）执行，CodeArtsAgent 为非 Hook 客户端，无法执行这些用例。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：
- [x] 写操作误判 read-only：
- [x] 红线（I 类）违规：
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无 | — | — | — |

> 本轮测试无真云资源创建。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：D4 安全系列（需 Hermes 客户端）、展开级用例
- 建议：为 CodeArtsAgent 补充 D4 安全测试用例的替代执行路径，或在 Hermes 客户端上执行 D4 系列用例

---

## 执行证据

### D4-27 双路径输出脱敏 ✅

**执行时间**：2026-10-14 21:09:32

**测试方法**：源码级探针直调  和  导出函数

**测试结果**：6/6 通过

| 测试项 | 结果 |
|---|---|
| redactSecrets key=value patterns | ✅ PASS |
| redactSecrets bare token= | ✅ PASS |
| redactSecrets security_token | ✅ PASS |
| redactSecrets object redaction | ✅ PASS |
| redactOutput plain text | ✅ PASS |
| non-sensitive fields not redacted | ✅ PASS |

**证据路径**：

**根因**：无（PASS）
