# Codex-GPT-5 每日测试报告
> **报告名**：`Codex-GPT-5-测试报告.md`
> **生成时间**：2026-09-29 05:11:39（北京时间）
> **执行归档**：`results/Codex/2026-09-29-192.168.0.102/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 3 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `Codex` + `GPT-5` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.7 (git 557dcdc6)` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：Windows Node 22 源码级探针、MCP stdio 分组探针、serviceCatalog 路由 harness；未执行破坏性真云创建。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `139` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `124 / 15 / 0 / 0 / 2` |
| 通过率（分母 = PASS+FAIL = 139） | `89.2%` |
| P0 / P1 / P2 新增缺陷 | `3 / 12 / 0` |
| 红线（I 类）违规 | `无` |
| 资源释放 | `本轮未创建真云资源` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `98` | 有证据且通过 PASS 门禁 |
| FAIL | `4` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `26` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `2` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | D4安全 | 命令包裹穿透 | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 2 | P1 | `D4-27` | D4安全 | 双路径输出脱敏 | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手协议安全基线 | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 4 | P0 | `D10-4` | D10评测 | 安全干预-静态规则层 | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 5 | P1 | `EXP-E01` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 6 | P1 | `EXP-E02` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 7 | P1 | `EXP-E03` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 8 | P1 | `EXP-E04` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 9 | P1 | `EXP-E05` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 10 | P1 | `EXP-E07` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 11 | P1 | `EXP-E10` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 12 | P1 | `EXP-E11` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 13 | P1 | `EXP-E12` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 14 | P1 | `EXP-E13` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |
| 15 | P1 | `EXP-E14` |  |  | 见 `FINDINGS.md` 与对应 evidence/stdout.log | 待提单 |

### 根因详情

> FAIL/SPEC 根因、断言和证据详见同目录 `FINDINGS.md`；本轮失败均为已知历史关联，未重复提单。

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `EXP-D5-2-1` |  |  | Codex Windows 宿主级夹具未提供；仅完成源码/协议层验证，保留 NOT_RUN。 |
| `EXP-D5-2-3` |  |  | Codex Windows 宿主级夹具未提供；仅完成源码/协议层验证，保留 NOT_RUN。 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：未发现真实凭证落盘或输出
- [x] 写操作误判 read-only：未发现本轮新增误判
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：D4-27 失败已记录，证据已脱敏

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 0 | 0 | 不适用，未创建 |

> 本轮未执行资源创建类真云用例，因此无资源需要释放。

---

## 八、遗留与建议

- 复核 D4-16、D4-27、D9-12、D10-4 与 serviceCatalog 路由历史缺陷；EXP-D5-2-1/3 待 Codex 宿主夹具可用后执行。
