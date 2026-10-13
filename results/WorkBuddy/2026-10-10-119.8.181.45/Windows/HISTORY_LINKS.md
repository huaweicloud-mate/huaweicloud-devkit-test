# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D4-15 hook绕过尝试 — 大小写混淆命令未被拦截
- 今日证据：`evidence/D4-15/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#864](https://github.com/huaweicloud/huaweicloud-devkit/issues/864)（open）**[每日测试] CodeArtsSpace-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（8 项）**
    - 历史单内容：# FINDINGS — CodeArtsSpace Windows 每日测试 2026-10-09 > 被测版本：huaweicloud-devkit@1.1.8-next.1 > 客户端：CodeArtsSpace | OS：Windows | IP：120.46.40.202 > 执行时间：2026-10-09 05:08（北京时间） > 测试报告：results/CodeArtsSpace
  - [#858](https://github.com/huaweicloud/huaweicloud-devkit/issues/858)（open）**[daily-test] CodeArtsSpace Windows 2026-10-07: 8 缺陷 (4 P0 + 4 P1) huaweicloud-devkit@1.1.8-next.1**
    - 历史单内容：## 每日测试缺陷汇总 | 项 | 值 | |---|---| | 客户端 | CodeArtsSpace (GLM-5.2) | | OS | Windows | | 日期 | 2026-10-07 | | 被测版本 | huaweicloud-devkit@1.1.8-next.1 | | 测试结果 | 132 PASS / 8 FAIL / 1 NOT_RUN (共 141) | | 通过率
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05**
    - 历史单内容：## 缺陷概述 **客户端**: Hermes (GLM-5.2) / **OS**: Windows / **被测版本**: 1.1.8-next.1 **测试日期**: 2026-10-05 ## 缺陷详情 # FINDINGS — Hermes-GLM-5.2 缺陷发现清单 > **落盘路径**：`results/Hermes/2026-10-05-120.46.40.202/Windows
  - [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845)（open）**[daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4)**
    - 历史单内容：## 每日测试缺陷汇总 — CodeArtsSpace / Windows / 2026-10-02 **被测版本**：huaweicloud-devkit@1.1.8-next.1 **测试客户端**：CodeArtsSpace (GLM-5.2) **执行环境**：Windows / 120.46.40.202 **测试结果**：133 PASS / 8 FAIL / 0 BLOCKED (通
  - [#841](https://github.com/huaweicloud/huaweicloud-devkit/issues/841)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）**
    - 历史单内容：## 测试报告: CodeArtsSpace Windows 2026-10-01 每日测试 - **客户端**: CodeArtsSpace (GLM-5.2) - **OS**: Windows - **被测版本**: 1.1.8-next.1 - **执行时间**: 2026-10-01 05:15 BJT - **用例数**: 141 (设计级 102 + 展开级 39) - **结果**
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）**[测试报告] huaweicloud-devkit 1.1.4 每日测试缺陷合并单（4 项，OpenCode-glm-5.2 Windows）**
    - 历史单内容：## 测试概要 - 被测版本：1.1.4（npm latest，gitHead 9b67256） - 客户端：OpenCode-glm-5.2 / Windows Server 2022 - 测试日期：2026-09-15 - 设计级用例：81 条（PASS 77 / FAIL 4 / BLOCKED 0 / NOT_RUN 0） - 展开级用例：39 条（PASS 39 / FAIL 0 / B
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#682](https://github.com/huaweicloud/huaweicloud-devkit/issues/682)（open）**[测试报告] huaweicloud-devkit v1.1.4 安全策略绕过缺陷合并单（2 项 P0）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：2 项 - 客户端：WorkBuddy (GLM-5.2) / Windows - 测试时间：2026-09-15 ## 缺陷清单 ### 1. [P0] URL 编码的 hcloud 命令绕过安全检测（D4-15） - **描述**：`hcloud%20ecs%20DeleteServers%20--instance_ids=xxx` 经 `
  - [#681](https://github.com/huaweicloud/huaweicloud-devkit/issues/681)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - **预期（精确
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#676](https://github.com/huaweicloud/huaweicloud-devkit/issues/676)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（9 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：9 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而对象路径 `{AK:..., SK:...}`、`access_key=`/`secret_k
  - [#675](https://github.com/huaweicloud/huaweicloud-devkit/issues/675)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - 
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖 - **描述**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`） - **预期（精
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#791

## D2-11 R3 STS token拒绝落盘 — auth_switch persist token 未被拦截
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

## D1-27 检测语义-已是最新 — judgeUpdate 返回格式不符预期
- 今日证据：`evidence/D1-27/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#746](https://github.com/huaweicloud/huaweicloud-devkit/issues/746)（open）**[Bug] 工具协议暴露漂移 — TOOL_DEFINITIONS 40 vs 框架 MCP 37（#679 第7项）**
    - 历史单内容：## 缺陷描述 **来源**：#679 第 7 项（工具协议暴露漂移）+ VOD Agent 每日复核反馈（v1.1.5 仍复现） `plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 定义 **40** 个工具，但 CodeArts CLI 框架 MCP 运行时仅暴露 **37** 个。以下 3 个工具未在框架 MCP 注册： | 工
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h

## D1-28 检测语义-有新版本 — judgeUpdate 返回格式不符预期
- 今日证据：`evidence/D1-28/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#746](https://github.com/huaweicloud/huaweicloud-devkit/issues/746)（open）**[Bug] 工具协议暴露漂移 — TOOL_DEFINITIONS 40 vs 框架 MCP 37（#679 第7项）**
    - 历史单内容：## 缺陷描述 **来源**：#679 第 7 项（工具协议暴露漂移）+ VOD Agent 每日复核反馈（v1.1.5 仍复现） `plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 定义 **40** 个工具，但 CodeArts CLI 框架 MCP 运行时仅暴露 **37** 个。以下 3 个工具未在框架 MCP 注册： | 工
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h

## D4-17 hook模糊fail-closed — 空输入未默认拒绝
- 今日证据：`evidence/D4-17/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#676](https://github.com/huaweicloud/huaweicloud-devkit/issues/676)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（9 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：9 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而对象路径 `{AK:..., SK:...}`、`access_key=`/`secret_k
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso

## D4-24 确认令牌过期与重复确认边界 — 审批令牌生命周期未实现
- 今日证据：`evidence/D4-24/stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#864](https://github.com/huaweicloud/huaweicloud-devkit/issues/864)（open）**[每日测试] CodeArtsSpace-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（8 项）**
    - 历史单内容：# FINDINGS — CodeArtsSpace Windows 每日测试 2026-10-09 > 被测版本：huaweicloud-devkit@1.1.8-next.1 > 客户端：CodeArtsSpace | OS：Windows | IP：120.46.40.202 > 执行时间：2026-10-09 05:08（北京时间） > 测试报告：results/CodeArtsSpace
  - [#858](https://github.com/huaweicloud/huaweicloud-devkit/issues/858)（open）**[daily-test] CodeArtsSpace Windows 2026-10-07: 8 缺陷 (4 P0 + 4 P1) huaweicloud-devkit@1.1.8-next.1**
    - 历史单内容：## 每日测试缺陷汇总 | 项 | 值 | |---|---| | 客户端 | CodeArtsSpace (GLM-5.2) | | OS | Windows | | 日期 | 2026-10-07 | | 被测版本 | huaweicloud-devkit@1.1.8-next.1 | | 测试结果 | 132 PASS / 8 FAIL / 1 NOT_RUN (共 141) | | 通过率
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05**
    - 历史单内容：## 缺陷概述 **客户端**: Hermes (GLM-5.2) / **OS**: Windows / **被测版本**: 1.1.8-next.1 **测试日期**: 2026-10-05 ## 缺陷详情 # FINDINGS — Hermes-GLM-5.2 缺陷发现清单 > **落盘路径**：`results/Hermes/2026-10-05-120.46.40.202/Windows
  - [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845)（open）**[daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4)**
    - 历史单内容：## 每日测试缺陷汇总 — CodeArtsSpace / Windows / 2026-10-02 **被测版本**：huaweicloud-devkit@1.1.8-next.1 **测试客户端**：CodeArtsSpace (GLM-5.2) **执行环境**：Windows / 120.46.40.202 **测试结果**：133 PASS / 8 FAIL / 0 BLOCKED (通
  - [#841](https://github.com/huaweicloud/huaweicloud-devkit/issues/841)（open）**[测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）**
    - 历史单内容：## 测试报告: CodeArtsSpace Windows 2026-10-01 每日测试 - **客户端**: CodeArtsSpace (GLM-5.2) - **OS**: Windows - **被测版本**: 1.1.8-next.1 - **执行时间**: 2026-10-01 05:15 BJT - **用例数**: 141 (设计级 102 + 展开级 39) - **结果**
  - [#836](https://github.com/huaweicloud/huaweicloud-devkit/issues/836)（open）**[测试报告] huaweicloud-devkit 1.1.7 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.7 - 缺陷：1 项 ## 缺陷清单 ### 8. [P1] D4-24 审批令牌过期/重复确认未返回精确结构化 code - **描述**：`consumeApprovalToken` 首次/重复均返回 null；未返回 `{code:'CONFIRM_TOKEN_EXPIRED'}` / `{outcome:'already_processed'}`。 -
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#727
