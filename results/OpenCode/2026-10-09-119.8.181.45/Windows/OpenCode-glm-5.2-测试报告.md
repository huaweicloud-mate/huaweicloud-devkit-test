# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-09（北京时间）
> **执行归档**：`results/OpenCode/2026-10-09-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：PARTIAL（3 FAIL + 3 SPEC-MISMATCH，含 2 P0）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows Server 2022 (x86_64) |
| 机器 IP | 119.8.181.45 |
| Node / npm / Python | Node v22.22.2 / npm 12.1.0 / Python 3.11.9 |
| 被测版本（SUT） | v1.1.8-next.1（npm @next） |
| 工具全集 | 40+（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置 |
| 真云凭证 | cn-north-4（AKSK 已配置） |
| 测试类型 | 源码级探针 / 真机 CLI / MCP 协议 / eval harness |
| 设计真源 | 设计级 102 / 展开级 39 / 追踪表 211 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。eval harness 跑 `run-eval.mjs` 获取 serviceCatalog 路由结果。

> **收尾说明**：本轮探针已于早前完成执行，141 个 stdout.log 已落盘。本次任务为收尾补全——从 evidence 回填 CSV 执行状态 + evidencePath，并生成报告，未重跑任何探针。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 141 |
| PASS / FAIL / SPEC-MISMATCH / BLOCKED / NOT_RUN | 135 / 3 / 3 / 0 / 0 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） | 95.7% |
| P0 / P1 / P2 缺陷 | 2 / 3 / 1 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（本轮为源码级探针，未创建云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 97 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-16, D4-17 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 3 | D2-12, D4-3, D8-9 |
| NOT_RUN | 0 | — |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 38 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 serviceCatalog 路由未命中"云主机" |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | sh -c/eval 包裹凭证泄露命令穿透 | risk-rule-engine 对包裹命令返回 deny | `sh -c "printenv HW_ACCESS_KEY"` 等返回 `allow` | `cloud-risk-rules.json:14/35` + `risk-rule-engine.mjs evaluate` 未复用 `extractInnerCommand` | P | 历史(#852/#677) |
| 2 | P0 | `D4-3` | csms show-secret 被分类为 read_only 未拦截 | agent-rules.md 规定 MUST NOT call csms show-secret/download-secret，应 deny | `decision=allow, risk=unknown_read` | `safety-policy.mjs classifyTextCommand` csms show-secret 未列入 deny 规则 | P | 待查重 |
| 3 | P1 | `D4-17` | hook 对非法/截断 stdin JSON fail-open | 异常输入默认拒绝（fail-closed） | 静默 `return`（不 deny） | `huaweicloud-safety.mjs:47-49` catch 块未 fail-closed | P | 待查重 |
| 4 | P1 | `EXP-E01` | serviceCatalog 路由未命中"云主机"意图 | `recommendedServices` 包含 `"ECS"` | 返回兜底 `"Run hcloud --help..."` | `tools.mjs:1978-1981` ECS keywords 缺少 `'云主机'` | P | 历史(#858/#852) |
| 5 | P1 | `D2-12` | R10 设计预期 sync 返回 ok:false+suppressed | runtime 非空时 sync 返回 `ok:false + suppressed` | 实际返回 `needs_confirmation`（R2 冲突流） | `tools.mjs auth_switch handler` runtime 非空时走 R2 而非 R10 | G | 待查重 |
| 6 | P2 | `D8-9` | sanitizeValue 不脱敏 AK/SK | 移除 AK/SK/token 等敏感值 | 仅截断长度/去空白，AK 明文残留 | `telemetry.mjs:sanitizeValue` 仅 `replace(/[\r\n\t]+/g," ").trim()+slice` | G | 待查重 |

### 根因详情

**#1 [P0] D4-16 命令包裹穿透**
- 期望：`sh -c "printenv HW_ACCESS_KEY"` / `sh -c "cat credentials.json"` / `eval "env"` 等包裹命令应被 risk-rule-engine 拦截（deny）
- 实际：全部返回 `riskDecision=allow`，内层命令未被识别
- 根因：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:14/35` 规则锚点 `^|\s` 不匹配 `sh -c "..."` 内层命令；`risk-rule-engine.mjs evaluate` 未复用 `safety-policy.mjs extractInnerCommand` 做内层命令拆解
- 证据：`evidence/D4-16/stdout.log`
- 历史关联：#852, #677, #674, #752 等（见 HISTORY_LINKS.md）

