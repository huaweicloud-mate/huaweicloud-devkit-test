# OpenCode-GLM-5.2 每日测试报告（1.1.6 正式版）

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-23 15:33:57（北京时间）
> **执行归档**：`results/OpenCode/2026-09-23-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit@1.1.6（npm latest，gitHead `46152dd`，PR #795）
> **结论**：`PARTIAL`（1 个 P0 FAIL + 11 个 P1 FAIL，P0 缺口已记录）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows Server 2022 (x86_64)` |
| Node / npm / Python | `Node v22.22.2 / npm 12.1.0 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.6`（npm latest，gitHead `46152dd`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `check_cli 确认已配置` |
| 真云凭证 | `已配置（~/.config/huaweicloud/credentials.json）` |
| 测试类型 | 源码级探针 / MCP 工具实测 / eval harness |
| daily 基础用例 | 设计级 100 / 展开级 39（已按 OpenCode+Windows 预筛） |

> **执行方法**：3 个批量探针脚本（batch-probe-d1-d2.mjs / batch-probe-d3-d5.mjs / batch-probe-d6-d10.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily 设计级） | `100` |
| 已执行 | `100` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `98 / 1 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL） | `98.99%` |
| P0 / P1 / P2 新增缺陷 | `1 / 11 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云资源创建）` |

> **展开级**：39 条（已按 OpenCode+Windows 预筛），28 PASS / 11 FAIL / 0 BLOCKED。

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | D4-2 凭证 env 打印拦截不完整 |
| BLOCKED | `1` | D4-24 需真云写操作（confirm token 过期测试） |
| SPEC-MISMATCH | `0` | 无契约漂移 |
| NOT_RUN | `0` | 无未覆盖 |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E05/E07/E10~E14 serviceCatalog 路由 miss |
| BLOCKED | `0` | 无环境阻塞 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | printenv HW_SECRET_ACCESS_KEY 未被拦截 | `deny` | `allow` | `risk-rule-engine.mjs` 规则仅匹配文件路径 | P | 待提单 |
| 2 | P1 | `EXP-E01~E14` | serviceCatalog 中文路由 11/15 MISS | 路由到正确服务 | 返回 "Run hcloud --help" | `tools.mjs` serviceCatalog 关键词映射缺失 | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**
- 现象：`hook_check_command` 对 `printenv HW_SECRET_ACCESS_KEY` 返回 `decision='allow'`
- 断言：`hook_check_command({command:'printenv HW_SECRET_ACCESS_KEY'}).decision === 'deny'`
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 风险规则（`hwc-command-credential-file`）仅匹配凭证文件路径模式，不匹配 env 变量名或 echo 命令中的凭证值
- 证据：`evidence/D4-2/stdout.log`
- 历史关联：#561 #677 #694（1.1.6 正式版复现确认）

**#2 [P1] EXP-E01~E14 serviceCatalog 自然语言路由命中率低**
- 现象：15 个中文自然语言服务路由任务中 11 个未路由到正确服务
- 断言：`serviceCatalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'}).recommendedServices` 应包含 `ECS`
- 实际：返回 `Run hcloud --help`（11/15 MISS）
- 根因：`plugins/huaweicloud-core/src/tools.mjs` — `serviceCatalog()` 关键词匹配表未覆盖中文自然语言查询
- 证据：`evidence/EXP-E01/stdout.log` 至 `evidence/EXP-E14/stdout.log`
- 历史关联：#689（1.1.6 正式版复现确认，命中率从 3/15 降为 4/15）

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D4-24` | 设计级 | P1 | BLOCKED | 补环境 | confirm token 过期/重复确认测试需真云写操作（创建最小规格 ECS）+ 可注入时钟 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志
- [x] PASS 门禁：所有 PASS 用例均有 evidencePath + 证据（verify_no_fake_pass.py 通过）
- [x] 覆盖率门禁：P0 无 NOT_RUN/空，NOT_RUN+空占比 0%（verify_coverage.py 通过）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | n/a | n/a |

> 本轮为源码级探针 + MCP 工具级测试，未创建真云资源。

---

## 八、遗留与建议

- **待修复缺陷**：2 类（1 P0 + 1 P1 影响 11 个展开级用例），均为历史缺陷复现
- **本轮未覆盖**：真云 E2E 用例（D4-24 confirm token 测试需真云写操作）
- **与 1.1.4 对比**：
  - D4-2 在 1.1.6 仍复现（根因从 `safety-policy.mjs` 变为 `risk-rule-engine.mjs`，拦截逻辑可能重构但缺口仍在）
  - D4-16（sh -c 包裹穿透）在 1.1.6 已修复（PASS）
  - D2-4（redactSecrets 小写 ak/sk）在 1.1.6 已修复（PASS）
  - D8-4（INSTALL.md 未包含）在 1.1.6 已修复（PASS）
  - EXP-E 路由 miss 在 1.1.6 仍复现（11/15 MISS，与 #689 一致）
- **建议**：
  1. 修复 D4-2：risk-rule-engine 增加 env 变量打印和凭证值 echo 拦截规则
  2. 修复 EXP-E：serviceCatalog 增加中文自然语言关键词到服务名的映射
