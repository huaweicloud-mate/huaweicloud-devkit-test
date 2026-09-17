# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D2-4 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式）
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 `lowercase ak=/sk= redacted`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
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
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖 - **描述**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`） - **预期（精
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso
  - [#649](https://github.com/huaweicloud/huaweicloud-devkit/issues/649)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.2 D10评测集测试结果 — 8 Agent × 15 用例 全部通过**
    - 历史单内容：## 测试概述 - **devkit版本**: 1.1.4-next.2 (next) - **测试日期**: 2026-09-12 - **测试集**: D10评测集 (15个用例) - **参测Agent**: 8个 (codearts, deepseek-harness, hermes, jiuwenswarm, kimicode, openclaw, opencode, prime-age
  - [#643](https://github.com/huaweicloud/huaweicloud-devkit/issues/643)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.2 (8bcae14) 全量测试缺陷合并单（10 项，附 Hermes-Agent-DeepSeek-V4-Pro 测试报告）**
    - 历史单内容：## 测试概览 - 被测版本：`v1.1.4-next.2 (8bcae14)`（dev 分支最新，39 个 MCP 工具） - 测试执行：Hermes-Agent（DeepSeek-V4-Pro），2026-09-12 - 执行状态：设计级 163 条 → PASS 74 / FAIL 7 / SPEC-MISMATCH 7 / BLOCKED 5 / NOT_RUN 70 - **完整测试报告
  - [#572](https://github.com/huaweicloud/huaweicloud-devkit/issues/572)（open）**# AI生成
[Bug] AK/SK 登录凭证架构 v4 测试发现 5 个缺陷/偏差：auth init 重跑不备份、auth status 诊断不完整、R8 多 profile 未实现等（44 PASS / 4 FAIL / 3 WARN，附完整测试报告；密文指纹误报已由 #533 跟踪不重复提交）**
    - 历史单内容：## 问题概述 对 huaweicloud-devkit v1.1.2-next.5（npx 安装，target=officeace）的登录凭证（AK/SK）架构 v4 执行专项测试（测试用例 11 章、60+ 用例），核心链路全部符合规格，发现 6 个缺陷/偏差。经与仓库现有 issue 逐一比对，其中 **D-1 与 #533 重复**（authEncrypt=true 密文指纹误报，本次实测
  - [#556](https://github.com/huaweicloud/huaweicloud-devkit/issues/556)（open）**[Bug] 卸载时回收站删除偶发失败，但 skills 统计仍报全部成功（Removed 29 实际 28）**
    - 历史单内容：## 问题描述 卸载时插件以回收站（trash）方式删除 skills，`genie-trash` 偶发抛出 `Some operations were aborted` 导致个别 skill 删除失败。但卸载器对该失败**仅打 WARN、不重试、不降级**，且最终统计**仍按原始总数报告成功**，日志与实际状态不一致，误导排障。 ## 环境 - OS：Windows 10/11，Git Bash
  - [#555](https://github.com/huaweicloud/huaweicloud-devkit/issues/555)（open）**[Bug] uninstall --target all 在含 WorkBuddy hook 的环境必然崩溃且无法自愈（TypeError: reading 'PostToolUse'）**
    - 历史单内容：## 问题描述 在装有 WorkBuddy 插件的环境执行 `uninstall --target all` 时，卸载流程在处理完 WorkBuddy 段后**必然抛出 TypeError 崩溃**，后续所有 agent（OpenClaw/DSH/OfficeAce/AtomCode/Codex）与全局清理段（含凭据库删除）**全部不执行**。且由于崩溃点位于 `writeFileSync` 之前
  - [#554](https://github.com/huaweicloud/huaweicloud-devkit/issues/554)（open）**[Bug] 更新检测在 Windows 上完全失效：spawnSync('npm.cmd') 缺少 shell:true 抛 EINVAL 被静默吞掉（1.1.1-next.14 ~ 1.1.2-next.4 全部受影响）**
    - 历史单内容：## 问题描述 **更新检测功能（#496）在 Windows 上完全失效**：运行 `install` / `update` 时，无论当前版本落后多少，「检测到新版本」的黄字提示**永远不出现**，检测过程中的失败被静默吞掉。 > 说明：此 Issue 曾误提交到 huaweicloud-mate/huaweicloud-devkit#155，现迁移至本仓库，内容不变。 ## 环境 - OS：W
  - [#304](https://github.com/huaweicloud/huaweicloud-devkit/issues/304)（open）**建议：支持网页登录/扫码授权或临时凭据，降低 AK/SK 配置成本**
    - 历史单内容：提个小建议：全流程跑下来，在终端里手工配置 AK/SK 还是比较麻烦，尤其对第一次使用华为云插件的开发者不太友好。 期望可以考虑增加一种更 Agent 友好的登录授权方式： 1. 支持跳转到华为云登录网页，由用户扫码或网页登录授权，插件自动完成本地凭据配置。 2. 或支持生成临时 AK/SK / 临时凭据，避免用户长期手工管理 AK/SK。 3. 最好能和现有 KooCLI / MCP / 多 A

## D4-2 凭证 env 打印拦截不完整（HW_ 前缀漏网）
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 3 条）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#690](https://github.com/huaweicloud/huaweicloud-devkit/issues/690)（open）**[test] Hermes Windows 每日测试 2026-09-15: D4-22 deploy plan 公网暴露规则误报 (1 新缺陷 + 3 已知复现)**
    - 历史单内容：## 缺陷描述 ### D4-22【P0】hook_check_deploy_plan 公网暴露规则误报（SPEC-MISMATCH） - **现象**：`evaluateDeployPlan` 的 `hwc-functiongraph-public-no-auth` 规则对 `public_access=false` 的安全配置也触发 `severity=warn` 告警 - **断言**：当 
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
  - [#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 缺陷补充单（Hermes 2 项新增：Change* 写操作漏拦截 + 提示注入绕过）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，hdk@dev gitHead 3b6290b，PR #647） - 客户端：Hermes（2026-09-14 每日测试，1.94.218.129 / Linux） - 缺陷：2 项新增（去重后）；另有 4 项与既有问题单重复，未拆单（见文末） ## 缺陷清单 ### 1. [P1] 写操作审批门漏词 — Change
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖 - **描述**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`） - **预期（精
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso
  - [#643](https://github.com/huaweicloud/huaweicloud-devkit/issues/643)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.2 (8bcae14) 全量测试缺陷合并单（10 项，附 Hermes-Agent-DeepSeek-V4-Pro 测试报告）**
    - 历史单内容：## 测试概览 - 被测版本：`v1.1.4-next.2 (8bcae14)`（dev 分支最新，39 个 MCP 工具） - 测试执行：Hermes-Agent（DeepSeek-V4-Pro），2026-09-12 - 执行状态：设计级 163 条 → PASS 74 / FAIL 7 / SPEC-MISMATCH 7 / BLOCKED 5 / NOT_RUN 70 - **完整测试报告
  - [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)（open）**[规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖（echo /--adminPass=/--password= 均 allow NO-RULE，1.1.2-next.4 复核仍成立）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） 对 huaweicloud-devkit 规则引擎（`evaluateCommandRisk`，`plugins/huaweicloud-core/src/risk-rule-engine.mjs`）双层验证： | 命令 | 语义 | decision | 命中规则 | |---|---|---|---| | `echo $HW_ACCESS_KE

## D4-3 明文 secret API 拦截漏 kms DecryptData
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 `kms DecryptData deny`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)（open）**[test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D1-39/D4-2/D4-3/D4-15/D4-16**
    - 历史单内容：## 测试信息 - **客户端**: Hermes (GLM-5.2) - **OS**: Windows 10 - **被测版本**: v1.1.4-next.6 - **测试日期**: 2026-09-14 - **P0 结果**: PASS 13 / FAIL 5 - **测试报告**: [Hermes-GLM-5.2-测试报告.md](https://github.com/huaweicl
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso
  - [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)（open）**[规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖（echo /--adminPass=/--password= 均 allow NO-RULE，1.1.2-next.4 复核仍成立）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） 对 huaweicloud-devkit 规则引擎（`evaluateCommandRisk`，`plugins/huaweicloud-core/src/risk-rule-engine.mjs`）双层验证： | 命令 | 语义 | decision | 命中规则 | |---|---|---|---| | `echo $HW_ACCESS_KE

## D4-15 hook 命令替换绕过（$(...) + ANSI-C quoting）
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 `command-substitution deny`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#690](https://github.com/huaweicloud/huaweicloud-devkit/issues/690)（open）**[test] Hermes Windows 每日测试 2026-09-15: D4-22 deploy plan 公网暴露规则误报 (1 新缺陷 + 3 已知复现)**
    - 历史单内容：## 缺陷描述 ### D4-22【P0】hook_check_deploy_plan 公网暴露规则误报（SPEC-MISMATCH） - **现象**：`evaluateDeployPlan` 的 `hwc-functiongraph-public-no-auth` 规则对 `public_access=false` 的安全配置也触发 `severity=warn` 告警 - **断言**：当 
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
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso
  - [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)（open）**[规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖（echo /--adminPass=/--password= 均 allow NO-RULE，1.1.2-next.4 复核仍成立）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） 对 huaweicloud-devkit 规则引擎（`evaluateCommandRisk`，`plugins/huaweicloud-core/src/risk-rule-engine.mjs`）双层验证： | 命令 | 语义 | decision | 命中规则 | |---|---|---|---| | `echo $HW_ACCESS_KE

## D4-16 shell 包裹穿透 hcloud 写操作拦截
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 2 条）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#690](https://github.com/huaweicloud/huaweicloud-devkit/issues/690)（open）**[test] Hermes Windows 每日测试 2026-09-15: D4-22 deploy plan 公网暴露规则误报 (1 新缺陷 + 3 已知复现)**
    - 历史单内容：## 缺陷描述 ### D4-22【P0】hook_check_deploy_plan 公网暴露规则误报（SPEC-MISMATCH） - **现象**：`evaluateDeployPlan` 的 `hwc-functiongraph-public-no-auth` 规则对 `public_access=false` 的安全配置也触发 `severity=warn` 告警 - **断言**：当 
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
  - [#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 缺陷补充单（Hermes 2 项新增：Change* 写操作漏拦截 + 提示注入绕过）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，hdk@dev gitHead 3b6290b，PR #647） - 客户端：Hermes（2026-09-14 每日测试，1.94.218.129 / Linux） - 缺陷：2 项新增（去重后）；另有 4 项与既有问题单重复，未拆单（见文末） ## 缺陷清单 ### 1. [P1] 写操作审批门漏词 — Change
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖 - **描述**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`） - **预期（精
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso
  - [#643](https://github.com/huaweicloud/huaweicloud-devkit/issues/643)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.2 (8bcae14) 全量测试缺陷合并单（10 项，附 Hermes-Agent-DeepSeek-V4-Pro 测试报告）**
    - 历史单内容：## 测试概览 - 被测版本：`v1.1.4-next.2 (8bcae14)`（dev 分支最新，39 个 MCP 工具） - 测试执行：Hermes-Agent（DeepSeek-V4-Pro），2026-09-12 - 执行状态：设计级 163 条 → PASS 74 / FAIL 7 / SPEC-MISMATCH 7 / BLOCKED 5 / NOT_RUN 70 - **完整测试报告
  - [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)（open）**[规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖（echo /--adminPass=/--password= 均 allow NO-RULE，1.1.2-next.4 复核仍成立）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） 对 huaweicloud-devkit 规则引擎（`evaluateCommandRisk`，`plugins/huaweicloud-core/src/risk-rule-engine.mjs`）双层验证： | 命令 | 语义 | decision | 命中规则 | |---|---|---|---| | `echo $HW_ACCESS_KE
  - [#559](https://github.com/huaweicloud/huaweicloud-devkit/issues/559)（open）**[会话级安全] OfficeAce 回退链写命令无审批即执行——连接器断开时 agent 通过技能+本地 CLI 直接创建云资源（OBS-9/10 同族第三例，连 MCP 门禁都没有）**
    - 历史单内容：## 现象（真云实测，OBS 桶已用后立删） OfficeAce 5.5.x（Windows，CEF）会话发送「用 huaweicloud_devkit 创建一个 OBS 桶 test-g3-oa-20260908（cn-north-4）」： - **连接器已断开**（本机 huaweicloud-devkit 插件 09/02 曾卸载：mcp_connectors 1 行 / 注册工具 30 行
  - [#557](https://github.com/huaweicloud/huaweicloud-devkit/issues/557)（open）**[会话级安全] WorkBuddy 内 MCP 写命令无可见审批即执行——approvedByUser 为模型自填参数，客户端连接器未对 MCP 写工具设门禁**
    - 历史单内容：## 现象（真云实测，资源已用后立删） WorkBuddy 5.5.3 会话内发送「创建 VPC test-g3-20260908，请直接执行」： - **无 mcp-approvals.json 新增记录**（文件最新条目为历史会话 15:50），CDP 侧零人工授权点击 - **云上 VPC 真实创建成功**（ListVpcs 确认 ACTIVE，ID df04893a-...；已 Delet
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#658

## D4-23 全局规则 huawei-agent-rules 未随安装注入
- 今日证据：`evidence/install/stdout.log`（`found=0` + `files includes rules` 为 false）
- **关联历史单（已作为缺陷提过，本次为复核）**：
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
  - [#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 缺陷补充单（Hermes 2 项新增：Change* 写操作漏拦截 + 提示注入绕过）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，hdk@dev gitHead 3b6290b，PR #647） - 客户端：Hermes（2026-09-14 每日测试，1.94.218.129 / Linux） - 缺陷：2 项新增（去重后）；另有 4 项与既有问题单重复，未拆单（见文末） ## 缺陷清单 ### 1. [P1] 写操作审批门漏词 — Change
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso

## D4-17 hook 畸形输入 fail-open（应 fail-closed）
- 今日证据：`evidence/security/stdout.log`（FAIL 断言 `malformed artifact fail-closed (deny)`）
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
  - [#564](https://github.com/huaweicloud/huaweicloud-devkit/issues/564)（open）**[健壮性·P2] evaluateCommandRisk 对异常输入 fail-open——null/数字/对象/超长一律 allow 无 findings（plan 门有类型守卫而规则引擎无，低危纵深缺陷）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） `evaluateCommandRisk`（`plugins/huaweicloud-core/src/risk-rule-engine.mjs`，`huaweicloud_hook_check_command` 底层）对**异常/畸形输入不做类型归一，一律返回 allow 且 findings 空**： | 输入 | decision | fin

## D9-2 JSON-RPC 错误码契约漂移（未返回 -32601）
- 今日证据：`evidence/protocol/stdout.log`（FAIL 断言 `unknown method code (-32601)`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#692](https://github.com/huaweicloud/huaweicloud-devkit/issues/692)（open）**【体验报告】CodeArtsWork 连接器 + 码道 Work 体验问题合集**
    - 历史单内容：## 概述 本 issue 为一份《CodeArtsWork 连接器故障诊断与体验优化报告》的合并提单，汇总 CodeArtsWork 连接器「huaweicloud-devkit_344」使用过程中发现的 **9 类问题**（含明确缺陷与体验优化建议）。完整体验报告在文末「附件」中给出。 --- ## 问题清单 | # | 问题 | 类别 | 优先级 | 类型 | |---|------|---
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#676](https://github.com/huaweicloud/huaweicloud-devkit/issues/676)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（9 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：9 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而对象路径 `{AK:..., SK:...}`、`access_key=`/`secret_k
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#671](https://github.com/huaweicloud/huaweicloud-devkit/issues/671)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 缺陷补充单（Hermes 2 项新增：Change* 写操作漏拦截 + 提示注入绕过）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，hdk@dev gitHead 3b6290b，PR #647） - 客户端：Hermes（2026-09-14 每日测试，1.94.218.129 / Linux） - 缺陷：2 项新增（去重后）；另有 4 项与既有问题单重复，未拆单（见文末） ## 缺陷清单 ### 1. [P1] 写操作审批门漏词 — Change
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖 - **描述**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`） - **预期（精
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso
  - [#643](https://github.com/huaweicloud/huaweicloud-devkit/issues/643)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.2 (8bcae14) 全量测试缺陷合并单（10 项，附 Hermes-Agent-DeepSeek-V4-Pro 测试报告）**
    - 历史单内容：## 测试概览 - 被测版本：`v1.1.4-next.2 (8bcae14)`（dev 分支最新，39 个 MCP 工具） - 测试执行：Hermes-Agent（DeepSeek-V4-Pro），2026-09-12 - 执行状态：设计级 163 条 → PASS 74 / FAIL 7 / SPEC-MISMATCH 7 / BLOCKED 5 / NOT_RUN 70 - **完整测试报告
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#565

## D10-3 serviceCatalog 中文意图路由大量 miss（关键词英文-only）
- 今日证据：`evidence/routing/stdout.log`（`3/15 hit`，EXP-E01~E14 共 12 条 FAIL）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt

## D8-1 文档与能力漂移（AGENTS.md 39 vs 实现 40 工具）
- 今日证据：`evidence/doc/stdout.log`（`N=40 doc39=true`）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt

## D1-39 Windows 更新检测链 EINVAL（升级检测链无 shell:true）
- 今日证据：`evidence/update/stdout-blocked.log`（Linux 直调 queryDistTagsSync 得 dist-tags 正常；源码 `queryDistTagsSync`/`queryDistTags` spawn npm 未加 `shell:true` → Windows EINVAL 根因仍在）
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#554](https://github.com/huaweicloud/huaweicloud-devkit/issues/554)（open）**[Bug] 更新检测在 Windows 上完全失效：spawnSync('npm.cmd') 缺少 shell:true 抛 EINVAL 被静默吞掉**
    - 历史单内容：更新检测功能在 Windows 上完全失效，检测失败被静默吞掉；本单为其每日复现复核。

## D9-9 tools/call 取消/超时协议契约漂移（capabilities.cancellation 缺失 + 无 -32000 timeout）
- 今日证据：`evidence/protocol/stdout-blocked.log`（`initialize.capabilities={tools:{}}`，未声明 notifications.cancellation；未知方法 `code=-32603`，无 -32000 timeout）
- **关联历史单（与 D9-2 同源 -32603 硬编码，已作为缺陷提过）**：
  - [#692](https://github.com/huaweicloud/huaweicloud-devkit/issues/692)（open）、[#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）、[#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）——均覆盖 MCP 协议错误码契约（-32603 硬编码/错误码漂移）。
  - 本单新增的「capabilities.cancellation 未声明」「无 -32000 timeout」为该协议契约漂移的补充维度，不重复开单。
