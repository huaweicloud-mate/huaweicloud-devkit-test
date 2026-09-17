# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## D4-2 凭证 env 打印拦截残留 — `env|grep HW_*` 仍放行（v1.1.5 修复不完整）
- 今日证据：`evidence/d4-security-core/probe-v115-fixes.stdout.log`、`evidence/d4-security-core/probe-p0-security.stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）**[测试报告] huaweicloud-devkit 1.1.4 每日测试缺陷合并单（4 项，OpenCode-glm-5.2 Windows）**
    - 历史单内容：## 测试概要 - 被测版本：1.1.4（npm latest，gitHead 9b67256） - 客户端：OpenCode-glm-5.2 / Windows Server 2022 - 测试日期：2026-09-15 - 设计级用例：81 条（PASS 77 / FAIL 4 / BLOCKED 0 / NOT_RUN 0） - 展开级用例：39 条（PASS 39 / FAIL 0 / B
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

## D4-16 命令包裹穿透残留 — `sh -c "env|grep ..."` 文本路径未解包（v1.1.5 修复不完整）
- 今日证据：`evidence/d4-security-core/probe-v115-fixes.stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）**[测试报告] huaweicloud-devkit 1.1.4 每日测试缺陷合并单（4 项，OpenCode-glm-5.2 Windows）**
    - 历史单内容：## 测试概要 - 被测版本：1.1.4（npm latest，gitHead 9b67256） - 客户端：OpenCode-glm-5.2 / Windows Server 2022 - 测试日期：2026-09-15 - 设计级用例：81 条（PASS 77 / FAIL 4 / BLOCKED 0 / NOT_RUN 0） - 展开级用例：39 条（PASS 39 / FAIL 0 / B
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

## D4-17 hook 三工具畸形输入 fail-open（应 fail-closed）
- 今日证据：`evidence/d4-security-core/probe-d4-17-hook.stdout.log`
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
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖 - **描述**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`） - **预期（精
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso
  - [#564](https://github.com/huaweicloud/huaweicloud-devkit/issues/564)（open）**[健壮性·P2] evaluateCommandRisk 对异常输入 fail-open——null/数字/对象/超长一律 allow 无 findings（plan 门有类型守卫而规则引擎无，低危纵深缺陷）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） `evaluateCommandRisk`（`plugins/huaweicloud-core/src/risk-rule-engine.mjs`，`huaweicloud_hook_check_command` 底层）对**异常/畸形输入不做类型归一，一律返回 allow 且 findings 空**： | 输入 | decision | fin

## D9-2 JSON-RPC 错误码残留 — -32602（invalid params）未区分
- 今日证据：`evidence/d9-protocol/probe-d9-2-invalid.stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#699](https://github.com/huaweicloud/huaweicloud-devkit/issues/699)（open）**[测试报告] huaweicloud-devkit 1.1.4 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4 - 缺陷：1 项 ## 缺陷清单 ### 2. [P1] MCP server 未强制 initialize 握手时序，initialize 前可处理 tools/call 请求 - **描述**：新连接未发送 `initialize` 请求时，直接发送 `tools/call` 请求，服务器返回正常结果（非错误）。MCP 规范要求服务器在 `initia
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

