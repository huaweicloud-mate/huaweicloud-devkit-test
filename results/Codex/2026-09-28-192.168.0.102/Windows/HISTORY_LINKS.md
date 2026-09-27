# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D10-3 serviceCatalog 路由准确率低
- 今日证据：`evidence/EXP-E01/stdout.log`（路由 harness 汇总与 `eval/results/eval-run-20260927210940.csv`）。
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#805](https://github.com/huaweicloud/huaweicloud-devkit/issues/805)（open）**[每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + EXP-E01~E14 路由基线**
    - 历史单内容：# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2） > **落盘路径**：`results/Hermes/2026-09-23-120.46.40.202/Windows/FINDINGS.md` > **生成时间**：2026-09-23 10:00:00（北京时间） > **被测版本**：huaweicloud-devkit@1.1.7-next.0（hdk 源码 v1.1
  - [#797](https://github.com/huaweicloud/huaweicloud-devkit/issues/797)（open）**[每日测试] OfficeAce Windows 2026-09-22: 22 FAIL / 1 BLOCKED (v1.1.5)**
    - 历史单内容：## 测试概况 - **客户端**: OfficeAce (glm-5.2) - **OS**: Windows - **日期**: 2026-09-22 - **被测版本**: huaweicloud-devkit@1.1.5 - **总用例**: 139 (设计级 100 + 展开级 39) - **结果**: 116 PASS / 22 FAIL / 1 BLOCKED - **通过率**:
  - [#785](https://github.com/huaweicloud/huaweicloud-devkit/issues/785)（open）**[测试报告] huaweicloud-devkit 1.1.6-next.0 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.6-next.0 - 缺陷：1 项 ## 缺陷清单 ### 1. [P1] EXP-E01~E15 serviceCatalog 中文意图路由大面积 MISS（12/15 未命中） - **描述**：`node eval/harness/run-eval.mjs` 跑 serviceCatalog 路由评测，15 条中文意图中 12 条 MISS： - **预
  - [#784](https://github.com/huaweicloud/huaweicloud-devkit/issues/784)（open）**[测试报告] huaweicloud-devkit 1.1.6-next.0 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.6-next.0 - 缺陷：1 项 ## 缺陷清单 ### 5. [P1] EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4%） - **描述**：`run-eval.mjs` 跑 15 条中文意图评测集，仅 3 条 HIT（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 Voucher），11 条 MISS
  - [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)（open）**[每日测试] Hermes Windows 2026-09-21: D9-4 MCP未强制initialize前置 + D9-9 取消能力未声明**
    - 历史单内容：## 每日测试发现 — 2 项新 SPEC-MISMATCH **测试版本**: huaweicloud-devkit v1.1.5 (commit e7ed6f6) **客户端**: Hermes / Windows **日期**: 2026-09-21 --- ### #1【SPEC-MISMATCH】D9-4 协议生命周期 — MCP 服务器未强制 initialize 前置 - **现象*
  - [#770](https://github.com/huaweicloud/huaweicloud-devkit/issues/770)（open）**[daily-test] CodeArtsWork Windows 2026-09-21: 4 defects (3 P0 + 1 P1)**
    - 历史单内容：## 每日测试缺陷汇总 — CodeArtsWork Windows 2026-09-21 **客户端**: CodeArtsWork (GLM-5.2) **OS**: Windows **包版本**: huaweicloud-devkit@1.1.5 **测试日期**: 2026-09-21 **总用例**: 139 (PASS=121, FAIL=16, BLOCKED=2) --- # F
  - [#762](https://github.com/huaweicloud/huaweicloud-devkit/issues/762)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（3 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.5 - 缺陷：3 项 ## 缺陷清单 ### 6. [P1] D3-S3 沙箱预览出 URL——deploy_check nginx_serving=FAIL - **描述**：sandbox 部署 `deploy_nginx ok=true`（部署成功）但 `deploy_check nginx_serving.status=FAIL`，预览 URL 未就
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#758](https://github.com/huaweicloud/huaweicloud-devkit/issues/758)（open）**[每日测试] Hermes Windows 2026-09-20: D4-16 命令包裹穿透 + D4-11 提示注入 + D4-23 规则未发布 + serviceCatalog路由低**
    - 历史单内容：## Hermes Windows 每日测试缺陷报告 (2026-09-20) **被测版本**: huaweicloud-devkit v1.1.5 (commit e7ed6f6) **客户端**: Hermes + GLM-5.2 | **OS**: Windows 10 **执行归档**: `results/Hermes/2026-09-20-120.46.40.202/Windows/`
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）**
    - 历史单内容：**版本**: v1.1.5 (gitHead e7ed6f6) **客户端**: AtomCode (Linux) **类型**: 每日测试 > 本单为 2026-09-20 AtomCode Linux 每日测试的**新增缺陷**合并单。另有 6 项命中历史 issue 已查重不重复开单（见 HISTORY_LINKS.md：D4-2→#731、D4-16→#731、D4-6→#735/#71
  - [#733](https://github.com/huaweicloud/huaweicloud-devkit/issues/733)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（CodeArtsWork Windows 2026-09-18，6 项已知复现）**
    - 历史单内容：## 测试概览 - **客户端**: CodeArtsWork (GLM-5.2) - **OS**: Windows Server (x86_64) - **被测版本**: v1.1.5 (gitHead e7ed6f66) - **测试日期**: 2026-09-18 - **测试结果**: 设计级 80 (PASS 75 / FAIL 5) + 展开级 39 (PASS 27 / FAIL 
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
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#783, #766, #680

## D9-9 超时后重连未恢复 MCP 工具列表
- 今日证据：`evidence/D9-9/stdout.log`。
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)（open）**[每日测试] Hermes Windows 2026-09-21: D9-4 MCP未强制initialize前置 + D9-9 取消能力未声明**
    - 历史单内容：## 每日测试发现 — 2 项新 SPEC-MISMATCH **测试版本**: huaweicloud-devkit v1.1.5 (commit e7ed6f6) **客户端**: Hermes / Windows **日期**: 2026-09-21 --- ### #1【SPEC-MISMATCH】D9-4 协议生命周期 — MCP 服务器未强制 initialize 前置 - **现象*
  - [#698](https://github.com/huaweicloud/huaweicloud-devkit/issues/698)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：1 项 ## 缺陷清单 ### 12. [P2] D9-9 capabilities.cancellation 未暴露（SPEC-MISMATCH） - **描述**：initialize 返回 `capabilities={"tools":{}}`，无 `cancellation` 能力；tools/call 无超时/取消语义实现。 - **
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#752

## D5-1 Codex 插件 manifest/注册清单不满足 fixture 契约
- 今日证据：`evidence/EXP-D5-2-1/stdout.log`。
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#816](https://github.com/huaweicloud/huaweicloud-devkit/issues/816)（open）**[测试报告] huaweicloud-devkit 1.1.7 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.7 - 缺陷：1 项 ## 缺陷清单 ### 1. [P1] EXP-D5-2-1 Codex 插件清单与注册缺失 - **描述**：Codex discovery fixture 实测 2 项 PASS、3 项 FAIL；`.mcp.json`、`openclaw.plugin.json`、MCP 注册与 bundle manifest 断言失败。 - **
  - [#797](https://github.com/huaweicloud/huaweicloud-devkit/issues/797)（open）**[每日测试] OfficeAce Windows 2026-09-22: 22 FAIL / 1 BLOCKED (v1.1.5)**
    - 历史单内容：## 测试概况 - **客户端**: OfficeAce (glm-5.2) - **OS**: Windows - **日期**: 2026-09-22 - **被测版本**: huaweicloud-devkit@1.1.5 - **总用例**: 139 (设计级 100 + 展开级 39) - **结果**: 116 PASS / 22 FAIL / 1 BLOCKED - **通过率**:
