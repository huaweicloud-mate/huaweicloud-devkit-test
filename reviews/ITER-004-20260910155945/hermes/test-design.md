# Hermes 测试设计交接版（版本升级提醒 NR3）

> 当前迭代：`ITER-004-20260910155945`
> 状态：`HERMES_REVISION_READY`（由 Hermes 更新；**不得提前签署 `TEST_DESIGN_READY`**，需 Codex 第三轮复评）
> 生成时间：2026-09-10T17:25:00+08:00（ISO 8601）
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`（源码注释 Spec 链接指向内部 specs，与飞书 wiki 同源；归档仓库 `docs/` 下无该文件副本）
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`（huaweicloud/huaweicloud-devkit）
> Codex 评审：`codex/review-round-01-版本升级提醒.md`、`codex/review-round-02-版本升级提醒.md`

## 一、设计基线

| 项 | 值 |
|---|---|
| 正式版（旧版载体） | 1.1.2 @ `09a59b937eb3`（npm 发布 2026-09-09T11:03Z） |
| next 线（未修复副本） | 1.1.3-next.2 @ `c6c0965f0bdf`（npm 发布 2026-09-10T01:22Z） |
| dev 远端（观测） | `e2f4d2ada058`（2026-09-10T15:29+08:00） |
| FIX(sim) 修复副本 | next.2 原码 + 3 处补丁（sync→node.exe+npm-cli、async→shell:true、npx→node.exe+npx-cli+npm_execpath），版本号 1.1.3 受控**非官方发布线** |
| Node / npm | v22.23.2 / 10.9.8 |
| OS / 架构 | Windows 10 / win32 x64（本机可执行基线） |
| Shell / TTY | powershell.exe 5.1 / 非 TTY（spawnSync 管道） |
| 执行 Agent | Hermes（本机） |
| 风险 | 升级写操作仅在一次性隔离 HOME 执行（`evidence/nr3/.sandbox`，gitignore）；真实云资源零触碰 |

## 二、设计范围与分层

设计级用例 D1-26~D1-55（30 条），按证据性质分五层（Codex 要求 #3 口径）：

| 分层 | 定义 | 覆盖用例 |
|---|---|---|
| COMMON | 平台无关核心逻辑（函数级，Windows 探针执行，需 Linux 复跑确认） | D1-27/28/30/31/32/33/34/35/36/44/46/47/50(mock) |
| CROSS_PROCESS | 跨进程/跨会话状态边界 | D1-42、D1-48、D1-55 |
| CLIENT_MATRIX | 客户端安装布局与生命周期（Hook/非 Hook） | D1-52（非 Hook=OpenCode 布局）；D1-41/42/45（stdio 协议闭环） |
| OS_MATRIX | 操作系统差异路径 | D1-39（Windows FAIL / Linux 待验）、D1-52（升级链） |
| AGENT_E2E | 真实 Agent 宿主会话 | D1-54（BLOCKED） |

直接 MCP 进程测试（stdio/remote 探针）归类 COMMON/CROSS_PROCESS/协议闭环，**不替代** CLIENT_MATRIX 与 AGENT_E2E 证据。

## 三、候选用例矩阵

见同目录 `candidate-matrix.csv`（16 列：caseId/terminal/agent/os/arch/node/npm/shell/ttyMode/installLayout/mcpTransport/hookSupport/executionLevel/requiredEvidence/status/blockedReason），逐用例×终端展开，分类分层明确。

## 四、执行证据索引

| 资产 | 路径 |
|---|---|
| 原始运行日志（stdout/stderr/退出码 ×4 探针） | `results/ITER-004-2026-09-10/evidence/nr3/run-logs/`（`*.stdout.log`/`*.stderr.log`/`*.exit`） |
| 环境 manifest（命令/起止时间/Node/npm/OS/arch/shell/TTY/commit/沙箱/退出码/断言汇总） | `run-logs/manifest.json` |
| 探针源码 | `evidence/nr3/{d1-unit-probe,d1-mcp-loop,d1-upgrade-real,d1-49-d1-55-ext,run-probes,build-sandbox,fixture-server}.mjs` |
| 沙箱来源清单 | `.sandbox/MANIFEST.md`（构建产物，gitignore，可 `build-sandbox.mjs` 重建） |
| 执行记录（分档/多终端/裁决清单） | `results/ITER-004-2026-09-10/NR3版本升级提醒-补充执行记录.md` |

## 五、当前统计（设计级 D1-26~55，30 条）

- ✅ PASS：24（D1-26/27/28/30/31/32/33/34/35/36/37/38/40/41/42/44/45/47/48/49/50/51/52/53）
- ⚠️ SPEC-MISMATCH：4（D1-29 pre 策略差异；D1-43c 失败态伪 up_to_date+current 伪冷却；D1-46g doQuery reject 直抛；**D1-55b 同进程多会话 hintConsumed 按进程共享**——本轮新增实锤）
- ❌ FAIL：1（D1-39 修复前 Windows P0 EINVAL，双腿端到端实锤）
- ⛔ BLOCKED：1（D1-54 Hermes 真实会话）
- UNASSESSED：0
- 断言级：120/120 PASS（59+31+16+14），可由 `run-logs/*.stdout.log` 逐项追溯。

## 六、放行检查（Codex 第二轮门禁对照）

| # | Codex 要求 | 落实 |
|---|---|---|
| 1 | hermes/ 三份交接文件 | ✅ 本版（test-design.md / candidate-matrix.csv / status.md） |
| 2 | D1-49、D1-55 补齐或显式 BLOCKED | ✅ D1-49 7 断言 PASS；D1-55 remote 双客户端实测（55b SPEC 实锤） |
| 3 | Windows/Linux + Hook/非 Hook 矩阵 | ✅ 分层矩阵（见记录 v2 §三）；Linux/Hook/macOS/ARM/remote-TTY 未执行路径均显式 BLOCKED 写明原因/影响/解除条件 |
| 4 | 逐用例 16 列 | ✅ candidate-matrix.csv |
| 5 | D1-39 P0 FAIL + SPEC 保留，FIX(sim) 不写作产品修复 | ✅ 见执行记录 v2 §三 口径声明 |
| 6 | 原始 stdout/stderr/exit/env 归档 + 断言可追溯 | ✅ run-logs/ + manifest.json（120/120 逐项可溯） |
| 7 | 正文 ISO 8601 + 文件名紧凑时间戳 | ✅ 本目录全部文档 |
| 8 | 状态 HERMES_REVISION_READY（非 TEST_DESIGN_READY） | ✅ status.md |

## 七、仍需 Codex 第三轮复核 / 开发裁决

1. D1-29、D1-43c、D1-46g、D1-55b 四项规格裁决（详见执行记录 v2 §七）——是否接受现状或改实现/文档，裁决后再重生成矩阵。
2. D1-39 上游 `#554` 固定修复版本回归（FIX(sim) 不作为产品证据）。
3. D1-54 解除条件满足后的真实 Hermes 会话补验。
4. Linux/macOS/ARM/Hook 客户端路径的测试机接入计划（BLOCKED 解除条件）。