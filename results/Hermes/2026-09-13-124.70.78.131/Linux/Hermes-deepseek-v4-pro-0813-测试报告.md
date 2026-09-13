# Hermes-deepseek-v4-pro-0813 测试报告

> 生成时间：2026-09-13 02:00~02:15（北京时间）
> 测试执行归档：`results/Hermes/2026-09-13/Linux/`
> 测试对象：huaweicloud-devkit（GitHub huaweicloud/huaweicloud-devkit，dev 分支 @ npm next）

## 一、测试概述

| 项 | 值 |
|---|---|
| 被测版本（SUT） | `huaweicloud-devkit@1.1.4-next.3`（gitHead `3b6290bc`） |
| 工具全集 | 39 个（`tools.mjs` TOOL_DEFINITIONS 注册数组，实测 tools/list） |
| 本机环境 | Linux（aarch64, Ubuntu 6.8.0），Node v22.13.0，npm 10.9.2 |
| Agent + 模型 | Hermes + deepseek-v4-pro-0813 |
| 真云 | cn-north-4（本机已有 AK/SK；本轮**未创建/删除任何真云资源**，仅做脱敏/只读验证） |
| 测试类型 | 每日回归（黑盒 CLI + MCP 协议 + 源码级单测 + 凭证脱敏） |

**设计真源**：设计级 163 条 / 展开级 137 条 / 追踪表 169 条。今日为单终端 Hermes+Linux 每日回归，仅对**实际执行且留存证据**的用例标 PASS，其余诚实标 NOT_RUN/BLOCKED（见红线「禁虚报」）。

## 二、执行结果

### 2.1 已执行并通过（有真实证据，均落盘 `evidence/<case-id>/`）

| 用例组 | 结果 |
|---|---|
| D1 安装（D1-1/3/5） | 3/3 ✓（install → doctor → uninstall 全流程，隔离 HERMES_HOME） |
| D2 凭证（D2-4 脱敏 / D2-11 STS 拒绝落盘） | 2/2 ✓ |
| D3 功能（D3-B5 detect_framework） | 1/1 ✓ |
| D4 安全（D4-7 hook 三工具 / D4-8 Python·Node 一致） | 2/2 ✓ |
| D9 协议（D9-1 tools/list / D9-3 tools/call / D9-4 生命周期） | 3/3 ✓ |

**关键证据要点**：
- `install --target hermes`：29 skills + MCP server + safety policy/hooks + hook allowlist 全部落盘，`status` 确认「已安装: Hermes Agent」。
- `doctor --target hermes`：11 pass / 0 warn / 0 fail。
- `uninstall --target hermes`：清理 hooks config/plugin/allowlist/MCP config/29 skills/MCP server/safety hooks，`status` 回落「未安装」。
- 凭证脱敏：`show_profile_redacted` 返回 `accessKeyId/secretAccessKey/securityToken = <redacted>`，`auth_status` 仅返回指纹 `caae65f2`，无 AK/SK 泄露。
- MCP 协议：initialize（protocolVersion 2024-11-05 + capabilities.tools）→ tools/list（39 工具，0 非法 schema）→ tools/call（content 数组 + isError:false）标准时序正常。
- 源码级单测（`node --test`）：`auth-credentials` 22/22、`detect-framework` 20/20、`hook-plugin` 9/9、`hook-node` 5/5、`hook-python` 10/10、`safety-policy` 24/24、`reconcile` 9/9、`cred-reconcile-e2e` 24/24、`uninstall-cleanup` 4/4、`update-check` 28/28、`risk-rule-engine` 18/18、`structure` 39/39、`mcp-server` 3/3、`tools` 22/22 等全部通过。

### 2.2 执行状态汇总（今日快照）

| 状态 | 数量 |
|---|---|
| PASS | 11 |
| FAIL | 1 |
| BLOCKED | 15 |
| NOT_RUN | 136 |
| **合计** | **163** |

> 今日实测通过率（PASS / 已执行+PASS）：11 / 12 = **91.7%**（唯一失败为 D9-2 JSON-RPC 错误码，为已知缺陷复现）。

## 三、缺陷清单（1 个，本次复现确认）

| # | 级别 | 用例ID | 标题 | 根因（文件+行号） |
|---|---|---|---|---|
| 1 | P1 | D9-2 | JSON-RPC 错误码不规范 | `plugins/huaweicloud-core/src/mcp-server.mjs:169` `handleMessage` 的 catch 分支对**所有** `dispatch` 异常硬编码 `code: -32603`。实测：未知 method → `-32603 "Unsupported method"`（规范应为 `-32601` Method not found）；未知 tool → `-32603 "Unknown tool"`（应为 `-32602` Invalid params，tool 名为参数而非 method）。错误类型未区分，客户端无法据此分类处理。 |

> 本缺陷在母版用例矩阵中已标记 FAIL（历史已知），本次在 1.1.4-next.3 上**黑盒复现确认仍存在**，根因定位到 `mcp-server.mjs:169` + `tools.mjs:1455`（`Unknown tool` 抛出语义）与 `mcp-protocol.mjs:95`（`Unsupported method` 抛出语义）。

## 四、环境阻塞项

| 项 | 原因 |
|---|---|
| D3-C1/C3/C6/C8 真云 E2E | 需付费/配额（ECS、DevStation、企业项目），单 Linux 终端无安全创建删除条件 |
| D1-52 真实升级 | 需真实重启会话验证 hdk 生效 |
| D1-13/D1-39/D7-3/D5-6 | Windows 专项，Linux 无法复现 |
| D9-6 / D10-1~5 | 跨客户端并存 / 评测 harness + 预算 |

## 五、真云资源清理声明

本轮**未创建任何真云资源**（仅执行脱敏/只读 `show_profile_redacted`、`auth_status`、`check_cli` 查询），无资源残留。install/uninstall 仅作用于本机 Hermes 的 `HERMES_HOME`，测试后已 `uninstall --target hermes` 清理干净（`status` 回落「未安装」）。

## 六、后续计划

1. D1 剩余安装域（D1-56/57 中断恢复/坏包回滚、D1-10/12 卸载清理 flag、D1-58 通用 MCP 白名单）继续补测。
2. D4 安全域黑盒层（D4-1/2/3/18/19/21/22 审批门与预检）在真实交互会话中补测。
3. D3 功能域真云只读扩展（22 服务只读规划）。
4. 展开级矩阵（D5 客户端 70 / D3-C4 服务 22 / NR3 终端 25）分终端补测。