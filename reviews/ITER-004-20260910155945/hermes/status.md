# Hermes-Codex 测试设计交接状态

> 需求主题：`版本升级提醒 NR3`（存量用户版本升级提醒设计验收）
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`（huaweicloud/huaweicloud-devkit）
> 归档迭代：`ITER-004-20260910155945`
> 创建时间：2026-09-10T15:59:45+08:00
> 更新时间：2026-09-10T20:10:00+08:00（ISO 8601；第五轮整改完成：统一口径、清理旧结论）

## 当前状态

`HERMES_REVISION_READY`

可选状态：`HERMES_DRAFT_READY` / `CODEX_REVIEWING` / `REVIEW_CHANGES_REQUESTED` / `HERMES_REVISION_READY` / `USER_DECISION_REQUIRED` / `BLOCKED` / `TEST_DESIGN_READY`

> 说明：按 Codex 第五轮评审（`codex/review-round-05-版本升级提醒.md`，BLOCKED）完成交接材料口径统一。`FINAL_STATUS.md` 由 Codex 维护为 `BLOCKED`；`TEST_DESIGN_READY` 需 Codex 复评通过后由流程签署，Hermes 不自行填写。用户已确认 **完整终端验收** 口径（2026-09-10T19:08:11+08:00），不接受受限范围豁免；环境类 BLOCKED 不得改写为 PASS。

## 基线

| 项目 | 值 |
|---|---|
| 被测版本 | 1.1.2（旧版载体）/ 1.1.3-next.2（未修复副本）/ FIX(sim) 修复副本 1.1.3（受控，非官方发布线） |
| commit（沙箱源，source-commit.json 采集） | `09a59b937eb3`、`c6c0965f0bdf`；dev 远端观测 `e2f4d2ada058` |
| Node / npm | v22.23.2 / 10.9.8 |
| OS / 架构（已执行） | Windows 10 / win32 x64 |
| Agent/宿主（已执行） | Hermes（隔离 profile nr3-test，Hook）；OpenCode（非 Hook 代表） |
| 执行时间（已执行轮） | 2026-09-10T15:29:00+08:00 ~ 2026-09-10T19:35:00+08:00（北京时间 ISO 8601） |
| 真实操作风险 | upgrade 写操作仅落隔离目录（evidence/nr3/.sandbox 临时构建 + hermes-profile-runtime，均不入库）；真实云资源零触碰 |

## 当前统计（以 terminal-matrix.csv 与 hermes-e2e-manifest.json 为准，2026-09-10T20:10 统一）

**终端矩阵**（`terminal-matrix.csv` 与 `hermes/candidate-matrix.csv` 内容一致，**39 行 × 16 列**）：

| 状态 | 行数 | 说明 |
|---|---:|---|
| PASS | 26 | 含 D1-54（Hermes 真实会话）、D1-52 Hermes(Hook) 行 |
| SPEC-MISMATCH | 4 | D1-29 / D1-43c / D1-46g / D1-55b |
| FAIL | 1 | D1-39 修复前 Windows P0 |
| BLOCKED | 8 | Linux×4、macOS/ARM×1、CodeArtsSpace(Hook)×1、TTY×1、D1-55-session(NOT_RUN)×1 |

**展开矩阵**：`test-cases/expanded/用例矩阵-展开级.csv` **132 行**（D5 客户端 70 + D3-C4 服务 22 + D10 评测 15 + NR3 终端展开 25）。

**设计级结果（D1-26~55，30 条，UNASSESSED=0）**：

| 分类 | 数量 | 用例 |
|---|---:|---|
| PASS | 25 | D1-26/27/28/30/31/32/33/34/35/36/37/38/40/41/42/44/45/47/48/49/50/51/52/53/54 |
| SPEC-MISMATCH | 4 | D1-29、D1-43（43c）、D1-46（46g）、D1-55（55b） |
| FAIL | 1 | D1-39（修复前 Windows P0 EINVAL；FIX(sim) ≠ 产品修复） |
| BLOCKED | 0 | 设计级为 0 不覆盖终端矩阵 BLOCKED |
| UNASSESSED | 0 | — |

**探针观测**：120/120 checks（119 PASS + 1 OBSERVED_SPEC_MISMATCH(D1-55b)）+ 1 BLOCKED(NOT_RUN)(D1-55-session)，4 探针退出码 0；checks 通过 ≠ 设计级 PASS。

## 已闭合项（第五轮确认）

- **D1-54 → PASS**：隔离 Hermes profile `nr3-test` 5 个真实会话（S1 SKILL→check_update 征询/未同意不动作、S2 同意→真实 upgrade 1.1.2→1.1.3+重启提示、S3 重启生效 up_to_date、S4 拒绝 dismiss 3 天冷却落盘、S6 离线 check_failed 不阻塞 check_cli），48 次工具调用全部成功。
- **D1-52 Hermes(Hook) 行 → PASS**：Hermes Hook 客户端完整生命周期（安装→MCP 启动→提示消费→升级→重启提示/生效→拒绝→离线降级）；升级仅落隔离 `hermes-profile-runtime`。
- **Windows x64 非 Hook OpenCode**（install→upgrade→restart）保持 PASS。
- **HER-1 前置说明**：`run-logs/hermes-e2e-manifest.json` 记录的 HER-1 为 **Hermes 测试 venv 的 mcp SDK 版本漂移**（实际安装 2.1.1 vs Hermes 声明 1.28.1，致全部 MCP 工具调用报 isError AttributeError），通过对齐测试 venv（`uv pip install mcp==1.28.1 starlette==1.3.1`）后复测通过；**未改动 Hermes 代码与 default profile，不属于被测项目修复**，仅作为测试环境前置条件保留。`run-logs/hermes-e2e-s1.out.log` 为该问题修复前的失败基线（HER-1 根因佐证），正式证据以 s1b/s2/s3/s4/s6 为准。

## 未闭合项（BLOCKED，均含原因/影响/解除条件，详见 terminal-matrix.csv 各行 blockedReason）

| 终端 | 行数 | 未执行原因（2026-09-10 实测） | 解除条件 |
|---|---:|---|---|
| Linux（D1-39/49/52/55） | 4 | 无可用 Linux 测试机：120.46.40.202 / 113.44.143.91 SSH 均无凭据不可达；WSL 无发行版；Docker 未安装 | 接入 Linux 测试机（zhangshuang/testbot1）后以本轮相同被测版本与探针补跑并归档 stdout/stderr/exit/manifest |
| macOS/ARM | 1 | 无 macOS 机器/CI runner | 提供 macOS 测试机或 CI runner 后补跑 |
| CodeArtsSpace(Hook) | 1 | 无可用 CodeArtsSpace 客户端环境（120.46.40.202 不可达）；**Hermes Hook 证据不冒充 CodeArtsSpace 证据** | 接入 CodeArtsSpace 客户端后补生命周期证据 |
| TTY/PTY | 1 | 本机仅 PowerShell 管道（non-TTY）；升级确认/提示交互需真实 PTY | PTY 会话（tmux/ConPTY）执行交互流 |
| D1-55-session | 1 | NOT_RUN：被测 remote transport 无 MCP-Session-Id 与 session 状态绑定（协议探测+源码确认），无法建立真实 session | 产品/remote transport 支持 session 后复用 A/B 交错序列重测 |

## 保留的真实未闭合问题（不得改写为 PASS）

- **D1-39**：Windows P0 EINVAL 仍 FAIL；FIX(sim) 仅证明修复方向；需 `#554` 正式产品修复版本回归。
- **规格裁决 4 项**：D1-29（pre 提醒策略）、D1-43c（失败态 dismiss 伪 up_to_date+伪冷却）、D1-46g（doQuery reject 防御封装）、D1-55b（hintConsumed 会话级 vs 进程级）——保留开发/产品裁决清单（见执行记录 §八）。

