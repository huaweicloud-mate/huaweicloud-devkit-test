# Hermes ITER-006 交接状态

- 状态：**`TEST_DESIGN_READY`**（OpenCode Round 04 终审通过，设计可放行）
- 评审目录：`reviews/ITER-006-20261029171721/`
- 评审者：OpenCode（`deepseek-gw/deepseek-v4-pro-0813`），替代 Codex（Codex 侧 429 限流不可用）
- 本轮纪律：只产出设计文档 + 候选矩阵 + 决策记录；**未执行测试、真实探针、真云操作、真实升级**。

## SUT 基线（被测项目，P1 可复现）

- SUT：源码仓 v2 分支 `fcfe047f`（2.0.0，npm 未发布）
- 工具注册源：`plugins/huaweicloud-core/src/tool-definitions.ts` → **56 个**
- 设计输入：`results/version/v2.0.0/`（FINDINGS.md 8 条漂移 + 产品反馈已裁决）

## 本轮产出（Round 03 提交版）

1. `v2-契约漂移-用例影响清单.md` — 8 条漂移 → 用例映射（76 条）
2. `decision-log.md` — 3 条 P0/P1 漂移产品侧裁决结论
3. `test-design.md` — 候选设计（76 条受影响）
4. `candidate-matrix.csv` — **76 条**受影响设计级用例的迁移后 27 列全文

## 统计

- 受影响用例：**76 条设计级**（vendor_gate 64 / dispatch 3 / remote 1 / fake-move 3 / rule 1 / toolcount 4）
- 不受影响：**136 条设计级**保持 1.x 原样（212 − 76）
- 展开级迁移：评审放行后 Step 3 随生成器处理（继承自 76 条的展开行）

## Round 01 整改记录（全部落实，Round 02 已核验）

| # | 整改项 | 结果 |
|---|---|---|
| 1 | 多判 3 条 `D2-24/D2-26/D2-3`（auth_sync 未 gate）移出 | ✅ |
| 2 | 漏判 vendor gate 7 条 `D10-3/D4-24/D6-8/D2-1/D3-A3/D3-A4/D3-C9` 纳入 | ✅ |
| 3 | 漏判 tool-count 2 条 `D1-56/D5-3` 纳入（40→56 工具） | ✅ |
| 4 | `D9-12` 的 `findSkillsRoot` → `SKILLS_ROOT` | ✅ |
| 5 | 影响清单 §4 假漂移表去掉 `D9-10` | ✅ |
| 6 | `D2-23/D2-27` 关联工具归因复核 → 书面排除 | ✅（排除论证成立） |

## Round 02 评审结论与整改（OpenCode 2026-10-30 15:23 → Hermes 整改）

结论：`REVIEW_CHANGES_REQUESTED`（3 项，已闭合）

| # | 严重度 | 整改项 | 完成情况 |
|---|---|---|---|
| 1 | P1 | 新漏判 `D1-71`（sandbox_expose_tunnel，步骤①触及 gated `sandbox_connect`）纳入 | ✅ 确认纳入（三件套已完整）；关联工具列补 `sandbox_connect` |
| 2 | P1 | 工作区矩阵与文档计数不一致 + 错误包含已排除的 `D2-23/D2-27` | ✅ 从候选矩阵移除 `D2-23/D2-27`，收敛为 76 行 / 64 vendor gate；文档同步 76 |
| 3 | P2 | `D5-3`/`D1-56` 残留「40 工具」注记 | ✅ 核查后已无「40 工具」残留（均已为 56） |

### D2-23/D2-27 书面排除理由（Round 02 复核成立）

- `D2-23`：关联工具列写 `auth_status`，但操作步骤实为「查询 agent 注册状态」，指引来源 `agent-registration.getAgentRegistrationStatuses` 为内部函数直调，不经 MCP 工具层、不触发 vendor gate → 排除。
- `D2-27`：关联工具列写 `auth_status`，但操作步骤为 KooCLI 版本解析（`koocli-version.*`），与 `auth_status` 无关 → 排除。

## 仍未解决

- 唯一外部项：v2 发版文档明示 remote Accept 头 + Mcp-Session-Id（产品侧动作，不阻塞本设计放行）。


## Round 03 评审结论与整改（OpenCode 2026-10-30）

结论：`REVIEW_CHANGES_REQUESTED`（仅剩 1 处残留）

- ✅ D2-23/D2-27 已移除、无「40 工具」残留、计数一致（76/64）、D1-71 三件套完整
- ❌ D1-71 关联工具列未补 `sandbox_connect` → 已补为 `sandbox_expose_tunnel/sandbox_connect`（磁盘读回确认）

## Round 04 终审结论（OpenCode 2026-10-30 16:15）

结论：**`TEST_DESIGN_READY`**（可放行）

- D1-71 关联工具列 = `sandbox_expose_tunnel/sandbox_connect`，无残留；前几轮整改项全部落实，无机器可闭合整改项残留。
- 文件：`reviewer/review-round-04-契约迁移复审.md`

## 最终统计（放行口径）

- 受影响用例：**76 条设计级**（vendor_gate 64 / dispatch 3 / remote 1 / fake-move 3 / rule 1 / toolcount 4）
- 不受影响：**136 条**（212 − 76）
- 外部依赖：仅 v2 发版文档明示 remote Accept 头 + Mcp-Session-Id（产品侧动作，不阻塞放行）
