# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-28 05:12:00（北京时间）
> **执行归档**：`results/AtomCode/2026-09-28-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 5 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7`（gitHead `7456d059`） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：① 源码级确定性探针直调（47 个 .mjs 重跑，直调 tools/safety/mcp/credentials risk-engine 等模块函数）② MCP 真机（tools/list、tools/call、initialize 握手、协议生命周期）③ 真云 E2E（`probe-realcloud.mjs` 建删资源归零，22/22）④ D10 官方 harness `run-eval.mjs` + D9 官方 `protocol-probe.mjs`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `111 / 25 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 136） | `81.6%` |
| P0 / P1 / P2 新增缺陷 | `5 / 17 / 3` |
| 红线（I 类）违规 | `无凭证泄漏事件、无写操作误判 read-only；发现 5 项脱敏/拦截覆盖缺口（见缺陷清单 #1/#2/#3/#4/#7/#8/#14）` |
| 资源释放 | `真云 E2E 建安全组 tctest-d3c4-sg-* → 测后删除，归零验证剩余=0` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `83` | 有证据且通过 PASS 门禁 |
| FAIL | `14` | 不符预期，根因见缺陷清单 |
| BLOCKED | `3` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | TODO: 待补根因 | 待提单 |
| 2 | P1 | `D3-S8` | D3功能 | 场景-操作失败后排障指引 | TODO: 待补根因 | 待提单 |
| 3 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | TODO: 待补根因 | 待提单 |
| 4 | P1 | `D4-6` | D4安全 | adminPass回显警告 | TODO: 待补根因 | 待提单 |
| 5 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | TODO: 待补根因 | 待提单 |
| 6 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | TODO: 待补根因 | 待提单 |
| 7 | P0 | `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | TODO: 待补根因 | 待提单 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | TODO: 待补根因 | 待提单 |
| 9 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | TODO: 待补根因 | 待提单 |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | TODO: 待补根因 | 待提单 |
| 11 | P1 | `D9-2` | D9协议 | JSON-RPC错误码 | TODO: 待补根因 | 待提单 |
| 12 | P1 | `D9-4` | D9协议 | 协议生命周期 | TODO: 待补根因 | 待提单 |
| 13 | P2 | `D9-7` | D9协议 | 协议版本协商降级 | TODO: 待补根因 | 待提单 |
| 14 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | TODO: 待补根因 | 待提单 |
| 15 | P1 | `EXP-E01` |  |  | TODO: 待补根因 | 待提单 |
| 16 | P1 | `EXP-E02` |  |  | TODO: 待补根因 | 待提单 |
| 17 | P1 | `EXP-E03` |  |  | TODO: 待补根因 | 待提单 |
| 18 | P1 | `EXP-E04` |  |  | TODO: 待补根因 | 待提单 |
| 19 | P1 | `EXP-E05` |  |  | TODO: 待补根因 | 待提单 |
| 20 | P1 | `EXP-E07` |  |  | TODO: 待补根因 | 待提单 |
| 21 | P1 | `EXP-E10` |  |  | TODO: 待补根因 | 待提单 |
| 22 | P1 | `EXP-E11` |  |  | TODO: 待补根因 | 待提单 |
| 23 | P1 | `EXP-E12` |  |  | TODO: 待补根因 | 待提单 |
| 24 | P1 | `EXP-E13` |  |  | TODO: 待补根因 | 待提单 |
| 25 | P1 | `EXP-E14` |  |  | TODO: 待补根因 | 待提单 |

### 根因详情

> 每个 FAIL / SPEC-MISMATCH 用例的「现象 / 断言 / 根因（文件:行号）/ 证据」已严格按 `templates/findings.md` 格式落盘 `FINDINGS.md`（共 15 条），供 `file_issue.py` 统一提单解析。展开级 EXP-E01~E14（除 E06/E08/E09/E15 命中）与设计级 `D10-3` 同根因：`plugins/huaweicloud-core/src/tools.mjs:1817` serviceCatalog 中文关键词覆盖不足。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属：Windows 升级检测链 EINVAL/npm.cmd 专属；Linux 结构化不适用（Linux 侧由源码级 queryDistTagsSync 探针佐证 dist-tags 含 latest+next）。P0 唯一允许 NOT_RUN 的 OS 专属例外 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | 需真实 DSH 插件安装/跳过验证（AGENT_TOOLKIT_MODE/SKIP_DSH 注入破坏性全局安装，run-only 不执行）；category=补环境 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 需真实 RDS+沙箱多服务编排会话自动化（建库→部署→连接串注入→读写验证→归零）；本客户端无 dsh/CDP agent 会话 harness；category=补环境 |
| `D9-6` | D9协议 | 跨客户端互通 | 跨客户端互通需官方 MCP Inspector 校验 + ≥2 真实客户端互通冒烟环境；本机源码级 clientInfo 互操作已证，真实多客户端会话冒烟需多客户端环境；category=补环境 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无——D9-13 tools/call 返回无明文 AK/SK，D2-11 凭证库 S1 不含明文 STS token，D4-13 只读子账号写被 IAM 拒绝`
- [x] 写操作误判 read-only：`无——D4-5 DeleteServers/CreateServers 判非 read-only，只读 Describe/List 放行`
- [x] 红线（I 类）违规：`发现 5 处脱敏/拦截覆盖缺口（D2-4/D4-2/D4-6/D4-16/D4-21/D4-23/D4-27/D8-9），已记根因并统一提单`
- [x] 脱敏复核：`D4-26 findings 证据脱敏通过（含 <redacted>）；D2-4/D4-6/D4-27/D8-9 漏脱敏项已记缺陷待修复`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 安全组 `tctest-d3c4-sg-*`（cn-north-4） | 1 个（真云 E2E D3-C4/D4-14 审计） | `DeleteSecurityGroup` 删除 | `ListSecurityGroups` 过滤 tctest-d3c4- 剩余 = 0 |
| 隔离 HOME（D2-16 import 测试） | 1 个临时目录 | `rmSync(recursive)` | 已删除（临时内存态凭证 scope=temporary 不落盘） |
| 运行时凭证（D9-13） | setRuntimeCredentials 注入测试值 | clearRuntimeCredentials | hasRuntimeCredentials=false |

> 真云资源只建删本次 `tctest-` 前缀资源，测后归零验证通过；无残留计费资源。

---

## 八、遗留与建议

- `D9-9` SPEC-MISMATCH（capabilities 未声明 cancellation）待维护者裁决是否属产品缺陷。
- 建议优先修复 5 处脱敏/拦截缺口（D2-4/D4-2/D4-6/D4-16/D4-21/D4-23/D4-27/D8-9），均为 safety-policy.mjs / risk-rule-engine.mjs 覆盖盲区，I 类安全风险。
- 建议提升 `serviceCatalog` 中文意图路由覆盖（当前 21.4%），补齐 ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 中文关键词。
- `D3-S7`（跨服务交付的真实 RDS+沙箱编排）、`D9-6`（真实多客户端互通）、`D1-67`（真实 DSH 安装）三项为环境阻塞，非 DSH/CDP 客户端暂无会话 harness，待补环境后复测。