## D4-21 hook_check_artifacts 未拦截 Terraform HCL broad IAM（actions=["*"]）
- 今日证据：`evidence/d4-security-core/probe-p0-security.stdout.log`、`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694)（open）**[测试报告] huaweicloud-devkit 1.1.4 每日测试缺陷合并单（4 项，OpenCode-glm-5.2 Windows）**
    - 历史单内容：## 测试概要 - 被测版本：1.1.4（npm latest，gitHead 9b67256） - 客户端：OpenCode-glm-5.2 / Windows Server 2022 - 测试日期：2026-09-15 - 设计级用例：81 条（PASS 77 / FAIL 4 / BLOCKED 0 / NOT_RUN 0） - 展开级用例：39 条（PASS 39 / FAIL 0 / B
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
  - [#643](https://github.com/huaweicloud/huaweicloud-devkit/issues/643)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.2 (8bcae14) 全量测试缺陷合并单（10 项，附 Hermes-Agent-DeepSeek-V4-Pro 测试报告）**
    - 历史单内容：## 测试概览 - 被测版本：`v1.1.4-next.2 (8bcae14)`（dev 分支最新，39 个 MCP 工具） - 测试执行：Hermes-Agent（DeepSeek-V4-Pro），2026-09-12 - 执行状态：设计级 163 条 → PASS 74 / FAIL 7 / SPEC-MISMATCH 7 / BLOCKED 5 / NOT_RUN 70 - **完整测试报告

## D4-23 全局规则 huawei-agent-rules.mdc 注入失效（11 安装目标）
- 今日证据：`evidence/d4-security-core/probe-d4-23-rules.stdout.log`
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

## D4-6 adminPass 空格形式回显未脱敏（明文字段泄漏）
- 今日证据：`evidence/d4-security-core/probe-d4-6-plaintext.stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
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
  - [#649](https://github.com/huaweicloud/huaweicloud-devkit/issues/649)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.2 D10评测集测试结果 — 8 Agent × 15 用例 全部通过**
    - 历史单内容：## 测试概述 - **devkit版本**: 1.1.4-next.2 (next) - **测试日期**: 2026-09-12 - **测试集**: D10评测集 (15个用例) - **参测Agent**: 8个 (codearts, deepseek-harness, hermes, jiuwenswarm, kimicode, openclaw, opencode, prime-age
  - [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)（open）**[规则缺失·P1] 规则引擎对凭证env打印与明文secret参数零覆盖（echo /--adminPass=/--password= 均 allow NO-RULE，1.1.2-next.4 复核仍成立）**
    - 历史单内容：## 现象（1.1.2-next.4 基线实测） 对 huaweicloud-devkit 规则引擎（`evaluateCommandRisk`，`plugins/huaweicloud-core/src/risk-rule-engine.mjs`）双层验证： | 命令 | 语义 | decision | 命中规则 | |---|---|---|---| | `echo $HW_ACCESS_KE

## D4-7 hook 三工具部分失效 — hook_check_artifacts broad IAM 未拦截
- 今日证据：`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#682](https://github.com/huaweicloud/huaweicloud-devkit/issues/682)（open）**[测试报告] huaweicloud-devkit v1.1.4 安全策略绕过缺陷合并单（2 项 P0）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：2 项 - 客户端：WorkBuddy (GLM-5.2) / Windows - 测试时间：2026-09-15 ## 缺陷清单 ### 1. [P0] URL 编码的 hcloud 命令绕过安全检测（D4-15） - **描述**：`hcloud%20ecs%20DeleteServers%20--instance_ids=xxx` 经 `
  - [#679](https://github.com/huaweicloud/huaweicloud-devkit/issues/679)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（8 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：8 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECR
  - [#673](https://github.com/huaweicloud/huaweicloud-devkit/issues/673)（open）**[测试报告] huaweicloud-devkit 1.1.4-next.6 全量测试缺陷合并单（6 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4-next.6 - 缺陷：6 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖 - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `h
  - [#672](https://github.com/huaweicloud/huaweicloud-devkit/issues/672)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截未覆盖 `HW_` 前缀（D4-2，凭证红线 I 类） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_SECRET_KEY` 实测 `classifyTextCommand` 返回 `allow, risk=n
  - [#652](https://github.com/huaweicloud/huaweicloud-devkit/issues/652)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（4 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3 - 缺陷：4 项 ## 缺陷清单 ### 1. [P0] 凭证 env 打印拦截不完整 — HW_ 前缀未覆盖 - **描述**：`printenv HW_ACCESS_KEY` / `env | grep HW_SECRET_KEY` 实测 classifyTextCommand 返回 `allow`（应 `deny`） - **预期（精
  - [#651](https://github.com/huaweicloud/huaweicloud-devkit/issues/651)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.3 全量测试缺陷合并单（12 项，8 agent）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.3（npm @next，gitHead 3b6290b，PR #647） - 缺陷：12 项（去重后，原始 24 条来自 8 个 agent） - 测试日期：2026-09-13 ## 缺陷清单 ### 1. [P0] hook_check_artifacts 未检测 Terraform HCL 宽泛 IAM 授权 - **描述**：`reso

## D10-3 中文意图路由未命中（serviceCatalog 仅英文关键词）— 展开级 EXP-E 同源
- 今日证据：`evidence/d10-routing/probe-d10-routing.stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：5 项 ## 缺陷清单 ### 5. [P1] Python/Node 安全钩子策略不一致 - **描述**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。 - **预期（精确断言）**：Pyt
  - [#683](https://github.com/huaweicloud/huaweicloud-devkit/issues/683)（open）**[测试报告] huaweicloud-devkit v1.1.4 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式） - **描述**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；而 `access_key=`/`secret_key=` 大写键与对象路径 `{AK,SK}` 均正常脱敏
  - [#674](https://github.com/huaweicloud/huaweicloud-devkit/issues/674)（open）**[测试报告] huaweicloud-devkit v1.1.4-next.6 全量测试缺陷合并单（10 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4-next.6 - 缺陷：10 项 ## 缺陷清单 ### 1. [P0] 凭证环境变量打印拦截不完整（HW_ 前缀漏网） - **描述**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `allow`，预期 `deny`。Node 钩子与 Pyt

## D9-4 协议生命周期 — initialize 握手时序未强制
- 今日证据：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#699](https://github.com/huaweicloud/huaweicloud-devkit/issues/699)（open）**[测试报告] huaweicloud-devkit 1.1.4 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：1.1.4 - 缺陷：1 项 ## 缺陷清单 ### 2. [P1] MCP server 未强制 initialize 握手时序，initialize 前可处理 tools/call 请求 - **描述**：新连接未发送 `initialize` 请求时，直接发送 `tools/call` 请求，服务器返回正常结果（非错误）。MCP 规范要求服务器在 `initia

## D9-9 tools/call 超时/取消语义 — capabilities.cancellation 未暴露（SPEC-MISMATCH）
- 今日证据：`eval/results/protocol-probe-20260915232009.json`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#698](https://github.com/huaweicloud/huaweicloud-devkit/issues/698)（open）**[测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（1 项）**
    - 历史单内容：## 测试概览 - 被测版本：v1.1.4 - 缺陷：1 项 ## 缺陷清单 ### 12. [P2] D9-9 capabilities.cancellation 未暴露（SPEC-MISMATCH） - **描述**：initialize 返回 `capabilities={"tools":{}}`，无 `cancellation` 能力；tools/call 无超时/取消语义实现。 - **
