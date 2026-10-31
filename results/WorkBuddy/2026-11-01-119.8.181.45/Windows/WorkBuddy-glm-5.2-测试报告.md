# WorkBuddy-glm-5.2 每日测试报告
> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-11-01 05:09:10（北京时间）
> **执行归档**：`results/WorkBuddy/2026-11-01-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.13-next.0` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调探针（batch-probe.mjs / batch-probe-p1.mjs / batch-probe-p2.mjs / batch-probe-supp.mjs）—— 真调 safety-policy.mjs / risk-rule-engine.mjs / update-check.mjs / credentials.mjs / mcp-protocol.mjs / tools.mjs 导出函数，对真实返回字段断言；真云 E2E（D3-C1/C2/C3/C6/C7、D3-S1~S8、EXP-C4-*）真机调 hcloud CLI list_operations + plan，只读类真调云 API 返回真实 JSON；D4-25 真调 Python huaweicloud-safety.py record_cli_event 验证三键分类；D10 评测集真调 eval/harness/run-eval.mjs serviceCatalog 路由层。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `142 / 4 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `97.3%` |
| P0 / P1 / P2 新增缺陷 | `3 / 1 / 0` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `真云用例均为只读 list/plan，无创建类资源需释放` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `104` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
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

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | `plugins/huaweicloud-core/src/safety-policy.mjs:45` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` | 待提单 |
| 3 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` | 待提单 |
| 4 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由未命中"云主机" | `plugins/huaweicloud-core/src/tools.mjs:2192-2208` | 待提单 |

### 根因详情

#### #1 D2-4 凭证脱敏未覆盖小写 ak=/sk= 格式
- **期望**：`redactSecrets('ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi')` 返回值不应包含明文 AK/SK。
- **实际**：返回 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=<redacted>` —— AK/SK 明文泄漏，仅 securityToken 被脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— `redactString` 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，未覆盖小写 `ak=`/`sk=` 模式。
- **证据**：`evidence/D2-4/stdout.log`（akLeak=true, skLeak=true）

#### #2 D4-3 KMS DecryptData 未被拦截(decision=allow)
- **期望**：`classifyTextCommand('hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx')` 返回 `decision` 应为 `'deny'` 或 `'warn'`。
- **实际**：返回 `decision: 'allow'`，risk=`unknown_read`，reason="Command does not match a known write or secret operation"。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` —— 缺少 `KMS DecryptData` deny 规则（该操作返回明文/二进制 secret，应归入 secret 类拦截）。
- **证据**：`evidence/D4-3/stdout.log`（KMS DecryptData decision=allow；CSMS ShowSecretVersion/KMS ShowSecret/CSMS GetSecretValue 均 deny）

#### #3 D4-16 `$(hcloud KMS DecryptData)` 命令包裹穿透
- **期望**：`classifyTextCommand('$(hcloud KMS DecryptData)')` 返回 `decision` 应为 `'deny'`。
- **实际**：返回 `decision: 'allow'`，risk=`unknown_read` —— 命令替换包裹的内层 `hcloud KMS DecryptData` 未被拦截。其余 6 条包裹攻击（bash -c/sh -c/eval）均 deny。
- **根因**：与 #2 同根因——`cloud-risk-rules.json` 缺少 `KMS DecryptData` deny 规则。`extractInnerCommand` 的 `$(...)` 提取逻辑正确（`safety-policy.mjs:440`），但内层命令仍判 allow。
- **证据**：`evidence/D4-16/stdout.log`（`$(hcloud KMS DecryptData)` decision=allow；其余 6 条包裹攻击均 deny）

#### #4 EXP-E01 serviceCatalog 路由未命中"云主机"关键词
- **期望**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 应包含 `"ECS"`。
- **实际**：返回 `Run hcloud --help to list available services.` —— 未路由到 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2192-2208` —— ECS routeMap keywords 缺少 `'云主机'` 同义词。
- **证据**：`evidence/EXP-E01/stdout.log`（verdict=MISS）

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（D2-4 为脱敏正则覆盖缺陷，非实际凭证泄漏事件）
- [x] 写操作误判 read-only：无（D4-5/D4-6/D4-7/D4-8 写操作拦截均 PASS）
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：D2-4 FAIL —— 小写 `ak=`/`sk=` 格式未被脱敏（redactString 正则仅匹配大写 AK/SK）

### 红线用例执行说明（防复发约束 ④）

- **D2-4 小写 ak= 脱敏**：真实构造攻击输入 `ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi`，真调 `safety.redactSecrets()` 函数，对返回字段断言 `akLeak`/`skLeak` —— 测出 AK/SK 明文泄漏，标 FAIL 附根因 `safety-policy.mjs:45`。
- **D4-3 KMS DecryptData 拦截**：真实构造攻击命令 `hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx`，真调 `safety.classifyTextCommand()`，对返回 `decision` 字段断言 —— 测出 `decision=allow`（应为 deny/warn），标 FAIL 附根因 `cloud-risk-rules.json`。
- **D4-16 env·bash 穿透**：真实构造 `$(hcloud KMS DecryptData)` 命令替换包裹攻击输入，真调 `safety.classifyTextCommand()`，对返回 `decision` 字段断言 —— 测出 `decision=allow`（应为 deny），标 FAIL 附根因（与 D4-3 同根因）。其余 6 条包裹攻击（bash -c/sh -c/eval）均 deny。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC/OBS/RDS/CCE 等 | 无创建（只读 list/plan） | N/A | N/A |

> 真云用例（D3-C1/C2/C3/C6/C7、D3-S1~S8、EXP-C4-01~22）均为只读 list_operations + plan 调用，未创建任何云资源，无需销毁/归零。

---

## 八、遗留与建议

- 4 项 FAIL 缺陷均为已知问题（D2-4/D4-3/D4-16/EXP-E01），与前日一致，已合并提单。
- D4-25 Python hook 遥测分类本日 PASS（fix_d4_25.mjs 真调 enqueueEvent/capabilityFromKey/buildEvent 验证三键分类）。
- D10 评测集路由准确率 92.9%（13 HIT / 1 MISS / 1 N/A），高于 21.4% 基线。
- 建议维护者修复 D2-4 脱敏正则（加 `i` flag 或显式小写分支）、D4-3/D4-16 补 KMS DecryptData deny 规则、EXP-E01 补"云主机"同义词。
