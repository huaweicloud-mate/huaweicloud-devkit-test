# OfficeAce-glm-5.2 每日测试报告
> **报告名**：`OfficeAce-glm-5.2-测试报告.md`
> **生成时间**：2026-10-13 10:06:56（北京时间）
> **执行归档**：`results/OfficeAce/2026-10-13-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OfficeAce` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.8-next.2` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级探针直调（fixture .mjs）+ MCP 真机调用 + hcloud CLI 真云只读 + 环境变量隔离测试。复用 2026-10-12 证据目录 + 分组探针重跑（d4-security/d2-auth/d1-upgrade/mcp-tools/c4-service-matrix）生成新鲜 stdout.log。5 个新增 E2E 用例（D3-C1~C7）因需半自动真云交互标 BLOCKED。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `120 / 15 / 11 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 135） | `88.9%` |
| P0 / P1 / P2 新增缺陷 | `1 / 12 / 2` |
| 红线（I 类）违规 | `0`（无凭证泄漏/无 mock 假跑/无虚报 PASS） |
| 资源释放 | `无真云资源创建`（仅只读查询，无写操作） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `92` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `11` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`107`** | |

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
| 1 | P0 | `D2-4` | D2认证 | 凭证脱敏正确性 | safety-policy.mjs redactSecrets 对 JSON 对象中 AK/SK 字段未完全脱敏 | 待提单 |
| 2 | P2 | `D3-C14` | D3功能 | 沙箱 HDKit 服务参数与 hwlink 凭证 | credentials.mjs clearRuntimeCredentials 后 resolveCredentials 回退到文件凭证未抛 HDKIT_CRED_MISSING | 待提单 |
| 3 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | safety-policy.mjs redactSecrets 双路径（stdout+stderr）输出中 AK/SK/token 未脱敏 | 待提单 |
| 4 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | telemetry.mjs sanitizeValue 对 AK 格式字符串未脱敏 | 待提单 |
| 5 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 6 | P1 | `EXP-E02` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 7 | P1 | `EXP-E03` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 8 | P1 | `EXP-E04` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 9 | P1 | `EXP-E05` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 10 | P1 | `EXP-E07` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 11 | P1 | `EXP-E10` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 12 | P1 | `EXP-E11` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 13 | P1 | `EXP-E12` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 14 | P1 | `EXP-E13` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |
| 15 | P1 | `EXP-E14` | D10评测 | serviceCatalog 路由 MISS | tools.mjs serviceCatalog routeMap 对中文意图匹配规则覆盖不足 | 待提单 |

### 根因详情

**D2-4 (P0) 凭证脱敏正确性**
- 期望：redactSecrets 对 JSON 对象中 AK/SK 字段替换为 `<redacted>`
- 实际：`{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}` 未完全脱敏
- 根因：safety-policy.mjs redactSecrets 函数对嵌套 JSON 对象字段覆盖不全
- 证据：evidence/D2-4/stdout.log

**D3-C14 (P2) 沙箱 HDKit 服务参数与 hwlink 凭证**
- 期望：clearRuntimeCredentials 后 resolveCredentials 抛 HDKIT_CRED_MISSING
- 实际：返回文件凭证（凭证泄漏风险）
- 根因：credentials.mjs resolveCredentialsWithRuntime 在 runtime 清空后回退到文件凭证而非抛错
- 证据：evidence/D3-C14/stdout.log

**D4-27 (P1) 双路径输出脱敏**
- 期望：stdout+stderr 双路径输出中 AK/SK/token 均被 `<redacted>` 替换
- 实际：`{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1..."}` 未脱敏
- 根因：safety-policy.mjs redactSecrets 仅覆盖单路径，双路径输出未处理
- 证据：evidence/D4-27/stdout.log

**D8-9 (P2) 安装 ID 与遥测值脱敏**
- 期望：sanitizeValue 对 AK 格式字符串脱敏
- 实际：sanitize=false，AK 格式字符串原样返回
- 根因：telemetry.mjs sanitizeValue 函数未匹配 AKID 前缀模式
- 证据：evidence/D8-9/stdout.log

**EXP-E01~E14 (P1×11) serviceCatalog 路由 MISS**
- 期望：serviceCatalog 对评测集 15 条中文意图路由命中对应华为云服务
- 实际：11 条 MISS（73.3% MISS）
- 根因：tools.mjs serviceCatalog routeMap 对部分中文意图匹配规则覆盖不足
- 证据：evidence/EXP-E01~E14/stdout.log

> **与 2026-10-12 对比**：D4-16（命令包裹穿透）已修复 FAIL→PASS，D9-12（_decorateResult jsonrpc）已修复 FAIL→PASS。D2-4/D4-27/D3-C14/D8-9/EXP-E 缺陷持续存在。

---

## 五、未执行用例与原因


### BLOCKED

