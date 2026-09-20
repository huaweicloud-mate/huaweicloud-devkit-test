# OpenCode-GLM-5.2 每日测试报告

> **报告名**：`OpenCode-GLM-5.2-测试报告.md`
> **生成时间**：2026-09-21 05:20:00（北京时间）
> **执行归档**：`results/OpenCode/2026-09-21-188.239.14.150/Windows/`
> **被测对象**：huaweicloud-devkit（GitHub `huaweicloud/huaweicloud-devkit`）
> **结论**：`PARTIAL`（3个P0安全缺陷 + 11条已知基线路由MISS）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | `OpenCode` + `GLM-5.2` |
| OS / 架构 | `Windows 11 (x64)` |
| Node / npm / Python | `Node v22.22.2 / npm 10.9.7 / Python 3.11.9` |
| 被测版本（SUT） | `v1.1.5`（npm latest，gitHead `e7ed6f6`，PR #696） |
| 工具全集 | `40`（`tools.mjs` TOOL_DEFINITIONS） |
| hcloud / 依赖 | `已安装 / doctor 确认已配置` |
| 真云凭证 | `cn-north-4（AKSK 已配置 / 未使用真云E2E）` |
| 测试类型 | 源码级探针 / MCP协议 / eval harness / CLI真机 |
| 设计真源 | 设计级 100 / 展开级 39 / 追踪表 209 |
| daily 基础用例 | 设计级 100 / 展开级 39 |

> **执行方法**：探针脚本（.mjs）直调 `hdk/plugins/huaweicloud-core/src/*` 导出函数（classifyTextCommand/evaluateCommandRisk/loadRiskRules/redactSecrets/judgeUpdate/queryDistTagsSync等），决策/结果落 `stdout.log`；MCP协议测试通过 spawn mcp-server.mjs + JSON-RPC 帧通信；eval harness 跑 `run-eval.mjs` 得路由准确率；证据统一落 `evidence/<case-id>/`。

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | `139`（设计级100 + 展开级39） |
| 已执行 | `139` |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | `125 / 14 / 0 / 0 / 0` |
| 通过率（分母 = PASS+FAIL = 139） | `89.9%` |
| P0 / P1 / P2 新增缺陷 | `3 / 0 / 0` |
| 红线（I 类）违规 | `0` |
| 资源释放 | `全部归零（未创建真云资源）` |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `97` | 有证据且通过 PASS 门禁 |
| FAIL | `3` | P0安全缺陷：D4-2/D4-3/D4-16 |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`100`** | |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | `28` | 有证据且通过 PASS 门禁 |
| FAIL | `11` | EXP-E路由MISS（已知基线21.4%准确率） |
| BLOCKED | `0` | — |
| SPEC-MISMATCH | `0` | — |
| NOT_RUN | `0` | — |
| **合计** | **`39`** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | `D4-2` | Windows风格%HW_SECRET_KEY%未拦截 | `classifyTextCommand('echo %HW_SECRET_KEY%')` → `{decision:'deny'}` | 返回 `allow` | `safety-policy.mjs:417-419` | P | 待提单 |
| 2 | P0 | `D4-3` | ShowServerPassword未拦截为secret | `classifyTextCommand('hcloud ECS ShowServerPassword ...')` → `{decision:'deny',risk:'secret'}` | 返回 `allow` | `safety-policy.mjs:232-246` | P | 待提单 |
| 3 | P0 | `D4-16` | bash -c "hcloud..."包裹穿透 | `classifyTextCommand('bash -c "hcloud ECS DeleteServers ..."')` → `{decision:'deny',risk:'write'}` | 返回 `allow` | `safety-policy.mjs:428-430` | P | 待提单 |

### 根因详情

**#1 [P0] D4-2 凭证env打印拦截不完整（Windows风格%HW_SECRET_KEY%未拦截）**

- 期望：`echo %HW_SECRET_KEY%` → `deny`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:417-419`
  env变量拦截正则 `/(?<!['\\])\$\{?(?:HUAWEICLOUD|HWC|HW|OS)_(?:ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN)/i` 仅匹配 `$HW_*`（Unix风格 `$` 前缀），未覆盖 Windows `%HW_*%` 格式。

**#2 [P0] D4-3 明文secret API拦截不完整（ShowServerPassword未拦截）**

- 期望：`hcloud ECS ShowServerPassword` → `{decision:'deny',risk:'secret'}`
- 实际：返回 `allow`（被 `hasReadPrefix` 匹配为只读）
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:232-246`
  `blockedSecretOperations` 列表和正则未包含 `ShowServerPassword`。`Show` 前缀被 `hasReadPrefix` 匹配为只读。

**#3 [P0] D4-16 命令包裹穿透（bash -c "hcloud..."未拦截）**

- 期望：`bash -c "hcloud ECS DeleteServers ..."` → `{decision:'deny',risk:'write'}`
- 实际：返回 `allow`
- 根因：`plugins/huaweicloud-core/src/safety-policy.mjs:428-430`
  `classifyTextCommand()` 仅当文本匹配 `/(^|\s)hcloud(\.exe)?\s+/i` 时才调用 `classifyHcloudArgs()`。`bash -c "hcloud..."` 中 hcloud 在引号内，前面是 `"` 非空白字符，正则不匹配。`classifyHcloudArgs()` 内部的 `stripExecutable()` 有shell解包逻辑但从未被调用。

---

## 五、未执行用例与原因

无未执行用例。全部139条用例已执行完毕，无 NOT_RUN / BLOCKED。

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：`0`
- [x] 写操作误判 read-only：`3`（D4-2/D4-3/D4-16 — 已记为P0缺陷待提单）
- [x] 红线（I 类）违规：`0`（发现的安全缺陷已如实记录，未虚标PASS）
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 真云ECS/VPC/RDS等 | 否 | N/A | N/A（本轮未执行真云E2E创建类用例） |
| MCP Server进程 | 是（多轮spawn） | 已全部kill | 残留 0 |

> 本轮测试以源码级探针 + MCP协议测试为主，未创建真云计费资源。

---

## 八、遗留与建议

- **3个P0安全缺陷**需提单修复：D4-2（Windows env var格式）、D4-3（ShowServerPassword）、D4-16（bash -c包裹穿透）
- **serviceCatalog路由准确率**（21.4%）为已知基线限制，11条EXP-E MISS用例属预期行为，建议持续跟踪改进
- 建议 `classifyTextCommand()` 增加 Windows `%VAR%` 格式识别和 shell wrapper（`bash -c`/`sh -c`/`cmd /c`）的 hcloud 命令提取逻辑
