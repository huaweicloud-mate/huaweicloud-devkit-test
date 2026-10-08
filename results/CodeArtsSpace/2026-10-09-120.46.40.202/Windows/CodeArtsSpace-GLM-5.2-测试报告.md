# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-09 05:10（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-09-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 4 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8-next.1` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针直调（safety-policy.mjs redactString/classifyTextCommand）+ MCP 真机（hdk status/doctor/auth）+ eval harness（run-eval.mjs serviceCatalog 路由）+ 真云 E2E（hcloud ECS NovaListServers 主账号+只读子账号）+ 源码静态读取（cloud-risk-rules.json/mcp-server.mjs）

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `140` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 8 / 0 / 0 / 1` |
| 通过率（分母 = PASS+FAIL = 140） | `94.3%` |
| P0 / P1 / P2 新增缺陷 | `4 / 4 / 0` |
| 红线（I 类）违规 | `0`（无凭证泄漏、无 mock 假跑、真云已执行） |
| 资源释放 | `N/A`（本次仅只读 API 调用 NovaListServers，未创建任何云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `7` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D2-11` | D2认证 | R3 STS token拒绝落盘 | safety/rules/cloud-risk-rules.json:94 正则未覆盖 sts get-token, severity 为 warn 而非 deny | 待提单 |
| 2 | P1 | `D2-16` | D2认证 | import文件读取后擦除 | safety/policy.json:25 blockedConfigureSubcommands 缺少 'import' | 待提单 |
| 3 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | safety-policy.mjs:45 正则 /(AK\|SK)\s*[:=]/g 缺少 i 标志, 小写 ak/sk 不匹配 | 待提单 |
| 4 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 | safety-policy.mjs 凭证env打印规则仅匹配 HUAWEICLOUD_/HW_ 前缀, 未覆盖非标准前缀 | 待提单 |
| 5 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | safety/policy.json:26 blockedSecretOperations 仅覆盖 PascalCase, 未覆盖 CLI 小写 show-secret/decrypt-data | 待提单 |
| 6 | P1 | `D4-4` | D4安全 | 写操作审批门 | safety-policy.mjs 凭证打印拦截仅匹配华为云特定变量名, 未覆盖 ACCESS_KEY/SECRET_KEY | 待提单 |
| 7 | P1 | `D4-24` | D4安全 | 确认令牌过期与重复确认边界（审批流健壮性） | safety-policy.mjs:25 isSecretKeyName 正则将 access_token 归一化为 accesstoken, 不匹配 access.*key; policy.json:11 模式 token 经锚定不匹配 access_token | 待提单 |
| 8 | P1 | `EXP-E01` | D10评测 | serviceCatalog routes -> ECS matched | eval/harness/run-eval.mjs: serviceCatalog 中文意图'帮我查一下我账号在华北北京四有哪些云主机'未命中 ECS, 返回通用 help 提示 | 待提单 |

### 根因详情

**D2-11 (P0)**：期望 STS get-token 返回 decision:deny，实际返回 decision=allow, risk=read_only。根因：`safety/rules/cloud-risk-rules.json:94` 正则未覆盖 `sts get-token`，severity 为 warn 而非 deny。证据：`evidence/D2-11/stdout.log`

**D2-16 (P1)**：期望 configure import --file 返回 decision:deny，实际返回 decision=allow, risk=unknown_read。根因：`safety/policy.json:25` blockedConfigureSubcommands 缺少 'import'。证据：`evidence/D2-16/stdout.log`

**D2-4 (P0)**：期望 redactString 大小写均脱敏，实际小写 ak=/sk= 未被脱敏。根因：`safety-policy.mjs:45` 正则 `/(AK|SK)\s*[:=]/g` 缺少 i 标志。证据：`evidence/D2-4/stdout.log`

**D4-2 (P0)**：期望 echo $HW_SECRET_KEY 被阻断(decision:deny)，实际第三条命令返回 decision=allow, risk=not_huaweicloud。根因：`safety-policy.mjs` 凭证env打印规则仅匹配 HUAWEICLOUD_/HW_ 前缀。证据：`evidence/D4-2/stdout.log`

**D4-3 (P0)**：期望 hcloud CSMS/KMS 密钥操作被阻断(decision:deny)，实际 csms show-secret/kms decrypt-data 返回 decision=allow。根因：`safety/policy.json:26` blockedSecretOperations 仅覆盖 PascalCase。证据：`evidence/D4-3/stdout.log`

**D4-4 (P1)**：期望 echo $ACCESS_KEY 返回 decision:deny，实际返回 decision=allow, risk=not_huaweicloud。根因：`safety-policy.mjs` 凭证打印拦截仅匹配华为云特定变量名。证据：`evidence/D4-4/stdout.log`

**D4-24 (P1)**：期望 redactSecrets({access_token}) 返回 {access_token:<redacted>}，实际 access_token 字段未被脱敏。根因：`safety-policy.mjs:25` isSecretKeyName 正则将 access_token 归一化为 accesstoken。证据：`evidence/D4-24/stdout.log`

**EXP-E01 (P1)**：期望 serviceCatalog 路由命中 ECS，实际 MISS（路由至 'Run hcloud --help'）。根因：`eval/harness/run-eval.mjs` serviceCatalog 中文意图路由未命中 ECS。证据：`evidence/EXP-E01/stdout.log`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `EXP-E08` | D10评测 | 诊断类意图(explain_error)路由 | NOT_RUN - 诊断类意图(explain_error)不在 serviceCatalog 路由范围(harness 标记 N/A); explain_error 工具路由需真实 LLM harness |

> **分类**：【补环境】EXP-E08 需真实 LLM Agent 会话评测（run-agent-eval.mjs），非 DSH 客户端无 dsh，需 CDP 会话自动化环境。解除条件：部署 CDP 自动化或安装 dsh。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无（所有真云调用使用 credentials.json，未输出明文 AK/SK）
- [x] 写操作误判 read-only：无（D4-9 DeleteServers 正确判 deny）
- [x] 红线（I 类）违规：0（无凭证泄漏、无 mock 假跑、真云已执行）
- [x] 脱敏复核：通过（tools/call 结果经 redactString 脱敏，不含 AK/SK 明文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 0 | 0 | N/A（仅只读 NovaListServers） |
| VPC | 0 | 0 | N/A |
| 安全组 | 0 | 0 | N/A |

> 本次仅只读 API 调用 NovaListServers（主账号+只读子账号），未创建任何云资源，无需销毁归零。

---

## 八、遗留与建议

- 8 项 FAIL 缺陷与 2026-10-08 一致（已知缺陷，待源码仓库修复）
- EXP-E08 NOT_RUN：诊断类意图路由需真实 LLM harness，非 DSH 客户端暂无法执行
- 建议修复 safety-policy.mjs 正则覆盖大小写 AK/SK + 通用凭证变量名 + STS token 拦截