## 证据路径

- 顶层正式矩阵：`reviews/ITER-004-20260910155945/terminal-matrix.csv`（39 行 × 16 列）
- 候选矩阵：`hermes/candidate-matrix.csv`（与此文件内容一致）
- NR3 展开级真源：`test-cases/expanded/用例矩阵-展开级.csv`（132 行；gen_matrix.py 可复现）
- 探针原始日志（stdout/stderr/exit）与 manifest：`results/ITER-004-2026-09-10/evidence/nr3/run-logs/`（20 个文件，含 `manifest.json` 真北京时间+沙箱源 commit）
- Hermes E2E 会话日志 + 汇总：`run-logs/hermes-e2e-s1b/s2/s3/s4/s6.out.log` + `hermes-e2e-manifest.json`（s1.out.log=HER-1 修复前失败基线）
- 执行记录：`results/ITER-004-2026-09-10/NR3版本升级提醒-补充执行记录.md`（第五轮已统一口径）
- 设计交接：`hermes/test-design.md`（本目录）

## 放行状态

- 当前：`HERMES_REVISION_READY`（Hermes 侧整改完成）
- 等待 Codex 第六轮复评；`TEST_DESIGN_READY` 未满足（终端 BLOCKED 8 行 + 产品失败/规格裁决未闭合）
- 未开始正式全量 devkit-test 执行

## 仍需 Codex 复核 / 开发裁决 / 环境接入

1. 规格裁决 4 项：D1-29、D1-43c、D1-46g、D1-55b（含 D1-55-session 的产品 session 支持决策）。
2. D1-39：`#554` 正式修复版本发布后 Windows 全链回归。
3. Linux 测试机接入（zhangshuang/testbot1）后按矩阵补跑 4 行并归档证据。
4. macOS/ARM CI、CodeArtsSpace 客户端、PTY 会话接入。
5. 环境接入完成后 Codex 复评，确认终端门禁（至少 Windows/Linux + Hook/非 Hook 实覆盖）闭合。