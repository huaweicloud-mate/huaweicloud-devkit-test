# 状态 — ITER-006（v2.0.0 测试设计）

> 更新时间：2026-10-29 17:17:21（北京时间）

## 当前状态机

`RANGE_FIXED`（范围已固定 + 影响清单已产出，未到候选设计终稿）

## 变更摘要

1. 范围固定：被测 = 源码仓 v2 分支 `fcfe047f`（2.0.0，TS 化重构，工具面 43→56）。
2. 产出 `v2-契约漂移-用例影响清单.md`（本目录）：8 条漂移 → 用例 ID 逐条映射。
   - 3 条待产品裁决（vendor gate / dispatch 删除 / remote Streamable HTTP）→ 标「契约依赖待冻结」
   - 5 条测试侧已接受 → 待发版更新断言/指引来源
3. 受影响用例：约 40 条设计级 + 若干展开级。

## 待 Codex 复核项 / 待用户裁决项

- 3 个 P0/P1 漂移需产品侧裁决（触发条件是否放宽、是否给 dispatch 兼容层、remote 是否明示 breaking change）——详见 `results/version/v2.0.0/产品反馈-v2-契约漂移.md`。

## 下一步

进入完整候选设计（`skills/test-design/SKILL.md` Step 1）：产 `test-design.md` + `candidate-matrix.csv` + 本文件改 `HERMES_DRAFT_READY`。