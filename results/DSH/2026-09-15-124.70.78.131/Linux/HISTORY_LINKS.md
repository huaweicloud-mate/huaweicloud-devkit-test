# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D2-4 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式）
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 `lowercase ak=/sk= redacted`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#675](https://github.com/huaweicloud/huaweicloud-devkit/issues/675)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - 
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#681

## D4-2 凭证 env 打印拦截不完整（HW_ 前缀漏网）
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 3 条）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#681](https://github.com/huaweicloud/huaweicloud-devkit/issues/681)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - **预期（精确
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#675](https://github.com/huaweicloud/huaweicloud-devkit/issues/675)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - 
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#650](https://github.com/huaweicloud/huaweicloud-devkit/issues/650)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项（根因见正文） ## 缺陷清单 ### P0 · 凭证环境变量打印拦截不完整（D4-2） - 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` 的 env-dump 拦截规则环境变量名 pattern 仅为 `/HUAWEICLOUD|HWC_|HCLOU
  - [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)（open）**[规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖（echo /--adminPass=/--password= 均 allow NO-RULE，1.1.2-next.4 复核仍成立）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） 对 huaweicloud-devkit 规则引擎（`evaluateCommandRisk`，`plugins/huaweicloud-core/src/risk-rule-engine.mjs`）双层验证： | 命令 | 语义 | decision | 命中规则 | |---|---|---|---| | `echo $HW_ACCESS_KE

## D4-3 明文 secret API 拦截漏 kms DecryptData
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 `kms DecryptData deny`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)（open）**[规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖（echo /--adminPass=/--password= 均 allow NO-RULE，1.1.2-next.4 复核仍成立）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） 对 huaweicloud-devkit 规则引擎（`evaluateCommandRisk`，`plugins/huaweicloud-core/src/risk-rule-engine.mjs`）双层验证： | 命令 | 语义 | decision | 命中规则 | |---|---|---|---| | `echo $HW_ACCESS_KE

## D4-15 hook 命令替换绕过（$(...) + ANSI-C quoting）
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 `command-substitution deny`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#682](https://github.com/huaweicloud/huaweicloud-devkit/issues/682)（open）**[测试报告] huaweicloud-devkit v1.1.4 安全策略绕过缺陷合并单（2 项 P0）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：2 项 - 客户端：WorkBuddy (GLM-5.2) / Windows - 测试时间：2026-09-15 ## 缺陷清单 ### 1. [P0] URL 编码的 hcloud 命令绕过安全检测（D4-15） - **描述**：`hcloud%20ecs%20DeleteServers%20--instance_ids=xxx` 经 `
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h

## D4-16 shell 包裹穿透 hcloud 写操作拦截
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 2 条）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#682](https://github.com/huaweicloud/huaweicloud-devkit/issues/682)（open）**[测试报告] huaweicloud-devkit v1.1.4 安全策略绕过缺陷合并单（2 项 P0）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：2 项 - 客户端：WorkBuddy (GLM-5.2) / Windows - 测试时间：2026-09-15 ## 缺陷清单 ### 1. [P0] URL 编码的 hcloud 命令绕过安全检测（D4-15） - **描述**：`hcloud%20ecs%20DeleteServers%20--instance_ids=xxx` 经 `
  - [#681](https://github.com/huaweicloud/huaweicloud-devkit/issues/681)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - **预期（精确
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#675](https://github.com/huaweicloud/huaweicloud-devkit/issues/675)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — echo $HW_ACCESS_KEY 未被拦截 - **描述**：`classifyTextCommand('echo $HW_ACCESS_KEY')` 返回 `decision='allow'`，凭证环境变量可通过 echo 命令打印输出 - 
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 缺陷补充单（Hermes 2 项新增：Change* 写操作漏拦截 + 提示注入绕过）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，hdk@dev gitHead 3b6290b，PR #647） - 客户端：Hermes（2026-09-14 每日测试，1.94.218.129 / Linux） - 缺陷：2 项新增（去重后）；另有 4 项与既有问题单重复，未拆单（见文末） ## 缺陷清单 ### 1. [P1] 写操作审批门漏词 — Change
  - [#650](https://github.com/huaweicloud/huaweicloud-devkit/issues/650)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项（根因见正文） ## 缺陷清单 ### P0 · 凭证环境变量打印拦截不完整（D4-2） - 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` 的 env-dump 拦截规则环境变量名 pattern 仅为 `/HUAWEICLOUD|HWC_|HCLOU

## D4-23 全局规则 huawei-agent-rules 未随安装注入
- 今日证据：`evidence/install/stdout.log`（`found=0` + `files includes rules` 为 false）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
  - [#650](https://github.com/huaweicloud/huaweicloud-devkit/issues/650)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项（根因见正文） ## 缺陷清单 ### P0 · 凭证环境变量打印拦截不完整（D4-2） - 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` 的 env-dump 拦截规则环境变量名 pattern 仅为 `/HUAWEICLOUD|HWC_|HCLOU
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#674

## D4-17 hook 畸形输入 fail-open（应 fail-closed）
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 `malformed artifact fail-closed (deny)`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h

## D9-2 JSON-RPC 错误码契约漂移（未返回 -32601）
- 今日证据：`evidence/protocol/stdout.log`（FAIL 断言 `unknown method code (-32601)`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#650](https://github.com/huaweicloud/huaweicloud-devkit/issues/650)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项（根因见正文） ## 缺陷清单 ### P0 · 凭证环境变量打印拦截不完整（D4-2） - 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` 的 env-dump 拦截规则环境变量名 pattern 仅为 `/HUAWEICLOUD|HWC_|HCLOU
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#651

## D10-3 serviceCatalog 中文意图路由大量 miss（关键词英文-only）
- 今日证据：`evidence/routing/stdout.log`（`3/15 hit`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#683, #674

## D8-1 文档与能力漂移（AGENTS.md 39 vs 实现 40 工具）
- 今日证据：`evidence/doc/stdout.log`（`N=40 doc39=true`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
