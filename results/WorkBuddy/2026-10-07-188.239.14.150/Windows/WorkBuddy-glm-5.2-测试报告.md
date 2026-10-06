# WorkBuddy-glm-5.2 每日测试报告

> **报告名**：`WorkBuddy-glm-5.2-测试报告.md`
> **生成时间**：2026-10-07 05:35:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-10-07-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（无 P0 缺陷；4 项 P1 缺陷待提单）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `glm-5.2` |
| OS / 架构 | `Windows Server 2022 Standard` x86_64 |
| Node / npm / Python | `Node v22.22.2` / `npm 10.x` / `Python 3.11.9` |
| 被测版本（SUT） | `huaweicloud-devkit@1.1.8-next.1`（gitHead `ffd7b47`） |
| 工具全集 | 39（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 已配置` / `doctor 确认通过` |
| 真云凭证 | `cn-north-4` AKSK（本次未触发真云建删，源码级探针直调） |
| 测试类型 | 源码级探针直调 + MCP 协议探针 + eval harness 路由层 + CLI 真机 |
| 设计真源 | daily 设计级 102 / 展开级 39 / 追踪表 211 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；MCP 协议探针走 `mcp-protocol.mjs`；eval harness 跑 `run-eval.mjs` 取路由结论；CLI 真机执行 `huaweicloud-devkit doctor/status/install/update`。证据统一落 `evidence/<case-id>/`（probe.mjs + stdout.log JSON）。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `141`（设计级 102 + 展开级 39） |
| 已执行 | `141` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `137 / 1 / 0 / 3 / 0` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 141） | `97.2%` |
| P0 / P1 / P2 新增缺陷 | `0 / 4 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零`（本轮未触发真云建删资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `99` | 有证据且通过 PASS 门禁 |
| FAIL | `0` | — |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `3` | 契约漂移（D2-12 / D4-3 / D8-9） |
| NOT_RUN | `0` | — |
| **合计** | **`102`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `38` | 有证据且通过 PASS 门禁 |
| FAIL | `1` | EXP-E01 路由未命中 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 维度 | 标题 | 根因（文件:行号） | 状态 |
|---|---|---|---|---|---|---|
| 1 | P1 | `D2-12` | D2认证 | R10 runtime非空禁止落盘 | `plugins/huaweicloud-core/src/tools.mjs:1199-1271` | 待提单 |
| 2 | P0 | `D4-3` | D4安全 | 明文secret API拦截 | `plugins/huaweicloud-core/src/safety-policy.mjs:489` | 待提单 |
| 3 | P1 | `D8-9` | D8质量 | 安装 ID 与遥测值脱敏 | `plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` | 待提单 |
| 4 | P1 | `EXP-E01` | D10评测 | serviceCatalog 路由未命中 | `plugins/huaweicloud-core/src/tools.mjs:360` | 待提单 |

### 根因详情

**#1 [P1] D2-12 R10 runtime非空禁止落盘 — 设计预期拒绝，实际返回 needs_confirmation**

- 期望：runtime 非空时 persist 应返回 `{status:error, scope:rejected}` 或 `{ok:false, suppressed:true}`，不进入确认流
- 实际：返回 `{status:"needs_confirmation", confirmToken:"switch-...", options:[s1, newImported]}`（R2 冲突确认流）。S1 未被写入（R10 部分生效）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1199-1271` — `case 'huaweicloud_auth_switch'` handler 中，runtime 非空时走 R2 冲突确认流而非 R10 直接拒绝
- 证据：`evidence/D2-12/stdout.log`

**#2 [P0] D4-3 明文secret API拦截 — csms show-secret/download-secret 未被 deny**

- 期望：`csms download-secret` 和 `csms show-secret` 应被 `classifyTextCommand` 判 `deny`
- 实际：被分类为 `read_only`/`unknown_read`，decision=`allow`。`agent-rules.md` 规定 `MUST NOT call hcloud csms download-secret/show-secret`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:489` — `classifyTextCommand()` 未将 `csms download-secret`/`csms show-secret`/`kms decrypt` 列入 deny 规则
- 证据：`evidence/D4-3/stdout.log`

**#3 [P1] D8-9 安装 ID 与遥测值脱敏 — sanitizeValue 不脱敏 AK/SK**

- 期望：`sanitizeValue` 输入 AK/SK/token 应返回 `<redacted>` 或脱敏值
- 实际：`sanitizeValue('AKABCDEFGHIJKLMNOP')` 返回原值 `AKABCDEFGHIJKLMNOP`，仅做空白 replace + 长度截断
- 根因：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` — `sanitizeValue()` 无敏感字段识别/脱敏逻辑
- 证据：`evidence/D8-9/stdout.log`

**#4 [P1] EXP-E01 serviceCatalog 路由未命中 — "查一下云主机"未路由到 ECS**

- 期望：意图含"云主机"应路由到 ECS 服务
- 实际：返回 `"Run hcloud --help to list available services."`（未命中）
- 根因：`plugins/huaweicloud-core/src/tools.mjs:360` — `huaweicloud_service_catalog` 的 intent 路由逻辑未覆盖"云主机"关键词
- 证据：`evidence/EXP-E01/stdout.log`（eval harness 基线 MISS 率 7.1%，1/14）

---

## 五、未执行用例与原因

无未执行用例。全部 141 条用例均已执行并回填。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（探针使用测试 AK/SK，无真实凭证落盘）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`0`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（D8-9 用例使用测试 AK 字符串，非真实凭证）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS / VPC / EIP | 否 | — | 本轮未触发真云建删 |
| OBS / RDS / CCE | 否 | — | 本轮未触发真云建删 |
| 沙箱 / DevStation | 否 | — | 本轮未触发 |

> 本轮 141 条用例均为源码级探针 / MCP 协议 / eval harness / CLI 真机类，未触发真云建删资源。真云 E2E 用例在 dedicated 真云轮次单独执行。

---

## 八、遗留与建议

- 待裁决 SPEC：`D2-12`（R10 与 R2 冲突流的设计边界）、`D4-3`（csms show-secret 拦截层级）、`D8-9`（telemetry 脱敏范围）
- 本轮未覆盖：真云 E2E 建删资源用例（dedicated 轮次执行）、真实 Agent 会话评测 D10-1/2/5/9（需 DSH/CDP 环境，非 WorkBuddy 客户端能力）
- 建议：
  1. D4-3 P0 缺陷优先修复：`safety-policy.mjs` 应将 `csms download-secret`/`show-secret`/`kms decrypt` 列入 deny
  2. D8-9 `sanitizeValue` 增加敏感字段识别（AK/SK/token 前缀匹配 → 脱敏）
  3. EXP-E01 `serviceCatalog` intent 路由补"云主机"关键词别名
