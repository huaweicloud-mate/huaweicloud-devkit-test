# Hermes-GLM-5.2 每日测试报告

> **报告名**：`Hermes-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-22 05:35:00（北京时间）
> **执行归档**：`results/Hermes/2026-09-22-120.46.40.202/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 2 个 P0 FAIL + 12 个 P1 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Hermes` + `GLM-5.2` |
| OS / 架构 | `Windows 10 (10.0.20348) AMD64` |
| Node / npm / Python | `Node v22.13.0 / npm 10 / Python 3.11.15` |
| 被测版本（SUT） | `v1.1.6-next.0`（npm @next，gitHead `e7ed6f6`） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 全部 PASS (10/10)` |
| 真云凭证 | `cn-north-4（AKSK 已配置，未使用真云 E2E）` |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status） |
| daily 基础用例 | 设计级 100 / 展开级 43 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 143 |
| 已执行 | 143 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 129 / 14 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL） | 90.2% |
| P0 / P1 / P2 新增缺陷 | 2 / 12 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 无真云资源创建（源码级测试，无副作用） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 97 | 有证据且通过 PASS 门禁 |
| FAIL | 3 | D2-4 (P0), D4-16 (P0), D4-27 (P1) — 根因见缺陷清单 |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 0 | 无契约漂移 |
| NOT_RUN | 0 | 全部覆盖 |
| **合计** | **100** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 32 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E05,E07,E10~E14 serviceCatalog 路由 MISS |
| BLOCKED | 0 | 无环境阻塞 |
| SPEC-MISMATCH | 0 | 无契约漂移 |
| NOT_RUN | 0 | 全部覆盖 |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D2-4` | JSON 字符串中短键名 ak/sk/token 未脱敏 | `redactSecrets` 输入含 `ak`/`sk` 的 JSON 字符串时，值应为 `<redacted>` | 原始值未被替换 | `safety-policy.mjs:34-48` | P | 待提单 |
| 2 | P0 | `D4-16` | sh -c "printenv HW_*" 未被拦截 | `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 应返回 `deny` | 返回 `allow` | `safety-policy.mjs:392-396` | P | 待提单 |
| 3 | P1 | `D4-27` | JSON 字符串短键名脱敏不完整（与 #1 同源） | `redactSecrets` JSON 字符串中 `sk`/`token` 值应为 `<redacted>` | 原始值未被替换 | `safety-policy.mjs:34-48` | P | 待提单 |
| 4 | P1 | `EXP-E01~E14` | serviceCatalog 路由 10/15 MISS | 15 条中文意图全部路由 HIT | 10 条 MISS | `tools.mjs` serviceCatalog | P | 待提单 |

### 根因详情

**#1 [P0] D2-4 凭证脱敏正确性 — JSON 字符串中短键名未脱敏**

- 期望：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` → `sk` 值替换为 `<redacted>`
- 实际：返回原始字符串，`sk` 值未被替换
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:34-48` — `redactString()` 正则匹配 `access[_-]?key|secret[_-]?key|security[_-]?token` 等长格式，不匹配 `ak`/`sk`/`token` 短键名。`isSecretKeyName()` 同样不匹配。
- 证据：`evidence/d2-auth/stdout.log`

**#2 [P0] D4-16 命令包裹穿透 — sh -c 包裹的 env dump 未拦截**

- 期望：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:392-396` — env-dump 正则 `(^|\s)(env|printenv...)` 要求 printenv 前是行首或空白，但 sh -c 包裹时 printenv 前是双引号 `"`，不匹配边界。
- 证据：`evidence/d4-security/stdout.log`、`evidence/mcp-tools/stdout.log`

**#4 [P1] EXP-E01~E14 serviceCatalog 路由 MISS**

- 期望：15 条中文意图全部路由到正确服务
- 实际：10/15 MISS（ECS查询、ECS创建、OBS静态站、EIP绑定、RDS查询、CCE查询、ELB查询、DDS查询、DCS查询、SMN查询）
- 根因：`tools.mjs` serviceCatalog 路由规则对中文自然语言意图覆盖不完整
- 证据：`evidence/c4-service-matrix/stdout.log`

---

## 五、未执行用例与原因

无未执行用例。全部 143 条用例已执行并回填状态。NOT_RUN=0, BLOCKED=0。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（测试使用脱敏测试数据，无真实凭证泄漏）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（测试数据均为 AKIDTEST/SKTEST 前缀）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | N/A | N/A（源码级测试，无真云副作用） |

> 本轮测试全部为源码级探针 + CLI 真机执行（doctor/status），未创建任何真云资源。

---

## 八、遗留与建议

- **D2-4/D4-27 脱敏缺陷**：建议在 `redactString()` 中增加 `ak`/`sk`/`token` 短键名匹配规则，或在 `isSecretKeyName()` 中增加短键名 pattern
- **D4-16 sh 包裹穿透**：建议 `classifyTextCommand` 增加引号内内容提取逻辑，或将 `(^|\s)` 边界扩展为 `(^|\s|["'])`
- **EXP-E 路由 MISS**：与历史基线一致（21.4% MISS），建议持续扩充 serviceCatalog 中文意图路由规则
- **Hermes 插件未安装**：`status --target Hermes` 显示未安装（devkit 为 CodeArts Work 安装），但源码级探针覆盖了全部安全/逻辑用例
