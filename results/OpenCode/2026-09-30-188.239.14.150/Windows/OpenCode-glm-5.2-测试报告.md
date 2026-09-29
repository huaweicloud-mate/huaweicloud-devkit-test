# OpenCode-glm-5.2 每日测试报告

> **报告名**：`OpenCode-glm-5.2-测试报告.md`
> **生成时间**：2026-09-30 05:10:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-30-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（有 1 个 P0 FAIL）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | OpenCode + glm-5.2 |
| OS / 架构 | Windows (win32) |
| Node / npm / Python | Node v22.22.2 / npm / Python 3.11.9 |
| 被测版本（SUT） | `v1.1.8-next.1`（npm @next，gitHead `ffd7b47`） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | hcloud 已配置 / doctor 确认 |
| 真云凭证 | `cn-north-4`（AKSK / 已配置未创建资源） |
| 测试类型 | 源码级探针 / 真机 CLI（install/doctor/status）/ MCP 协议 / 真云只读 |
| daily 基础用例 | 设计级 102 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数 + MCP `callTool` 调用，决策/结果落 `stdout.log`；CLI 真机执行记录日志；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 141（设计级 102 + 展开级 39） |
| 已执行 | 141 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 140 / 1 / 0 / 0 / 0 |
| 通过率（分母 = PASS+FAIL） | 99.3% |
| P0 / P1 / P2 新增缺陷 | 1 / 0 / 0 |
| 红线（I 类）违规 | 0 |
| 资源释放 | 全部归零（未创建云资源） |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 101 | 有证据且通过 PASS 门禁 |
| FAIL | 1 | D4-16 命令包裹穿透 |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **102** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 39 | 有证据且通过 PASS 门禁 |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-16` | 命令包裹穿透 — hook_check_command 不检测 shell 包裹内层命令 | `sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 应返回 `decision: "deny"` | 返回 `decision: "allow"` | `tools.mjs:1146-1147` | P | 待提单 |

### 根因详情

```markdown
**#1 [P0] D4-16 命令包裹穿透**

- 期望：`huaweicloud_hook_check_command({ command: 'sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"' })` → `decision: "deny"`
- 实际：返回 `{"ok":true,"decision":"allow","findings":[],"nextStep":"No Huawei Cloud hook risk rule matched."}`
- 根因：`plugins/huaweicloud-core/src/tools.mjs:1146-1147`
  `hook_check_command` 的 callTool 实现仅调用 `evaluateCommandRisk(args.command)`（risk-rule-engine.mjs，正则规则匹配），
  未调用 `classifyTextCommand()`（safety-policy.mjs，含 `extractInnerCommand()` 内层命令提取）。

  `evaluateCommandRisk` 对完整命令字符串做正则匹配，`sh -c "printenv ..."` 整体不匹配任何规则；
  而 `classifyTextCommand` 先用 `extractInnerCommand` 提取 `printenv HUAWEICLOUD_ACCESS_KEY_ID`，
  再匹配 env-dump 规则，正确判 deny。

- 证据：`evidence/D4-16/stdout.log`，源码级 `classifyTextCommand` 返回 `deny`，MCP `hook_check_command` 返回 `allow`
```

---

## 五、未执行用例与原因

无未执行用例。全部 141 条用例已执行，无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`0`（D4-5 PASS — DeleteServers 正确识别为写操作）
- [x] 红线（I 类）违规：`无`
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS | 否 | — | 无残留 |
| VPC | 否 | — | 无残留 |
| OBS | 否 | — | 无残留 |
| 沙箱 | 否 | — | 无残留 |

> 本轮测试以源码级探针 + MCP 工具调用为主，未创建真云资源，无需归零。

---

## 八、遗留与建议

- **D4-16 命令包裹穿透**：`hook_check_command` 应在 `evaluateCommandRisk` 之外补充 `classifyTextCommand` 调用（或使 `evaluateCommandRisk` 内部集成 `extractInnerCommand`），确保 shell 包裹的内层命令被检测。
- 建议：后续版本在 `risk-rule-engine.mjs` 的 `evaluateCommandRisk` 中集成 `extractInnerCommand`，对包裹命令递归检查内层命令。
