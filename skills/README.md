# 测试技能归档目录

本目录归档 Hermes 生成的、与 huaweicloud-devkit 测试相关的自定义技能（SKILL.md + 可选 references / templates / scripts）。

## 与运行时技能的关系（避免双份漂移）

| 位置 | 性质 | 说明 |
|---|---|---|
| `hermes-home/skills/` | **运行时真源** | Hermes 实际加载、执行技能；`skill_manage` 创建/修改都落这里 |
| 本目录 `skills/` | **git 归档副本** | 每次生成或大改技能后，把真源快照同步到这里，随仓库 git 追溯/分享/备份 |

- Hermes 运行时**只从 hermes-home/skills/ 加载**，本目录是纯归档，不被加载。
- 本目录性质同 `test-cases/versions/`（冻结切片）：用于追溯、团队复用、丢失恢复。
- 修改技能一律在 hermes-home 真源改（`skill_manage`），改完同步归档到本目录，保持两者一致，避免「文档提及≠实际」。

## 归档规则

- 子目录名 = 技能名（如 `huaweicloud-devkit-full-pipeline/`），内含完整 SKILL.md。
- 归档方式：`Copy-Item "<hermes-home>\skills\testing\<技能名>" -Recurse -Destination "skills\"`。
- 新增/大改技能后，同步更新根 README 目录导航里的技能说明。

## 技能清单

| 技能 | 用途 |
|---|---|
| `huaweicloud-devkit-full-pipeline` | 一句话触发全链路：版本需求/问题 分流 → 测试设计(评审闭环) → 用例输出(生成器+门禁) → 测试验证(执行回填+报告+提单) |