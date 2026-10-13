# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D2-11 R3 STS token拒绝落盘逻辑缺失
- 今日证据：`evidence/D2-11/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#864](https://github.com/huaweicloud/huaweicloud-devkit/issues/864)（open）**[每日测试] CodeArtsSpace-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（8 项）**
    - 历史单内容：# FINDINGS — CodeArtsSpace Windows 每日测试 2026-10-09 > 被测版本：huaweicloud-devkit@1.1.8-next.1 > 客户端：CodeArtsSpace | OS：Windows | IP：120.46.40.202 > 执行时间：2026-10-09 05:08（北京时间） > 测试报告：results/CodeArtsSpace
  - [#858](https://github.com/huaweicloud/huaweicloud-devkit/issues/858)（open）**[daily-test] CodeArtsSpace Windows 2026-10-07: 8 缺陷 (4 P0 + 4 P1) huaweicloud-devkit@1.1.8-next.1**
    - 历史单内容：## 每日测试缺陷汇总 | 项 | 值 | |---|---| | 客户端 | CodeArtsSpace (GLM-5.2) | | OS | Windows | | 日期 | 2026-10-07 | | 被测版本 | huaweicloud-devkit@1.1.8-next.1 | | 测试结果 | 132 PASS / 8 FAIL / 1 NOT_RUN (共 141) | | 通过率
  - [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845)（open）**[daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4)**
    - 历史单内容：## 每日测试缺陷汇总 — CodeArtsSpace / Windows / 2026-10-02 **被测版本**：huaweicloud-devkit@1.1.8-next.1 **测试客户端**：CodeArtsSpace (GLM-5.2) **执行环境**：Windows / 120.46.40.202 **测试结果**：133 PASS / 8 FAIL / 0 BLOCKED (通
  - [#841](https://github.com/huaweicloud/huaweicloud-devkit/issues/841)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）**
    - 历史单内容：## 测试报告: CodeArtsSpace Windows 2026-10-01 每日测试 - **客户端**: CodeArtsSpace (GLM-5.2) - **OS**: Windows - **被测版本**: 1.1.8-next.1 - **执行时间**: 2026-10-01 05:15 BJT - **用例数**: 141 (设计级 102 + 展开级 39) - **结果**
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt

## D4-18 confirm-not-deny审批语义缺失
- 今日证据：`evidence/D4-18/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05**
    - 历史单内容：## 缺陷概述 **客户端**: Hermes (GLM-5.2) / **OS**: Windows / **被测版本**: 1.1.8-next.1 **测试日期**: 2026-10-05 ## 缺陷详情 # FINDINGS — Hermes-GLM-5.2 缺陷发现清单 > **落盘路径**：`results/Hermes/2026-10-05-120.46.40.202/Windows

## D4-19 确认流下预检仍生效逻辑缺失
- 今日证据：`evidence/D4-19/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05**
    - 历史单内容：## 缺陷概述 **客户端**: Hermes (GLM-5.2) / **OS**: Windows / **被测版本**: 1.1.8-next.1 **测试日期**: 2026-10-05 ## 缺陷详情 # FINDINGS — Hermes-GLM-5.2 缺陷发现清单 > **落盘路径**：`results/Hermes/2026-10-05-120.46.40.202/Windows

