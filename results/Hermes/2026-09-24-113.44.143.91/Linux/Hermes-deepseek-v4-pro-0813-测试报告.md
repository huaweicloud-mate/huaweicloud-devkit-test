# Hermes-deepseek-v4-pro-0813 每日测试报告

> **报告名**：`Hermes-deepseek-v4-pro-0813-测试报告.md`
> **生成时间**：2026-09-24 12:05（北京时间）
> **执行归档**：`results/Hermes/2026-09-24-113.44.143.91/Linux/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（P0 安全缺口 3 项复现，未达 PASS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Hermes + deepseek-v4-pro-0813 |
| OS / 架构 | Linux aarch64 |
| Node / npm / Python | Node v22.13.0 / npm 10.9.2 / Python 3.12 |
| 被测版本（SUT） | `v1.1.7-next.1`（npm @next，gitHead `657ceb7b`，PR #806） |
| 工具全集 | 39（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 7.2.12（doctor 确认已配置） |
| 真云凭证 | cn-north-4（AKSK 已配置） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云 E2E |
| daily 基础用例 | 设计级 100 + 展开级 43 = 143 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（safety-policy / tools / mcp-protocol / telemetry / risk-rule-engine），决策/结果落 `stdout.log`；`eval/harness/run-eval.mjs` 跑中文意图路由；真云 E2E 建删资源归零；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 143 |
| 已执行 | 143 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 118 / 21 / 0 / 2 / 2 |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH） | 83.7%（118/141） |
| P0 / P1 / P2 产品缺陷 | 3 / 16 / 3（另 1 条测试侧 D4-13 不计入提单） |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（FunctionGraph 0 / VPC 0 / 其余真云此前已归零） |

---

## 三、状态汇总

### 3.1 设计级（100）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 87 | 有证据且通过 PASS 门禁 |
| FAIL | 10 | 不符预期，根因见缺陷清单 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 2 | D4-24 / D9-9 契约漂移 |
| NOT_RUN | 1 | D1-39 Windows 专属（Linux 由 EXP-NR3-10 覆盖） |
| **合计** | **100** | |

### 3.2 展开级（43）

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 31 | 有证据且通过 PASS 门禁 |
| FAIL | 11 | EXP-E01~E14 中文意图路由 miss |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 1 | EXP-E08 诊断意图（缺 dsh 真实 LLM harness） |
| **合计** | **43** | |

---

## 四、缺陷清单（详尽，每个缺陷一栏）

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D2-4 | 凭证脱敏缺小写 ak=/sk= | 小写 `ak=`/`sk=` → `<redacted>` | 返回原文不脱敏 | safety-policy.mjs:45 正则缺 /i | P | 待提单 |
| 2 | P0 | D4-16 | shell 包裹单引号内 env-dump 穿透 | `sh -c 'printenv HW_...'` → deny | 返回 allow | safety-policy.mjs:397-419 正则锚点 `(^|\s)` 不匹配单引号 | P | 待提单 |
| 3 | P0 | D4-23 | 全局规则安装未注入 | install 后目标含 `huawei-agent-rules.mdc` | 无产物 | setup-cli.mjs:420-422 仅复制 skills | P | 待提单 |
| 4 | P1 | D4-27 | 双路径输出脱敏漏小写 | 小写 `ak=`/`sk=` → redacted | 原文泄漏（同 D2-4 源） | safety-policy.mjs:45 / hcloud-cli.mjs:587 | P | 待提单 |
| 5 | P1 | D9-2 | tools/list 非法参数无 -32602 | 非法参数 → -32602 error | 直接返回工具列表 | mcp-protocol.mjs:57-59 忽略 params | P | 待提单 |
| 6 | P1 | D10-3 | 中文意图路由准确率 21.4% | 中文意图 → 对应服务 | 11 MISS/15 | tools.mjs:1817-1921 routeMap 英文-only | P | 待提单 |
| 7 | P1 | D4-24 | 确认令牌 JSON 契约未实现 | 精确 `code/status/outcome` | 抛非结构化 Error | tools.mjs:1258-1269 | S | 待提单 |
| 8 | P1 | D9-9 | capabilities.cancellation 未声明 | capabilities 含 cancellation | 仅 `{tools:{}}` | mcp-protocol.mjs:47-49 | S | 待提单 |
| 9 | P2 | D8-9 | sanitizeValue 未脱敏凭证 | sanitizeValue 移除 AK/SK/token | 返回原文 | telemetry.mjs:189 | P | 待提单 |
| 10 | P2 | D4-26 | findings 证据脱敏漏小写 | evidence AK/SK → redacted | 明文 | risk-rule-engine.mjs:25 缺 /i | P | 待提单 |
| 11 | P2 | D3-S6 | 中文「函数」意图不路由 FunctionGraph | 中文意图 → FunctionGraph | 返回 help 提示 | tools.mjs routeMap 无中文词（同 #6） | P | 待提单 |
| 12 | P1 | EXP-E01~E14 | 中文意图路由 miss（11 条） | 各意图 → 对应服务 | MISS | tools.mjs routeMap 英文-only（同 #6） | P | 待提单 |

> 展开级 11 条 EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14 与 #6 D10-3 同源（中文关键词缺失），合并为 #12 辨析，根因同一处 `tools.mjs routeMap`。

### 根因详情（每个 P0/P1 缺陷附代码片段 + 复现证据）

**#2 [P0] D4-16 命令包裹穿透（shell 包裹单引号内 env-dump 失配 allow）**

- 期望：`sh -c 'printenv HUAWEICLOUD_ACCESS_KEY_ID'` → `deny`
- 实际：返回 `allow`（无引号 `sh -c printenv ...` 反为 `deny`）
- 根因：`safety-policy.mjs:397-419` env-dump 正则与 printenv 引用正则均以 `(^|\s)`/`(?:^|\s)` 为前缀锚点；单引号包裹时 printenv 前为 `'` 非空白，正则失配穿透。`stripExecutable` 解包（:67-101）仅作用于 `classifyHcloudArgs` 写命令路径，未前移到 env-dump 检测。
- 证据：`evidence/D4-16/stdout.log`，实测 `sh-c-envdump=allow bash-c-cred=deny`

