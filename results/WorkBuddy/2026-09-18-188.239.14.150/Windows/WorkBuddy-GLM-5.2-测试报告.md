# WorkBuddy-GLM-5.2 每日测试报告

> **报告名**：`WorkBuddy-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-18 05:15:00（北京时间）
> **执行归档**：`results/WorkBuddy/2026-09-18-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 FAIL 和 P0 缺陷）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `WorkBuddy` + `GLM-5.2` |
| OS / 架构 | `Windows Server 2022 x64` |
| Node / npm / Python | `Node v22.22.2 / npm 10.9.7 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f66`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `hcloud 7.2.12 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置）` |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / MCP 工具调用 / eval harness / 真云只读验证 |
| 设计真源 | 设计级 80 / 展开级 39（预筛后） / 追踪表 |
| daily 基础用例 | 设计级 80 / 展开级 39（预筛后） |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数；CLI 真机执行记录日志；MCP 工具通过 subprocess JSON-RPC 调用；eval harness 直调 serviceCatalog；真云只读通过 run-as-readonly.py 验证。证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `119`（设计级 80 + 展开级 39） |
| 已执行 | `117`（PASS+FAIL+SPEC-MISMATCH+BLOCKED） |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `86 / 21 / 9 / 1 / 2` |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH = 108） | `79.6%` |
| P0 / P1 / P2 新增缺陷 | `7 / 3 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `58` | 有证据且通过 PASS 门禁 |
| FAIL | `10` | D1-39, D1-45, D4-1, D4-3, D4-7, D4-9, D4-15, D4-17, D4-27, D10-3 |
| BLOCKED | `9` | D1-5, D1-41, D1-42, D2-10, D2-13, D2-16, D2-26, D4-24, D10-4 |
| SPEC-MISMATCH | `1` | D9-9 capabilities.cancellation 未声明 |
| NOT_RUN | `2` | D1-58(Linux专属), D7-4(镜像源) |
| **合计** | **`80`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E01~E05/E07/E10~E14(路由MISS) |
| BLOCKED | `0` | |
| SPEC-MISMATCH | `0` | |
| NOT_RUN | `0` | |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-1` | IAM CreateUser 含密码未被拦截 | `decision=deny/warn` | `decision=allow` | `tools.mjs:1104` evaluateCommandRisk | P | 待提单 |
| 2 | P0 | `D4-3` | ECS CreateServers 含 adminPass 未被拦截 | `decision=deny/warn` | `decision=allow` | `tools.mjs:1104` evaluateCommandRisk | P | 待提单 |
| 3 | P0 | `D4-7` | IAM CreateUser/CreatePolicy 未被拦截 | `decision=warn/deny` | `decision=allow` | `risk-rule-engine.mjs` evaluateCommandRisk | P | 待提单 |
| 4 | P0 | `D4-9` | deploy plan 公网暴露未检测 | `decision=warn/deny` | `decision=allow` | `risk-rule-engine.mjs:119` evaluateDeployPlan | P | 待提单 |
| 5 | P0 | `D4-15` | delete 变体未被拦截 | `decision=warn/deny` | `decision=allow` | `tools.mjs:1104` evaluateCommandRisk | P | 待提单 |
| 6 | P0 | `D4-17` | 异常输入未默认拒绝 | `decision=deny` | `decision=allow` | `risk-rule-engine.mjs` evaluateCommandRisk | P | 待提单 |
| 7 | P0 | `D1-39` | Windows queryDistTagsSync 返回 null | 返回非空 dist-tags | `null` | `update-check.mjs:236-248` | P | 待提单 |
| 8 | P1 | `D10-3` | serviceCatalog 路由准确率仅 21.4% | ≥90% | 21.4% | `tools.mjs:1776` serviceCatalog | P | 待提单 |
| 9 | P1 | `D1-45` | applyUpdateHint 未设置 _updateInfo | `_updateInfo` 存在 | undefined | `update-check.mjs:361` | P | 待提单 |
| 10 | P1 | `D4-27` | redactSecrets 未覆盖裸 AK/SK | 全部 `<redacted>` | 裸字符串未脱敏 | `safety-policy.mjs` redactSecrets | P | 待提单 |

### 根因详情

**#1-#3 [P0] D4-1/D4-3/D4-7 凭证参数和高危 IAM 操作未拦截**
- 期望：含 `--password`/`--adminPass` 参数的命令及 IAM CreateUser/CreatePolicy 操作 → `deny/warn`
- 实际：返回 `allow`
- 根因：`tools.mjs:1104` — `evaluateCommandRisk` 未检测凭证参数关键词和高危 IAM 操作

**#4 [P0] D4-9 deploy plan 公网暴露未检测**
- 期望：公网IP + 0.0.0.0/0安全组 + 无清理 → `warn/deny`
- 实际：`allow, findings=[]`
- 根因：`risk-rule-engine.mjs:119` — `evaluateDeployPlan` 规则未匹配 `publicIP` 字段

