# Hermes-Codex 测试设计交接状态

> 需求主题：`版本升级提醒 NR3`（存量用户版本升级提醒设计验收）
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`（huaweicloud/huaweicloud-devkit）
> 归档迭代：`ITER-004-20260910155945`
> 创建时间：2026-09-10T15:59:45+08:00
> 更新时间：2026-09-10T17:30:00+08:00（ISO 8601）

## 当前状态

`HERMES_REVISION_READY`

可选状态：`HERMES_DRAFT_READY` / `CODEX_REVIEWING` / `REVIEW_CHANGES_REQUESTED` / `HERMES_REVISION_READY` / `USER_DECISION_REQUIRED` / `BLOCKED` / `TEST_DESIGN_READY`

> 说明：本轮已完成 Codex 第二轮评审（`codex/review-round-02-版本升级提醒.md`，REVIEW_CHANGES_REQUESTED）的 8 项修订。`TEST_DESIGN_READY` 需 Codex 第三轮复评通过后由流程签署，Hermes 不自行填写。

## 基线

| 项目 | 值 |
|---|---|
| 被测版本 | 1.1.2（旧版载体） / 1.1.3-next.2（未修复副本） / FIX(sim) 修复副本 1.1.3（受控，非官方发布线） |
| 分支 / commit | 固定 commit：`09a59b937eb3`、`c6c0965f0bdf`、dev 远端观测 `e2f4d2ada058` |
| Node / npm | v22.23.2 / 10.9.8 |
| OS / 架构 | Windows 10 / win32 x64 |
| Agent/宿主 | Hermes（本机）；OpenCode 布局用于 CLIENT_MATRIX 生命周期 |
| 执行时间 | 2026-09-10T15:29:00+08:00 ~ 2026-09-10T17:20:00+08:00 |
| 真实操作风险 | upgrade 写操作仅在一次性隔离 HOME（evidence/nr3/.sandbox，gitignore）；真实云资源零触碰 |

## 轮次统计（设计级 D1-26~55，30 条）

| 分类 | 数量 | 用例 |
|---|---|---|
| PASS | 24 | D1-26/27/28/30/31/32/33/34/35/36/37/38/40/41/42/44/45/47/48/49/50/51/52/53 |
| SPEC-MISMATCH | 4 | D1-29、D1-43（43c）、D1-46（46g）、D1-55（55b，本轮新增实锤） |
| FAIL | 1 | D1-39（修复前 Windows P0 EINVAL；FIX(sim) 通过≠产品修复） |
| BLOCKED | 1 | D1-54（Hermes 真实会话） |
| UNASSESSED | 0 | — |

断言级：120/120 PASS（函数级 59 + MCP 闭环 31 + 真实升级 16 + D1-49/55 扩展 14），全部可由 `results/ITER-004-2026-09-10/evidence/nr3/run-logs/*.stdout.log` 逐项追溯。

## 证据路径

- 原始运行日志/退出码/环境 manifest：`results/ITER-004-2026-09-10/evidence/nr3/run-logs/`（`manifest.json` 含命令、起止时间、Node/npm、OS/arch、shell/TTY、gitHead、沙箱路径、断言汇总）
- 探针源码（4 个探针 + runner + 沙箱构建 + fixture）：`evidence/nr3/*.mjs`
- 执行记录（分档/多终端矩阵/裁决清单）：`results/ITER-004-2026-09-10/NR3版本升级提醒-补充执行记录.md`
- 设计交接：`hermes/test-design.md`、`hermes/candidate-matrix.csv`（16 列 × 37 行）

## 放行检查（Codex 第二轮门禁）

| 门禁 | 状态 |
|---|---|
| hermes/ 三份正式交接文件更新 | ✅ |
| D1-49、D1-55 补齐或显式 BLOCKED | ✅（D1-49 PASS；D1-55 SPEC 实锤 + 观察项） |
| Windows/Linux + Hook/非 Hook 多终端矩阵 | ✅（分层 COMMON/CLIENT_MATRIX/OS_MATRIX/AGENT_E2E/CROSS_PROCESS；未执行路径均显式 BLOCKED 含原因/影响/解除条件） |
| D1-39 P0 FAIL、D1-29/43c/46g SPEC 保留；FIX(sim) 不写作产品修复 | ✅ |
| 原始 stdout/stderr/退出码/环境清单 + 断言可追溯 | ✅ |
| 正文时间 ISO 8601、文件名紧凑时间戳 | ✅ |
| 状态 = HERMES_REVISION_READY（非 TEST_DESIGN_READY） | ✅ |

## 仍需 Codex 复核 / 开发裁决

1. 规格裁决 4 项：D1-29（pre 提醒策略）、D1-43c（失败态 dismiss 伪 up_to_date+伪冷却）、D1-46g（doQuery reject 防御封装）、D1-55b（hintConsumed 会话级 vs 进程级）。
2. D1-39 上游 `#554` 固定修复版本回归（FIX(sim) 不作为产品证据）。
3. D1-54 Hermes 真实会话 E2E 解除条件满足后补验。
4. Linux/macOS/ARM/Hook 客户端路径测试机接入计划。