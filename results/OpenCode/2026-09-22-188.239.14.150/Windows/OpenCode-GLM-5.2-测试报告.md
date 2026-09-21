# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-22 21:30:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-22-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 4 个 P0 FAIL + 11 个 P1 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows Server 2022 (10.0.20348)` |
| Node / npm / Python | `Node v22.22.2 / npm / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.6-next.0`（npm @next，gitHead `faaefb8f`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / check_cli 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK / 已配置）` |
| 测试类型 | 源码级探针 / MCP 协议 / 真云只读 / eval harness |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP 工具直接调用 + eval harness（run-eval.mjs），决策/结果落 `evidence/<case-id>/stdout.log`；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `139`（设计级 100 + 展开级 39） |
| 已执行 | `139` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `123 / 15 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | `89.1%`（123/138） |
| P0 / P1 / P2 新增缺陷 | `4 / 11 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真实云资源创建）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `95` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | D1-39/D4-2/D4-3/D4-28，根因见缺陷清单 |
| BLOCKED | `1` | D4-24 确认令牌边界测试需真实云写操作 |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E05/E07/E10~E14 serviceCatalog 路由 MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D1-39` | Windows 升级检测链 EINVAL | queryDistTagsSync 返回非空 | 返回 null，result=check_failed | `update-check.mjs:queryDistTagsSync` | P | 待提单 |
| 2 | P0 | `D4-2` | 凭证 env 打印拦截缺失 | printenv HW_ACCESS_KEY → deny | 返回 allow | `risk-rule-engine.mjs:loadRiskRules` | P | 待提单 |
| 3 | P0 | `D4-3` | 明文 secret API 拦截缺失 | KeystoneListUserCredentials → deny/warn | 返回 allow | `risk-rule-engine.mjs:loadRiskRules` | P | 待提单 |
| 4 | P0 | `D4-28` | Node 安全 hook 凭证检测缺失 | echo HW_SECRET_KEY → deny | 返回 allow | `risk-rule-engine.mjs:loadRiskRules` | P | 待提单 |
| 5 | P1 | `EXP-E01~E14` | serviceCatalog 路由准确率低 | ≥90% HIT | 21.4% HIT (3/14) | `tools.mjs:serviceCatalog` | P | 待提单 |

### 根因详情

**#1 [P0] D1-39 Windows 升级检测链 EINVAL 静默失败**
- 期望：Windows 下 `queryDistTagsSync()` 返回 `{latest, next}` 非空
- 实际：返回 null，`check_update` result=check_failed
- 根因：`update-check.mjs` queryDistTagsSync 在 Windows 下 child_process spawn 遇到 EINVAL，静默返回 null
- 证据：`evidence/D1-39/stdout.log`

**#2 [P0] D4-2 凭证 env 打印拦截缺失**
- 期望：`printenv HW_ACCESS_KEY` → deny
- 实际：返回 allow（0 findings）
- 根因：`risk-rule-engine.mjs` `hwc-command-credential-file` 规则仅匹配 cat/type/Get-Content + .hcloud/.huaweicloud 路径，不覆盖 printenv/echo + HW_ACCESS_KEY/HW_SECRET_KEY
- 证据：`evidence/D4-2/stdout.log`

**#3 [P0] D4-3 明文 secret API 拦截缺失**
- 期望：`hcloud IAM KeystoneListUserCredentials` → deny/warn
- 实际：返回 allow（0 findings）
- 根因：`risk-rule-engine.mjs` 无规则匹配返回明文凭证的 IAM API
- 证据：`evidence/D4-3/stdout.log`

**#4 [P0] D4-28 Node 安全 hook 凭证检测缺失**
- 期望：`echo HW_SECRET_KEY=abc123` → deny
- 实际：返回 allow（0 findings）
- 根因：同 D4-2，Node hook 链路未检测 echo/printenv 环境变量打印
- 证据：`evidence/D4-28/stdout.log`

**#5 [P1] EXP-E01~E14 serviceCatalog 路由准确率低**
- 期望：serviceCatalog 中文意图路由 ≥90% HIT
- 实际：21.4% HIT（3/14），11 条 MISS
- 根因：`tools.mjs` serviceCatalog 中文意图关键词匹配不完整
- 证据：`evidence/EXP-E01~E15/stdout.log` + `eval/results/eval-run-20260921211046.csv`

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D4-24` | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界测试需真实云写操作（创建最小规格 ECS）来测试令牌生命周期，测试环境不具备安全清理保证 | — |

> 无 NOT_RUN 用例。所有归本客户端/OS 的用例均已执行。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（所有输出已脱敏，show_profile_redacted 验证通过）
- [x] 写操作误判 read-only：`0`（plan_cli_command 正确分类写操作为 deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否 | — | 无创建 |
| VPC | 否 | — | 无创建 |
| OBS | 否 | — | 无创建 |
| 沙箱 | 否 | — | 无创建 |

> 本轮未创建任何真实云资源。所有真云测试为只读操作（ListServersDetails 等），无残留。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：D4-24 确认令牌边界（需真实云写操作环境）
- 建议：
  1. **D4-2/D4-3/D4-28 合并修复**：在 `risk-rule-engine.mjs` 新增规则匹配 printenv/echo 凭证 env 变量 + IAM 凭证 API
  2. **D1-39 Windows EINVAL**：关联 #554，需在 queryDistTagsSync 增加 Windows fallback（如 shell:true 或 fetch API）
  3. **EXP-E 路由优化**：扩充 serviceCatalog 中文意图关键词库，提升路由准确率
