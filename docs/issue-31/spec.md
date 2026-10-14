# Spec: Issue #31 — refresh-dashboard 工作流推送失败修复

> 来源：Issue Agent 发布的 Spec（https://github.com/huaweicloud-mate/huaweicloud-devkit-test/issues/31#issuecomment-6144877966），本文为落地归档版。

## 目标

修复 `refresh-dashboard` GitHub Actions 工作流中 `git push origin HEAD:main` 因 CI 并发竞态被远端拒绝的问题，使看板自动刷新恢复正常。

## 根因

`refresh-dashboard` 工作流（2026-10-12 02:08 UTC 运行）checkout 时 main 为 `c64b9b70`，push 时远端 main 已更新为 `4e3290519`（其他提交合入），非 fast-forward 推送被拒：

```
! [remote rejected] HEAD -> main (cannot lock ref 'refs/heads/main': is at 4e3290519... but expected c64b9b70...)
```

## 范围

### In

- 修改 `.github/workflows/refresh-dashboard.yml` 的 `Commit & push dashboard` step：
  - `git commit` 后、`git push` 前插入 `git pull --rebase origin main`
  - `git push origin HEAD:main` 包裹在重试循环中（≤2 次重试，共 3 次尝试）
  - 每次重试前再次 `git pull --rebase origin main`
  - rebase 冲突时以明确 `::error::` 信息失败

### Out

- 不改动 `scripts/gen_dashboard.py` 渲染逻辑
- 不改动触发方式（workflow_run / schedule / workflow_dispatch 三路保持）
- 不迁移 GitHub create-or-update-file API
- 保留现有 `concurrency` 配置不变

## 验收标准

1. push step 在 main 被更新时能自动 rebase 并重试，不直接失败
2. 重试次数 ≤ 2 次，超过后正常失败报错
3. dashboard 无变动时仍跳过提交
4. 工作流连续 3 次运行无 push 失败（合入后观察项）
5. rebase 冲突时以明确错误信息失败

## 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 修复方案 | rebase+retry | 最小改动、直接解决根因；concurrency 不防其他工作流的提交；API 方案过重 |
| 重试次数 | 2 次 | CI 竞态窗口短，2 次足够覆盖 |
| rebase 冲突 | 直接失败 | dashboard.html 自动生成，冲突概率极低；发生应人工介入 |
