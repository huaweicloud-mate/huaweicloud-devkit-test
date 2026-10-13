# Plan: Issue #31 — refresh-dashboard push 竞态修复

## 改动清单

| # | 文件 | 改动 | 验证 |
|---|------|------|------|
| 1 | `.github/workflows/refresh-dashboard.yml` | `Commit & push dashboard` step：commit 后先 `git pull --rebase origin main`（失败→`::error::` 退出）；push 包裹 `for attempt in 1 2 3` 循环，失败且未到第 3 次时 rebase 后重试，第 3 次仍失败→`::error::` 退出 | 契约测试 + 本地 git 沙箱 |
| 2 | `test/python/test_refresh_dashboard_workflow.py`（新增） | 从 workflow YAML 提取 step 脚本原文，在 bare origin + work/racer 双克隆沙箱真实执行，PATH git 包装器注入 push 竞态 | `npm run test:python` |

## 实现顺序（TDD）

1. **RED**：先写测试 `test_refresh_dashboard_workflow.py`，对旧版 workflow（无 rebase/retry）跑 → 行为测试失败（已验证：竞态注入用例失败，证明测试有效）
2. **GREEN**：修改 workflow step 加入 rebase + retry → 13/13 全绿
3. **REFACTOR**：无（改动即最终形态）

## 测试矩阵

| 用例 | 场景 | 期望 |
|------|------|------|
| test_no_change_skips_commit_and_push | dashboard 无变动 | 跳过提交、0 次 push、远端不动 |
| test_push_success_first_attempt | 正常推送 | 第 1 次成功、远端 +1 |
| test_remote_advanced_before_push_rebases_then_succeeds | push 前远端已更新 | rebase 后第 1 次成功、看板提交在顶端 |
| test_push_rejected_once_retries_and_succeeds | 第 1 次 push 被拒 | rebase 后第 2 次成功 |
| test_push_rejected_twice_succeeds_third_attempt | 前 2 次 push 被拒 | 第 3 次成功 |
| test_push_rejected_beyond_retry_limit_fails_with_error | 远端持续竞态 | 3 次耗尽后 `::error::` 明确失败 |
| test_rebase_conflict_fails_with_clear_error | rebase 内容冲突 | `::error::rebase 失败…` 明确报错、远端不被覆盖 |
| WorkflowStructureTest（6 项） | 静态结构 | 语法合法、rebase 在 push 前、重试 ≤2、触发/concurrency 不变 |

## CI 环境差异覆盖

- CI `workflow_run` 触发时 checkout 检出 SHA（detached HEAD）——已用本地 detached HEAD 沙箱实测 `git pull --rebase origin main` + `git push origin HEAD:main` 正常工作（rebase 输出 "Successfully rebased and updated detached HEAD"，push 成功）。

## 风险

| 风险 | 缓解 |
|------|------|
| rebase 冲突 | 明确 `::error::` 失败，人工介入（dashboard.html 自动生成，概率极低） |
| 竞态窗口内远端连续更新 | 重试封顶 3 次尝试，失败信息含 ::error:: annotation |
