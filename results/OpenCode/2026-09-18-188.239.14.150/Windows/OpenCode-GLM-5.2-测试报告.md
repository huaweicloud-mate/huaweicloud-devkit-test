# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-18 05:15:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-18-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 2 个 P0 FAIL 缺陷 + 11 个已知基线 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows` (win32 x64) |
| Node / npm / Python | `Node v22.22.2 / npm 10.9.7 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f6`，PR #696） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 11/11 PASS` |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI（doctor/status）/ MCP 协议 / 真云 E2E / eval harness |
| daily 基础用例 | 设计级 80 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；MCP 工具级测试通过 `callTool` 直调 + 真实 MCP 工具调用；eval harness 跑 `run-eval.mjs`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `119`（设计级 80 + 展开级 39） |
| 已执行 | `119` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `105 / 14 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL，不含 BLOCKED/NOT_RUN） | `88.2%` |
| P0 / P1 / P2 新增缺陷 | `2 / 0 / 0`（EXP-E MISS 为已知基线，不计新增缺陷） |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（本轮未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `77` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | D2-4, D4-16, D4-27，根因见缺陷清单 |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`80`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E05,E07,E10~E14（serviceCatalog 路由 MISS，已知基线） |
| BLOCKED | `0` | 无 |
| SPEC-MISMATCH | `0` | 无 |
| NOT_RUN | `0` | 无 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | sh -c 命令包裹穿透：`sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 绕过 env dump 拦截 | `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'` | 返回 `allow` | `safety-policy.mjs:397-426` | P | 待提单 |
| 2 | P0 | `D2-4, D4-27` | redactSecrets 不脱敏 JSON 字符串中的小写 sk 字段 | `!redactSecrets('{"sk":"SK1234567890abcdef"}').includes('SK1234567890abcdef')` | 原值未被脱敏 | `safety-policy.mjs:45` | P | 待提单 |
| 3 | 非产品缺陷 | `EXP-E01~E05,E07,E10~E14` | serviceCatalog 中文意图路由未命中（已知基线 21.4%） | 路由命中正确服务 | 11 条 MISS | `run-eval.mjs` 路由层 | — | 已知基线 |

### 根因详情

**#1 [P0] D4-16 命令包裹穿透**

- 期望：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'`
- 实际：返回 `allow`，MCP `huaweicloud_hook_check_command` 同样返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:397-426`
  `classifyTextCommand()` 的 env-dump 正则 `/(^|\s)(env|printenv|...)/i` 要求 `printenv` 前面是空白或字符串起始，但在 `sh -c "printenv ..."` 中 `printenv` 前面是双引号 `"`，正则不匹配。`stripExecutable`（line 67-101）能解包 `sh -c` 但只用于 `classifyHcloudArgs`，未用于 `classifyTextCommand`。
- 证据：`evidence/d4-security/stdout.log` + `evidence/mcp-tools/stdout.log`

**#2 [P0] D2-4/D4-27 redactSecrets JSON 脱敏缺陷**

- 期望：`redactSecrets('{"sk":"SK1234567890abcdef"}')` 不含原值
- 实际：原值未被脱敏
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:45`
  `redactString` 中正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 缺少 `i` 标志（大小写敏感），JSON 小写键 `"sk":` 不匹配大写 `SK`。对比 line 42 的正则有 `gi` 标志。
- 证据：`evidence/d2-auth/stdout.log`

---

## 五、未执行用例与原因

无。本轮全部 119 条用例已执行（0 NOT_RUN / 0 BLOCKED）。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 DeleteServers/CreateServers 正确判定 deny/write）
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（MCP show_profile_redacted 返回 `<redacted>`）
- [ ] D4-16 缺陷：`sh -c` 包裹可绕过 env dump 拦截（已记录为 P0 缺陷待修复）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云 ECS/OBS/VPC 等 | 否 | N/A | 本轮未创建真云资源（只读操作为主） |
| 沙箱 | 否 | N/A | 未使用沙箱 |
| skip 文件 | 是（测试用） | 是（测试目录内） | 无残留 |

---

## 八、遗留与建议

- 待修复缺陷：D4-16（sh -c 包裹穿透）+ D2-4/D4-27（redactSecrets JSON 脱敏）→ 已合并 1 张缺陷单待提
- 已知基线：EXP-E01~E15 路由准确率 21.4%（3 HIT / 14 总），serviceCatalog 路由层对中文意图支持有限，非新缺陷
- 建议：`classifyTextCommand` 应复用 `stripExecutable` 解包逻辑；`redactString` 的 AK/SK 正则应加 `i` 标志
