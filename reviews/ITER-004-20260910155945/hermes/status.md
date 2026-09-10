# Hermes-Codex 测试设计交接状态

> 需求主题：`版本升级提醒 NR3`（存量用户版本升级提醒设计验收）
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`（huaweicloud/huaweicloud-devkit）
> 归档迭代：`ITER-004-20260910155945`
> 创建时间：2026-09-10T15:59:45+08:00
> 更新时间：2026-09-10T19:40:00+08:00（ISO 8601；Hermes Agent E2E / Hook 客户端真实证据已补齐）

## 当前状态

`HERMES_REVISION_READY`

可选状态：`HERMES_DRAFT_READY` / `CODEX_REVIEWING` / `REVIEW_CHANGES_REQUESTED` / `HERMES_REVISION_READY` / `USER_DECISION_REQUIRED` / `BLOCKED` / `TEST_DESIGN_READY`

> 说明：本轮按 Codex 第三轮评审（`codex/review-round-03-版本升级提醒.md`，REVIEW_CHANGES_REQUESTED）完成七项整改。`TEST_DESIGN_READY` 需 Codex 第四轮复评通过后由流程签署；代表终端硬门槛（Linux + Hook）未达前不自行放行。

## 基线

| 项目 | 值 |
|---|---|
| 被测版本 | 1.1.2（旧版载体） / 1.1.3-next.2（未修复副本） / FIX(sim) 修复副本 1.1.3（受控，非官方发布线） |
| commit（沙箱源，由 source-commit.json 采集） | `09a59b937eb3`、`c6c0965f0bdf`；dev 远端观测 `e2f4d2ada058` |
| Node / npm | v22.23.2 / 10.9.8 |
| OS / 架构 | Windows 10 / win32 x64（本机）；Linux/macOS/ARM 为 BLOCKED 未执行路径 |
| Agent/宿主 | Hermes（本机）；OpenCode（非 Hook 客户端代表）；Hermes/CodeArtsSpace（Hook，BLOCKED） |
| 执行时间 | 2026-09-10T15:29:00+08:00 ~ 2026-09-10T17:48:00+08:00（北京时间 ISO 8601） |
| 真实操作风险 | upgrade 写操作仅在一次性隔离 HOME（evidence/nr3/.sandbox，gitignore）；真实云资源零触碰 |

## 轮次统计

**探针观测**（run-logs v2，4 探针退出码 0）：120/120 checks passed = **119 PASS + 1 OBSERVED_SPEC_MISMATCH（D1-55b）**，另含 1 BLOCKED(NOT_RUN)（D1-55-session）。checks 仅表示观测到预设行为，不等于设计级 PASS。

**设计级结果（D1-26~55，30 条）**：

| 分类 | 数量 | 用例 |
|---|---|---|
| PASS | 25 | D1-26/27/28/30/31/32/33/34/35/36/37/38/40/41/42/44/45/47/48/49/50/51/52/53/54 |
| SPEC-MISMATCH | 4 | D1-29、D1-43（43c）、D1-46（46g）、D1-55（55b 进程级共享实锤） |
| FAIL | 1 | D1-39（修复前 Windows P0 EINVAL；FIX(sim) 通过≠产品修复） |
| BLOCKED | 0 | — |
| UNASSESSED | 0 | — |

> D1-54 于 2026-09-10T19:35+08:00 由**真实 Hermes 会话证据**转 PASS（用户 19:08 决策完整验收后补跑）：隔离 profile `nr3-test` 5 会话（SKILL→check_update→征询→同意升级 1.1.2→1.1.3→重启生效→拒绝 dismiss 3 天冷却→离线不阻塞），48 工具调用全成功；同套证据构成 Hermes **Hook 客户端完整生命周期**（D1-52 Hermes 行 PASS）。前置 HER-1（venv mcp SDK 2.1.1 与 hermes 声明 1.28.1 漂移致全部 MCP 工具调用 isError 错误）已对齐修复并复测。

**矩阵展开路径 BLOCKED**：8 行（terminal-matrix.csv：Linux×4、macOS/ARM×1、CodeArtsSpace(Hook)×1、TTY×1、D1-55-session NOT_RUN×1；均含原因/影响/解除条件，2026-09-10 实测无 Linux 测试机/[SSH 无凭据]/WSL 无发行版/Docker 未装）。

## 证据路径

- 顶层正式矩阵（评审确认后副本）：`reviews/ITER-004-20260910155945/terminal-matrix.csv`（38 行 × 16 列，与 hermes/candidate-matrix.csv 一致）
- NR3 展开级真源：`test-cases/expanded/用例矩阵-展开级.csv`（131 行 = D5 历史 70 + NR3 终端展开 24；gen_matrix.py 可复现）
- 原始运行日志/退出码/环境 manifest：`results/ITER-004-2026-09-10/evidence/nr3/run-logs/`（v2：真北京时间、沙箱源 commit、双轨统计）
- 探针源码：`evidence/nr3/*.mjs`（含 v2：session 探测、SPEC 分档输出）
- 执行记录：`results/ITER-004-2026-09-10/NR3版本升级提醒-补充执行记录.md`
- 设计交接：`hermes/test-design.md`、`hermes/candidate-matrix.csv`、`hermes/status.md`（本文件）

## 放行检查（Codex 第三轮门禁对照）

| 门禁 | 状态 |
|---|---|
| 顶层 terminal-matrix.csv | ✅ 38 行，与最终候选矩阵一致 |
| NR3 展开级同步（不覆盖 D5 历史，带来源/生成时间） | ✅ 131 = 70 + 24；verify_review_html ALL PASS、check_docs 0 问题 |
| D1-55 session 建模（降级/新增验证项/保留 SPEC） | ✅ PROCESS_SHARED_STATE + D1-55-session NOT_RUN(BLOCKED) + D1-55b SPEC 保留 |
| run-probes 时区与 commit 采集修正 + 重新运行 | ✅ 真北京时间、沙箱源 commit、v2 日志已重跑归档 |
| 探针 checks 与设计级结果分离表述 | ✅ 120/120（含 1 OBSERVED_SPEC）与 24/4/1/1 分列 |
| 未解决项保留（39/29/43c/46g/55b/54/Linux/Hook/macOS/TTY） | ✅ 全部保留并写明原因/影响/解除条件，未伪造执行结果 |
| 文件修改边界（不改 codex/、不提前 TEST_DESIGN_READY） | ✅ |

## 仍需 Codex 第四轮复核 / 开发裁决

1. 规格裁决 4 项：D1-29、D1-43c、D1-46g、D1-55b（含 remote transport 是否补 session 支持）。
2. D1-39 上游 `#554` 固定修复版本回归（FIX(sim) 不作产品证据）。
3. D1-54 与 Hook 客户端：测试专用 Hermes 实例安装后的真实会话 E2E / Hook 生命周期。
4. Linux/macOS/ARM/TTY 接入安排（zhangshuang/testbot1、macOS CI、PTY）。
5. 代表终端硬门槛协商：Windows + 非 Hook OpenCode 已覆盖；Linux 与真实 Hook 是否纳入放行前提。