## D9-13 tools/call 凭证不泄露与权限校验缺失
- 今日证据：`evidence/D9-13/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#864](https://github.com/huaweicloud/huaweicloud-devkit/issues/864)（open）**[每日测试] CodeArtsSpace-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（8 项）**
    - 历史单内容：# FINDINGS — CodeArtsSpace Windows 每日测试 2026-10-09 > 被测版本：huaweicloud-devkit@1.1.8-next.1 > 客户端：CodeArtsSpace | OS：Windows | IP：120.46.40.202 > 执行时间：2026-10-09 05:08（北京时间） > 测试报告：results/CodeArtsSpace
  - [#858](https://github.com/huaweicloud/huaweicloud-devkit/issues/858)（open）**[daily-test] CodeArtsSpace Windows 2026-10-07: 8 缺陷 (4 P0 + 4 P1) huaweicloud-devkit@1.1.8-next.1**
    - 历史单内容：## 每日测试缺陷汇总 | 项 | 值 | |---|---| | 客户端 | CodeArtsSpace (GLM-5.2) | | OS | Windows | | 日期 | 2026-10-07 | | 被测版本 | huaweicloud-devkit@1.1.8-next.1 | | 测试结果 | 132 PASS / 8 FAIL / 1 NOT_RUN (共 141) | | 通过率
  - [#857](https://github.com/huaweicloud/huaweicloud-devkit/issues/857)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（2 项）**
    - 历史单内容：## 目标 修复 huaweicloud-devkit 1.1.8-next.1 每日测试发现的 2 项 P1 缺陷。 ## 现状 被测版本 1.1.8-next.1 每日测试发现 2 项 P1 缺陷： ### 缺陷 1 [P1]：JSON credential redaction is incomplete - JSON 凭据脱敏不完整，存在凭据泄露风险。 ### 缺陷 2 [P1]：servi
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05**
    - 历史单内容：## 缺陷概述 **客户端**: Hermes (GLM-5.2) / **OS**: Windows / **被测版本**: 1.1.8-next.1 **测试日期**: 2026-10-05 ## 缺陷详情 # FINDINGS — Hermes-GLM-5.2 缺陷发现清单 > **落盘路径**：`results/Hermes/2026-10-05-120.46.40.202/Windows
  - [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845)（open）**[daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4)**
    - 历史单内容：## 每日测试缺陷汇总 — CodeArtsSpace / Windows / 2026-10-02 **被测版本**：huaweicloud-devkit@1.1.8-next.1 **测试客户端**：CodeArtsSpace (GLM-5.2) **执行环境**：Windows / 120.46.40.202 **测试结果**：133 PASS / 8 FAIL / 0 BLOCKED (通
  - [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（Hermes Linux 2026-10-02，6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.8-next.1 - 缺陷：6 项 ## 缺陷清单 ### 1. [P1] D3-S1 中文「云主机」意图路由未命中（serviceCatalog ECS 关键词缺失） - **描述**：`service_catalog({intent:'帮我查一下我账号有哪些云主机'})` → `recommendedServices=['Run hcloud --help
  - [#841](https://github.com/huaweicloud/huaweicloud-devkit/issues/841)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）**
    - 历史单内容：## 测试报告: CodeArtsSpace Windows 2026-10-01 每日测试 - **客户端**: CodeArtsSpace (GLM-5.2) - **OS**: Windows - **被测版本**: 1.1.8-next.1 - **执行时间**: 2026-10-01 05:15 BJT - **用例数**: 141 (设计级 102 + 展开级 39) - **结果**
  - [#809](https://github.com/huaweicloud/huaweicloud-devkit/issues/809)（open）**[安全] redactSecrets 对 Authorization: Bearer <jwt> 脱敏不完整——JWT 值明文残留**
    - 历史单内容：## 目标 修复 `redactSecrets`/`redactOutput` 对 `Authorization: Bearer <jwt>` 脱敏不完整的缺陷——当前仅脱敏到 `Bearer`，JWT 值 `eyJ...` 明文残留，可经日志/对话输出泄漏。 ## 现状 `plugins/huaweicloud-core/src/safety-policy.mjs` 中 `redactStrin
  - [#808](https://github.com/huaweicloud/huaweicloud-devkit/issues/808)（open）**[测试报告] huaweicloud-devkit 1.1.7-next.1 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.7-next.1 - 缺陷：1 项 ## 缺陷清单 ### 2. [P0] D9-13 tools/call 凭证不泄露与权限校验基线失败 - **描述**：运行时凭证 set/resolve 形参不匹配；artifact 风险合并未把含 AK 文本提升为非 allow；审批 token 消费断言失败。 - **预期（精确断言）**：运行时凭证解析应返回扁平 
  - [#797](https://github.com/huaweicloud/huaweicloud-devkit/issues/797)（open）**[每日测试] OfficeAce Windows 2026-09-22: 22 FAIL / 1 BLOCKED (v1.1.5)**
    - 历史单内容：## 测试概况 - **客户端**: OfficeAce (glm-5.2) - **OS**: Windows - **日期**: 2026-09-22 - **被测版本**: huaweicloud-devkit@1.1.5 - **总用例**: 139 (设计级 100 + 展开级 39) - **结果**: 116 PASS / 22 FAIL / 1 BLOCKED - **通过率**:
  - [#791](https://github.com/huaweicloud/huaweicloud-devkit/issues/791)（open）**refactor: redact 设计重构——统一键名策略与脱敏路径**
    - 历史单内容：## 背景 源自 PR #772 中 @CheneyYin 的设计反馈：「当前的解决方法是就问题解决问题，应该重新审视 redact 的设计或实现缺失」。 PR #772 的补丁式修复（`\b` 单词边界 + `i` 标志 + JSON 格式正则 + token 短键名）可先合并解决 #694 紧急缺陷；本 Issue 跟踪 `redactSecrets`/`redactString` 的结构性重
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）**
    - 历史单内容：**版本**: v1.1.5 (gitHead e7ed6f6) **客户端**: AtomCode (Linux) **类型**: 每日测试 > 本单为 2026-09-20 AtomCode Linux 每日测试的**新增缺陷**合并单。另有 6 项命中历史 issue 已查重不重复开单（见 HISTORY_LINKS.md：D4-2→#731、D4-16→#731、D4-6→#735/#71
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）**[测试报告] huaweicloud-devkit 1.1.4 每日测试缺陷合并单（4 项，OpenCode-glm-5.2 Windows）**
    - 历史单内容：## 测试概要 - 被测版本：1.1.4（npm latest，gitHead 9b67256） - 客户端：OpenCode-glm-5.2 / Windows Server 2022 - 测试日期：2026-09-15 - 设计级用例：81 条（PASS 77 / FAIL 4 / BLOCKED 0 / NOT_RUN 0） - 展开级用例：39 条（PASS 39 / FAIL 0 / B
  - [#692](https://github.com/huaweicloud/huaweicloud-devkit/issues/692)（open）**【体验报告】CodeArtsWork 连接器 + 码道 Work 体验问题合集**
    - 历史单内容：## 概述 本 issue 为一份《CodeArtsWork 连接器故障诊断与体验优化报告》的合并提单，汇总 CodeArtsWork 连接器「huaweicloud-devkit_344」使用过程中发现的 **9 类问题**（含明确缺陷与体验优化建议）。完整体验报告在文末「附件」中给出。 --- ## 问题清单 | # | 问题 | 类别 | 优先级 | 类型 | |---|------|---
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#681](https://github.com/huaweicloud/huaweicloud-devkit/issues/681)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - **预期（精确
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#676](https://github.com/huaweicloud/huaweicloud-devkit/issues/676)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（9 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：9 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而对象路径 `{AK:..., SK:...}`、`access_key=`/`secret_k
  - [#675](https://github.com/huaweicloud/huaweicloud-devkit/issues/675)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - 
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso

## D1-26 升级提醒工具注册与协议暴露缺失
- 今日证据：`evidence/D1-26/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#746](https://github.com/huaweicloud/huaweicloud-devkit/issues/746)（open）**[Bug] 工具协议暴露漂移 — TOOL_DEFINITIONS 40 vs 框架 MCP 37（#679 第7项）**
    - 历史单内容：## 缺陷描述 **来源**：#679 第 7 项（工具协议暴露漂移）+ VOD Agent 每日复核反馈（v1.1.5 仍复现） `plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 定义 **40** 个工具，但 CodeArts CLI 框架 MCP 运行时仅暴露 **37** 个。以下 3 个工具未在框架 MCP 注册： | 工
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
