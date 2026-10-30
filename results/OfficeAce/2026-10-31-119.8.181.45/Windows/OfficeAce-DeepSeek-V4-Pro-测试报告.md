# OfficeAce-DeepSeek-V4-Pro 每日测试报告
> **报告名**：`OfficeAce-DeepSeek-V4-Pro-测试报告.md`
> **生成时间**：2026-10-31 05:33:47（北京时间）
> **执行归档**：`results/OfficeAce/2026-10-31-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `DeepSeek-V4-Pro` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `TODO: 待填（npm 包版本 + gitHead）` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 3 / 5 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `2 / 1 / 0` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `5` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | TODO: 待补根因 | 待提单 |
| 3 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | AGENT_TOOLKIT_MODE=local is DSH-client-specific (HUAWEICLOUD_AGENT_TOOLKIT_MODE env tested by DSH agent) |
| `D3-C3` | D3功能 | 沙箱部署E2E | Sandbox E2E requires DevStation upstream connection (real network sandbox) |
| `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | Sandbox HDKit requires DevStation upstream |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Sandbox requires DevStation upstream |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Sandbox requires DevStation upstream |

---

## 六、安全与红线合规

- [ ] 凭证泄漏事件：`TODO: 待填`
- [ ] 写操作误判 read-only：`TODO: 待填`
- [ ] 红线（I 类）违规：`TODO: 待填`
- [ ] 脱敏复核：`TODO: 待填`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| TODO | TODO | TODO | TODO |

> TODO: 真云用例的资源创建/销毁/归零情况由 agent 依据执行过程补充。

---

## 八、遗留与建议

- TODO: 待裁决 SPEC / 未覆盖项 / 修复建议由 agent 补充。
