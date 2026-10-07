# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-08 05:12:28（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-08-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷，2 个 SPEC-MISMATCH + 1 个已知 FAIL 待提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 Standard (x86_64)` |
| Node / npm / Python | `Node v22.22.2 / npm 10 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `39`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已安装 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置，本轮未使用真云写操作）` |
| 测试类型 | 源码级探针 / MCP 协议 / 评测集路由层 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `138 / 1 / 0 / 2 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC = 141） | `97.9%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 1` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `不涉及（本轮无真云写操作）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `2` | 契约漂移（D4-3, D8-9） |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 路由未命中（EXP-E01） |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | D4安全 | 风险规则 regex 大小写敏感不匹配 CLI 格式 | `cloud-risk-rules.json: hwc-command-secret-value-read` | 待提单 |
| 2 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由未命中"云主机"意图 | `mcp-server.mjs: serviceCatalog 路由层` | 待提单 |
| 3 | P2 | `D8-9` | D8质量 | sanitizeValue 未脱敏 AK/SK/token | `telemetry/telemetry.mjs: sanitizeValue()` | 待提单 |

### 根因详情

**#1 [P0] D4-3 风险规则 regex 大小写敏感不匹配 CLI 格式**

- 期望：`hcloud csms show-secret --secret-name mysecret` → `deny`
- 实际：返回 `allow`，规则未命中
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 中 `hwc-command-secret-value-read` 规则的 match.regex 为 `(ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue)`，大小写敏感，不匹配实际 CLI 命令格式 `show-secret`（小写连字符）
- 验证：`hcloud csms ShowSecret` (camelCase) → `deny` ✓；`hcloud csms show-secret` (CLI格式) → `allow` ✗
- 证据：`evidence/D4-3/stdout.log`

**#2 [P1] EXP-E01 serviceCatalog 路由未命中"云主机"意图**

- 期望：中文意图"帮我查一下我账号在华北北京四有哪些云主机" → 路由到 `ECS`
- 实际：返回 `"Run hcloud --help to list available services."`，未命中 ECS
- 根因：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层未将"云主机"映射到 ECS 服务
- 说明：此为已知基线问题（21.4% MISS），连续多日一致复现
- 证据：`evidence/EXP-E01/stdout.log`

**#3 [P2] D8-9 sanitizeValue 未脱敏 AK/SK/token**

- 期望：`sanitizeValue('AKTEST123456')` → 移除/脱敏 AK/SK 值（用例 spec："移除 AK/SK/token 等敏感值与非法字符"）
- 实际：`sanitizeValue('AKTEST123456')` → `'AKTEST123456'`（原样返回，仅移除控制字符和截断长度）
- 根因：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue()` 函数（约 line 189）仅做 `replace(/[\r\n\t]+/g, ' ')` 和 `slice(0, MAX_VALUE_LENGTH)`，无 AK/SK/token 模式检测与脱敏
- 证据：`evidence/D8-9/stdout.log`

---

## 五、未执行用例与原因

无未执行用例。全部 141 条用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 验证写操作不被误判为只读）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D2-4 凭证脱敏验证 PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 不涉及 | 否 | 不涉及 | 不涉及 |

> 本轮测试为源码级探针 + MCP 协议测试，未执行真云写操作（建/删资源），无资源残留。

---

## 八、遗留与建议

- 待裁决 SPEC：`D4-3`（风险规则大小写敏感）、`D8-9`（sanitizeValue 脱敏范围）
- 已知 FAIL：`EXP-E01`（serviceCatalog 路由 MISS，基线 21.4%）
- 建议：
  1. D4-3：`cloud-risk-rules.json` 的 `hwc-command-secret-value-read` regex 应加 `i` flag 或同时匹配 `show-secret`/`ShowSecret`
  2. EXP-E01：serviceCatalog 路由层应增加"云主机"→ECS 的中文同义词映射
  3. D8-9：`sanitizeValue()` 应增加 AK/SK/token 模式检测与脱敏逻辑
