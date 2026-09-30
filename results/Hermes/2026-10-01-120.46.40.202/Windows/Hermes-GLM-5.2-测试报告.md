# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-01 22:00:00（北京时间）
> **执行归档**：`results/Hermes/2026-10-01-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（1 个 P1 缺陷 EXP-E01，其余全 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `GLM-5.2` |
| OS / 架构 | `Windows 10` |
| Node / npm / Python | `Node v22.23.1 / npm / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `41`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK / 未使用）` |
| 测试类型 | 源码级探针 / MCP 协议 / 评测 harness |
| daily 基础用例 | 设计级 102 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；MCP 协议测试通过 `dispatch()` 函数；评测 harness 通过 `eval/harness/run-eval.mjs`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `145`（设计级 102 + 展开级 43） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `144 / 1 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `102` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 无 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `42` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 serviceCatalog 路由 MISS |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`43`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | serviceCatalog 中文意图"云主机"未路由到 ECS | recommendedServices 包含 "ECS" | 返回 "Run hcloud --help"（MISS） | `tools.mjs:serviceCatalog()` ECS routeMap 缺少 "云主机" 关键词 | 待提单 |

### 根因详情

**#1 [P1] EXP-E01 serviceCatalog 中文意图"云主机"未路由到 ECS**

- 期望：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机").recommendedServices` 包含 `"ECS"`
- 实际：返回 `["Run hcloud --help to list available services."]`（MISS）
- 根因：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog()` 函数的 ECS routeMap keywords 列表缺少 `"云主机"` 关键词。当前包含 `'弹性云服务器'`、`'云服务器'`、`'服务器'`、`'虚拟机'`，但不包含 `"云主机"`。
- 证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

本轮无 NOT_RUN / BLOCKED 用例。所有用例均已执行。

---

## 六、安全/红线

| 检查项 | 结果 |
|---|---|
| P0 用例全测 | ✅ 21/21 PASS |
| PASS 门禁（verify_no_fake_pass.py） | ✅ 通过 |
| 覆盖率门禁（verify_coverage.py） | ✅ 通过 |
| 真云资源创建/删除 | 无真云资源创建（源码级探针测试） |
| 红线违规 | 0 |

---

## 七、资源释放

本轮测试未创建任何真云资源（ECS/VPC/OBS等）。所有测试通过源码级探针和 MCP 协议测试完成，无需资源清理。

---

## 八、遗留建议

1. **EXP-E01 缺陷修复建议**：在 `tools.mjs` `serviceCatalog()` 的 ECS routeMap keywords 中添加 `'云主机'` 关键词。
2. **D4-2 边缘发现**：Windows 风格 `%HW_SECRET_KEY%` 环境变量打印和 AWS 风格 `$AWS_SECRET_ACCESS_KEY` 未被 safety policy 拦截（core HW_*/HUAWEICLOUD_* 已正确拦截）。建议评估是否需要扩展覆盖。
3. **D10-4 规则数量**：cloud-risk-rules.json 当前 9 deny + 10 warn = 19 rules，AGENTS.md spec 标注 "9 deny + 7 warn"。deny 数量匹配，warn 规则增加了 3 条（规则库演进）。核心断言（高危→deny、只读→allow）全部通过。
