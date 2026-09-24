# AtomCode-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-25 05:19:39（北京时间）
> **执行归档**：`results/AtomCode/2026-09-25-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 6 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `AtomCode` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7 (gitHead 7456d059)` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针（.mjs 直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数）重跑 47 个探针；CLI 真机（doctor/help/install/update）；MCP 协议探针（d9-protocol/protocol-probe）；D10 路由 harness（`node eval/harness/run-eval.mjs`）；真云 E2E（`probe-realcloud.mjs` 建删归零，22/22）。证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `110 / 26 / 3 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 136） | `80.9%` |
| P0 / P1 / P2 新增缺陷 | `6 / 17 / 3` |
| 红线（I 类）违规 | `6`（凭证脱敏/拦截不完整类，详见缺陷清单 #1/#2/#3/#4/#8/#9） |
| 资源释放 | `全部归零`（realcloud E2E 建删 tctest-d3c4-sg 归零，见 §七） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `82` | 有证据且通过 PASS 门禁 |
| FAIL | `15` | 不符预期，根因见缺陷清单 |
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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `safety-policy.mjs:49/:34` redactSecrets/redactString 未覆盖 JSON 键值 | 待提单 |
| 2 | P1 | `D3-S8` | D3功能 | 场景-操作失败后排障指引 | `tools.mjs:1817/:1123` serviceCatalog routeMap 缺排障分支 | 待提单 |
| 3 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | `safety-policy.mjs:398-419` env-dump 正则未覆盖 `HW_` 裸字面 | 待提单 |
| 4 | P1 | `D4-6` | D4安全 | adminPass回显警告 | `safety-policy.mjs:34/:42` redactString 未覆盖空格分隔 adminPass | 待提单 |
| 5 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:398-399` env-dump gate 未解 `sh -c` 包裹 | 待提单 |
| 6 | P0 | `D4-21` | D4安全 | hook_check_artifacts 具名回归（代码/IaC/策略制品预检） | `risk-rule-engine.mjs` evaluateArtifacts 缺 broad IAM 规则 | 待提单 |
| 7 | P0 | `D4-23` | D4安全 | 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标） | `package.json:8` files 缺 rules/ + `setup-cli.mjs` 无 .mdc 注入 | 待提单 |
| 8 | P2 | `D4-25` | D4安全 | Python hook 事件遥测分类 | `huaweicloud-safety.py:95-96/:44-46` WRITE_OPERATION_RE 未命中写 verb | 待提单 |
| 9 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | `safety-policy.mjs:34` redactString 缺小写 ak=/sk=/裸 token= | 待提单 |
| 10 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `telemetry.mjs:189` sanitizeValue 未调 redactSecrets | 待提单 |
| 11 | P1 | `D9-2` | D9协议 | JSON-RPC错误码 | `mcp-protocol.mjs:57` tools/list 无入参校验未返回 -32602 | 待提单 |
| 12 | P1 | `D9-4` | D9协议 | 协议生命周期 | `mcp-protocol.mjs:57` tools/list 无 initialize 时序守卫 | 待提单 |
| 13 | P2 | `D9-7` | D9协议 | 协议版本协商降级 | `mcp-protocol.mjs:46` protocolVersion 直接透传无降级 | 待提单 |
| 14 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | `mcp-protocol.mjs:57` tools/list 无时序守卫未返回 -32600（同 D9-4） | 待提单 |
| 15 | P1 | `D10-3` | D10评测 | 路由准确率+混淆矩阵 | `tools.mjs:1817` serviceCatalog 中文关键词覆盖不足（21.4%） | 待提单 |
| 16 | P1 | `EXP-E01` | D10评测 | 中文意图路由 MISS | 同 D10-3（serviceCatalog 中文意图未命中） | 待提单 |
| 17 | P1 | `EXP-E02` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 18 | P1 | `EXP-E03` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 19 | P1 | `EXP-E04` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 20 | P1 | `EXP-E05` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 21 | P1 | `EXP-E07` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 22 | P1 | `EXP-E10` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 23 | P1 | `EXP-E11` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 24 | P1 | `EXP-E12` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 25 | P1 | `EXP-E13` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |
| 26 | P1 | `EXP-E14` | D10评测 | 中文意图路由 MISS | 同 D10-3 | 待提单 |

### 根因详情

> 每个缺陷的「期望 / 实际 / 根因（文件:行号）/ 证据」完整内容见同目录 `FINDINGS.md`（共 16 项，含 6 项 P0）。展开级 EXP-E01~E14 的 11 个 MISS 与设计级 D10-3 同根因（`tools.mjs:1817` serviceCatalog 中文关键词覆盖不足），在 FINDINGS.md #7 合并列为 1 项，不加开 11 单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | 【调归属】OS 专属用例（OS 列标注「Windows 专属」），Linux 侧结构性不适用；Linux 由源码级 queryDistTagsSync 探针佐证 dist-tags 含 latest+next，另由 D1-40 反向提醒防护覆盖 |

### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | 需真实 DSH 插件安装/跳过验证（AGENT_TOOLKIT_MODE/SKIP_DSH 注入破坏性全局安装，run-only 不执行）；category=补环境 |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | 需真实 RDS+沙箱多服务编排会话自动化（建库→部署→连接串注入→读写验证→归零）；本客户端无 dsh/CDP agent 会话 harness；category=补环境 |
| `D9-6` | D9协议 | 跨客户端互通 | 跨客户端互通需官方 MCP Inspector 校验 + ≥2 真实客户端互通冒烟环境；本机源码级 clientInfo 互操作 10/10 已证，真实多客户端会话冒烟需多客户端环境；category=补环境 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`6` 项拦截/脱敏缺口（D2-4/D4-2/D4-6/D4-16/D4-27/D8-9，均为「未拦截/未脱敏」缺口，非本次泄漏事件）
- [x] 写操作误判 read-only：`0`（DeleteServers/CreateServers 均正确判为写/非 allow，只读 Describe/List 均 allow）
- [x] 红线（I 类）违规：`6`（凭证脱敏/拦截不完整，详见 FINDINGS.md #1/#2/#3/#4/#8/#9）
- [x] 脱敏复核：证据目录无原始 AK/SK 明文（realcloud 探针仅用预置 credentials.json + 只读子账号，输出已脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| VPC 安全组 `tctest-d3c4-sg-*`（D3-C4/D4-14 真机） | 是（CreateSecurityGroup 计数 +1） | 是（DeleteSecurityGroup） | 归零（tctest-d3c4- 剩余 = 0，ListSecurityGroups 复核） |
| 隔离 HOME `hdk-d2real-*`（D2-16 import 擦除） | 是（mkdtemp） | 是（rmSync force） | 归零（临时目录删除） |

> 真云 E2E 只删本次 `tctest-d3c4-*` 前缀资源，未触碰既有/他人资源；`probe-realcloud.run.log` 22/22 PASS 含「测后删除归零=0」断言。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities 未声明 cancellation）由维护者裁决是否设计缺陷。
- 本轮未覆盖（范围）：`D3-S7`（真实 RDS+沙箱多服务编排）、`D9-6`（多客户端真实会话互通）、`D1-67`（真实 DSH 插件安装）→ 已 BLOCKED 并按四要素写原因，非 DSH 客户端缺 dsh/CDP agent 会话 harness。
- 建议：优先修复 6 项 P0 安全缺口（D2-4/D4-2/D4-6/D4-16/D4-21/D4-23）与 D9-12 握手时序守卫，其次补 D10-3 中文 serviceCatalog 路由覆盖率。
