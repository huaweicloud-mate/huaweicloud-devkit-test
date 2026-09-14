# 测试能力库（prompt-as-skill）

本目录是**任意 agent 通用的测试能力库**：把「测试设计 / 测试执行 / 缺陷回归 / 源码覆盖核对」等能力写成**一篇篇自包含的能力文档（SKILL.md）**。任何 agent（OpenCode / Codex / CodeArtsAgent / CodeArtsWork / WorkBuddy / DSH / OfficeAce / Hermes / OpenClaw / AtomCode）clone 本仓库后，读根目录 `AGENTS.md` 的「能力索引」，按提示语翻开对应 `skills/<能力>/SKILL.md` 即可完成对应工作——**不依赖 Hermes 本机、不依赖任何特定客户端工具**。

## 与 AGENTS.md 的分工

| 位置 | 性质 | 内容 |
|---|---|---|
| `AGENTS.md`（仓库根） | **入口** | 能力索引表（提示语 → 能力文档）+ 公共前置（仓库地址/专属目录/自我识别/凭证/真云 AK-SK）+ 全局红线 + 状态口径 |
| `skills/<能力>/SKILL.md` | **能力文档** | 单个能力的完整流程：触发语 + 前置 + 步骤 + 命令 + 门禁 + 红线 + 陷阱 |

> 约定：能力文档是**能力级完整说明**，AGENTS.md 的索引只列「提示语 + 一句话用途 + 文档路径」，不重复展开正文，避免两处漂移。

## 能力地图

| # | 能力 | 目录 | 触发语（一句话） | 使用者 | 状态 |
|---|---|---|---|---|---|
| 1 | 测试设计 | `skills/test-design/SKILL.md` | `测试设计 <版本/需求>` | 设计者 agent | ✅ 已落地 |
| 2 | 测试执行（每日） | `skills/test-execution/SKILL.md` | `每日测试` | 执行 agent | ✅ 已落地 |
| 3 | 缺陷回归 | `skills/test-regression/SKILL.md` | `回归 #<编号>` / `全链路测 #<编号>` | 执行 agent | ✅ 已落地 |
| 4 | 源码覆盖核对 | `skills/source-coverage/SKILL.md` | `覆盖核对` | 设计者 agent | ✅ 已落地 |

> 维护者专属（HTML 汇总 / GitHub Actions 自动汇总 / 邮件派发 / 资产治理与结构门禁联动）不纳入本库，保留在 Hermes 本机技能；本库只收录**需要跨 agent 分发**的能力（设计者 + 执行者 agent 都能干的活）。

## 能力文档写作规范（去 Hermes 化）

一篇能力文档必须满足，否则对非 Hermes 的 agent 不可用：

1. **自包含**：agent 读了就能干，不依赖额外上下文/记忆/本机技能。仓库地址、两个 clone 命令、自我识别、凭证来源都要在文档内写全（或明确指向 AGENTS.md 对应节）。
2. **去 Hermes 化**：不得出现 `skill_manage` / `hermes-home` / `delegate_task` 等 Hermes 专属工具；评审闭环用通用语义（「由维护者统一评审，见 docs/06」），不假设 `codex exec` 存在。
3. **命令通用**：只用 `bash` / `powershell` / `git` / `gh` / `python` / `node`，任何 agent 环境都有；推送凭证统一走 `HDK_GH_TOKEN` 或 token URL，不绑 `pushm` 别名。
4. **触发语唯一且可识别**：一句话命令式，与 AGENTS.md 能力索引一一对应；触发语含歧义时文档内写清「如何判类型」。
5. **结尾必带**：命令速查表 + 红线 + 陷阱三段，供 agent 执行时快速对照。

## 与 Hermes 本机技能的关系

| 位置 | 性质 |
|---|---|
| `hermes-home/skills/` | Hermes 本机**运行时真源**（含本机专属工具：Codex exec 评审、delegate_task 编排、DPAPI 凭证等） |
| 本目录 `skills/` | **跨 agent 分发能力库**（去 Hermes 化后的子集 + 通用化），随 git 分发到所有 agent |

- Hermes 本机技能与本目录**方向相反不互通**：本机技能面向「Hermes 一个 agent + 本机专属工具」，本目录面向「任意 agent + 通用工具」。
- 新增/修改能力时，两个位置各自维护：本机技能留在 `skill_manage`，跨 agent 能力落到本目录；内容重叠的部分以本目录（分发给所有 agent 的版本）为准做去 Hermes 化改写。

## 既有归档的去向

曾保留的 `huaweicloud-devkit-full-pipeline/`（Hermes「全链路编排」技能归档副本，含 Codex 评审闭环等 Hermes 专属工具）已**移除**：

- 其「流水线 A（版本需求设计）」→ 由 `test-design/` 承载（去 Hermes 化）
- 其「流水线 B（问题回归）」→ 由 `test-regression/` 承载
- 其「编排层 / Codex 评审闭环」→ 仍是 Hermes 维护者专属，真源保留在 `hermes-home/skills/`（不丢）