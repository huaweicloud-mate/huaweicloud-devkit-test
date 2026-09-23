# CodeArtsWork-GLM-5.2 每日测试报告

> **报告名**：`CodeArtsWork-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-23 08:50:00（北京时间）
> **执行归档**：`results/CodeArtsWork/2026-09-23-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（全部用例通过，无 FAIL/BLOCKED/NOT_RUN）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsWork` + `GLM-5.2` |
| OS / 架构 | `Windows (win32) x64` |
| Node / npm / Python | `Node v22.13.0 / npm 10.9.2 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.7-next.0`（npm @next，gitHead `0790e92`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置 / 只读子账号已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / 真云 E2E / 沙箱预览 / 评测 harness |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP JSON-RPC 子进程 + eval harness（run-eval.mjs）+ 沙箱全链路（connect→upload→deploy→verify→close）；决策/结果落 `stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 100 + 展开级 39 = 139 |
| 已执行 | 139 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `100.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（沙箱会话已关闭，真云只读操作无创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 本轮无缺陷。全部 139 条用例 PASS，无 FAIL / SPEC-MISMATCH。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| — | — | — | 无缺陷 | — | — | — | — | — |

---

## 五、未执行用例与原因（供维护 agent 修改用例）

> 无未执行用例。全部 139 条用例均已执行且有证据落盘。

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| — | — | — | — | — | 无未执行用例 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 沙箱会话（sessionId=8d898bc4...） | 是 | 已关闭（close_session ok） | 残留 0 |
| 真云资源 | 否（只读操作） | 不涉及 | 不涉及 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留即 FAIL。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：无
- 建议：本轮 D3-S3 沙箱预览用例从昨日 BLOCKED 转为 PASS（沙箱配额可用，全链路 connect→upload→deploy→verify→close 成功）。D10-3 路由准确率 100%（8/8），较昨日 21.4% 显著提升。
