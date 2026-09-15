# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-16 07:00:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-16-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 和 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `GLM-5.2` |
| OS / 架构 | `Windows 11 x64` |
| Node / npm / Python | `Node v22.22.2 / npm 10.9.7 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / MCP 工具调用 / eval harness |
| 设计真源 | 设计级 81 / 展开级 71 / 追踪表 10 列 |
| daily 基础用例 | 设计级 78 / 展开级 39（预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；CLI 真机执行记录日志；MCP 工具通过 Agent 会话直接调用；eval harness 跑 `run-eval.mjs` + `protocol-probe.mjs`。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `117`（设计级 78 + 展开级 39） |
| 已执行 | `93`（PASS+FAIL+SPEC-MISMATCH+BLOCKED） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `72 / 20 / 20 / 1 / 4` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 93） | `77.4%` |
| P0 / P1 / P2 新增缺陷 | `3 / 5 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `46` | 有证据且通过 PASS 门禁 |
| FAIL | `7` | D1-39, D1-45, D4-2, D4-9, D4-22, D9-2, D10-3 |
| BLOCKED | `20` | 环境阻塞（需真云/隔离HOME/多profile等） |
| SPEC-MISMATCH | `1` | D9-9 capabilities.cancellation 未声明 |
| NOT_RUN | `4` | D1-6(已验证), D1-58(Linux专属), D7-4(镜像源), D8-6(中文README) |
| **合计** | **`78`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `26` | 有证据且通过 PASS 门禁 |
| FAIL | `13` | EXP-C4-14(DMS), EXP-C4-18(DEW), EXP-E01-E05/E07/E10-E14(路由MISS) |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | hook_check_command 未拦截 printenv HW_ACCESS_KEY | `decision=deny` | `decision=allow` | `tools.mjs:1104` | P | 待提单 |
| 2 | P0 | `D4-9` | hook_check_deploy_plan 未检测公网暴露部署计划 | `decision=warn/deny` | `decision=allow` | `risk-rule-engine.mjs:119` | P | 待提单 |
| 3 | P0 | `D1-39` | Windows queryDistTagsSync 返回 null | 返回非空 dist-tags | `null` | `update-check.mjs:236-248` | P | 待提单 |
| 4 | P1 | `D9-2` | JSON-RPC invalid params 未返回 -32602 | `code=-32602` | 无 error 对象 | `mcp-protocol.mjs:46` | P | 待提单 |
| 5 | P1 | `D9-9` | capabilities.cancellation 未声明 | 声明存在 | 缺失 | `mcp-server.mjs` | P | SPEC-MISMATCH |
| 6 | P1 | `D10-3` | serviceCatalog 路由准确率仅 21.4% | ≥90% | 21.4% | `tools.mjs` serviceCatalog | P | 待提单 |
| 7 | P1 | `D1-45` | applyUpdateHint 未设置 _updateInfo | `_updateInfo` 存在 | undefined | `update-check.mjs:361` | P | 待提单 |
| 8 | P1 | `EXP-C4-14` | DMS list_operations 不支持 | 返回操作列表 | `[USE_ERROR]` | KooCLI 服务名映射 | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 hook_check_command 未拦截 printenv HW_ACCESS_KEY**
- 期望：`hook_check_command("printenv HW_ACCESS_KEY")` → `deny`
- 实际：返回 `allow`
- 根因：`tools.mjs:1104` — `return hookResult(evaluateCommandRisk(args.command || ''))` 使用 `evaluateCommandRisk` 而非 `classifyTextCommand`。`classifyTextCommand` 在 `safety-policy.mjs:417-426` 已有 `printenv HW_` 拦截修复，但 MCP 工具层未调用。

**#2 [P0] D4-9 hook_check_deploy_plan 未检测公网暴露**
- 期望：公网IP + 0.0.0.0/0安全组 + 无清理 → `warn/deny`
- 实际：`allow, findings=[]`
- 根因：`risk-rule-engine.mjs:119` — `evaluateDeployPlan` 规则未匹配 `publicIP` 字段。

