# Hermes 测试设计交接版（版本升级提醒 NR3）

> 当前迭代：`ITER-004-20260910155945`
> 状态：`HERMES_REVISION_READY`（由 Hermes 更新；**不得提前签署 `TEST_DESIGN_READY`**，需 Codex 复评）
> 生成时间：2026-09-10 20:40:00 ｜更新：2026-09-10 20:40:00（第六轮+：Linux 实机补跑 testbot3 接入，Linux D1-39/49/55 转 PASS）
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`（huaweicloud/huaweicloud-devkit）
> Codex 评审：`codex/review-round-01/02/03/04/05-版本升级提醒.md`

## 一、设计基线

| 项 | 值 |
|---|---|
| 正式版（旧版载体） | 1.1.2 @ `09a59b937eb3`（npm 发布 2026-09-09 11:03Z） |
| next 线（未修复副本） | 1.1.3-next.2 @ `c6c0965f0bdf`（npm 发布 2026-09-10 01:22Z） |
| dev 远端（观测） | `e2f4d2ada058`（2026-09-10 15:29） |
| FIX(sim) 修复副本 | next.2 原码 + 3 处补丁，版本号 1.1.3 受控**非官方发布线**（仅证明修复方向） |
| Node / npm | v22.23.2 / 10.9.8（本机已执行基线） |
| OS / 架构 | Windows 10 / win32 x64（已执行）；Linux/macOS/ARM 为 BLOCKED 未执行路径 |
| Shell / TTY | powershell.exe 5.1 / 非 TTY（已执行）；PTY/TTY 为 BLOCKED |
| 执行 Agent | Hermes（隔离 profile nr3-test，Hook，已执行）；OpenCode（非 Hook，已执行） |
| 风险 | upgrade 写操作仅在一次性隔离目录（.sandbox 临时构建 + hermes-profile-runtime），真实云资源零触碰 |

## 二、设计范围与分层

设计级用例 D1-26~D1-55（30 条）＋ NR3 终端展开级 25 条（`EXP-NR3-01~25`，已入唯一真源 `test-cases/expanded/`，展开级合计 132 行含历史 D5 70）。

| 分层 | 定义 | 覆盖与现状 |
|---|---|---|
| COMMON | 平台无关核心逻辑（函数级，Windows 已执行，Linux 复跑 BLOCKED） | D1-27/28/30/31/32/33/34/35/36/44/46/47/50(mock) |
| CLIENT_MATRIX | 客户端安装布局与生命周期（Hook/非 Hook） | ✅ 非 Hook=OpenCode（D1-52）；✅ Hook=Hermes（D1-52 Hermes 行，完整生命周期）；⛔ CodeArtsSpace/WorkBuddy BLOCKED |
| OS_MATRIX | 操作系统差异路径 | ✅ Windows（D1-39 FAIL/D1-52）；⛔ Linux/macOS/ARM BLOCKED |
| AGENT_E2E | 真实 Agent 宿主会话 | ✅ D1-54（Hermes 5 会话真实 E2E，PASS） |
| CROSS_PROCESS | 跨进程/跨会话状态边界 | ✅ D1-42/48/55（PROCESS_SHARED_STATE 证据）；⛔ D1-55-session NOT_RUN |

## 三、候选用例矩阵与正式矩阵

- `hermes/candidate-matrix.csv`（候选，**39 行 × 16 列**）
- `reviews/ITER-004-20260910155945/terminal-matrix.csv`（**评审确认后的顶层正式矩阵，内容与候选矩阵一致**）
- 矩阵状态分布：**PASS 29 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 5**（Linux-D1-52 升级链×1、macOS/ARM×1、CodeArtsSpace(Hook)×1、TTY×1、D1-55-session NOT_RUN×1；Linux D1-39/49/55 已由 testbot3 实机补跑转 PASS，2026-09-10 20:34）
- **D1-55 证据分级**：remote transport 无 session 支持（协议探测无 `MCP-Session-Id`，源码确认 mcp-server-remote.mjs 无 session 状态绑定）→ 当前证据级别 = `PROCESS_SHARED_STATE`；`D1-55-session` = `BLOCKED(NOT_RUN)`；D1-55b 保持 `SPEC-MISMATCH` 不改写为 PASS。

## 四、执行证据索引

| 资产 | 路径 |
|---|---|
| 探针原始日志（stdout/stderr/exit ×4 探针） | `results/ITER-004-2026-09-10/evidence/nr3/run-logs/` |
| 环境 manifest（真北京时间、沙箱源 commit、双轨统计） | `run-logs/manifest.json` |
| Hermes E2E 会话日志（s1b/s2/s3/s4/s6）与汇总 | `run-logs/hermes-e2e-s*.out.log` + `hermes-e2e-manifest.json`（s1.out.log=HER-1 修复前失败基线） |
| 探针源码 | `evidence/nr3/{d1-unit-probe,d1-mcp-loop,d1-upgrade-real,d1-49-d1-55-ext,run-probes,build-sandbox,fixture-server}.mjs` |
| 沙箱来源清单 + 结构化 commit（临时构建产物，可重建） | `.sandbox/MANIFEST.md` + `.sandbox/source-commit.json`（gitignore） |
| 执行记录（分档/多终端/裁决清单） | `results/ITER-004-2026-09-10/NR3版本升级提醒-补充执行记录.md` |

## 五、当前统计口径（第五轮统一）

- **探针观测**：120/120 checks（119 PASS + 1 `OBSERVED_SPEC_MISMATCH`(D1-55b)）+ 1 `BLOCKED(NOT_RUN)`(D1-55-session)，4 探针退出码 0；checks passed 仅表示观测到预设行为，**不等于设计级 PASS**。
- **设计级（30 条，UNASSESSED=0）**：PASS **25**／SPEC-MISMATCH **4**（D1-29/43c/46g/55b）／FAIL **1**（D1-39 修复前）／BLOCKED **0**。
- **终端矩阵（39 行）**：PASS **29**／SPEC-MISMATCH 4／FAIL 1／BLOCKED **5**（Linux D1-39/49/55 已实机补跑 PASS；D1-52 升级链受探针平台限制保留 BLOCKED）。
- **展开矩阵**：132 行（D5 70 + D3-C4 22 + D10 15 + NR3 25）。

## 六、已闭合 / 未闭合

### 已闭合（第五轮 Codex 确认有效）

- D1-54 → PASS（Hermes 5 会话真实 E2E，48 工具调用）；D1-52 Hermes(Hook) 行 → PASS；Windows OpenCode 非 Hook 保持 PASS。
- HER-1 为 Hermes 测试环境 mcp SDK 版本漂移（2.1.1 vs 声明 1.28.1）的对齐修复，**非被测项目修复**，保留为前置条件。

### 未闭合（BLOCKED 5 行 + 产品级问题，详见 status.md 与 terminal-matrix.csv）

- Linux-D1-52 升级链×1（安装链已 PASS，探针平台化补丁后重跑）、macOS/ARM×1、CodeArtsSpace(Hook)×1、TTY×1、D1-55-session×1——均含实测原因/影响/解除条件；**未伪造执行结果**。
- D1-39 P0 FAIL（FIX(sim) ≠ 产品修复）；D1-29/43c/46g/55b SPEC-MISMATCH 保留开发裁决。

## 七、待 Codex 复评 / 开发裁决 / 环境接入

1. 规格裁决 4 项：D1-29、D1-43c、D1-46g、D1-55b（含 remote transport 是否补 session 支持）。
2. D1-39：`#554` 正式修复版本发布后 Windows 全链回归（FIX(sim) 不作产品证据）。
3. Linux 测试机接入（zhangshuang/testbot1）后按本轮相同被测版本/探针补跑 4 行并归档。
4. macOS/ARM CI、CodeArtsSpace 客户端、PTY 会话接入。
5. 终端门禁判定：Windows✓ + 非 Hook(OpenCode)✓ + Hook(Hermes)✓ 已达；Linux✗——完整终端验收口径下需 Linux 实机证据后 Codex 复评放行。