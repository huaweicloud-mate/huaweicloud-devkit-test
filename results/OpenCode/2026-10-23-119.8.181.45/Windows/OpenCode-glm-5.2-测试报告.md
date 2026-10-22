# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-10-23 21:30:00（北京时间）
> **执行归档**：`results/OpenCode/2026-10-23-119.8.181.45/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 3 个 FAIL 缺陷，2 个 BLOCKED 真云用例）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `glm-5.2` |
| OS / 架构 | `Windows Server 2019 (x86_64)` |
| Node / npm / Python | `Node v22.22.2 / npm 12.1.0 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.12`（npm latest, gitHead `4ed07801`） |
| 工具全集 | `40`（tools.mjs TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 (doctor WARN: paired 7.3.12)` |
| 真云凭证 | `cn-north-4 (AKSK, configured)` |
| 测试类型 | 源码级探针 / MCP 工具调用 / MCP 协议 / eval harness |
| daily 基础用例 | 设计级 81 / 展开级 39（预筛后） / 使命 9 |

> **执行方法**：MCP 工具直接调用（hook_check_command/plan_cli_command/list_operations等）+ Node.js 探针脚本直调源码导出函数 + eval harness 路由测试 + MCP 协议 spawn 测试。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 146 |
| 已执行 | 146 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 140 / 3 / 3 / 0 / 0 |
| 通过率（分母 = PASS+FAIL = 143） | 97.9% |
| P0 / P1 / P2 新增缺陷 | 2 / 1 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 无真云资源创建（BLOCKED 用例未创建资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 103 | 有证据且通过 PASS 门禁 |
| FAIL | 2 | D4-3 (adminPass CLI 未拦截), D4-16 (python -c env dump 未拦截) |
| BLOCKED | 2 | D3-C1 (ECS E2E 需真云审批), D3-C2 (OBS E2E 需真云审批) |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **107** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 37 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | EXP-E01 (serviceCatalog MISS ECS查询) |
| BLOCKED | 1 | EXP-E08 (explain_error 诊断路由 N/A) |
| SPEC-MISMATCH | 0 | |
| NOT_RUN | 0 | |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-3` | hook_check_command 未拦截 CLI 命令中的明文 adminPass | `--Server.adminPass=MyPassword123!` 应触发 `hwc-command-adminpass-exposure` warn | `decision=allow, findings=[]` | `risk-rule-engine.mjs:evaluateCommandRisk` | P | 待提单 |
| 2 | P0 | `D4-16` | hook_check_command 未拦截 python -c 环境变量打印 | `python -c "import os; print(os.environ.get('HW_SECRET_KEY'))"` 应触发 `hwc-command-env-dump` deny | `decision=allow, findings=[]` | `risk-rule-engine.mjs:evaluateCommandRisk` env-dump 正则未覆盖 Python | P | 待提单 |
| 3 | P1 | `EXP-E01` | serviceCatalog 未命中 ECS 查询意图 | "帮我查一下我账号在华北北京四有哪些云主机" 应路由到 ECS | 返回 "Run hcloud --help" | `mcp-server.mjs:serviceCatalog` 关键词匹配未覆盖 | P | 待提单 |

### 根因详情

**#1 [P0] D4-3 hook_check_command 未拦截 CLI 命令中的明文 adminPass**
- 期望：`hcloud ECS CreateServers --Server.adminPass=MyPassword123!` → `warn` (hwc-command-adminpass-exposure)
- 实际：返回 `allow`，无 findings
- 根因：`risk-rule-engine.mjs` 的 `evaluateCommandRisk()` 未扫描 CLI 参数值。`hwc-command-adminpass-exposure` 规则仅在 `evaluateArtifacts()` 中触发。
- 证据：`evidence/D4-3/stdout.log`

**#2 [P0] D4-16 hook_check_command 未拦截 python -c 环境变量打印**
- 期望：`python -c "import os; print(os.environ.get('HW_SECRET_KEY'))"` → `deny` (hwc-command-env-dump)
- 实际：返回 `allow`，无 findings
- 根因：`risk-rule-engine.mjs` 的 `hwc-command-env-dump` 正则仅匹配 shell 模式（`$VAR`、`printenv`），未覆盖 Python `os.environ` 访问。
- 证据：`evidence/D4-16/stdout.log`

**#3 [P1] EXP-E01 serviceCatalog 未命中 ECS 查询意图**
- 期望：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` → ECS查询→read
- 实际：返回 "Run hcloud --help to list available services."
- 根因：`mcp-server.mjs` 的 serviceCatalog 关键词路由未覆盖"查一下"+"云主机"组合。
- 证据：`evidence/EXP-E01/stdout.log`，eval harness `eval/results/eval-run-20261022210652.csv`

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| `D3-C1` | 设计级 | P1 | BLOCKED | 补环境 | ECS 生命周期 E2E 需真云资源创建（plan+approve+create+delete），plan_cli_command 正确分类为 write/deny，但实际创建/删除需用户审批付费资源 | — |
| `D3-C2` | 设计级 | P1 | BLOCKED | 补环境 | OBS 静态站 E2E 需真 OBS 桶创建，setup_obs_config 可用但实际创建需用户审批 | — |
| `EXP-E08` | 展开级 | P1 | BLOCKED | 改用例 | explain_error 诊断路由 N/A — serviceCatalog 是服务路由层，explain_error 是元工具（非服务路由），不适用于 serviceCatalog 路由测试 | 展开规则应将 explain_error 路由测试标注为 N/A 或改为 Agent 行为评测 |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志（show_profile_redacted 返回 `<redacted>`）

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否（BLOCKED） | N/A | N/A |
| OBS | 否（BLOCKED） | N/A | N/A |
| 沙箱 | 否 | N/A | N/A |

> 真云用例因 BLOCKED 未创建任何资源，无需释放。

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：真云 ECS/OBS E2E（BLOCKED - 需用户审批付费资源创建）；真实 Agent 会话评测（需 LLM harness）
- 建议：
  1. `risk-rule-engine.mjs` 应扩展 `evaluateCommandRisk()` 扫描 CLI 参数值中的明文密码（adminPass）
  2. `hwc-command-env-dump` 规则应覆盖 Python `os.environ` 访问模式
  3. `serviceCatalog` 应增加"查一下"+"云主机"等中文意图组合的关键词匹配
  4. KooCLI 版本 7.2.12 vs paired 7.3.12 不匹配（doctor WARN）
