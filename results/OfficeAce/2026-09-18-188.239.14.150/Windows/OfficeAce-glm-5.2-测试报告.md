# OfficeAce-glm-5.2 每日测试报告

> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-09-18 19:15:00（北京时间）
> **执行归档**：`results/OfficeAce/2026-09-18-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（1 个 P2 FAIL：D8-1 文档与能力一致）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OfficeAce + glm-5.2 |
| OS / 架构 | Windows 11 AMD64 |
| Node / npm / Python | Node v24.14.1 / npm 11.11.0 / Python 3.13.4 |
| 被测版本（SUT） | v1.1.5（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | 40（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12 / doctor 确认已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置 / 只读子账号 test001 已下发） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status/auth）/ MCP 协议 / eval harness |
| 设计真源 | 设计级 80 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 80 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；MCP 协议测试通过 stdin/stdout JSON-RPC；eval harness 通过 `run-eval.mjs` 执行 15 条中文意图路由测试；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 119（设计级 80 + 展开级 39） |
| 已执行 | 119 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 118 / 1 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 99.2% |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（未创建真云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 79 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | D8-1 文档与能力一致（proxy 命令未文档化） |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 无 |
| **合计** | **80** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 39 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | 无 |
| BLOCKED | 0 | 无 |
| SPEC-MISMATCH | 0 | 无 |
| NOT_RUN | 0 | 无 |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P2 | D8-1 | proxy 命令未在 README 文档化 | README.md 和 README.zh-CN.md 应文档化所有 CLI 命令包括 proxy | proxy 命令在 setup-cli.mjs:5037 实现但 README 未提及 | setup-cli.mjs:5037 | P | 待提单 |

### 根因详情

```markdown
**#1 [P2] D8-1 proxy 命令未在 README 文档化**

- 期望：README.md 和 README.zh-CN.md 应包含 proxy 命令的说明
- 实际：proxy 命令在 setup-cli.mjs:5037 中实现，但 README.md 和 README.zh-CN.md 均未提及该命令
- 根因：`plugins/huaweicloud-core/src/setup-cli.mjs:5037` (proxy 命令已实现但未文档化)
- 证据：`evidence/D8-1/stdout.log`
```

---

## 五、未执行用例与原因

无未执行用例。所有 119 条用例均已执行并有证据落盘。

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
| 真云资源 | 否 | 不适用 | 未创建真云资源，无需释放 |

> 本轮测试以源码级探针 + CLI 真机 + MCP 协议测试为主，未创建真云资源。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：无（全部 119 条用例已执行）
- 建议：在 README.md 和 README.zh-CN.md 中补充 proxy 命令的文档说明，以修复 D8-1 缺陷