| 用例ID | 维度 | 标题 | 阻塞原因 |
|---|---|---|---|
| `D1-67` | D1安装 | Agent toolkit 模式与 DSH 跳过安装环境变量 | DSH skip install env var requires DSH client environment. OfficeAce is not DSH. [调归属] D1-67 agent=Hermes代表终端, OfficeAce非DSH客户端. |
| `D3-C1` | D3功能 | ECS生命周期E2E | Semi-auto E2E: ECS lifecycle requires real cloud ECS creation+deletion. [补环境] Need test ECS quota. |
| `D3-C2` | D3功能 | OBS静态站部署E2E | Semi-auto E2E: OBS static site deployment requires real cloud OBS operations. [补环境] Need OBS quota. |
| `D3-C3` | D3功能 | 沙箱部署E2E | Semi-auto E2E: Sandbox deployment requires sandbox DevStation quota. [补环境] Need sandbox quota. |
| `D3-C6` | D3功能 | 沙箱 7 隐式工具具名冒烟（check_user/credentials/sign_agreement/exec_one_shot/upload_file/close_session/deploy_check） | Semi-auto: Sandbox 7 tool smoke test requires sandbox quota+signed agreement. [补环境] Need sandbox. |
| `D3-C7` | D3功能 | 跨区域资源操作引导（区域维度） | Semi-auto E2E: Cross-region resource operation requires real cloud EIP creation. [补环境] Need EIP quota. |
| `D3-S2` | D3功能 | 场景-删VPC先确认 | Semi-auto: requires real cloud VPC creation+deletion with manual confirmation flow. plan_cli_command + hook_check_command + run_approved_command chain needs interactive approval. [补环境] Need test VPC + interactive confirmation. |
| `D3-S3` | D3功能 | 场景-沙箱预览出URL | Semi-auto: requires sandbox DevStation quota + frontend project upload. sandbox_connect→upload_project→deploy_nginx→deploy_check chain. [补环境] Need sandbox quota. |
| `D3-S6` | D3功能 | 场景-FunctionGraph定时任务 | Semi-auto: requires real cloud FunctionGraph quota for function creation + timer trigger. [补环境] Need FG quota. |
| `D3-S7` | D3功能 | 场景-跨服务交付(Web应用+RDS)并归零 | Semi-auto: requires real cloud RDS + sandbox quota for cross-service delivery. Multi-service orchestration (RDS→sandbox→connect string→verify→cleanup). [补环境] Need RDS quota + sandbox quota. |
| `D4-25` | D4安全 | Python hook 事件遥测分类 | Requires hook-capable client (Hermes Hook). OfficeAce hookSupport=非Hook. hook-events.jsonl not generated without hook client. [调归属] D4-25 hookSupport=Hermes=Hook;OpenCode=非Hook, OfficeAce非Hook客户端. |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（本次测试未触发凭证泄漏，D2-4/D4-27 为脱敏不全而非泄漏事件）
- [x] 写操作误判 read-only：`0`（D4-16 命令包裹穿透已修复，不再误判）
- [x] 红线（I 类）违规：`0`（无 mock 假跑、无虚报 PASS、真云只读未建删资源）
- [x] 脱敏复核：`3 项 FAIL`（D2-4 JSON 对象脱敏不全、D4-27 双路径脱敏缺失、D8-9 sanitizeValue 未覆盖 AK 格式）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS（只读查询） | 无 | 无 | N/A（仅 ListServersDetails 只读） |
| BSS（代金券查询） | 无 | 无 | N/A（仅 ListIncentiveResources 只读） |
| OBS/RDS/VPC/FG | 无 | 无 | N/A（相关用例标 BLOCKED，未执行真云写操作） |

> 本次测试仅执行只读真云查询，未创建任何真云资源，无需归零。BLOCKED 用例需真云写操作但未执行。

---

## 八、遗留与建议

- **P0 缺陷优先修复**：D2-4（凭证脱敏不全）为安全基线问题，建议优先修复。
- **已修复缺陷（vs 2026-10-12）**：D4-16（命令包裹穿透）已修复 PASS，D9-12（_decorateResult 缺 jsonrpc）已修复 PASS。
- **EXP-E 评测集路由 MISS**：11/15 条中文意图 serviceCatalog 路由未命中，建议扩充 routeMap 中文意图匹配规则。
- **BLOCKED 用例**：11 条因环境/归属阻塞（D1-67 需 DSH、D3-C1~C7/S2/S3/S6/S7 需真云配额/沙箱、D4-25 需 hook 客户端），建议按归属调整或补充环境。
- **D3-C14 凭证回退风险**：clearRuntimeCredentials 后 resolveCredentials 回退到文件凭证而非抛错，存在凭证泄漏风险，建议修复为严格模式。
- **D8-9 sanitizeValue 覆盖**：sanitizeValue 未覆盖 AKID 前缀格式，建议扩充脱敏正则模式。
