# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-09-30 05:10:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-30-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`FAIL`（有 FAIL/SPEC-MISMATCH 缺陷，均为历史已知缺陷复核确认）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 Standard` |
| Node / npm / Python | `Node v22.22.2 / npm 12.1.0 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.8-next.1`（npm latest，gitHead `7456d05`，PR #813） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `已配置（doctor 确认）` |
| 真云凭证 | `cn-north-4（AKSK 已配置，未使用真云 E2E）` |
| 测试类型 | 源码级探针 / MCP 协议 / 评测 harness |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；MCP 协议探针走 `eval/harness/protocol-probe.mjs`；评测路由走 `eval/harness/run-eval.mjs`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 设计级 102 + 展开级 39 = 141 |
| 已执行 | 141 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 122 / 18 / 0 / 1 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 122/141 = 86.5% |
| P0 / P1 / P2 新增缺陷 | 0 / 0 / 0（均为历史已知） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 94 | 有证据且通过 PASS 门禁 |
| FAIL | 7 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 1 | 契约漂移（D9-9 cancellation 未声明） |
| NOT_RUN | 0 | 无未执行 |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 28 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | serviceCatalog 路由 MISS（历史已知） |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | 无未执行 |
| **合计** | **39** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

> 所有缺陷均为历史已知缺陷的复核确认，无新增缺陷。

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | 命令包裹穿透（sh -c） | `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `deny` | 返回 `allow` | `safety-policy.mjs:384-430` | P | 历史关联 #731 |
| 2 | P0 | `D2-4` | 凭证脱敏正确性（字符串输入漏脱敏） | `redactSecrets` 对含小写 `ak`/`sk` 键的 JSON 字符串返回脱敏后的字符串 | 原字符串未脱敏 | `safety-policy.mjs:34-46` | P | 历史关联 #694/#791 |
| 3 | P0 | `D9-12` | initialize 握手协议安全基线 | capabilities 含 notifications.cancellation；tools/list 非法参数返回 -32602 | cancellation 未声明；无 -32602 错误 | `mcp-server.mjs` | P | 历史关联 |
| 4 | P0 | `D10-4` | 安全干预-静态规则层（DeleteServers 仅 warn） | 高危删除命令判 `deny/confirm` | 返回 `warn` | `risk-rule-engine.mjs` + `cloud-risk-rules.json:225-249` | P | 历史关联 |
| 5 | P1 | `D4-27` | 双路径输出脱敏 | MCP + 直调双路径均脱敏 `ak`/`sk` | 双路径均未脱敏 lowercase `ak`/`sk` | `safety-policy.mjs:45` | P | 历史关联 #694/#791 |
| 6 | P1 | `D9-2` | JSON-RPC错误码（invalid params） | 非法 params 调用返回 `-32602` | 无 error 对象 | `mcp-server.mjs` | P | 历史关联 #731 |
| 7 | P1 | `D9-9` | tools/call 超时协议语义与取消 | capabilities 含 `notifications.cancellation` 声明 | 未声明 | `mcp-server.mjs` | P | 历史关联 |
| 8 | P1 | `D10-3` | 路由准确率+混淆矩阵 | 15 条评测集意图全部路由命中（HIT） | 4/15 命中（26.7% HIT），11 条 MISS | `hcloud-cli.mjs` serviceCatalog | P | 历史关联 |
| 9~19 | P1 | `EXP-E01~E14` | serviceCatalog 路由 MISS（11 条） | 15 条评测集意图全部路由命中 | E01,E02,E03,E04,E05,E07,E10,E11,E12,E13,E14 MISS | `hcloud-cli.mjs` serviceCatalog | P | 历史关联 |

### 根因详情

**#1 [P0] D4-16 命令包裹穿透（sh -c）**
- 期望：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:384-430` — `classifyTextCommand` 在 hcloud regex 不匹配时直接 fallthrough 到 allow，未调用 `stripExecutable` 解包 `sh -c` wrapper；正则要求 printenv 前面是 `^` 或 `\s`，但引号内的 printenv 前面是 `"` 不匹配
- 证据：`evidence/D4-16/stdout.log` + `evidence/d4-security/stdout.log`

