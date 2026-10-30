# 决策记录 — ITER-006（v2.0.0）3 条漂移产品侧裁决

> 记录：2026-10-29 17:xx（北京时间）｜ 来源：产品侧回复，测试经理转述

## 裁决结论（3 条 P0/P1，方向已定）

| # | 漂移 | 产品侧裁决 | 测试侧落点 |
|---|---|---|---|
| 1 | vendor gate 路由 0% | **安全增强，不放宽**；测试侧适配即可恢复 | 用例断言改为「带 `vendorConfirmed`（用户确立华为云的原文引用）+ 首次 challenge 后 retry 一次」→ 路由/工具返回正常 |
| 2 | dispatch 删除 | **breaking change，不做 shim**（v2 未发布，无真实老用户） | 用例断言改为按 v2 工厂函数（`createDevkitMcpServer` / `createLinkedDevkitServers` / `runInitializeSideEffects` / `normalizeToolCallParams`）语义 |
| 3 | remote Streamable HTTP | **规范升级，非缺陷**；仅要求发版文档明示 | 用例断言改双 Accept 头（`application/json, text/event-stream`）返回 200；单 Accept 头 406 属契约内行为；须核查发版文档已明示 Accept 头 + `Mcp-Session-Id` 要求 |

## 对候选设计的影响

- 3 条漂移从「契约依赖待冻结」转为「**按 v2 行为冻结契约，测试侧改断言适配**」。
- 唯一产品侧遗留动作：#3 remote 的「发版文档明示」需在发版时落地（测试侧可先以「文档应明示」作断言项）。
- 其余 5 条（假漂移 / 规则集 19 / 工具 56 / 真云时序 / 沙箱）维持「测试侧更新断言/指引来源」不变。