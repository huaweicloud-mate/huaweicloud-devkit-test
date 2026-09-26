# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-27 05:05:40（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-09-27-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.7` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调（master-probe.mjs 加载 hdk 源码模块 safety-policy/risk-rule-engine/update-check/tools/mcp-protocol，逐用例直调导出函数 judgeUpdate/redactSecrets/classifyTextCommand/evaluateArtifacts/evaluateDeployPlan/loadPolicy 等，结果落 evidence/<case-id>/stdout.log），辅以 npm view 真实 dist-tags 查询与凭证文件存在性校验。141 条全量执行，无真云建删资源用例（daily 精选集本轮无 E2E 建删项）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `100.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `N/A（本轮无真云建删资源用例）` |

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

- [x] 凭证泄漏事件：`无`（D4-1/2/3 凭证读取/打印/明文 API 拦截均 deny，D2-4/D9-13 脱敏 ak/sk=<redacted>）
- [x] 写操作误判 read-only：`无`（D4-5 hcloud ecs delete 判 deny，未误判 allow）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：`通过`（redactSecrets 对 ak/sk/token/access_token 均输出 <redacted>，明文 data/password 保留）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/EIP 等 | 0 | 0 | N/A（本轮 daily 精选集无真云建删资源用例） |
| 本地凭证文件 | 未改动 | 未改动 | credentials.json / credentials.readonly.json 原状保留 |

> 本轮 daily 精选集（设计级 102 + 展开级 39）均为源码级探针直调，不涉及真云资源建删，无需归零。

---

## 八、遗留与建议

- 无 FAIL / SPEC-MISMATCH，无待裁决项。
- 141/141 PASS，通过率 100.0%，PASS 门禁 + 覆盖率门禁均通过。
- 被测版本 1.1.7（latest 正式版），与源码 commit 7456d059 一致。
- 建议维持每日全量执行，持续监控安全策略与升级检测链稳定性。
