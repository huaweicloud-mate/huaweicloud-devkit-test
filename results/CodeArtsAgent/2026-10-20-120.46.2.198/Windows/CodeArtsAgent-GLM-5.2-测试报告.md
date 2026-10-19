# CodeArtsAgent-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsAgent-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-20 21:30:00（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-10-20-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（1 条 FAIL：EXP-E01 路由 MISS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.14.7` |
| 被测版本（SUT） | `v1.1.9`（npm latest，gitHead `05a67b64`） |
| 工具全集 | `42`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12（插件配对 7.3.12，版本不匹配但功能可用）` |
| 真云凭证 | `cn-north-4（AKSK，已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / eval harness |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP 工具直接调用 + eval harness 路由测试，决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `145 / 1 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `107` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 无 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由 MISS |
| BLOCKED | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

### 3.3 按优先级

| 优先级 | PASS | FAIL | BLOCKED | 合计 |
|---|---|---|---|---|
| P0 | 21 | 0 | 0 | 21 |
| P1（设计级） | 56 | 0 | 0 | 56 |
| P1（展开级） | 38 | 1 | 0 | 39 |
| P2 | 30 | 0 | 0 | 30 |
| **合计** | **145** | **1** | **0** | **146** |

---

## 四、缺陷清单

| ID | 级别 | 描述 | 断言 | 根因 | 证据 |
|---|---|---|---|---|---|
| EXP-E01 | P1 | 路由 MISS：中文意图"查看一下不信号在卡片写的有啥服务"被路由到通用 `Run hcloud --help` 而非 ECS | serviceCatalog(intent="查看ECS") 应命中 ECS 服务 | `eval/harness/run-eval.mjs` 路由层：意图"查看ECS"含"ECS"关键词但未命中 ECS 路由规则，fallback 到通用 help | `evidence/EXP-E01/stdout.log` |

---

## 五、未执行用例与原因

无未执行用例。全部 146 条用例已执行并回填。

---

## 六、安全/红线

| 红线 | 结果 |
|---|---|
| 真云用例真机执行 | ✅ 无 mock 假跑，真云凭证已配置 |
| PASS 门禁（禁虚报） | ✅ 所有 PASS 用例均有 evidencePath + 非空 stdout.log |
| 缺陷提单 | ✅ FINDINGS.md 非空，将统一提单 |
| 目录权限 | ✅ 只提交 `results/CodeArtsAgent/` 目录 |
| 覆盖率门禁 | ✅ P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0% |

---

## 七、资源释放

本轮测试未创建真云资源（源码级探针 + MCP 工具验证 + eval harness 路由测试），无需资源释放。

---

## 八、遗留建议

1. **EXP-E01 路由 MISS**：中文意图"查看ECS"未命中 ECS 路由规则，建议优化 `serviceCatalog` 路由层对中文服务名简称的匹配逻辑（如"查看ECS"应匹配 ECS 服务）。
2. **KooCLI 版本不匹配**：已安装 7.2.12 vs 插件配对 7.3.12，建议运行 `npx huaweicloud-devkit install-hcloud` 更新。
3. **D10-3 eval harness 基线**：路由准确率 92.9%（HIT=13, MISS=1, N/A=1），较基线 21.4% MISS 大幅改善。
