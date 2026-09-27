# OpenCode-glm-5.2 每日测试报告
> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-28 05:08:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-28-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 2 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `1.1.7` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：源码级探针直调（comprehensive-probe.mjs 直接 import 源码模块测试函数）+ eval harness（run-eval.mjs 跑 serviceCatalog 路由）+ service-matrix-probe（22 服务只读规划冒烟）+ fixup probes（针对 FAIL 用例的精准重测）。OpenCode 为非 Hook 客户端，安全用例走 classifyTextCommand（safety-policy.mjs）路径而非 OS 级拦截。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `126 / 15 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 141） | `89.4%` |
| P0 / P1 / P2 新增缺陷 | `2 / 13 / 0` |
| 红线（I 类）违规 | `0`（无凭证泄漏、无虚报 PASS） |
| 资源释放 | `无需释放`（源码级探针，无真云资源创建） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `100` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `26` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | D4安全 | 凭证env打印拦截 — Windows %VAR% 语法未覆盖 | `safety-policy.mjs:419` | 待提单 |
| 2 | P0 | `D4-16` | D4安全 | 命令包裹穿透 — sh -c/eval 包裹 env 打印未检测 | `safety-policy.mjs:170-181` | 待提单 |
| 3 | P1 | `EXP-E01~E14` | D10评测 | serviceCatalog 中文意图路由准确率低（21.4% HIT） | `tools.mjs:1947` routeMap 未覆盖 | 已知基线 |
| 4 | 测试侧 | `EXP-C4-03` | D3-C4 | OBS 服务矩阵 — hcloud OBS 不可用（OBS 用 obsutil） | 测试侧用例设计问题 | 不予提单 |

### 根因详情

**D4-2（P0）**：
- 期望：`classifyTextCommand("type %HUAWEICLOUD_SECRET_ACCESS_KEY%")` 返回 `decision=deny`
- 实际：返回 `decision=allow`，原因 "No Huawei Cloud safety rule matched."
- 根因：`safety-policy.mjs:419` — 凭证 env 打印正则仅匹配 `printenv` + Unix 风格 + HW/HUAWEICLOUD 前缀，未覆盖 Windows `type %VAR%` 语法
- 证据：`evidence/D4-2/stdout.log`

**D4-16（P0）**：
- 期望：`classifyTextCommand("sh -c \"printenv HW_ACCESS_KEY\"")` 返回 `decision=deny`
- 实际：返回 `decision=allow`，原因 "No Huawei Cloud safety rule matched."
- 根因：`safety-policy.mjs:170-181` — shell wrapper 解包逻辑仅对 hcloud 命令生效（`unwrappedIsHcloud` 检查），不对 `printenv`/`echo` 等非 hcloud 命令做二次解包
- 证据：`evidence/D4-16/stdout.log`

**EXP-E01~E14（P1，合并 1 组）**：
- 期望：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 ECS 路由
- 实际：返回 "Run hcloud --help to list available services."（未命中 fallback）
- 根因：`tools.mjs:1947` — routeMap 未覆盖 11/15 条中文自然语言意图
- 证据：`evidence/EXP-E01~E14/stdout.log` + `eval/results/eval-run-20260927210420.csv`
- 状态：已知基线（21.4% HIT），pre-existing 问题，每日追踪

**EXP-C4-03（测试侧）**：
- `hcloud OBS --help` 失败，OBS 使用 obsutil 而非 hcloud CLI
- 测试侧用例设计问题，非产品缺陷，不予提单

---

## 五、未执行用例与原因

无未执行用例。全部 141 条用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`无`（所有探针使用源码级直调，凭证文件不被读取/打印；输出经 redactSecrets 脱敏）
- [x] 写操作误判 read-only：`无`（D4-5 写操作误判检测 PASS — DeleteServers 正确判 deny）
- [x] 红线（I 类）违规：`0`（无虚报 PASS、无 mock 假跑、无跳过真云用例）
- [x] 脱敏复核：`通过`（D2-4 凭证脱敏 PASS、D4-27 双路径脱敏 PASS、D4-26 findings 证据脱敏 PASS）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 无 | 无 | 不适用（源码级探针，未创建真云资源） |

> 本轮测试全部使用源码级探针直调（import 源码模块 + classifyTextCommand/evaluateCommandRisk/judgeUpdate 等函数直调），未创建真云 ECS/VPC/RDS 等资源，无需释放。

---

## 八、遗留与建议

1. **D4-2/D4-16（P0 安全缺陷）**：建议扩展 `safety-policy.mjs:419` 的正则以覆盖 Windows `type %VAR%` 语法和 `echo $VAR` 形式；扩展 `safety-policy.mjs:170-181` 的 shell wrapper 解包逻辑以覆盖非 hcloud 命令（printenv/echo）。
2. **EXP-E 路由准确率（P1 已知基线）**：21.4% HIT 为 pre-existing 基线，建议持续扩充 routeMap 中文意图覆盖。每日测试追踪变化。
3. **EXP-C4-03（测试侧）**：建议修改 service-matrix-probe.mjs 的 OBS 用例，使用 obsutil 或 plan_cli_command 测试 OBS 路由，而非 `hcloud OBS --help`。