**#6/#12 [P1] D10-3 + EXP-E01~E14 中文意图路由缺失**

- 期望：各中文意图（查云主机→ECS、MySQL→RDS、函数→FunctionGraph、费用→BSS、监控→CES…）应路由命中对应服务
- 实际：15 条 11 MISS + 1 诊断 miss，准确率 21.4%
- 根因：`tools.mjs:1817-1921` `routeMap` 关键词全英文（`['ecs','server','vm','instance',...]`），`serviceCatalog` 输入仅 `toLowerCase()` 无中文映射
- 证据：`evidence/D10-3/stdout.log`、`evidence/EXP-E01~E14/stdout.log`

---

## 五、未执行用例与原因（供维护 agent 修改用例）

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-39 | 设计级 | P0 | NOT_RUN | 调归属 | Windows 升级检测链可用性，本机为 Linux，OS 专属 | Linux 侧由展开级 EXP-NR3-10 通用断言覆盖（PASS）；母版 OS 归属已正确标注 Windows，无需改 |
| EXP-E08 | 展开级 | P1 | NOT_RUN | 补环境 | 诊断意图评测需真实 LLM harness（`run-agent-eval.mjs` 驱动 `dsh --profile headless`），Hermes 客户端无 dsh | 补 dsh 环境后复测；或以 CDP 会话自动化替代 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（D2-4/D4-27/D4-26/D8-9 为脱敏能力缺陷本身，非测试过程泄漏；探针凭证均用 fixture 假值）
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始 AK/SK/未脱敏日志（credentials 文件经 redacted 工具访问，未入上下文）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| FunctionGraph 函数 `hdk-s6-fn-12798086` | 是（09-23 残留） | 已删 | `ListFunctions` `functions:[]` + `count:0` ✓ |
| VPC（D4-13 只读子账号误建） | 是 | 已删 | `ListVpcs` `vpcs:[]` ✓ |
| ECS / 沙箱 / OBS / 其他真云 | 否（本轮无新建残留） | — | 前轮已归零 ✓ |

> 真云只删本次创建/此前残留资源；删除前全量盘点 + 白名单（仅删 `hdk-s6-*`/`testbot3`/`hermes` 测试前缀），禁删既有/他人资源。残留即 FAIL：本轮归零达标。

---

## 八、遗留与建议

- 待裁决 SPEC：`D4-24`（确认令牌精确 JSON 契约）、`D9-9`（capabilities.cancellation 声明）
- 本轮未覆盖（说明范围）：`真云多终端矩阵（需 10 客户端终端矩阵单机无法满足）`、`真实 Agent 会话评测（Hermes 无 dsh harness）`
- 建议：D2-4 大小写脱敏缺口（`safety-policy.mjs:45` 加 `/i`）为 P0 安全红线，与 D4-26/D4-27/D8-9 同源，应一处修复多处闭环；更完整根因与代码片段见同目录 `FINDINGS.md`。