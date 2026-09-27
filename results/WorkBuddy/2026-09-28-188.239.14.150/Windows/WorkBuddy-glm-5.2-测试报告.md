# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-09-28 05:20:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-28-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 Standard` |
| 被测版本（SUT） | `1.1.7` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级直调（safety-policy/risk-rule-engine/credentials/hcloud-cli）+ MCP 协议探针（protocol-probe.mjs）+ 真云 E2E（realcloud_e2e.mjs：ECS/VPC/Subnet 建删归零、OBS 静态站、sandbox 会话）+ 只读子账号实测（run-as-readonly.py）+ D10 评测 harness（run-eval.mjs serviceCatalog 路由层）+ 源码巡检（env var/module/tool 注册）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `123 / 17 / 0 / 1 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 141） | `87.2%` |
| P0 / P1 / P2 新增缺陷 | `0 / 0 / 0`（全部历史已知） |
| 红线（I 类）违规 | `无` |
| 资源释放 | `已归零（ECS/VPC/Subnet/OBS桶 反序删除验证）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `6` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移（D9-9） |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E14 路由 MISS（11 条） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | 命令包裹穿透 | `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` → `deny` | 返回 `allow` | `safety-policy.mjs:384-430` | P | 历史关联 #731 |
| 2 | P0 | `D2-4` | 凭证脱敏（字符串输入漏脱敏） | `redactSecrets(jsonString)` 不含原始 SK | 原始 SK 保留 | `safety-policy.mjs:34-46` | P | 历史关联 #694/#791 |
| 3 | P0 | `D9-12` | initialize 握手协议安全基线 | capabilities 含 cancellation；非法参数返回 -32602 | cancellation 未声明；无 error 对象 | `mcp-server.mjs` | P | 历史关联 |
| 4 | P0 | `D10-4` | 安全干预-静态规则层 | DeleteServers → `deny` | 返回 `warn` | `risk-rule-engine.mjs` + `cloud-risk-rules.json:225-249` | P | 历史关联 |
| 5 | P1 | `D4-27` | 双路径输出脱敏 | `ak`/`sk` 脱敏 | 未脱敏 | `safety-policy.mjs:45` | P | 历史关联 #694/#791 |
| 6 | P1 | `D9-2` | JSON-RPC错误码 | 非法参数 → `-32602` | 无 error 对象 | `mcp-server.mjs` | P | 历史关联 #731 |
| 7 | P1 | `D9-9` | tools/call 超时协议语义与取消 | 声明 `notifications.cancellation` | 未声明 | `mcp-server.mjs` | P | 历史关联 |
| 8 | P1 | `D10-3` | 路由准确率+混淆矩阵 | 15 条评测意图全部 HIT | 4/15 HIT (26.7%) | `hcloud-cli.mjs` serviceCatalog | P | 历史关联 |
| 9~19 | P1 | `EXP-E01~E14` | serviceCatalog 路由 MISS（11 条） | 全部 HIT | 11 条 MISS | `hcloud-cli.mjs` serviceCatalog | P | 历史关联 |

### 根因详情

**#1 [P0] D4-16 命令包裹穿透**

- 期望：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:384-430`
  `classifyTextCommand()` 的 env-dump 正则 `/(^|\s)(env|printenv|...)/i` 和 `/(?:^|\s)printenv\s+HUAWEICLOUD_/i` 均要求 printenv 前面是 `^` 或 `\s`，但引号内的 printenv 前面是 `"` 不匹配，导致 `sh -c` 包裹的命令穿透所有规则
- 证据：`evidence/D4-16/stdout.log`

**#2 [P0] D2-4 凭证脱敏正确性（字符串输入漏脱敏）**

- 期望：`redactSecrets('{"ak":"AKID...","sk":"SK..."}')` 返回脱敏字符串
- 实际：返回原字符串，`ak`/`sk` 值未脱敏
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-46`
  `redactString` 正则 `/(AK|SK)\s*[:=]\s*.../g` 仅匹配大写 `AK`/`SK`，未覆盖小写 `ak`/`sk` 键名。对象输入走 `isSecretKeyName`（匹配 policy.json 的 `ak`/`sk` pattern）正常脱敏，但字符串输入走 `redactString` 正则路径漏脱敏
- 证据：`evidence/D2-4/stdout.log`

**#3 [P0] D9-12 initialize 握手协议安全基线**

- 期望：capabilities 含 `notifications.cancellation`；非法参数返回 `-32602`
- 实际：cancellation 未声明；非法参数无 error 对象
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` — capabilities 响应缺少 notifications.cancellation 声明；params 校验未返回标准 JSON-RPC 错误码
- 证据：`evidence/D9-12/stdout.log`

**#4 [P0] D10-4 安全干预-静态规则层**

- 期望：`evaluateCommandRisk('hcloud ECS DeleteServers ...')` → `deny`
- 实际：返回 `warn`
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:225-249` — `hwc-destructive-delete-operation` 规则 severity 为 `warn` 而非 `deny`
- 证据：`evidence/D10-4/stdout.log`

---

## 五、未执行用例与原因

无未执行用例（NOT_RUN=0, BLOCKED=0）。

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
| VPC | 是（D3-C1/C3/C6） | 已删 | ECS✓ subnet✓ vpc✓ |
| Subnet | 是 | 已删 | 反序删除验证 |
| ECS | 是（D3-C1/C3/C6） | 已删 | finally 归零验证 |
| OBS 桶 | 是（D3-C2） | 已删 | 删桶归零验证 |
| Sandbox 会话 | 是（D3-C3/C6） | 已关闭 | close_session 验证 |

> 真云只删本次创建资源；删除前全量盘点 + 白名单，禁删既有/他人资源。残留 0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9` (notifications.cancellation 未声明)
- 全部缺陷为历史已知，已在 #731/#694/#791 等关联单跟踪，本次不重复提单
- 建议：serviceCatalog 路由层需扩充中文意图匹配规则（当前 26.7% 命中率）
