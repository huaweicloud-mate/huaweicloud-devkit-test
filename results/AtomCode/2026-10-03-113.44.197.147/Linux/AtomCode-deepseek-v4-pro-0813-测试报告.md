# AtomCode-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`AtomCode-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：`2026-10-03 05:40:00`（北京时间）
> **执行归档**：`results/AtomCode/2026-10-03-113.44.197.147/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（存在 P0/P1 缺陷，见 §四缺陷清单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | AtomCode + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64（Ubuntu 24.04.4） |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12.3 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`；npm latest=1.1.7） |
| 工具全集 | 41（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置） |
| 真云凭证 | cn-north-4（AKSK 已配置，真机执行） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 102 / 展开级 39（本客户端 Linux 预筛后） |

> **执行方法**：grouped 探针（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix）+ eval/harness fixtures 18 项 + protocol-probe + run-eval + CLI 真机 + realcloud_e2e.mjs 真机 + supplement 直调。证据落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 141 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 130 / 9 / 0 / 1 / 1 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 92.9%（130/140） |
| P0 / P1 / P2 新增缺陷 | 1 / 7 / 2（P1 含 1 条 SPEC-MISMATCH） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（ECS/VPC/subnet/OBS 经补删后零残留） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 92 | 有证据且通过 PASS 门禁 |
| FAIL | 8 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 1 | D9-9 capabilities 未声明 cancellation |
| NOT_RUN | 1 | D1-39（Windows 专属，Linux 侧由 d1-upgrade 代表覆盖） |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01（云主机路由 MISS） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | 凭证 JSON 键值形态漏脱敏 | JSON 内 ak/sk/token → `<redacted>` | `safety-policy.mjs:34-47` | P | 待提单 |
| 2 | P1 | `D4-27` | 小写 `ak=`/`sk=` 短形漏脱敏 | `ak=`/`sk=` 值 → `<redacted>` | `safety-policy.mjs:45` | P | 待提单 |
| 3 | P1 | `EXP-E01` | 中文「云主机」未路由到 ECS | 「云主机」→ ECS | `tools.mjs:1970-1983` | P | 待提单 |
| 4 | P1 | `D9-2` | tools/list 非法 params 未返回 -32602 | 非法 params → `-32602` | `mcp-protocol.mjs:57-59` | P | 待提单 |
| 5 | P1 | `D9-9` | capabilities 未声明 cancellation | 声明 `notifications.cancellation` | `mcp-protocol.mjs:47-49` | P | 待提单（SPEC-MISMATCH） |
| 6 | P2 | `D8-9` | sanitizeValue 未脱敏凭证 | 遥测值 AK/SK/token → `<redacted>` | `telemetry/telemetry.mjs:189-196` | P | 待提单 |
| 7 | P1 | `D3-S1/S2/S3` | 自然语言全句未命中路由 | 场景全句 → ECS/VPC/Sandbox | `tools.mjs:2191-2198` | P | 待提单（新增） |
| 8 | P2 | `D3-S5` | 复合意图未分层路由 | 复合意图 → 多服务 | `tools.mjs:2191-2198` | P | 待提单（新增） |

### 根因详情（关键缺陷）

**#1 [P0] D2-4 凭证 JSON 键值形态漏脱敏**
- 期望：`redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}')` → 全部 `<redacted>`
- 实际：原样返回
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString` 正则只匹配 `key=value`/`key:value` 分隔，不识别 JSON `"key":"value"` 结构
- 证据：`evidence/D2-4/stdout.log`（d2-auth `redact-json` FAIL + supplement 直调）

**#3 [P1] EXP-E01 / #7 [P1] D3-S1/S2/S3 路由缺口**
- 现象：`service_catalog('帮我查...云主机')`、`'列出cn-north-4的ECS，只读不改'`、`'删除测试VPC，先列命令确认'`、`'部署当前项目到沙箱给我预览链接'` 均返回 `Run hcloud --help`
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2191-2198` 分词 `/[\s,./-]+/` 不切 `+`，英文关键词嵌中文不独立成 token；routeMap（:1968-2008）中文别名覆盖不全（缺「云主机」「沙箱」）
- 证据：`evidence/EXP-E01/stdout.log`、`evidence/D3-S1|S2|S3/stdout.log`（run-eval + supplement 直调）

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D1-39` | 设计级 | P0 | NOT_RUN | 调归属 | OS 列为「Windows（升级检测链 EINVAL 专属）」，本客户端为 Linux | Linux 侧已由展开级代表覆盖（d1-upgrade `queryDistTagsSync-no-EINVAL` 实测通过）；无需改用例，维持 Windows 专属归属 |

> 其余 140 例均实际执行并回填，无 BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（真云建删资源全部用唯一时间戳名，测后归零）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始 AK/SK 明文（D3 真云日志已脱敏/为 mock 凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（D3-C1 佐证 D3-C4） | 是 | 已删（补删） | ListServersDetails 复查 serverId 计数 0 |
| VPC / subnet（同） | 是 | 已删（补删） | ListVpcs/ListSubnets 复查 id 计数 0 |
| OBS 桶（D3-C2 佐证 D3-C13） | 是 | 已删 | rm 删除成功，桶不存在 |
| 沙箱会话（D3-C3/C6） | 是 | 已 close | close_session 返回 ok |

> 真云只删本次创建资源；ECS 异步删除在探针 150s 轮询窗口内未确认，已手动补删并二次复查归零，无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` capabilities 未声明 `notifications.cancellation`（MCP 协议契约，待维护者裁决是否补充）。
- 本轮未覆盖：真实 Agent 会话评测（D10-1/2/5/9 需 dsh headless；本机为 AtomCode 客户端，非 DSH，仅跑确定性 D10-3 路由层）。
- 建议：`routeMap` 增加英文关键词独立分词（中英混排场景）与「云主机」「沙箱」等中文别名，并对复合意图做多服务 token 级匹配，可一次性收敛 D3-S1/S2/S3/S5 与 EXP-E01。