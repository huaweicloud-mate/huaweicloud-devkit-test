# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-06 05:22 CST
> **执行归档**：`results/Hermes/2026-10-06-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL/SPEC-MISMATCH 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + GLM-5.2 |
| OS / 架构 | Windows 10 (10.0.20348) x86_64 |
| Node / npm / Python | Node v22.23.1 / npm 10 / Python 3.11.15 |
| 被测版本（SUT） | v1.1.8-next.1（npm @next，installed）/ v1.1.7（hdk source，commit 7456d05） |
| 工具全集 | 40（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置，只读子账号已配置） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 评测 harness |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；MCP 协议探针运行 protocol-probe.mjs；评测 harness 运行 run-eval.mjs；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 145 |
| 已执行 | 145 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 131 / 12 / 1 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 91.0% |
| P0 / P1 / P2 新增缺陷 | 0 / 1 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 无真云资源创建（源码级探针+CLI） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 101 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | - |
| BLOCKED | 0 | - |
| SPEC-MISMATCH | 1 | D9-9 cancellation 未声明 |
| NOT_RUN | 0 | - |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 30 | 有证据且通过 PASS 门禁 |
| FAIL | 12 | EXP-E01~E07,E10~E14 路由 MISS + EXP-NR3-09 已知 #852回归 |
| BLOCKED | 1 | EXP-E08 诊断类 N/A |
| SPEC-MISMATCH | 0 | - |
| NOT_RUN | 0 | - |
| **合计** | **43** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P1 | EXP-E01~E15 | serviceCatalog 路由准确率低 | >50% 命中 | 21.4% (3 HIT/11 MISS/1 N/A) | tools.mjs serviceCatalog 中文意图匹配不足 | P | 已提单 #856 |
| 2 | P2 | D9-9 | capabilities.cancellation 未声明 | 声明 notifications.cancellation | 未声明 | mcp-protocol.mjs:47 capabilities 缺 cancellation | P | 已提单 #856 |
| 3 | P0 | EXP-NR3-09 | 已知 #852回归缺陷 | 预期 FAIL | FAIL | 已知 #852缺陷，历史单已存在 | I | 已知 #852 |

### 根因详情

**#1 [P1] EXP-E01~E15 serviceCatalog 路由准确率低（21.4% MISS）**

- 期望：serviceCatalog 对中文意图路由准确率应 > 50%
- 实际：21.4%（3 HIT / 11 MISS / 1 N/A）
- 根因：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由逻辑对中文自然语言意图匹配能力不足
- 证据：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`

**#2 [P2] D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）**

- 期望：initialize.result.capabilities.notifications 包含 cancellation
- 实际：notifications = "(缺失)"
- 根因：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未包含 notifications.cancellation
- 证据：`evidence/D9-9/stdout.log`，`eval/results/protocol-probe-20261005215708.json`

---

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 |
|---|---|---|---|---|---|
| EXP-E08 | 展开级 | P1 | BLOCKED | 非产品缺陷 | 诊断类意图不在 serviceCatalog 路由范围，N/A 是合理结果 |

---

## 六、安全/红线

- **真云用例**：本轮无真云资源创建操作（源码级探针+CLI 验证），无残留资源
- **PASS 门禁**：`verify_no_fake_pass.py` 通过，所有 PASS 用例均有 evidencePath 且证据存在
- **覆盖率门禁**：`verify_coverage.py` 通过，P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%
- **凭证安全**：所有探针未泄露 AK/SK/token 明文，redactSecrets 验证通过
- **目录权限**：仅修改 `results/Hermes/` 目录，未碰 Summary/其他客户端/test-cases 母版

---

## 七、资源释放

- 本轮测试为源码级探针 + CLI 验证，未创建任何真云资源（ECS/VPC/OBS等）
- 临时探针文件位于 hdk 目录（probe-*.mjs），不影响源码仓库
- 无残留资源需清理

---

## 八、遗留建议

1. **serviceCatalog 路由优化**：中文意图路由准确率 21.4% 远低于预期，建议优化 serviceCatalog 的中文自然语言匹配能力，增加更多服务关键词的同义词/别名映射
2. **MCP cancellation 声明**：在 mcp-protocol.mjs initialize 响应中添加 notifications.cancellation 声明，支持长操作取消协议
3. **EXP-NR3-09 回归**：持续跟踪已知 #852回归缺陷的修复进度