**#5 [P0] D4-15 delete 变体未拦截**
- 期望：`Deleteserver --instance-id xxx` → `deny/warn`
- 实际：`allow`
- 根因：`tools.mjs:1104` — `evaluateCommandRisk` 仅匹配 `hcloud` 前缀命令，未检测裸 delete 关键词

**#6 [P0] D4-17 异常输入未 fail-closed**
- 期望：空/null/malformed 输入 → `deny`
- 实际：`allow`
- 根因：`risk-rule-engine.mjs` — `evaluateCommandRisk` 默认返回 allow

**#7 [P0] D1-39 Windows queryDistTagsSync 返回 null**
- 期望：返回 `{latest, next}` 非空
- 实际：`null`
- 根因：`update-check.mjs:236-248` — `spawnSync('npm.cmd', ...)` Windows 非 TTY 静默失败

**#8 [P1] D10-3 serviceCatalog 路由准确率 21.4%**
- 期望：中文意图路由准确率 ≥90%
- 实际：3/14 HIT = 21.4%
- 根因：`tools.mjs:1776` — `serviceCatalog` 英文关键词匹配，中文意图无法匹配

**#9 [P1] D1-45 applyUpdateHint 未设置 _updateInfo**
- 期望：`result._updateInfo` 存在
- 实际：`undefined`
- 根因：`update-check.mjs:361` — `applyUpdateHint` 未正确设置字段

**#10 [P1] D4-27 redactSecrets 未覆盖裸 AK/SK**
- 期望：裸 AK/SK 字符串被替换为 `<redacted>`
- 实际：原始字符串未脱敏
- 根因：`safety-policy.mjs` — `redactSecrets` 仅匹配 `key=value` 模式

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D1-5 | 设计级 | P1 | BLOCKED | 补环境 | uninstall会破坏当前工作环境，无法在运行中执行真实卸载 | — |
| D1-41 | 设计级 | P1 | BLOCKED | 补环境 | 需隔离HOME+可控registry响应注入四种结果 | — |
| D1-42 | 设计级 | P1 | BLOCKED | 补环境 | 需隔离HOME+跨进程MCP重启验证skip文件 | — |
| D1-58 | 设计级 | P1 | NOT_RUN | 调归属 | terminal=Linux L 真机，Windows不适用 | — |
| D2-10 | 设计级 | P1 | BLOCKED | 补环境 | 需多profile KooCLI环境 | — |
| D2-13 | 设计级 | P1 | BLOCKED | 补环境 | 需隔离HOME+S1+env验证R9优先级 | — |
| D2-16 | 设计级 | P1 | BLOCKED | 补环境 | 需creds-import.json文件，auth_switch mode=import返回空 | — |
| D2-26 | 设计级 | P1 | BLOCKED | 补环境 | 需auth_switch persist触发backup/restore，mode=mcp-config返回空 | — |
| D4-24 | 设计级 | P1 | BLOCKED | 补环境 | 需可注入时钟验证令牌过期 | — |
| D7-4 | 设计级 | P2 | NOT_RUN | 调归属 | 需配置华为云npm镜像，当前使用默认源 | — |
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

> 本轮测试未创建真云资源（源码级探针 + MCP 工具调用 + eval harness + 只读验证），无需释放。

---

## 八、遗留与建议

- 待裁决 SPEC：`D9-9 capabilities.cancellation 未声明`（MCP 协议规定如支持取消应声明此能力）
- 本轮未覆盖：隔离 HOME 测试（D1-41/D1-42/D2-13）、多 profile KooCLI（D2-10）、真实 LLM Agent 评测（D10-4）、creds-import.json（D2-16）、auth_switch persist backup/restore（D2-26）、令牌过期时钟注入（D4-24）
- 建议：
  1. D4-1/D4-3/D4-7 修复：`evaluateCommandRisk` 应检测 `--password`/`--adminPass` 参数和 IAM 高危操作
  2. D4-9 修复：`evaluateDeployPlan` 应匹配 `publicIP` 字段
  3. D4-15 修复：`evaluateCommandRisk` 应检测裸 delete 关键词（不限于 hcloud 前缀）
  4. D4-17 修复：`evaluateCommandRisk` 对异常输入应 fail-closed（默认 deny）
  5. D10-3 修复：serviceCatalog 中文意图匹配需大幅增强，当前 3/14 HIT
  6. D1-39 修复：Windows `spawnSync('npm.cmd', ...)` 需加 `shell:true` 或使用 fallback
  7. D1-45 修复：`applyUpdateHint` 应正确设置 `result._updateInfo`
  8. D4-27 修复：`redactSecrets` 应覆盖裸 AK/SK 字符串模式
