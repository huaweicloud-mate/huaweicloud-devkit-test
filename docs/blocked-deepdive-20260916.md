# CodeArtsWork Windows 无人值守执行受限（外部依赖）

> 日期：2026-09-16 ｜ 对象：CodeArtsWork 客户端（Windows 120.46.40.202）每日执行 ｜ 性质：客户端级外部依赖（非用例级 BLOCKED）

## 一、结论摘要

CodeArtsWork 客户端在 Windows 上**无法通过 multica 无人值守完成每日测试**，根因是客户端「codearts CLI + agent-kernel 内核」分离架构在 headless 场景的固有限制——本机可治理的三层（审批门 `bash_mode`、网络沙箱 `network_policy`、runtime 协议换绑）均已到位，仍无法突破此层。

## 二、根因链（已 SSH 实证 2026-09-16）

| 环节 | 证据 |
|---|---|
| runtime 协议 | 原绑 `provider=opencode`（node.exe 桥接），已换绑回 codearts：`multica agent update 76eea861… --runtime-id 9ee410b3…`，daemon.log 确认 `picked task provider=codearts` |
| codearts CLI | `codearts.cmd --help` 实查 = `node index.js run --format json --auto`（headless CLI，能正常启动 `pid=11816`）|
| 依赖内核 | 启动后唯一输出 `[codearts:stderr] [bridge] Using agent-kernel port: 59865`；59865 监听者 = `agent-kernel.exe`（`CodeArtsSpace\resources\bin\agent-kernel.exe --port=59865`，CodeArtsSpace 桌面客户端拉起的内核，PID 30352 常驻）|
| 卡点 | headless 下 kernel 连着但**不驱动 codearts 执行** → `tools=0`、15 分钟静默 → idle-watchdog（`idle_for=14m58s`）强停 |

**对比**：Linux 的 `CodeArts CLI`（`testbot2-Linux-CodeArts CLI`）是自包含的（LLM 调用 + 工具执行都在 CLI 内部），不依赖外部 kernel，因此 headless 能完整跑通并回填。

## 三、解除条件（任选其一）

1. **产品侧支持**：CodeArts 提供「不依赖 agent-kernel 的自包含 headless 模式」，或「agent-kernel 的 headless 启动/驱动方式」（类似 Linux CodeArts CLI）。
2. **执行形态**：改在有 GUI 会话的环境运行（人工/桌面常驻），或把 CodeArtsWork 用例落到能 headless 的客户端形态上执行。

## 四、影响

- CodeArtsWork 客户端今日（09-16）无自主回填，Summary 对应列为空/未回填。
- 历史（09-13/14/15）CodeArtsWork 有回填，说明此前或有 GUI 会话环境、或经其他非 multica 无人值守方式执行，与本结论不冲突。

## 五、已治理到位（供后续排查复用）

| 层 | 状态 |
|---|---|
| 审批门 `bash_mode` | ✅ `always_allow`（120 机 permission config 实测）|
| 网络沙箱 `network_policy` | ✅ `allow_all`（120 机 sandbox config 已改）|
| runtime 协议 | ✅ 已换绑回 `codearts`（原 opencode 错配）|