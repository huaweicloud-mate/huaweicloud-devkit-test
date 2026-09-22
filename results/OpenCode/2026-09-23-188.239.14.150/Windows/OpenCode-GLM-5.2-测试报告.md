# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-23 05:10:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-23-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 1 个 P0 FAIL + 11 个 P1 FAIL，P0 缺口已记录）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows NT x64` |
| Node / npm / Python | `Node v22.22.2 / npm / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.7-next.0`（npm @next，gitHead `0790e92a`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / check_cli 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK / 已配置）` |
| 测试类型 | 源码级探针 / MCP 工具实测 / eval harness / 真云只读 |
| 设计真源 | 设计级 100 / 展开级 39 / 追踪表 211 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；MCP 工具实测（check_cli/auth_status/hook_check_command/plan_cli_command/explain_error等）；eval harness（run-eval.mjs）；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `139`（设计级 100 + 展开级 39） |
| 已执行 | `139` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 12 / 1 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 138） | `91.3%` |
| P0 / P1 / P2 新增缺陷 | `1 / 11 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（无真云写操作）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | D4-2 凭证env打印拦截不完整 |
| BLOCKED | `1` | D4-24 确认令牌过期测试需真云写操作 |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E05,E07,E10~E14 serviceCatalog路由MISS |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果 | 实际结果 | 根因 | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | 凭证env打印拦截不完整 | `printenv HW_SECRET_ACCESS_KEY` → `deny` | 返回 `allow` | `risk-rule-engine.mjs` 规则仅匹配文件路径 | P | 待提单 |
| 2 | P1 | `EXP-E01~E14` | serviceCatalog中文意图路由大面积MISS | 15条中文意图路由到正确服务 | 11条MISS，准确率21.4% | `tools.mjs` serviceCatalog routeMap中文匹配不全 | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证 env 打印拦截不完整**

- 期望：`printenv HW_SECRET_ACCESS_KEY` → `decision=deny`
- 实际：返回 `decision=allow`
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 风险规则 `hwc-command-credential-file` 仅匹配凭证文件路径模式，未覆盖环境变量名（`HW_SECRET_ACCESS_KEY`）和凭证值模式（`AK=xxx SK=xxx`）的 echo/printenv 命令
- 证据：`evidence/D4-2/stdout.log`，复现命令实测 `allow`

**#2 [P1] EXP-E01~E14 serviceCatalog 中文意图路由大面积 MISS**

- 期望：15条中文意图评测集路由到正确服务（如「帮我查云主机」→ECS）
- 实际：11条路由到 "Run hcloud --help to list available services" fallback，准确率仅 21.4%
- 根因：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog()` routeMap 中文意图匹配覆盖不全
- 证据：`evidence/eval-run-result.csv`，`evidence/EXP-E01~E15/stdout.log`

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D4-24` | 设计级 | P1 | BLOCKED | 补环境 | 确认令牌过期/重复确认边界测试需真实云写操作（创建ECS）+ 可注入时钟，测试环境无法安全执行 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（DeleteServers 正确判定为 write/deny）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 全部 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（只读查询） | N/A | N/A |
| VPC | 否（plan only） | N/A | N/A |
| 沙箱 | 否（工具注册验证） | N/A | N/A |

> 本轮无真云写操作（建删资源），全部为只读查询/源码级探针/MCP工具实测，无资源残留。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：真云 E2E 写操作（D4-24 确认令牌边界）、多终端矩阵（仅 OpenCode 单客户端）
- 建议：
  1. `risk-rule-engine.mjs` 应增加环境变量名匹配规则（`HW_ACCESS_KEY`/`HW_SECRET_ACCESS_KEY`/`HUAWEICLOUD_*` 前缀）和凭证值 echo 拦截
  2. `serviceCatalog` routeMap 应扩充中文意图关键词覆盖，当前 21.4% 准确率远低于 90% 目标