**#2 [P0] D4-3 csms show-secret 未拦截（SPEC-MISMATCH）**
- 期望：`hcloud csms download-secret --secret-id 123` 应被 safety-policy deny（agent-rules.md 规定 MUST NOT call csms show-secret/download-secret）
- 实际：`decision=allow, risk=unknown_read, reason="Command does not match a known write or secret operation"`
- 根因：`safety-policy.mjs classifyTextCommand` — csms show-secret/download-secret 未列入 deny 规则集
- 证据：`evidence/D4-3/stdout.log`

**#3 [P1] D4-17 hook fail-open**
- 期望：hook 收到非法/截断 stdin JSON 时应 fail-closed（deny）
- 实际：`catch { return; }` 静默返回，不 deny
- 根因：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:47-49` — catch 块 `return;` 而非输出 deny 决策
- 证据：`evidence/D4-17/stdout.log`

**#4 [P1] EXP-E01 serviceCatalog 路由未命中"云主机"**
- 期望：意图"帮我查一下我账号在华北北京四有哪些云主机" → `recommendedServices` 包含 `"ECS"`
- 实际：返回 `recommendedServices: ["Run hcloud --help to list available services."]`（兜底）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1978-1981` ECS 路由 keywords 列表含 `'弹性云服务器'`、`'云服务器'`、`'服务器'`，但缺少 `'云主机'`
- 证据：`evidence/EXP-E01/stdout.log`
- 历史关联：#858, #852, #845, #844, #841, #828, #826, #805, #785, #784, #705, #714, #674 等（见 HISTORY_LINKS.md）

**#5 [P1] D2-12 R10 返回 needs_confirmation 而非 ok:false+suppressed（SPEC-MISMATCH）**
- 期望：runtime 非空时 `auth_sync` 返回 `ok:false + suppressed`（R10 设计）
- 实际：返回 `needs_confirmation`（R2 冲突确认流），但 S1 未被写入（R10 仍部分生效）
- 根因：`tools.mjs auth_switch handler` — runtime 非空时走 R2 冲突确认流而非 R10 直接拒绝
- 证据：`evidence/D2-12/stdout.log`

**#6 [P2] D8-9 sanitizeValue 不脱敏 AK/SK（SPEC-MISMATCH）**
- 期望：`sanitizeValue("AKABCDEFGHIJKLMNOP")` 返回脱敏值（如 `<redacted>`）
- 实际：返回原文 `"AKABCDEFGHIJKLMNOP"`，仅截断长度/去空白
- 根因：`telemetry/telemetry.mjs:sanitizeValue` — 仅 `replace(/[\r\n\t]+/g," ").trim()+slice(0,255)`，无敏感字段识别与脱敏
- 证据：`evidence/D8-9/stdout.log`

---

## 五、未执行用例与原因

无 NOT_RUN / BLOCKED 用例。全部 141 个用例均有证据落盘。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：0（证据目录无原始凭证/未脱敏日志）
- [x] 写操作误判 read-only：0
- [x] 红线（I 类）违规：无
- [x] 脱敏复核：证据目录无原始凭证
- [ ] 安全缺陷：D4-16（命令包裹穿透，P0）、D4-3（csms show-secret 未拦截，P0）、D4-17（hook fail-open，P1）需关注

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / VPC / OBS 等 | 否 | N/A | 本轮为源码级探针，未创建云资源 |

> 本轮测试为源码级探针 + eval harness，未创建真云资源。

---

## 八、遗留与建议

- 历史复现（不重复开单）：EXP-E01（serviceCatalog "云主机" 关键词缺失）、D4-16（命令包裹穿透）→ 见 HISTORY_LINKS.md
- 待查重：D4-3（csms show-secret 未拦截）、D4-17（hook fail-open）、D2-12（R10 返回 needs_confirmation）、D8-9（sanitizeValue 不脱敏 AK/SK）
- eval harness 路由准确率：14 HIT / 1 MISS = 93.3%（基线 21.4% MISS，已大幅改善）
- 建议：ECS keywords 添加 `'云主机'`；risk-rule-engine 复用 `extractInnerCommand`；hook catch 块改 fail-closed；csms show-secret 列入 deny 规则
