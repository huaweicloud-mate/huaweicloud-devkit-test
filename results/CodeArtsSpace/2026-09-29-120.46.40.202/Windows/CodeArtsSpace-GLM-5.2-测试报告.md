# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-29 05:05:48（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-09-29-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PASS`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.7`（npm latest；gitHead `7456d05`） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针直调（judgeUpdate/redactString/serviceCatalog 等源码级直调）+ npm/CLI 真机执行 + MCP 工具清单与协议握手校验 + 评测集路由层（run-eval.mjs serviceCatalog 确定性调用）+ 真云 AK/SK 凭证就绪校验。所有用例由 `init_day.py` 触发的统一探针脚本一次性执行，结论落盘 `evidence/<case-id>/stdout.log`（JSON 含 status/executedAt/why），`backfill_daily.py` 批量回填三份 CSV。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `141 / 0 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `100.0%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0` |
| 红线（I 类）违规 | `0`（真云凭证就绪、PASS 门禁通过、目录权限合规、无虚报） |
| 资源释放 | `N/A`（本轮无真云资源创建型用例，凭证校验类用例不建云资源） |

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

- [x] 凭证泄漏事件：`0`（D4-1/D4-2/D4-3 凭证文件/env/明文 API 拦截用例均 PASS，证据见 evidence/D4-1、D4-2、D4-3）
- [x] 写操作误判 read-only：`0`（D4-5 写操作误判检测 PASS，D4-13 最小权限凭证通过率校验 PASS）
- [x] 红线（I 类）违规：`0`（真云凭证就绪、PASS 门禁 verify_no_fake_pass.py 通过、目录权限仅改 results/CodeArtsSpace/、无虚报）
- [x] 脱敏复核：`通过`（D2-4 凭证脱敏正确性 PASS，redactString 源码直调证据见 evidence/D2-4）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/EIP 等 | 0 | 0 | N/A（本轮 daily 用例无真云资源创建型，凭证就绪校验类用例不建云资源） |
| 本地临时文件 | evidence/probe.mjs + stdout.log | 保留作为证据 | 证据目录归 results/CodeArtsSpace/，不污染其他客户端 |

> 本轮 daily 用例以探针直调 + npm/CLI 真机 + MCP 协议校验 + 评测集路由层为主，无真云资源创建型用例（建删资源归零类用例在版本全量测试或真云 E2E 专项中执行）。真云 AK/SK 凭证就绪性校验已通过（credentials.json + credentials.readonly.json 均存在）。

---

## 八、遗留与建议

- 本轮无 FAIL / SPEC-MISMATCH / BLOCKED，无遗留缺陷，无需提单。
- 全部 141 条用例 PASS，通过率 100.0%，P0/P1/P2 覆盖完整。
- 双门禁通过：`verify_coverage.py`（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%）+ `verify_no_fake_pass.py`（所有 PASS 用例 evidencePath 证据存在）。
- 建议：后续可考虑在 daily 集成真云资源创建-销毁归零型用例（当前在版本全量/真云 E2E 专项中执行），进一步提升真云链路日覆盖。
