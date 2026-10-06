# OpenCode-big-pickle 每日测试报告
> **报告名**：`OpenCode-big-pickle-测试报告.md`
> **生成时间**：2026-10-07 05:26:06（北京时间）
> **执行归档**：`results/OpenCode/2026-10-07-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `big-pickle` |
| OS / 架构 | `Windows` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1 (gitHead ffd7b47)` |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：复用 WorkBuddy 2026-10-06（同机同源 ffd7b47）批量探针逻辑并改写为 OpenCode 路径执行 —— 直接 import `hdk/plugins/huaweicloud-core` 模块（tools.mjs / mcp-protocol.mjs / risk-rule-engine.mjs / safety-policy.mjs / credentials.mjs / update-check.mjs / telemetry.mjs）在进程内直调 MCP 工具与风险引擎做真实断言；D10 评测集（EXP-E01~E15）走 `eval/harness/run-eval.mjs` 真实调用 `serviceCatalog` 路由；D4-13 走 `run-as-readonly.py` 最小权限凭证；全部 141 例真实执行并落 `evidence/<case-id>/stdout.log`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 1 / 0 / 3 / 0` |
| 通过率（分母 = PASS+FAIL = 138） | `99.3%` |
| P0 / P1 / P2 新增缺陷 | `0 / 1 / 0` |
| 红线（I 类）违规 | `0`（详见第六节） |
| 资源释放 | `无真云资源新增，无需释放` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `99` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `3` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | 不符预期，根因见缺陷清单 |
| BLOCKED | `0` | 环境/权限/凭证阻塞 |
| SPEC-MISMATCH | `0` | 契约漂移 |
| NOT_RUN | `0` | 未执行 |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `EXP-E01` | 编排-路由 | serviceCatalog 路由未命中（"云主机"未路由到 ECS） | `src/tools.mjs:360/1152/2217` | 待提单 |

### 根因详情

**EXP-E01**（FAIL）：意图 `"帮我查一下我账号在华北北京四有哪些云主机"`，期望路由到 `ECS`，实际返回 fallback `"Run hcloud --help to list available services."`。
- 根因：`plugins/huaweicloud-core/src/tools.mjs:360`（`huaweicloud_service_catalog` 注册）、`tools.mjs:1152`（dispatch）、`tools.mjs:2217`（fallback）—— intent 路由未覆盖"云主机"关键词（仅含"云服务器"等），查询类意图落到 fallback。
- 证据：`evidence/EXP-E01/stdout.log`；eval harness 基线 MISS 率 7.1%（1/14）。
- 说明：另有 3 项 SPEC-MISMATCH（D2-12 / D4-3 / D8-9）属实现与设计契约漂移，根因与证据见 `FINDINGS.md`。

---

## 五、未执行用例与原因

无未执行用例。全部用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：无。D2-5/D2-13/D2-16/D2-26 对 `credentials.json` 的备份/替换均及时恢复，执行后 S1 AK 指纹与执行前一致；无明文 AK/SK 进入任何落盘输出（D2-4/D9-13/D4-27 通过）。
- [x] 写操作误判 read-only：本轮写操作（ECS create/delete、VPC delete 等）均触发确认/拦截（D4-4/D4-5/D4-18/D4-19/D3-C4 通过）；DEPRECATED D4-3 的 `csms show-secret/download-secret` 被误判 read_only → 已作为 SPEC-MISMATCH 记录缺陷 #2。
- [x] 红线（I 类）违规：0。无真云资源创建，无凭证落盘，全部证据为真实执行产出。
- [x] 脱敏复核：run_readonly_command 输出经 redactSecrets 脱敏（D3-B3/D4-27 通过）；show_profile_redacted 无明文（D2-4 通过）；遥测 sanitizeValue 不脱敏 AK/SK → 已作为 SPEC-MISMATCH 记录缺陷 #3。

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 0（本轮全部用例为进程内直调 / 只读 / 规划型探针，未创建任何 ECS/RDS/OBS 等真云资源） | 无 | 无需归零验证 |

> 说明：本轮 D1~D10 与 EXP 展开级均未触发真云资源创建/删除路径（无 create-servers 等真实写执行），故资源释放计数为 0。

---

## 八、遗留与建议

- **SPEC-MISMATCH（3 项，契约漂移）**：D2-12（runtime 非空 persist 未拒绝、走 R2 确认流）、D4-3（csms show-secret/download-secret 未 deny）、D8-9（telemetry sanitizeValue 不脱敏 AK/SK）——均与 2026-10-06 复现一致，命中上游历史 issue，不重复提单，详见 `HISTORY_LINKS.md`。
- **FAIL（1 项）**：EXP-E01 serviceCatalog "云主机"意图未路由到 ECS，落到 fallback。
- **建议**：源码侧优先修复 `safety-policy.mjs`（csms/kms 明文 secret deny）、`telemetry/telemetry.mjs`（sanitizeValue 敏感值脱敏）、`tools.mjs` service_catalog（"云主机"等查询词路由）。
