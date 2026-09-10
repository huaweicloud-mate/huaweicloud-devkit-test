# Hermes-Codex 测试设计交接状态

> 需求主题：`<topic>`  
> 设计文档：`<absolute path>`  
> 被测项目：`<absolute path>`  
> 归档迭代：`<ITER-NNN-YYYYMMDDHHmmss>`
> 创建时间：`<YYYY-MM-DDTHH:mm:ss+08:00>`

## 当前状态

`INIT`

可选状态：`HERMES_DRAFT_READY` / `CODEX_REVIEWING` / `REVIEW_CHANGES_REQUESTED` / `HERMES_REVISION_READY` / `USER_DECISION_REQUIRED` / `BLOCKED` / `TEST_DESIGN_READY`

## 基线

| 项目 | 值 |
|---|---|
| 被测版本 | `<version>` |
| 分支 | `<branch>` |
| commit | `<commit>` |
| Node/npm | `<versions>` |
| OS | `<os>` |
| Agent/宿主端 | `<Hermes/Codex/OpenCode/...>` |
| 架构 | `<x86/arm>` |
| 执行时间 | `<time zone and timestamp>` |
| 真实操作风险 | `<none / upgrade / cloud resource / credential>` |
| shell / TTY | `<shell> / <TTY or non-TTY>` |
| MCP 传输 | `<stdio/remote>` |
| 安装布局 | `<plugin dir / user dir / npx cache / HUAWEICLOUD_HOME>` |
| Hook 能力 | `<supported / unsupported / unknown>` |
| 多终端矩阵 | `<path to multi-terminal-matrix.csv>` |

## 当前轮次

| 项目 | 值 |
|---|---|
| Hermes 设计版本 | `<draft or revision>` |
| Codex 评审轮次 | `<round>` |
| 设计级用例数 | `<count>` |
| 展开级用例数 | `<count>` |
| P0/P1 未解决数 | `<count>` |
| BLOCKED 数 | `<count>` |
| SPEC-MISMATCH 数 | `<count>` |
| 终端矩阵行数 | `<count>` |

## Hermes 本轮交付

- 修改文件：
- 新增用例：
- 调整断言：
- 新增证据或脚本：
- 多终端影响范围：
- COMMON / CLIENT_MATRIX / OS_MATRIX / AGENT_E2E / CROSS_PROCESS 分类：
- 仍待 Codex 复核：
- 是否需要用户决策：

## Codex 本轮评审

- 结论：`REVIEW_CHANGES_REQUESTED` / `TEST_DESIGN_READY`
- 必须修改项：
- 已确认项：
- 证据路径：
- 下一步：

## 放行检查

- [ ] 需求到用例追踪率 100%
- [ ] P0/P1 用例完整
- [ ] Happy / Error / 防退化路径齐全
- [ ] 函数/mock 与 MCP/客户端/真实升级层次分开
- [ ] 用户同意/拒绝/取消/重复调用覆盖
- [ ] 持久化、重启、跨进程读取覆盖
- [ ] TTL、失败节流和恢复覆盖
- [ ] Windows/多客户端/多 agent 路径覆盖
- [ ] 至少一个 Hook 客户端和一个非 Hook 客户端
- [ ] Windows 和 Linux 已覆盖；声明支持的 macOS/ARM/remote/TTY 路径有证据或明确 BLOCKED
- [ ] 每条受影响用例都有 terminal/agent/OS/Node/npm/TTY/installLayout/mcpTransport/hookSupport
- [ ] 不能用单一 MCP 进程证据替代客户端适配和宿主生命周期证据
- [ ] 版本、commit、命令、时间和环境可复现
- [ ] PASS/FAIL/BLOCKED/SPEC-MISMATCH/PARTIAL 口径分开
- [ ] ID 唯一，生成脚本可复现
- [ ] 无未评估 P0/P1 风险

## 最终状态说明

`<只有 Codex 确认所有放行检查后，才能填写 TEST_DESIGN_READY。>`
