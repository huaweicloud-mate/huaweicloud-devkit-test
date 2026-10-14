# 任务收尾补充：workflow 文件推送受限的交付方式（2026-10-13）

## 现象

`git push` 携带 `.github/workflows/refresh-dashboard.yml` 变更的提交时被 GitHub 拒绝：

```
! [remote rejected] feat/issue-31 -> feat/issue-31
  (refusing to allow a Personal Access Token to create or update workflow
   `.github/workflows/refresh-dashboard.yml` without `workflow` scope)
```

## 根因

本任务注入的 bot 凭据为 fine-grained PAT（`grapedev-bot`），未授予 `workflow` 权限。GitHub 规定：任何包含 `.github/workflows/` 下文件变更的 push，要求凭据具备 `workflow` scope，否则整个 push 被拒（即使同批其他文件无需该权限）。

## 影响与交付方式

- 修复的**主体**（契约测试 + 方案文档）走 `feat/issue-31` 分支 + PR 正常交付；
- **workflow 变更**以补丁交付：`docs/issue-31/workflow-fix.patch`（`git apply` 即生效），随 PR 提交；
- 测试已内置守卫：workflow 未应用修复时，13 个用例自动 skip（`skipUnless`），不会在 CI 上报假失败；应用补丁后自动激活。
- 端到端验证（纯净 origin/main 检出）：补丁可干净应用 → 13/13 全绿；未应用 → 13 用例 skip，不阻断 CI。

## 解除条件

维护者在 GitHub 上为 grapedev-bot 的 fine-grained PAT 勾选 Permissions → Workflows → "Read and write permissions"，或换用带 `workflow` scope 的 classic PAT；随后可直接提交 workflow 文件，无需补丁交付。

## 应用补丁步骤（维护者）

```bash
git checkout main && git pull
git apply docs/issue-31/workflow-fix.patch
git add .github/workflows/refresh-dashboard.yml
git commit -m "fix: #31 refresh-dashboard push 前先 rebase 并支持重试"
git push origin main
```

## 验证记录（本会话）

| 验证项 | 结果 |
|--------|------|
| patch base blob vs origin/main workflow blob | `2cc22139e` 完全一致，`git apply --check` 通过 |
| 干净 origin/main + patch + 测试 | 13/13 ok |
| 干净 origin/main 无 patch（现状 CI） | 13 skipped，OK |
| 本工作树（修复已应用） | 13/13 ok |
| `npm run test:python` 全量回归 | 34/34 ok |
| `bash -n` step 脚本语法 | 通过（含在结构测试内） |
