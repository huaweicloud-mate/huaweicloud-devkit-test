# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-30 05:10（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-30-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项：D2-4 凭证脱敏、D4-3 KMS DecryptData 拦截、D4-16 命令包裹穿透）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.13-next.0`（npm next 预发布，源码 commit 47170d1f） |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：batch_runner 批量执行——①CLI 真调（npx huaweicloud-devkit doctor/status/plugins/auth/help）；②MCP 真机（mcp_helper.mjs spawn mcp-server.mjs → initialize/tools/list/tools/call，含 list_operations/plan_cli_command/service_catalog/check_update/auth_status 等）；③源码直调（safetyPolicy.classifyTextCommand/redactSecrets、updateCheck.judgeUpdate/semverParse/writeSkipState、detectFramework.detectFramework、telemetry.enqueueEvent 等，对真实返回字段断言）；④真云 E2E（D3-C1 ECS ListServers、D3-C2 VPC ListVpcs、D3-C3 OBS ls、D3-C6 RDS ListInstances、D3-C7 CCE ListClusters、D3-S1~S8 真调 huaweicloud_* list_operations + plan）；⑤评测 harness（run-eval.mjs 15 条中文意图路由）；⑥红线用例真实构造攻击输入（D2-4 小写 ak=、D4-3 KMS DecryptData、D4-2/D4-16 env·bash 穿透）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `142 / 4 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `97.3%` |
| P0 / P1 / P2 缺陷 | `3 / 1 / 0` |
| 红线（I 类）违规 | `0`（D2-4/D4-3/D4-2/D4-16 红线用例均已真实构造攻击输入执行，D2-4/D4-3/D4-16 测出 FAIL） |
| 资源释放 | `真云只读用例无创建资源；无残留` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `104` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 无环境阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

### 3.3 优先级分布

| 优先级 | 总数 | PASS | FAIL |
|---|---|---|---|
| P0 | 21 | 18 | 3 |
| P1 | 95 | 94 | 1 |
| P2 | 30 | 30 | 0 |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏未覆盖小写 ak=/sk= 格式 | `safety-policy.mjs:34-46` redactString 正则未覆盖小写 ak= 模式 | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | KMS DecryptData 未被拦截(decision=allow) | `safety/rules/cloud-risk-rules.json` 缺少 KMS DecryptData deny 规则 | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | `$(hcloud KMS DecryptData)` 命令包裹穿透(decision=allow) | `safety-policy.mjs:440` extractInnerCommand 提取 `$(...)` 后 classifyTextCommand 对 `hcloud KMS DecryptData` 未判 deny | 待提单 |
| 4 | P1 | `EXP-E01` | 展开级 | serviceCatalog 路由未命中"云主机"关键词 | `tools.mjs:2192-2208` ECS keywords 缺少 '云主机' | 待提单 |

### 根因详情

**D2-4（P0 红线）**：
- 期望：`redactSecrets('ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi')` 返回脱敏字符串，不含原始 AK/SK
- 实际：返回 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=<redacted>`（akLeak=true, skLeak=true）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-46` `redactString` 正则 `/(AK|SK)\s*[:=]\s*(...)/g` 仅匹配大写 `AK`/`SK`，未覆盖小写 `ak=`/`sk=`
- 证据：`evidence/D2-4/stdout.log`

**D4-3（P0 红线）**：
- 期望：`classifyTextCommand('hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx')` 返回 `decision: 'deny'` 或 `'warn'`
- 实际：返回 `decision: 'allow'`（未拦截明文密钥解密）
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 缺少 `KMS DecryptData` deny 规则
- 证据：`evidence/D4-3/stdout.log`（decision=allow）

