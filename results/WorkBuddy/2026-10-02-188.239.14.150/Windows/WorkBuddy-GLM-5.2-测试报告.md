# WorkBuddy-GLM-5.2 每日测试报告
> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-02 05:05:42（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-02-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.8-next.1（GitHub `huaweicloud/huaweicloud-devkit`，gitHead `ffd7b47`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项 + P1 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `GLM-5.2` |
| OS / 架构 | `Windows` / `x86_64` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1`（gitHead `ffd7b47`） |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调（classifyHcloudArgs/classifyTextCommand/evaluateCommandRisk/serviceCatalog 等），eval harness 路由层测试（run-eval.mjs），MCP 工具协议探针（protocol-probe.mjs）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `136 / 5 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `96.5%` |
| P0 / P1 / P2 新增缺陷 | `3 / 2 / 0` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `无真云资源创建（探针直调+eval harness，无副作用）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

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
| 1 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `safety-policy.mjs:257` 正则未匹配连字符变体 `show-secret`/`show-secret-version`/`get-secret-value` | 待提单 |
| 2 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | `safety-policy.mjs:257` 同 D4-3，连字符+大写服务名绕过 secret 拦截 | 待提单 |
| 3 | P0 | `D4-28` | D4安全 | Node 版安全 hook 链路 | `safety-policy.mjs:257` 同 D4-3，args 数组形式 commandText 提取后分类未 deny | 待提单 |
| 4 | P1 | `D4-11` | D4安全 | 提示注入防护 | `safety-policy.mjs:572` + `risk-rule-engine.mjs:mergeRiskDecision` warn 级 findings 不升级为 deny | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由未识别"云主机" | `tools.mjs:1978` routeMap ECS 关键词缺"云主机" | 待提单 |

### 根因详情

#### #1 D4-3 — CSMS secret 命令连字符变体未拦截
- **期望**：`hcloud csms show-secret/show-secret-version/get-secret-value` 判 `deny`
- **实际**：判 `allow`（risk=read_only），仅无连字符的 `showsecret` 判 `deny`
- **根因**：`safety-policy.mjs:257` 正则 `showsecret|showsecretversion|getsecretvalue` 未覆盖 `show-secret`（连字符）；`policy.json:26` blockedSecretOperations `ShowSecret` 与 `op.toLowerCase()===operation.toLowerCase()` 比较未处理连字符
- **证据**：`evidence/D4-3/stdout.log`

#### #2 D4-16 — bash -c 包裹 + 大写 CSMS 穿透
- **期望**：`bash -c "hcloud CSMS show-secret --secret-id test"` 判 `deny`
- **实际**：判 `allow`（risk=read_only），命令包裹穿透
- **根因**：同 D4-3，`classifyHcloudArgs` 提取 operation=`show-secret`（含连字符）未匹配 secret 拦截规则
- **证据**：`evidence/D4-16/stdout.log`

#### #3 D4-28 — Node hook args 数组形式未 deny
- **期望**：`hook_check_command({ args: ["hcloud","CSMS","show-secret","--secret-id","test"] })` 判 `deny`
- **实际**：commandText 提取正确但分类判 `allow`
- **根因**：同 D4-3，`classifyTextCommand` → `classifyHcloudArgs` 路径未拦截连字符变体
- **证据**：`evidence/D4-28/stdout.log`

#### #4 D4-11 — 提示注入 "Ignore previous instructions" 未拦截
- **期望**：包含提示注入模式的命令判 `deny`
- **实际**：判 `allow`（risk=not_huaweicloud）+ `warn` 级 findings
- **根因**：`safety-policy.mjs:572` `applyRawCommandRiskRules` 返回 allow+warn；`mergeRiskDecision` 仅 `risk.decision==='deny'` 时升级，warn 不升级
- **证据**：`evidence/D4-11/stdout.log`

#### #5 EXP-E01 — serviceCatalog "云主机" 路由 MISS
- **期望**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 路由到 ECS
- **实际**：返回 `Run hcloud --help`，路由 MISS
- **根因**：`tools.mjs:1978` routeMap ECS keywords 缺"云主机"
- **证据**：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（D2-4 凭证脱敏 PASS，D2-11 STS token 拒绝落盘 PASS）
- [x] 写操作误判 read-only：`无`（D4-5 写操作误判检测 PASS）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：`PASS`（redactSecrets 正确脱敏 AK/SK）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/VPC | 无 | 无 | N/A（探针直调+eval harness，无真云副作用） |

> 本次测试全部为源码级探针直调 + eval harness 路由层测试，未创建真云资源。

---

## 八、遗留与建议

- D4-3/D4-16/D4-28 同一根因（safety-policy.mjs:257 正则未覆盖连字符 secret 命令变体），建议一并修复：正则改为 `show[_-]?secret|show[_-]?secret[_-]?version|get[_-]?secret[_-]?value`
- D4-11 提示注入防护：建议 `mergeRiskDecision` 对 `warn` 级 destructive findings 在无 explicit approval 时升级为 `deny`，或新增 prompt-injection 检测规则
- EXP-E01 serviceCatalog：routeMap ECS 关键词补充"云主机"
