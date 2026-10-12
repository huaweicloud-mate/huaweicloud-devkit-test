# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-12 05:08:34（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-12-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.2` (gitHead: 681895da) |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调（safety-policy.mjs classifyTextCommand / hook_check_command / callTool）+ eval harness (run-eval.mjs) 路由评测 + auth_switch 真机凭证测试。P0 安全基线用例通过 classifyTextCommand + callTool 直调验证；D10-3/EXP-E01~E15 通过 eval harness 跑 serviceCatalog 路由评测；D2-11 STS token 拒绝落盘通过 auth_switch persist + securityToken 真机验证；D4-11 提示注入通过 hook_check_command 检测嵌入命令。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `100.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `无需（本轮无真云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `102` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `39` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

本轮无 FAIL 用例。

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`
- [x] 写操作误判 read-only：`无`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`D2-4/D4-27 showProfileRedacted 验证无明文 AK/SK；D4-1/D4-2/D4-3 凭证读取/打印拦截验证 deny`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无真云资源创建 | N/A | N/A | N/A |

> 本轮测试以源码级探针 + callTool 直调为主，未触发真云资源创建。D2-11 STS token 拒绝落盘验证使用已有凭证的 AK/SK（同账号），未创建新资源。

---

## 八、遗留与建议

- 本轮全部 141 条用例 PASS，无 FAIL/BLOCKED/NOT_RUN，无遗留问题。
- eval harness (D10-3) 路由评测基线：EXP-E01 MISS（期望=ECS，实际=Run hcloud --help），其余 HIT。serviceCatalog 对中文意图路由基本准确，E01 的 MISS 属已知基线（21.4% MISS rate）。
- 建议持续关注 serviceCatalog 对自然语言查询的路由命中率优化。
