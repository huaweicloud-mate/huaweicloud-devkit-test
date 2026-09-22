# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-23 05:55:00（北京时间）
> **执行归档**：`results/Hermes/2026-09-23-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 1 个 P0 FAIL + 2 个 SPEC-MISMATCH + 15 个 EXP-E 路由 MISS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `GLM-5.2` |
| OS / 架构 | `Windows 10 (x86_64)` |
| Node / npm / Python | `Node v22.13.0 / npm 10 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.7-next.0`（npm @next，hdk main commit `a96422e`） |
| 工具全集 | `40`（tools.mjs TOOL_DEFINITIONS，huaweicloud_ 前缀计数 104 含别名） |
| hcloud / 依赖 | `doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置，只读子账号已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / eval harness |
| daily 基础用例 | 设计级 100 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；eval harness 跑 serviceCatalog 路由评测集；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `143`（设计级 100 + 展开级 43） |
| 已执行 | `143` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 16 / 0 / 2 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 143） | `87.4%` |
| P0 / P1 / P2 新增缺陷 | `1 / 18 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 97 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | D4-16 命令包裹穿透 |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 2 | D9-9 取消能力未声明 / D9-2 invalid params 错误码缺失 |
| NOT_RUN | 0 | 全部执行 |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | 有证据且通过 PASS 门禁 |
| FAIL | 15 | EXP-E01~E15 serviceCatalog 路由 MISS |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 全部执行 |
| **合计** | **43** | |

### 3.3 按优先级汇总（设计级）

| 优先级 | PASS | FAIL | SPEC-MISMATCH | 合计 |
|---|---|---|---|---|
| P0 | 18 | 1 | 0 | 19 |
| P1 | 49 | 0 | 2 | 51 |
| P2 | 30 | 0 | 0 | 30 |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | D4-16 | 命令替换 $(...) 和反引号未拦截 | `classifyTextCommand('$(hcloud ECS DeleteServer)')` → `deny` | `allow` / `not_huaweicloud` | `safety-policy.mjs:428-430` | 待提单 |
| 2 | P1 | D9-9 | capabilities.cancellation 未声明 | `initialize.result.capabilities.notifications.cancellation` 存在 | 未声明（缺失） | `mcp-protocol.mjs:46-52` | 待提单 |
| 3 | P1 | D9-2 | invalid params 未返回 -32602 | `error.code = -32602` | 无 error 对象 | `mcp-protocol.mjs` dispatch | 待提单 |
| 4 | P1 | D10-3/EXP-E01~E15 | serviceCatalog 中文意图路由 MISS | 路由准确率 ≥90% | 0/15 命中（100% MISS） | `tools.mjs` serviceCatalog | 待提单 |

> 详见 `FINDINGS.md`。

---

## 五、未执行用例与原因

本轮无 NOT_RUN / BLOCKED 用例。全部 143 条用例均已执行并回填。

---

## 六、安全/红线

| 检查项 | 结果 |
|---|---|
| 真云用例是否真机执行 | ✅ 未创建真云资源（本轮用例均通过源码级探针执行，无需真云 E2E） |
| PASS 门禁（verify_no_fake_pass.py） | ✅ 通过（所有 PASS 用例均有 evidencePath 且证据存在） |
| 覆盖率门禁（verify_coverage.py） | ✅ 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%） |
| 凭证泄露 | ✅ 无（AK/SK 未输出） |
| 资源残留 | ✅ 无（无真云资源创建） |

---

## 七、资源释放

本轮测试未创建任何真云资源（源码级探针执行），无需资源释放。

---

## 八、遗留建议

1. **D4-16（P0）**：命令替换 `$(hcloud ...)` 和反引号 `` `hcloud ...` `` 绕过审批门禁是高危安全问题，建议优先修复 `classifyTextCommand` 的 hcloud 命令匹配正则，覆盖命令替换前缀。
2. **D9-9/D9-2（P1）**：MCP 协议合规性问题，建议在 `mcp-protocol.mjs` 的 initialize 响应中声明 cancellation 能力，并在 dispatch 中对 invalid params 返回标准 -32602 错误码。
3. **D10-3/EXP-E01~E15（P1）**：serviceCatalog 对中文自然语言意图的路由能力需大幅提升，当前 0% 命中率严重影响用户体验。建议增加中文语义解析或关键词映射表。
4. **真云 E2E**：D3-S3（沙箱预览）、D3-S7（跨服务交付）等场景用例本轮通过源码级验证，建议后续在真云环境下补充 E2E 验证。
