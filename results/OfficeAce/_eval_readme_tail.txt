## 执行方式

- **真实 Agent 会话评测**（D10-1/2/5/9）→ `run-agent-eval.mjs` 驱动 dsh headless（真实 LLM）
- **确定性路由评测**（D10-3）→ `run-eval.mjs` 直调 serviceCatalog，无需 LLM
- 安全用例按红线执行：只读/无破坏性，写操作须经审批确认

## 状态

- [x] ITER-003：目录结构 + eval-set-v1.csv（15 条）+ 本文档 —— 评测基建 v1 **建成**
- [x] ITER-004（2026-09-19）：`run-agent-eval.mjs` 真实 Agent 会话 harness + eval-set-v2.csv（三维度）+ 首轮分类基线（read 4/4、诊断 1/1、执行 1/1、plan/deploy 抽样达标）—— **建成**
- [ ] ITER-005+：写操作类（plan/deploy）全量基线 + 跨客户端（OpenCode/Codex 等 CDP 会话）扩展 + trends 趋势门