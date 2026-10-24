# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D3-C1 ECS 生命周期 E2E 删除异步超时，归零确认窗不足
- 今日证据：`evidence/D3-C1/stdout.log`（finally归零 False；人工清理后 hcloud ListServersDetails count=0）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#896](https://github.com/huaweicloud/huaweicloud-devkit/issues/896)（open）**[daily-test] CodeArtsSpace Windows 2026-10-13: D4-16 命令包裹穿透 + D4-27 脱敏 + eval-route MISS**
    - 历史单内容：## 每日测试缺陷提单 — CodeArtsSpace Windows 2026-10-13 **被测版本**: huaweicloud-devkit@1.1.8-next.3 **测试客户端**: CodeArtsSpace (GLM-5.2) / Windows **测试结果**: 124 PASS / 13 FAIL / 9 BLOCKED **执行归档**: `results/CodeAr
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#828

## D3-C3 沙箱 upload_project 在 Windows 上 tar 归档失败
- 今日证据：`evidence/D3-C3/stdout.log`（upload_project False，connect/deploy/check/close 均 true）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#981](https://github.com/huaweicloud/huaweicloud-devkit/issues/981)（open）**[测试报告] huaweicloud-devkit 1.1.10 每日测试缺陷合并单（1 项新回归）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.10（正式版，gitHead b0e9f026） - 客户端：OpenClaw (deepseek-v4-pro-0813) / OS：Linux aarch64 / 日期：2026-10-21 - 缺陷：1 项新回归（其余 12 项为历史延续，见 HISTORY_LINKS.md） ## 缺陷清单 ### 1. [P1] D3-C3/D3-S3 沙箱 dep
  - [#951](https://github.com/huaweicloud/huaweicloud-devkit/issues/951)（open）**[每日测试] 沙箱 deploy_nginx 部署残留 .conf 未清理，多轮后耗尽 8080-8089 端口**
    - 历史单内容：## 测试概览 - 被测版本：1.1.9（正式版，gitHead 05a67b64） - 缺陷：1 项（其余 15 项为历史延续，见对应用例号的历史单） ## 缺陷清单 ### 1. [P1] 沙箱 deploy_nginx 每次部署在 /etc/nginx/conf.d/ 残留 .conf 未清理，耗尽 8080-8089 端口 - **描述**：`huaweicloud_sandbox_dep
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#828

## D10-3/EXP-E01~E14 serviceCatalog 路由准确率 21.4%
- 今日证据：`evidence/EXP-E01~EXP-E15/stdout.log`、`hdk/eval-results.json`（21.4%）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#896](https://github.com/huaweicloud/huaweicloud-devkit/issues/896)（open）**[daily-test] CodeArtsSpace Windows 2026-10-13: D4-16 命令包裹穿透 + D4-27 脱敏 + eval-route MISS**
    - 历史单内容：## 每日测试缺陷提单 — CodeArtsSpace Windows 2026-10-13 **被测版本**: huaweicloud-devkit@1.1.8-next.3 **测试客户端**: CodeArtsSpace (GLM-5.2) / Windows **测试结果**: 124 PASS / 13 FAIL / 9 BLOCKED **执行归档**: `results/CodeAr
  - [#866](https://github.com/huaweicloud/huaweicloud-devkit/issues/866)（open）**[每日测试] Hermes-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（2 项历史复现）**
    - 历史单内容：## 测试概述 | 项 | 值 | |---|---| | 客户端 | Hermes | | OS | Windows | | 日期 | 2026-10-09 | | 版本 | huaweicloud-devkit@1.1.8-next.1 | | IP | 120.46.40.202 | ## 缺陷清单 ### #1【P0】D4-2 凭证环境变量检测盲区 - **现象**: `classifyT
  - [#864](https://github.com/huaweicloud/huaweicloud-devkit/issues/864)（open）**[每日测试] CodeArtsSpace-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（8 项）**
    - 历史单内容：# FINDINGS — CodeArtsSpace Windows 每日测试 2026-10-09 > 被测版本：huaweicloud-devkit@1.1.8-next.1 > 客户端：CodeArtsSpace | OS：Windows | IP：120.46.40.202 > 执行时间：2026-10-09 05:08（北京时间） > 测试报告：results/CodeArtsSpace
  - [#858](https://github.com/huaweicloud/huaweicloud-devkit/issues/858)（open）**[daily-test] CodeArtsSpace Windows 2026-10-07: 8 缺陷 (4 P0 + 4 P1) huaweicloud-devkit@1.1.8-next.1**
    - 历史单内容：## 每日测试缺陷汇总 | 项 | 值 | |---|---| | 客户端 | CodeArtsSpace (GLM-5.2) | | OS | Windows | | 日期 | 2026-10-07 | | 被测版本 | huaweicloud-devkit@1.1.8-next.1 | | 测试结果 | 132 PASS / 8 FAIL / 1 NOT_RUN (共 141) | | 通过率
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05**
    - 历史单内容：## 缺陷概述 **客户端**: Hermes (GLM-5.2) / **OS**: Windows / **被测版本**: 1.1.8-next.1 **测试日期**: 2026-10-05 ## 缺陷详情 # FINDINGS — Hermes-GLM-5.2 缺陷发现清单 > **落盘路径**：`results/Hermes/2026-10-05-120.46.40.202/Windows
  - [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845)（open）**[daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4)**
    - 历史单内容：## 每日测试缺陷汇总 — CodeArtsSpace / Windows / 2026-10-02 **被测版本**：huaweicloud-devkit@1.1.8-next.1 **测试客户端**：CodeArtsSpace (GLM-5.2) **执行环境**：Windows / 120.46.40.202 **测试结果**：133 PASS / 8 FAIL / 0 BLOCKED (通
  - [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（Hermes Linux 2026-10-02，6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.8-next.1 - 缺陷：6 项 ## 缺陷清单 ### 1. [P1] D3-S1 中文「云主机」意图路由未命中（serviceCatalog ECS 关键词缺失） - **描述**：`service_catalog({intent:'帮我查一下我账号有哪些云主机'})` → `recommendedServices=['Run hcloud --help
  - [#841](https://github.com/huaweicloud/huaweicloud-devkit/issues/841)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）**
    - 历史单内容：## 测试报告: CodeArtsSpace Windows 2026-10-01 每日测试 - **客户端**: CodeArtsSpace (GLM-5.2) - **OS**: Windows - **被测版本**: 1.1.8-next.1 - **执行时间**: 2026-10-01 05:15 BJT - **用例数**: 141 (设计级 102 + 展开级 39) - **结果**
  - [#828](https://github.com/huaweicloud/huaweicloud-devkit/issues/828)（open）**[测试报告] huaweicloud-devkit v1.1.7 版本全量测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.7 - 缺陷：5 项 ## 缺陷清单 ### 4. [D9-9 SPEC-MISMATCH] notifications.cancellation 未声明 ### 5. [EXP-E01~E14 P1] service_catalog 路由准确率低 21.4% ### 6. [D3-C1/C2 P1] 真云 ECS/OBS E2E 认证失败 ### 7. [
  - [#826](https://github.com/huaweicloud/huaweicloud-devkit/issues/826)（open）**[测试报告] huaweicloud-devkit 1.1.7 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 目标 修复 service_catalog 路由准确率低问题（EXP-E01~E14 P1，当前 21.4%） ## 现状 - 被测版本：1.1.7 - 缺陷数：1 项 - **[EXP-E01~E14 P1] service_catalog 路由准确率低 21.4%** - 测试报告：https://github.com/huaweicloud-mate/huaweicloud-devki
  - [#805](https://github.com/huaweicloud/huaweicloud-devkit/issues/805)（open）**[每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + EXP-E01~E14 路由基线**
    - 历史单内容：# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2） > **落盘路径**：`results/Hermes/2026-09-23-120.46.40.202/Windows/FINDINGS.md` > **生成时间**：2026-09-23 10:00:00（北京时间） > **被测版本**：huaweicloud-devkit@1.1.7-next.0（hdk 源码 v1.1
  - [#797](https://github.com/huaweicloud/huaweicloud-devkit/issues/797)（open）**[每日测试] OfficeAce Windows 2026-09-22: 22 FAIL / 1 BLOCKED (v1.1.5)**
    - 历史单内容：## 测试概况 - **客户端**: OfficeAce (glm-5.2) - **OS**: Windows - **日期**: 2026-09-22 - **被测版本**: huaweicloud-devkit@1.1.5 - **总用例**: 139 (设计级 100 + 展开级 39) - **结果**: 116 PASS / 22 FAIL / 1 BLOCKED - **通过率**:
  - [#785](https://github.com/huaweicloud/huaweicloud-devkit/issues/785)（open）**[测试报告] huaweicloud-devkit 1.1.6-next.0 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.6-next.0 - 缺陷：1 项 ## 缺陷清单 ### 1. [P1] EXP-E01~E15 serviceCatalog 中文意图路由大面积 MISS（12/15 未命中） - **描述**：`node eval/harness/run-eval.mjs` 跑 serviceCatalog 路由评测，15 条中文意图中 12 条 MISS： - **预
  - [#784](https://github.com/huaweicloud/huaweicloud-devkit/issues/784)（open）**[测试报告] huaweicloud-devkit 1.1.6-next.0 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.6-next.0 - 缺陷：1 项 ## 缺陷清单 ### 5. [P1] EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4%） - **描述**：`run-eval.mjs` 跑 15 条中文意图评测集，仅 3 条 HIT（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 Voucher），11 条 MISS
  - [#762](https://github.com/huaweicloud/huaweicloud-devkit/issues/762)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（3 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.5 - 缺陷：3 项 ## 缺陷清单 ### 6. [P1] D3-S3 沙箱预览出 URL——deploy_check nginx_serving=FAIL - **描述**：sandbox 部署 `deploy_nginx ok=true`（部署成功）但 `deploy_check nginx_serving.status=FAIL`，预览 URL 未就
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）**
    - 历史单内容：**版本**: v1.1.5 (gitHead e7ed6f6) **客户端**: AtomCode (Linux) **类型**: 每日测试 > 本单为 2026-09-20 AtomCode Linux 每日测试的**新增缺陷**合并单。另有 6 项命中历史 issue 已查重不重复开单（见 HISTORY_LINKS.md：D4-2→#731、D4-16→#731、D4-6→#735/#71
  - [#730](https://github.com/huaweicloud/huaweicloud-devkit/issues/730)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（Hermes Windows 2026-09-18，4 项）**
    - 历史单内容：## 测试概览 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows Server (x86_64) - **被测版本**: v1.1.5 (gitHead e7ed6f66, PR #696) - **测试日期**: 2026-09-18 - **测试结果**: 设计级 80 (PASS 75 / FAIL 3 / BLOCKED 1 / SPEC-MISM
  - [#714](https://github.com/huaweicloud/huaweicloud-devkit/issues/714)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（2 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.5 - 缺陷：2 项 ## 缺陷清单 ### 9. [P1] EXP-E01~E14 serviceCatalog 中文意图路由准确率低（11/14 MISS） - **描述**：D10 评测集 15 条中文意图经 `run-eval.mjs` 测试，HIT=3/MISS=11/N/A=1，准确率 21.4% - **预期（精确断言）**：serviceCat
  - [#706](https://github.com/huaweicloud/huaweicloud-devkit/issues/706)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（3 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.5 - 缺陷：3 项 ## 缺陷清单 ### 3. [P0] D4-9 高危公网部署仅告警未拦截 - **描述**：`evaluateDeployPlan({action:"deploy", public:true, service:"FunctionGraph"})` 返回 `warn`。 - **预期（精确断言）**：公网暴露 FunctionGraph 
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**[serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足**
    - 历史单内容：## 缺陷描述 `serviceCatalog` 工具对中文自然语言意图的路由准确率仅 21.4%（3/14 HIT）。11 个常见中文云服务意图未命中对应路由。 ## 未命中的中文意图 | # | 用例ID | 中文意图 | 期望路由 | 实际 | |---|---|---|---|---| | 1 | EXP-E01 | "帮我查一下我账号在华北北京四有哪些云主机" | ECS 查询 | MI
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#783, #774, #766, #680
