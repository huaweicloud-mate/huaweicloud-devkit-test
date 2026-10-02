# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-03 05:15:00（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-03-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1`（gitHead `7456d05`） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：Python 驱动真实命令执行（hdk CLI / hcloud CLI / safety-policy 直调 / eval harness / 真云 API），证据落盘 `evidence/<case-id>/stdout.log` + `result.json`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `121 / 19 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 140） | `86.4%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（全部为历史缺陷） |
| 红线（I 类）违规 | `0`（真云用例无资源泄漏，凭证未落盘） |
| 资源释放 | `N/A`（本批用例为源码级/安全策略级，无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 维度 | 用例数 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|---|
| D1安装 | 19 | 19 | 0 | 0 | 0 |
| D2认证 | 11 | 8 | 3 | 0 | 0 |
| D3功能 | 16 | 16 | 0 | 0 | 0 |
| D4安全 | 29 | 24 | 5 | 0 | 0 |
| D5客户端 | 2 | 2 | 0 | 0 | 0 |
| D6性能 | 4 | 4 | 0 | 0 | 0 |
| D8质量 | 6 | 6 | 0 | 0 | 0 |
| D9协议 | 13 | 13 | 0 | 0 | 0 |
| D10评测 | 2 | 1 | 1 | 0 | 0 |
| **合计** | **102** | **93** | **9** | **0** | **0** |

### 3.2 展开级

| 展开类型 | 用例数 | PASS | FAIL | BLOCKED | NOT_RUN |
|---|---|---|---|---|---|
| EXP-D5（客户端矩阵） | 2 | 2 | 0 | 0 | 0 |
| EXP-C4（服务矩阵） | 22 | 22 | 0 | 0 | 0 |
| EXP-E（评测集） | 15 | 3 | 11 | 0 | 1 |
| **合计** | **39** | **27** | **11** | **0** | **1** |

---

## 四、缺陷清单

> 全部 19 项 FAIL + 1 项 NOT_RUN 均为历史缺陷，包版本 1.1.8-next.1 无变化，无新缺陷、无回归。

### 4.1 设计级 FAIL（9 项）

| # | 用例 | 优先级 | 描述 | 历史单号 |
|---|---|---|---|---|
| 1 | D2-4 | P0 | 小写 ak=/sk= 凭证未被脱敏 | #772 #694 |
| 2 | D2-11 | P0 | STS get-token 未被安全规则拦截 | #689 |
| 3 | D2-16 | P1 | configure import --file 未被拦截 | #694 |
| 4 | D4-2 | P0 | 非华为云前缀凭证 env 打印未拦截 | #677 |
| 5 | D4-3 | P0 | CSMS/KMS 密钥操作未拦截 | #677 |
| 6 | D4-4 | P1 | echo $ACCESS_KEY 通用凭证变量名未拦截 | #757 |
| 7 | D4-24 | P1 | access_token 字段未被脱敏 | #805 |
| 8 | D10-3 | P1 | serviceCatalog 路由准确率 21.4% 远低于 90% | #705 |
| 9 | D10-3 衍生 | P1 | EXP-E 评测集 11/14 MISS | #705 |

### 4.2 展开级 FAIL（11 项，均为 EXP-E serviceCatalog 路由 MISS）

| # | 用例 | 描述 | 历史单号 |
|---|---|---|---|
| 1 | EXP-E01 | "云主机"→ECS 未命中 | #705 |
| 2 | EXP-E02 | "创建云服务器"→ECS 未命中 | #705 |
| 3 | EXP-E03 | "部署静态网站"→OBS 未命中 | #705 |
| 4 | EXP-E04 | "绑定EIP"→EIP 未命中 | #705 |
| 5 | EXP-E05 | "MySQL状态"→RDS 未命中 | #705 |
| 6 | EXP-E07 | "备份策略"→CBR 未命中 | #705 |
| 7 | EXP-E10 | "函数处理"→FunctionGraph 未命中 | #705 |
| 8 | EXP-E11 | "费用查询"→BSS 未命中 | #705 |
| 9 | EXP-E12 | "云监控告警"→CES 未命中 | #705 |
| 10 | EXP-E13 | "HTTPS证书"→ELB 未命中 | #705 |
| 11 | EXP-E14 | "权限审计"→IAM 未命中 | #705 |

### 4.3 展开级 NOT_RUN（1 项）

| # | 用例 | 描述 | 原因 |
|---|---|---|---|
| 1 | EXP-E08 | 诊断类意图(explain_error)路由 | 诊断类意图不在 serviceCatalog 路由范围(harness 标记 N/A); explain_error 工具路由需真实 LLM harness |

---

## 五、未执行用例与原因

| 用例 | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| EXP-E08 | 展开级 | P1 | NOT_RUN | 【补环境】 | 诊断类意图(explain_error)不在 serviceCatalog 路由范围，harness 标记 N/A。explain_error 工具路由需真实 LLM harness（run-agent-eval.mjs 驱动 dsh --profile headless），非 DSH 客户端需 CDP 会话自动化。 | 建议将 EXP-E08 标注为「需真实 LLM harness」并在非 DSH 客户端允许 NOT_RUN |

---

## 六、安全/红线

| 检查项 | 结果 |
|---|---|
| 凭证未落盘 | ✅ AK/SK 未出现在任何日志/上下文 |
| 真云资源归零 | ✅ 本批无真云资源创建（只读 NovaListServers） |
| PASS 门禁 | ✅ verify_no_fake_pass.py 通过 |
| 覆盖率门禁 | ✅ verify_coverage.py 通过（P0 无 NOT_RUN，NOT_RUN+空占比 2.6%） |
| 目录权限 | ✅ 只提交 results/CodeArtsSpace/ |

---

## 七、资源释放

本批用例为源码级/安全策略级/eval harness 级测试，无真云资源创建。真云探针（D4-13）仅执行只读 `ECS NovaListServers`，未创建任何 ECS/VPC/EIP 等资源，无需清理。

---

## 八、遗留建议

1. **历史缺陷跟踪**：19 项 FAIL 全部为历史缺陷（#677/#689/#694/#705/#757/#772/#805），包版本 1.1.8-next.1 无变化，已在 #841 合并单跟踪。建议持续跟踪上游修复进度。
2. **serviceCatalog 路由优化**：EXP-E 评测集 11/14 MISS（命中率 21.4%），中文意图路由是主要瓶颈。建议扩充 serviceCatalog 中文关键词词典（如"云主机"→ECS、"备份策略"→CBR）。
3. **EXP-E08 诊断类意图**：需真实 LLM harness 才能评测，非 DSH 客户端暂标 NOT_RUN。建议后续接入 CDP 会话自动化或扩展 run-agent-eval.mjs 支持非 DSH 客户端。
