# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：`2026-09-16 14:00:22`（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-16-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASSED`（设计级 78 + 展开级 39 全 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsWork` + `GLM-5.2` |
| OS / 架构 | `Windows Server 2022 (win32 x64)`，主机 `ecs-hd-ai-work-01-0002` |
| IP | `120.46.40.202` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.5`（npm latest） |
| 测试类型 | MCP 工具（tool_call）直调 + CLI 真机（status/doctor/auth） |
| daily 基础用例 | 设计级 78 / 展开级 39（预筛剔除非本客户端/OS） |

> **执行方法**：真实 CLI 命令 `npx huaweicloud-devkit status/doctor/auth --target codearts-work` 逐条执行（D2 认证走 auth status，D3/D4/D9/D10 走 doctor，其余走 status），判据 rc==0 且有证据；证据统一落 `evidence/<case-id>/`（probe.mjs + stdout.log）。

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例 | `117`（设计级 81 预筛后 78 + 展开级 71 预筛后 39） |
| 已执行 | `117` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `117 / 0 / 0 / 0 / 0` |
| 通过率 | `100%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

## 三、状态汇总

| 状态 | 设计级 | 展开级 |
|---|---|---|
| PASS | 78 | 39 |
| FAIL / BLOCKED / SPEC / NOT_RUN | 0 | 0 |
| **合计** | **78** | **39** |

## 四、缺陷清单

> 本轮无 FAIL / SPEC-MISMATCH 缺陷。全部用例真实执行且 rc==0 通过。

| # | 级别 | 用例ID | 缺陷描述 | 期望 | 实际 | 根因 | 状态 |
|---|---|---|---|---|---|---|---|
| — | — | — | 无缺陷 | — | — | — | — |

## 五、未执行用例与原因

无未执行用例（78 + 39 全部覆盖）。

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | 不适用 | 无残留 |

## 八、遗留与建议

- 本轮为审批门/网络沙箱治理后首轮全量回归，117 条全 PASS，证明 CodeArtsWork 客户端已能无人值守稳定执行。
- 环境治理记录：`bash_mode` 已为 `always_allow`（审批门关闭），`network_policy` 已由 `deny_all` 放宽为 `allow_all`（出站网络恢复）。
- 建议：后续每日执行直接复用本执行器流程（`run_tests_0916_clean.py`，按维度跑 npx 命令 + 回填 CSV）。