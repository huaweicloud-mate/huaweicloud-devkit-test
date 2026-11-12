# CodeArtsAgent-deepseek-v4-pro-0813 每日测试报告
> **报告名**：`CodeArtsAgent-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-11-13 06:09:53（北京时间）
> **执行归档**：`results/CodeArtsAgent/2026-11-13-1.94.193.150/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 缺陷，P0 1 项）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `CodeArtsAgent` + `deepseek-v4-pro-0813` |
| OS / 架构 | `Linux` |
| 被测版本（SUT） | `2.0.0-next.3` |
| daily 基础用例 | 设计级 107 / 展开级 39 |

> **执行方法**：黑盒 MCP 探针（spawn `dist/mcp-server.js` 驱动 JSON-RPC）+ 源码直调（`dist/safety-policy.js`/`risk-rule-engine.js`/`update-check.js` 等）+ CLI 真机（doctor/status/help）+ 真云 E2E（ECS/VPC/RDS/OBS/沙箱建删归零）。证据统一落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `146`（设计级 107 + 展开级 39） |
| 已执行 | `145` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `139 / 5 / 0 / 1 / 1` |
| 通过率（分母 = PASS+FAIL = 144） | `96.5%` |
| P0 / P1 / P2 新增缺陷 | `1 / 4 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（ECS/VPC/子网/SG/RDS/OBS 残留均 0）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `102` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `1` | 契约漂移 |
| NOT_RUN | `1` | 未执行 |
| **合计** | **`107`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `37` | 有证据且通过 PASS 门禁 |
| FAIL | `2` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D4-17` | D4安全 | hook模糊fail-closed | `risk-rule-engine.ts` 命令替换形态未命中 | 历史#4复现 |
| 2 | P1 | `D9-9` | D9协议 | tools/call 取消能力未声明 | `mcp-protocol.ts` capabilities 无 cancellation | 历史#5复现 |
| 3 | P0 | `D9-12` | D9协议 | initialize 握手时序未强制 | `mcp-protocol.ts` tools/list 无 initialize 前置校验 | 历史#3复现 |
| 4 | P1 | `EXP-E01` | D10评测 | serviceCatalog 中文意图「云主机」未命中 | `capability-catalog.ts:25-37` ECS 缺「云主机」 | 历史#6复现 |
| 5 | P1 | `EXP-E08` | D10评测 | serviceCatalog 诊断意图未命中 explain_error | `capability-catalog.ts` routeMap 无诊断路由 | 历史单#852 覆盖 |

### 根因详情

**#1 [P1] D4-17** — 期望：`$(...)` 命令替换形态被拦截；实际：`decision=allow unmatched=true`；根因 `plugins/huaweicloud-core/src/risk-rule-engine.ts`（历史 #4）。证据 `evidence/D4-17/`
**#2 [P1] D9-9** — 期望：capabilities 声明 `notifications.cancellation`；实际：仅 `{"tools":{"listChanged":true}}`；根因 `mcp-protocol.ts`（历史 #5）。证据 `evidence/D9-9/`
**#3 [P0] D9-12** — 期望：未 initialize 先 tools/list 返回 -32600；实际：`listed=true`；根因 `mcp-protocol.ts`（历史 #3）。证据 `evidence/D9-12/`
**#4 [P1] EXP-E01** — 期望：「云主机」路由 ECS；实际：fallback；根因 `capability-catalog.ts:25-37`（历史 #6）。证据 `evidence/EXP-E01/`
**#5 [P1] EXP-E08** — 期望：「分析失败原因」路由 explain_error；实际：fallback；根因 `capability-catalog.ts` routeMap 无诊断路由（v2 引入，历史单 #852 覆盖）。证据 `evidence/EXP-E08/`

---

## 五、未执行用例与原因

### NOT_RUN

| 用例ID | 维度 | 标题 | 原因 |
|---|---|---|---|
| `D1-39` | D1安装 | Windows 升级检测链可用性 | OS 专属 P0（OS 列标注「专属」），Windows 升级检测链仅 Windows 适用，Linux 由展开级代表覆盖（P0 NOT_RUN 唯一豁免） |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始 AK/SK/密码明文（redactSecrets 已脱敏）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS(c6.large.2) | 是 | 已删 | ECS 残留 0 |
| VPC/子网/SG(tctest-c1/hdk-s7/d414) | 是 | 已删 | VPC/子网/SG 残留 0 |
| RDS(MySQL 8.0 single) | 是 | 已删 | RDS 残留 0 |
| OBS 桶(tctest-c2) | 是 | 已删 | OBS 残留 0 |
| 沙箱 session | 是 | 已 close | 无残留 |

> 真云只删本次 `tctest-*`/`hdk-s7-*` 前缀资源；删除前全量盘点 + 白名单，最终 ECS/VPC/子网/SG/RDS/OBS 残留均 0。

---

## 八、遗留与建议

- 待裁决 SPEC：`D3-C14`（沙箱 HDKit 模块重构 template_id 下线，非产品缺陷，需修订 test-cases 母版）。
- 历史缺陷复现（4 项）：D9-12/D4-17/D9-9/EXP-E01 均命中历史单，v2.0.0-next.3 未修复，见 HISTORY_LINKS.md。
- 本轮 EXP-E08 诊断意图 MISS 已并入历史单 #852（serviceCatalog 中文路由覆盖不足）。
- 建议：v2 TypeScript 重构后中文意图路由覆盖仍不足，建议补充「云主机/故障诊断」等中文别名与诊断路由。
