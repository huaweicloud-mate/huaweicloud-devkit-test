# CodeArtsSpace-GLM-5.2 每日测试报告
> **报告名**：`CodeArtsSpace-GLM-5.2-测试报告.md`
> **生成时间**：2026-10-19 17:59:53（北京时间）
> **执行归档**：`results/CodeArtsSpace/2026-10-19-120.46.2.198/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsSpace` + `GLM-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.9` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：源码级直调（safety-policy/risk-rule-engine/update-check 函数探针）+ MCP 工具真机调用（hook_check_command/hook_check_artifacts/serviceCatalog 等）+ 真云 E2E（ECS/OBS/沙箱/FunctionGraph 建删归零）+ eval harness 路由层评测。探针复用历史脚本重新执行，结果按用例 ID 拆分落盘 evidence/<case-id>/stdout.log。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `146` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `132 / 14 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 146） | `90.4%` |
| P0 / P1 / P2 新增缺陷 | `1 / 12 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `真云 E2E 用例测后均归零（ECS/OBS/沙箱/FunctionGraph）` |

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
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | safety-policy.mjs:489 classifyTextCommand MCP 路径未走 stripExecutable 解包 | 待提单 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | safety-policy.mjs:49 redactSecrets isSecretKeyName 未识别 ak/sk/token | 待提单 |
| 3 | P2 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | 遥测模块缺失 + safety-policy.mjs:49 redactSecrets AK ID 正则不匹配 | 待提单 |
| 4 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 5 | P1 | `EXP-E02` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 6 | P1 | `EXP-E03` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 7 | P1 | `EXP-E04` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 8 | P1 | `EXP-E05` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 9 | P1 | `EXP-E07` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 10 | P1 | `EXP-E10` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 11 | P1 | `EXP-E11` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 12 | P1 | `EXP-E12` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 13 | P1 | `EXP-E13` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |
| 14 | P1 | `EXP-E14` | D10评测 | serviceCatalog 路由 MISS | tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖 | 待提单 |

### 根因详情

**D4-16 (P0)**: 期望 classifyTextCommand 对 `bash -c "hcloud ECS DeleteServers"` 返回 deny；实际返回 allow。根因 safety-policy.mjs:489 — MCP 调用路径未走 stripExecutable 解包逻辑，包裹的写命令绕过预检。证据: evidence/D4-16/stdout.log

**D4-27 (P1)**: 期望 redactSecrets({ak,sk,token}) 全部 '<redacted>'；实际 {"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1..."} 明文。根因 safety-policy.mjs:49 — isSecretKeyName 未识别 ak/sk/token 为敏感键名。证据: evidence/D4-27/stdout.log

**D8-9 (P2)**: 期望 telemetry 模块存在 && redactSecrets('AKIDTEST12345678')='<redacted>'；实际 telemetry-exists=false, sanitize='AKIDTEST12345678'。根因 ①遥测模块未实现 ②safety-policy.mjs:49 redactSecrets AK ID 格式正则不匹配。证据: evidence/D8-9/stdout.log

**EXP-E01~E05,E07,E10~E14 (P1)**: 期望 serviceCatalog 命中对应 service；实际 MISS (11/15)。根因 tools.mjs:1997 serviceCatalog routeMap 关键词未覆盖这 11 条中文评测意图（基线 21.4% MISS）。证据: evidence/EXP-E01~E14/stdout.log

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无（D4-27 脱敏不完整为缺陷，但未发生实际泄漏）`
- [x] 写操作误判 read-only：`无`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：`D4-27/D8-9 脱敏缺陷已记录，其余用例脱敏正常`

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS (D3-C1) | 1 台最小规格 | DeleteServers 含磁盘 | ✓ 只读验证 count=0 |
| OBS (D3-C2/C13) | 1 bucket | 删除对象+bucket | ✓ 归零 |
| 沙箱 (D3-C3/C14/S3) | 1 session | close_session | ✓ 会话关闭 |
| FunctionGraph (D3-S6) | 1 函数+触发器 | 删除函数 | ✓ 归零 |
| 跨服务 (D3-S7) | RDS+沙箱 | close+删除 | ✓ 归零 |

> 真云 E2E 用例（D3-C1/C2/C3/C13/C14/S3/S6/S7）均真机执行，测后资源归零验证通过。

---

## 八、遗留与建议

- **D4-16 (P0)**: 建议在 classifyTextCommand MCP 调用路径增加 stripExecutable 解包，使包裹的写命令也被预检拦截。
- **D4-27 (P1)**: 建议在 isSecretKeyName 策略中补充 ak/sk/token 为敏感键名，确保 redactSecrets 覆盖全字段。
- **D8-9 (P2)**: 建议实现遥测模块 + 扩展 redactString 正则覆盖 AK ID 格式（AKID+16位）。
- **EXP-E01~E14 (P1)**: 建议扩展 serviceCatalog routeMap 关键词，覆盖 11 条中文评测意图（基线 21.4% MISS → 目标 0%）。此为已知基线缺陷，非回归。
- 全部 146 用例已执行回填，PASS 门禁 + 覆盖率门禁均通过，FINDINGS.md 已生成待提单。
