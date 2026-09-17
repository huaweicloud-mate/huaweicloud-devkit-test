# 贡献指南（分支与提交约定）

## 分支策略：主干开发（trunk-based）

- `main` 是唯一主干，所有测试资产的最新状态都在 `main`。
- 不做长期开发分支。历史遗留的 `dev` 已归档为 `dev-archived`，原 `dev` 分支已删除，请勿再向其提交。

## 两类写入通道

### 1. 测试结果上报 —— 直接 push `main`（不走 PR）

客户端 agent 的每日测试产物（`results/<客户端>/...`）、CI 自动汇总（`results/Summary/`）、看板与门禁的写回，**直接 push `main`**。这是持续自动化写入，区别于下面的资产开发。

### 2. 测试资产开发 —— 必须 feature 分支 + PR（base 必须是 `main`）

改动以下内容必须走「feature 分支 + Pull Request」，且 **base 目标必须是 `main`**：

- `test-cases/`（用例矩阵、覆盖率缺口、追踪表等真源）
- `scripts/`（门禁 / 生成 / 校验脚本）
- `docs/`（评估报告、规划文档）
- `.github/workflows/`（CI 配置）
- `AGENTS.md` / `PROMPTS.md` / `skills/`（能力体系）

流程：

1. 从最新 `main` 切分支：`git checkout main && git pull && git checkout -b feat/<描述>`
2. 开发 + 提交
3. 提 PR：base = `main`（**切勿 base 到 `dev` / `dev-archived`**）
4. 维护者 review + approve 后合入，合入后删除 feature 分支

## grapedev-bot 特别注意

- 接 Issue 开发时，feature 分支必须从**最新 `main`** 切出，PR 的 base 必须是 `main`。
- 切勿基于陈旧基线开发；`dev` 已废弃，否则会导致用例矩阵等大文件整文件冲突。