**#3 [P0] D1-39 Windows queryDistTagsSync 返回 null**
- 期望：返回 `{latest, next}` 非空
- 实际：`null`
- 根因：`update-check.mjs:236-248` — `spawnSync('npm.cmd', ...)` 在 Windows 非 TTY 下静默失败。

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-5 | 设计级 | P1 | BLOCKED | 补环境 | uninstall会破坏当前工作环境，无法在运行中执行真实卸载 | — |
| D1-6 | 设计级 | P2 | NOT_RUN | 调归属 | install-hcloud已在doctor中验证hcloud已安装 | — |
| D1-39 | 设计级 | P0 | FAIL | — | queryDistTagsSync返回null（已记缺陷） | — |
| D1-41 | 设计级 | P1 | BLOCKED | 补环境 | 需隔离HOME+可控registry响应注入四种结果 | — |
| D1-42 | 设计级 | P1 | BLOCKED | 补环境 | 需隔离HOME+跨进程MCP重启验证skip文件 | — |
| D1-45 | 设计级 | P1 | FAIL | — | applyUpdateHint未设置_updateInfo（已记缺陷） | — |
| D1-58 | 设计级 | P1 | NOT_RUN | 调归属 | terminal=Linux L 真机，Windows不适用 | — |
| D2-1 | 设计级 | P1 | BLOCKED | 补环境 | 需真云E2E验证三端API | — |
| D2-5 | 设计级 | P1 | BLOCKED | 补环境 | 需构造无凭证/错误凭证环境 | — |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | 需多profile KooCLI环境 | — |
| D2-11 | 设计级 | P0 | BLOCKED | 补环境 | 需真云securityToken+auth_switch persist | — |
| D2-12 | 设计级 | P1 | BLOCKED | 补环境 | 需runtime凭据激活状态 | — |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | 需隔离HOME+S1+env验证R9优先级 | — |
| D2-16 | 设计级 | P1 | BLOCKED | 补环境 | 需creds-import.json文件 | — |
| D4-3 | 设计级 | P0 | BLOCKED | 补环境 | 需真云API返回明文secret | — |
| D4-11 | 设计级 | P1 | BLOCKED | 补环境 | 需构造注入payload响应mock | — |
| D4-13 | 设计级 | P1 | BLOCKED | 补环境 | 需run-as-readonly.py注入只读子账号 | — |
| D4-14 | 设计级 | P2 | BLOCKED | 补环境 | 需真云CTS日志查询 | — |
| D4-18 | 设计级 | P0 | BLOCKED | 补环境 | 需真云写操作触发确认流 | — |
| D4-19 | 设计级 | P0 | BLOCKED | 补环境 | 需真云高危写操作确认流 | — |
| D4-20 | 设计级 | P1 | BLOCKED | 补环境 | 需真云确认流选择拒绝 | — |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 需真云+可注入时钟验证令牌过期 | — |
| D6-3 | 设计级 | P2 | BLOCKED | 补环境 | MCP冷启测量探针未成功捕获stdout | — |
| D7-4 | 设计级 | P2 | NOT_RUN | 调归属 | 需配置华为云npm镜像，当前使用默认源 | — |
| D8-6 | 设计级 | P2 | NOT_RUN | 调归属 | 需README.zh-CN，当前源码checkout无中文README | — |
| D10-4 | 设计级 | P0 | BLOCKED | 补环境 | 需真实LLM Agent会话验证高危请求走审批 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`（所有输出已脱敏，AK/SK 显示 `<redacted>`）
- [x] 写操作误判 read-only：`0`（DeleteServers 正确判定 warn/destructive）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云资源 | 否 | — | 未创建真云资源，无需释放 |
| 本地临时文件 | 是（test-skip-state.json等） | 是 | 已清理 |

> 本轮测试未创建真云资源（源码级探针 + MCP 工具调用 + eval harness），无需释放。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9 capabilities.cancellation 未声明`（MCP 协议规定如支持取消应声明此能力）
- 本轮未覆盖：真云 E2E（D2-1/D4-18/D4-19/D4-20 等需真云写操作）、隔离 HOME 测试（D1-41/D1-42/D2-13）、多 profile KooCLI（D2-10）、真实 LLM Agent 评测（D10-4）
- 建议：
  1. D4-2 修复：`tools.mjs:1104` 应改用 `classifyTextCommand` 或在 `evaluateCommandRisk` 中增加 env/printenv 规则
  2. D4-9/D4-22 修复：`risk-rule-engine.mjs` deploy plan 规则应匹配 `publicIP` 字段
  3. D10-3 修复：serviceCatalog 中文意图匹配需大幅增强，当前 11/14 MISS
  4. D1-39 修复：Windows `spawnSync('npm.cmd', ...)` 需加 `shell:true` 或使用 `queryDistTagsFetch` fallback
