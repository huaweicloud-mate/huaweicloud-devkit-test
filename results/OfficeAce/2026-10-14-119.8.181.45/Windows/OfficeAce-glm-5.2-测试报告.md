# OfficeAce-glm-5.2 每日测试报告
> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-10-14 09:40:11（北京时间）
> **执行归档**：`results/OfficeAce/2026-10-14-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：TODO: 待 agent 补充（探针直调 / MCP 真机 / 真云 E2E 等）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `117 / 16 / 13 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 133） | `88.0%` |
| P0 / P1 / P2 新增缺陷 | `2 / 12 / 2` |
| 红线（I 类）违规 | `TODO: 待填` |
| 资源释放 | `TODO: 待填` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `91` | 有证据且通过 PASS 门禁 |
| FAIL | `5` | 不符预期，根因见缺陷清单 |
| BLOCKED | `11` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `26` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `2` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 2 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | TODO: 待补根因 | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 5 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 6 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 7 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 8 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 9 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 10 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 11 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 12 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 13 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 14 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 15 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 16 | P1 | `EXP-E14` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> TODO: 每个 FAIL 用例的「期望 / 实际 / 根因（文件:行号）/ 证据」需由 agent 依据 evidence/<case-id>/stdout.log 补充。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | DSH skip install env var requires DSH client environment. OfficeAce is not DSH. [调归属] D1-67 agent=Hermes |
| `D3-C1` | D3功能 | ECS生命周期E2E | Semi-auto E2E: ECS lifecycle requires real cloud ECS creation+deletion. [补环境] Need test ECS quota. |
| `D3-C2` | D3功能 | OBS静态站部署E2E | Semi-auto E2E: OBS static site deployment requires real cloud OBS operations. [补环境] Need OBS quota. |
| `D3-C3` | D3功能 | 沙箱部署E2E | Semi-auto E2E: Sandbox deployment requires sandbox DevStation quota. [补环境] Need sandbox quota. |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | Semi-auto: Sandbox 7 tool smoke test requires sandbox quota+signed agreement. [补环境] Need sandbox. |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | Semi-auto E2E: Cross-region resource operation requires real cloud EIP creation. [补环境] Need EIP quota. |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | Semi-auto: requires real cloud VPC creation+deletion with manual confirmation flow. [补环境] Need VPC quota. |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Semi-auto: requires sandbox DevStation quota + frontend project upload. [补环境] Need sandbox. |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | Semi-auto: requires real cloud FunctionGraph quota for function creation + timer trigger. [补环境] Need FunctionGraph quota. |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Semi-auto: requires real cloud RDS + sandbox quota for cross-service delivery. [补环境] Need RDS+sandbox quota. |
| `D4-25` | D4安全 | Python hook 事件遥测分类 | Requires hook-capable client (Hermes Hook). OfficeAce hookSupport=非Hook. hook-events.jsonl not generated. [调归属] D4-25 agent=Hermes |
| `EXP-D5-7-1` |  |  | file:///C:/Users/Administrator/devkit-test/officeace/huaweicloud-devkit-test/results/OfficeAce/2026-10-14-119.8.181.45/Windows/evidence/EXP-D5-7-1/probe.mjs:2
const { writeFileSync } = require('fs');
                          ^

ReferenceError: require is not defined in ES module scope, you can use import instead
    at file:///C:/Users/Administrator/devkit-test/officeace/huaweicloud-devkit-test/results/OfficeAce/2026-10-14-119.8.181.45/Windows/evidence/EXP-D5-7-1/probe.mjs:2:27
    at ModuleJob |
| `EXP-D5-7-3` |  |  | file:///C:/Users/Administrator/devkit-test/officeace/huaweicloud-devkit-test/results/OfficeAce/2026-10-14-119.8.181.45/Windows/evidence/EXP-D5-7-3/probe.mjs:2
const { writeFileSync } = require('fs');
                          ^

ReferenceError: require is not defined in ES module scope, you can use import instead
    at file:///C:/Users/Administrator/devkit-test/officeace/huaweicloud-devkit-test/results/OfficeAce/2026-10-14-119.8.181.45/Windows/evidence/EXP-D5-7-3/probe.mjs:2:27
    at ModuleJob |

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
