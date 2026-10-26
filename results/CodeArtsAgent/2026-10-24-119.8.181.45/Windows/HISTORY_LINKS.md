# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D1-39 Windows 升级检测链 queryDistTagsSync 返回 null
- 今日证据：evidence/D1-39/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#761](https://github.com/huaweicloud/huaweicloud-devkit/issues/761)（open）**[测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（OfficeAce Windows 2026-09-20，8+11 项）**
    - 历史单内容：## 每日测试缺陷合并单 — OfficeAce/Windows/2026-09-20 ### 基本信息 - **客户端**: OfficeAce - **操作系统**: Windows (AMD64) - **被测版本**: huaweicloud-devkit@1.1.5 - **测试日期**: 2026-09-20 - **设计级**: 100 条 (92 PASS, 8 FAIL) - *
  - [#690](https://github.com/huaweicloud/huaweicloud-devkit/issues/690)（open）**[test] Hermes Windows 每日测试 2026-09-15: D4-22 deploy plan 公网暴露规则误报 (1 新缺陷 + 3 已知复现)**
    - 历史单内容：## 缺陷描述 ### D4-22【P0】hook_check_deploy_plan 公网暴露规则误报（SPEC-MISMATCH） - **现象**：`evaluateDeployPlan` 的 `hwc-functiongraph-public-no-auth` 规则对 `public_access=false` 的安全配置也触发 `severity=warn` 告警 - **断言**：当 
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#653](https://github.com/huaweicloud/huaweicloud-devkit/issues/653)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.3 全量测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.3 - 缺陷：1 项 ## 缺陷清单 ### 1. [P0] Windows 升级检测链 EINVAL 静默失败 - **描述**：在 Windows + Node.js v22.22.2 环境下，`queryDistTagsSync` 和 `queryDistTags` 调用 `spawnSync('npm.cmd', ...)` / `spa

## D1-40 镜像 lag 检测 queryDistTags 返回 null
- 今日证据：evidence/D1-40/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h

## D1-26 tools list 命令不可用
- 今日证据：evidence/D1-26/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#746](https://github.com/huaweicloud/huaweicloud-devkit/issues/746)（open）**[Bug] 工具协议暴露漂移 — TOOL_DEFINITIONS 40 vs 框架 MCP 37（#679 第7项）**
    - 历史单内容：## 缺陷描述 **来源**：#679 第 7 项（工具协议暴露漂移）+ VOD Agent 每日复核反馈（v1.1.5 仍复现） `plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 定义 **40** 个工具，但 CodeArts CLI 框架 MCP 运行时仅暴露 **37** 个。以下 3 个工具未在框架 MCP 注册： | 工
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h

## D1-27 judgeUpdate 返回 check_failed
- 今日证据：evidence/D1-27/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#746](https://github.com/huaweicloud/huaweicloud-devkit/issues/746)（open）**[Bug] 工具协议暴露漂移 — TOOL_DEFINITIONS 40 vs 框架 MCP 37（#679 第7项）**
    - 历史单内容：## 缺陷描述 **来源**：#679 第 7 项（工具协议暴露漂移）+ VOD Agent 每日复核反馈（v1.1.5 仍复现） `plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 定义 **40** 个工具，但 CodeArts CLI 框架 MCP 运行时仅暴露 **37** 个。以下 3 个工具未在框架 MCP 注册： | 工
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h

## D1-28 judgeUpdate 返回 check_failed
- 今日证据：evidence/D1-28/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