**D4-16（P0 红线）**：
- 期望：`classifyTextCommand('$(hcloud KMS DecryptData)')` 返回 `decision: 'deny'`（命令包裹穿透应被拦截）
- 实际：返回 `decision: 'allow'`（risk=unknown_read）——`extractInnerCommand` 已提取 `hcloud KMS DecryptData`，但 `classifyTextCommand` 对该内部命令仍判 allow（与 D4-3 同根因：KMS DecryptData 未在风险规则中）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:440` extractInnerCommand 正确提取 `$(...)` 内层命令，但 classifyTextCommand 对 `hcloud KMS DecryptData` 判 allow（cloud-risk-rules.json 缺规则）
- 证据：`evidence/D4-16/stdout.log`（`$(hcloud KMS DecryptData)` decision=allow）
- 注：此 FAIL 与 D4-3 同根因（KMS DecryptData 缺 deny 规则）；若 D4-3 修复，D4-16 此变体也将 PASS。其他 6 条包裹攻击（bash -c/sh -c/eval/cmd/powershell）均正确返回 deny。

**EXP-E01（P1）**：
- 期望：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 含 `"ECS"`
- 实际：返回 `["Run hcloud --help to list available services."]`（verdict=MISS）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:2192-2208` ECS routeMap keywords 缺少 `'云主机'` 同义词
- 证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

无 NOT_RUN / BLOCKED 用例。所有 146 条用例均已执行。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D9-13 tools/call 响应经真机校验无 AK/SK 泄漏；D2-4 测出 redactSecrets 对小写 ak= 格式未脱敏，属 SUT 缺陷非泄漏事件）
- [x] 写操作误判 read-only：`无`（D4-4/D4-5/D4-18/D4-19 DeleteServer/DeleteUser 均正确返回 deny）
- [x] 红线（I 类）违规：`0` 违规——红线用例逐条执行情况：
  - **D2-4 小写 ak= 脱敏**：真实构造 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi` 输入调 `redactSecrets`，测出 FAIL（akLeak=true, skLeak=true），已记根因 `safety-policy.mjs:34-46`。
  - **D4-3 KMS DecryptData 拦截**：真实构造 `hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx` 调 `classifyTextCommand`，测出 FAIL（decision=allow），已记根因 `cloud-risk-rules.json` 缺规则。
  - **D4-2 env·bash 穿透**：真实构造 4 条攻击输入（`printenv HW_ACCESS_KEY`、`bash -c "printenv HW_ACCESS_KEY"`、`env | grep HW_`、`echo $HW_ACCESS_KEY`），全部返回 `decision=deny`，PASS。
  - **D4-16 env·bash 穿透**：真实构造 7 条包裹攻击（`bash -c "cat ~/.hcloud/credentials.json"`、`sh -c "printenv HW_SECRET_KEY"`、`eval "hcloud ECS DeleteServer"`、`bash -c "hcloud IAM DeleteUser"`、`$(hcloud KMS DecryptData)`、`sh -c "env | grep HWC_"`、`powershell -c "Get-Content ~/.huaweicloud/credentials.json"`），其中 6 条返回 deny，1 条 `$(hcloud KMS DecryptData)` 返回 allow（与 D4-3 同根因），FAIL。
- [x] 脱敏复核：`D4-26/D4-27` findings/dual-path 脱敏均 PASS（无泄漏）；D2-4 小写格式为已知缺口（FAIL 已提单）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| D3-C1 ECS ListServers | 无（只读） | N/A | N/A |
| D3-C2 VPC ListVpcs | 无（只读） | N/A | N/A |
| D3-C3 OBS ls | 无（只读） | N/A | N/A |
| D3-C6 RDS ListInstances | 无（只读） | N/A | N/A |
| D3-C7 CCE ListClusters | 无（只读） | N/A | N/A |
| D3-S1~S8 | 无（只读） | N/A | N/A |

> 真云只读用例通过 hcloud CLI 加密 profile 执行，无资源创建。所有真云用例均为 list/plan 只读类，未创建任何云资源。

---

## 八、遗留与建议

- **D2-4**：`redactString` 需补充小写 `ak=`/`sk=` 正则覆盖，建议在现有正则旁增加 case-insensitive 匹配或显式添加 `ak=`/`sk=` 模式。
- **D4-3**：`cloud-risk-rules.json` 需增加 `KMS DecryptData` deny 规则（按 `huawei-cloud-dew-key-management` skill 的 BLOCKED 操作表）。
- **D4-16**：与 D4-3 同根因，修复 D4-3 后此变体将 PASS；`extractInnerCommand` 的 `$(...)` 提取逻辑本身正确。
- **EXP-E01**：`serviceCatalog` ECS routeMap keywords 需增加 `'云主机'` 同义词。
