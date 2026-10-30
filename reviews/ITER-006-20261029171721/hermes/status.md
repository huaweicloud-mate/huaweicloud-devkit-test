# Hermes ITER-006 交接状态

- 状态：`HERMES_DRAFT_READY`（候选设计完成，待 Codex 评审；**不得标记 TEST_DESIGN_READY**）
- 评审目录：`reviews/ITER-006-20261029171721/`
- 本轮纪律：只产出设计文档 + 候选矩阵 + 决策记录；**未执行测试、真实探针、真云操作、真实升级**。

## SUT 基线（被测项目，P1 可复现）

- SUT：源码仓 v2 分支 `fcfe047f`（2.0.0，npm 未发布）
- 工具注册源：`plugins/huaweicloud-core/src/tool-definitions.ts` → **56 个**
- 设计输入：`results/version/v2.0.0/`（FINDINGS.md 8 条漂移 + 产品反馈已裁决）

## 本轮产出

1. `v2-契约漂移-用例影响清单.md` — 8 条漂移 → 用例映射（已更新为精确 69 条口径）
2. `decision-log.md` — 3 条 P0/P1 漂移产品侧裁决结论
3. `test-design.md` — 候选设计（基线/范围/放行检查 A/B/C 对照/待复审项）
4. `candidate-matrix.csv` — 69 条受影响设计级用例的迁移后 27 列全文

## 裁决结论（已落 decision-log）

| 漂移 | 裁决 |
|---|---|
| vendor gate | 安全增强，不放宽；测试侧带暗号 + challenge retry 适配 |
| dispatch 删除 | breaking change，不做 shim（v2 未发布无老用户） |
| remote Streamable HTTP | 规范升级非缺陷；发版文档明示 Accept 头 + Mcp-Session-Id |

## 统计

- 受影响用例：**69 条设计级**（vendor_gate 59 / dispatch 3 / fake-move 3 / toolcount 2 / rule 1 / remote 1）
- 不受影响：143 条设计级保持原样
- 展开级迁移：评审放行后 Step 3 随生成器处理（继承自 69 条的展开行）

## 待 Codex 复审

- vendor gate「⓪建立 vendor 确认」步骤机械可执行性
- dispatch 3 条 `dispatchTool`/工厂命名与 v2 源码一致性
- 59 条 vendor_gate 影响范围复验（是否漏判/多判）
- D10-4「9 deny + 10 warn」数值核对

## 仍未解决

- 唯一外部项：v2 发版文档明示 remote Accept 头 + Mcp-Session-Id（产品侧动作，不阻塞本设计放行）。