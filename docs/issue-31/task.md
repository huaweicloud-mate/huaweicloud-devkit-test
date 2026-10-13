# Task: Issue #31 — refresh-dashboard push 竞态修复

## 任务状态

- [x] 需求理解（Spec 已由 Issue Agent 发布，本任务照 Spec 实现）
- [x] 代码实现（workflow step rebase + retry）
- [x] 测试（test/python/test_refresh_dashboard_workflow.py，13 用例）
- [x] 文档（docs/issue-31/spec.md、plan.md）
- [x] 全量回归（npm run test:python 34/34；npm run test 5 失败为预存问题，与本次改动无关——git stash 基线复测同样失败）
- [ ] 合入后观察：工作流连续 3 次运行无 push 失败（验收项 4，需 main 上实际运行）

## 执行记录

1. 提取 Spec（Issue #31 评论）→ 确认范围：仅 `.github/workflows/refresh-dashboard.yml` 的 `Commit & push dashboard` step
2. 修改 step：commit 后 `git pull --rebase origin main`（冲突→`::error::` exit 1）→ `for attempt in 1 2 3` push 循环（失败且 attempt<3 → rebase 重试；attempt=3 失败 → `::error::` exit 1）
3. 新增契约测试：从 workflow 提取 step 脚本真实执行 + git 沙箱竞态注入
4. 有效性验证：对旧版 workflow（无修复）跑测试 → 竞态用例失败（测试有效）；修复版 13/13 全绿
5. detached HEAD 验证：CI workflow_run 触发检出 SHA 的场景实测 rebase+push 正常
6. YAML 语法校验（js-yaml）通过

## 提交

- commit 1: `fix: #31 refresh-dashboard push 前先 rebase 并支持重试`（workflow + 测试 + 文档）
