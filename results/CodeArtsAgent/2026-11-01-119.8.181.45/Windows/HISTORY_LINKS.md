# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D4-7 hook三工具有效性 - broad IAM policy 检出失败
- 今日证据：evidence/D4-1/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#1063](https://github.com/huaweicloud/huaweicloud-devkit/issues/1063)（open）**[测试报告] huaweicloud-devkit 1.1.13-next.0 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 目标 修复 huaweicloud-devkit 1.1.13-next.0 在 Windows 环境下升级检测链可用性缺陷（用例 D1-39，P0）。 ## 现状 - 被测版本：1.1.13-next.0 - 测试环境：Windows / CodeArtsAgent + openpangu-2.0-pro - 每日测试报告结论 PARTIAL：设计级已执行 35，PASS 32 / FAI
  - [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)（open）**[测试报告] huaweicloud-devkit v1.1.13-next.0 每日测试缺陷合并单（12 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.13-next.0 - 缺陷：12 项 ## 缺陷清单 ### 1. [P0] D4-16 sh -c 命令包裹穿透（凭证 env 打印绕过） - **描述**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `decision=allow, findings=[]`
  - [#752](https://github.com/huaweicloud/huaweicloud-devkit/issues/752)（open）**[测试报告] huaweicloud-devkit 1.1.5 每日测试缺陷合并单（9 项，AtomCode/Linux）**
    - 历史单内容：**版本**: v1.1.5 (gitHead e7ed6f6) **客户端**: AtomCode (Linux) **类型**: 每日测试 > 本单为 2026-09-20 AtomCode Linux 每日测试的**新增缺陷**合并单。另有 6 项命中历史 issue 已查重不重复开单（见 HISTORY_LINKS.md：D4-2→#731、D4-16→#731、D4-6→#735/#71
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖 - **描述**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`） - **预期（精
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#852

## D1-3 doctor健康自检
- 今日证据：evidence/D1-3/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#875](https://github.com/huaweicloud/huaweicloud-devkit/issues/875)（open）**[测试报告] huaweicloud-devkit 1.1.8 每日测试缺陷合并单（2 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.8 - 缺陷：2 项 ## 缺陷清单 ### 5. [P1] D1-3 doctor健康自检命令缺失 - **描述**：hcloud-cli.mjs 中未找到 doctor 命令实现 - **预期（精确断言）**：doctor 命令应能检测组件状态并给出修复指引 - **根因**：`hcloud-cli.mjs` 中未找到 doctor 相关代码 - **证据

## D1-27 检测语义-已是最新
- 今日证据：evidence/D1-27/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#746](https://github.com/huaweicloud/huaweicloud-devkit/issues/746)（open）**[Bug] 工具协议暴露漂移 — TOOL_DEFINITIONS 40 vs 框架 MCP 37（#679 第7项）**
    - 历史单内容：## 缺陷描述 **来源**：#679 第 7 项（工具协议暴露漂移）+ VOD Agent 每日复核反馈（v1.1.5 仍复现） `plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 定义 **40** 个工具，但 CodeArts CLI 框架 MCP 运行时仅暴露 **37** 个。以下 3 个工具未在框架 MCP 注册： | 工
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h

## D1-28 检测语义-有新版本
- 今日证据：evidence/D1-28/stdout.log
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
