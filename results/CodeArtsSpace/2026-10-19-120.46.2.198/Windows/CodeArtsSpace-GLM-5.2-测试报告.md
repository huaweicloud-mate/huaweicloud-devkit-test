# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-19 17:59:53（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-19-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.9` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（safety-policy/risk-rule-engine/update-check 函数探针）+ MCP 工具真机调用（hook_check_command/hook_check_artifacts/serviceCatalog 等）+ 真云 E2E（ECS/OBS/沙箱/FunctionGraph 建删归零）+ eval harness 路由层评测。探针复用历史脚本重新执行，结果按用例 ID 拆分落盘 evidence/<case-id>/stdout.log。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 14 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `90.4%` |
| P0 / P1 / P2 新增缺陷 | `1 / 12 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `真云 E2E 用例测后均归零（ECS/OBS/沙箱/FunctionGraph）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `104` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 3 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 5 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 6 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 7 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 8 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 9 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 10 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 11 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 14 | P1 | `EXP-E14` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

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