**#2 [P0] D2-4 凭证脱敏正确性（字符串输入漏脱敏）**
- 期望：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 返回脱敏后的字符串
- 实际：原字符串未脱敏
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-46` — `redactString` 正则 `/(AK|SK)\s*[:=]\s*.../g` 仅匹配大写 `AK`/`SK` 前缀，未覆盖小写 `ak`/`sk` 键名
- 证据：`evidence/D2-4/stdout.log` + `evidence/d2-auth/stdout.log`

**#3 [P0] D9-12 initialize 握手协议安全基线**
- 期望：initialize 返回 capabilities 含 `notifications.cancellation`；tools/list 非法参数返回 `-32602`
- 实际：`notifications.cancellation` 未声明（SPEC-MISMATCH）；非法参数无 error 对象
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` — capabilities 响应缺少 notifications.cancellation 声明；params 校验未返回标准 JSON-RPC 错误码
- 证据：`evidence/D9-12/stdout.log`

**#4 [P0] D10-4 安全干预-静态规则层（DeleteServers 仅 warn）**
- 期望：`evaluateCommandRisk('hcloud ECS DeleteServers --servers.1.id=abc')` 返回 `deny` 或 `confirm`
- 实际：返回 `warn`
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` + `safety/rules/cloud-risk-rules.json:225-249` — DeleteServers 匹配 `hwc-destructive-delete-operation` 规则（severity: warn）而非 deny 规则
- 证据：`evidence/D10-4/stdout.log`

**#5 [P1] D4-27 双路径输出脱敏**
- 期望：MCP + 直调双路径均脱敏 `ak`/`sk`
- 实际：双路径均未脱敏 lowercase `ak`/`sk`（与 D2-4 同根因）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` regex 仅匹配大写 `AK`/`SK`
- 证据：`evidence/D4-27/stdout.log`

**#6 [P1] D9-2 JSON-RPC错误码**
- 期望：非法 params 调用返回 `-32602` (Invalid params)
- 实际：无 error 对象
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` — params 校验未返回标准 JSON-RPC `-32602` 错误
- 证据：`evidence/D9-2/stdout.log`

**#7 [P1] D9-9 tools/call 超时协议语义与取消 (SPEC-MISMATCH)**
- 期望：capabilities 含 `notifications.cancellation` 声明
- 实际：未声明
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` — initialize 响应 capabilities 未声明 cancellation notification 能力
- 证据：`evidence/D9-9/stdout.log`

**#8 [P1] D10-3 路由准确率+混淆矩阵**
- 期望：15 条评测集意图全部路由命中（HIT）
- 实际：4/15 命中（26.7% HIT），11 条 MISS
- 根因：`plugins/huaweicloud-core/src/hcloud-cli.mjs` serviceCatalog 路由层覆盖不全
- 证据：`evidence/D10-3/stdout.log` + `evidence/c4-service-matrix/stdout.log`

**#9~#19 [P1] EXP-E01~E14 serviceCatalog 路由 MISS（11 条）**
- 期望：15 条评测集意图全部路由命中（HIT）
- 实际：E01,E02,E03,E04,E05,E07,E10,E11,E12,E13,E14 MISS；E06,E08,E09,E15 HIT
- 根因：`plugins/huaweicloud-core/src/hcloud-cli.mjs` serviceCatalog 路由层覆盖不全
- 证据：`evidence/c4-service-matrix/stdout.log`

---

## 五、未执行用例与原因

无未执行用例。本轮全部 141 条用例（设计级 102 + 展开级 39）均已实际执行并回填，无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS | 否 | — | 无真云资源创建 |
| 本地文件/进程 | 是 | 已清理 | 探针脚本执行完毕，无残留进程 |

> 本轮测试以源码级探针 + MCP 协议探针 + 评测 harness 为主，未创建真云资源。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9`（capabilities.notifications.cancellation 未声明，MCP 协议契约漂移）
- 历史已知缺陷 19 项（设计级 8 + 展开级 11），均与历史 FINDINGS 一致，无新增缺陷
- 建议：维护者统一处理历史缺陷单的复核确认，无需重复提单
