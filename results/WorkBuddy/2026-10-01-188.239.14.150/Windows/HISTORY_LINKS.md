# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## EXP-E01 serviceCatalog 路由未识别"云主机"意图
- 今日证据：`evidence/EXP-E01/stdout.log`（eval harness 结果：MISS, expected=ECS, actual=Run hcloud --help）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#841](https://github.com/huaweicloud/huaweicloud-devkit/issues/841)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）**
    - 历史单内容：## 测试报告: CodeArtsSpace Windows 2026-10-01 每日测试 - **客户端**: CodeArtsSpace (GLM-5.2) - **OS**: Windows - **被测版本**: 1.1.8-next.1 - **执行时间**: 2026-10-01 05:15 BJT - **用例数**: 141 (设计级 102 + 展开级 39) - **结果**
  - [#828](https://github.com/huaweicloud/huaweicloud-devkit/issues/828)（open）**[测试报告] huaweicloud-devkit v1.1.7 版本全量测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.7 - 缺陷：5 项 ## 缺陷清单 ### 4. [D9-9 SPEC-MISMATCH] notifications.cancellation 未声明 ### 5. [EXP-E01~E14 P1] service_catalog 路由准确率低 21.4% ### 6. [D3-C1/C2 P1] 真云 ECS/OBS E2E 认证失败 ### 7. [
  - [#826](https://github.com/huaweicloud/huaweicloud-devkit/issues/826)（open）**[测试报告] huaweicloud-devkit 1.1.7 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.7 - 缺陷：1 项 ## 缺陷清单 ### 3. [EXP-E01~E14 P1] service_catalog 路由准确率低 21.4% **测试报告**：https://github.com/huaweicloud-mate/huaweicloud-devkit-test/blob/main/results/OpenCode/2026-09-29-18
  - [#805](https://github.com/huaweicloud/huaweicloud-devkit/issues/805)（open）**[每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + EXP-E01~E14 路由基线**
    - 历史单内容：# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2） > **落盘路径**：`results/Hermes/2026-09-23-120.46.40.202/Windows/FINDINGS.md` > **生成时间**：2026-09-23 10:00:00（北京时间） > **被测版本**：huaweicloud-devkit@1.1.7-next.0（hdk 源码 v1.1
  - [#797](https://github.com/huaweicloud/huaweicloud-devkit/issues/797)（open）**[每日测试] OfficeAce Windows 2026-09-22: 22 FAIL / 1 BLOCKED (v1.1.5)**
    - 历史单内容：## 测试概况 - **客户端**: OfficeAce (glm-5.2) - **OS**: Windows - **日期**: 2026-09-22 - **被测版本**: huaweicloud-devkit@1.1.5 - **总用例**: 139 (设计级 100 + 展开级 39) - **结果**: 116 PASS / 22 FAIL / 1 BLOCKED - **通过率**:
  - [#785](https://github.com/huaweicloud/huaweicloud-devkit/issues/785)（open）**[测试报告] huaweicloud-devkit 1.1.6-next.0 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.6-next.0 - 缺陷：1 项 ## 缺陷清单 ### 1. [P1] EXP-E01~E15 serviceCatalog 中文意图路由大面积 MISS（12/15 未命中） - **描述**：`node eval/harness/run-eval.mjs` 跑 serviceCatalog 路由评测，15 条中文意图中 12 条 MISS： - **预
  - [#784](https://github.com/huaweicloud/huaweicloud-devkit/issues/784)（open）**[测试报告] huaweicloud-devkit 1.1.6-next.0 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.6-next.0 - 缺陷：1 项 ## 缺陷清单 ### 5. [P1] EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4%） - **描述**：`run-eval.mjs` 跑 15 条中文意图评测集，仅 3 条 HIT（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 Voucher），11 条 MISS
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#730](https://github.com/huaweicloud/huaweicloud-devkit/issues/730)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（Hermes Windows 2026-09-18，4 项）**
    - 历史单内容：## 测试概览 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows Server (x86_64) - **被测版本**: v1.1.5 (gitHead e7ed6f66, PR #696) - **测试日期**: 2026-09-18 - **测试结果**: 设计级 80 (PASS 75 / FAIL 3 / BLOCKED 1 / SPEC-MISM
  - [#714](https://github.com/huaweicloud/huaweicloud-devkit/issues/714)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（2 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.5 - 缺陷：2 项 ## 缺陷清单 ### 9. [P1] EXP-E01~E14 serviceCatalog 中文意图路由准确率低（11/14 MISS） - **描述**：D10 评测集 15 条中文意图经 `run-eval.mjs` 测试，HIT=3/MISS=11/N/A=1，准确率 21.4% - **预期（精确断言）**：serviceCat
  - [#706](https://github.com/huaweicloud/huaweicloud-devkit/issues/706)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（3 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.5 - 缺陷：3 项 ## 缺陷清单 ### 3. [P0] D4-9 高危公网部署仅告警未拦截 - **描述**：`evaluateDeployPlan({action:"deploy", public:true, service:"FunctionGraph"})` 返回 `warn`。 - **预期（精确断言）**：公网暴露 FunctionGraph 
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**[serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足**
    - 历史单内容：## 缺陷描述 `serviceCatalog` 工具对中文自然语言意图的路由准确率仅 21.4%（3/14 HIT）。11 个常见中文云服务意图未命中对应路由。 ## 未命中的中文意图 | # | 用例ID | 中文意图 | 期望路由 | 实际 | |---|---|---|---|---| | 1 | EXP-E01 | "帮我查一下我账号在华北北京四有哪些云主机" | ECS 查询 | MI
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#689, #680
