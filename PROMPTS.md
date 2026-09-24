# 测试能力提示语速查手册

> huaweicloud-devkit 测试体系的提示语清单，面向开发与测试人员。
>
> **核心原则：每个提示语都自带前置条件（测试仓库 + 源码仓库）**。新加入的人或 agent 拿到任意一条即可开工，无需额外背景——没有前置的短提示语（如单纯一句「每日测试」）会因缺乏上下文而无法执行、瞎猜或拒绝执行。

## 一、通用前置（所有完整提示语的固定开头）

新 agent 或新人不了解测试环境。任何提示语都必须先交代下面两件事再下指令，否则 agent 拿不到上下文：

```
【huaweicloud-devkit 测试】前置准备：
1. 第一次在 ~/devkit-test/<你的客户端名>/ 目录下 clone 两个仓库：
   - 测试仓库：git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git   （结果/用例/脚本）
   - 源码仓库：git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk        （源码检查/根因定位/写探针）
2. 读测试仓库根目录 AGENTS.md（能力索引 + 公共前置 + 全局红线）。
3. 自我识别：客户端名（OpenCode / Codex / CodeArtsAgent / CodeArtsSpace / WorkBuddy / DSH / OfficeAce / Hermes / OpenClaw / AtomCode 之一）、OS（Windows / Linux）。
```

> 两个仓库都要有：测试仓库管「测什么、结果记哪」，源码仓库（hdk）管「源码长啥样、bug 定位到哪一行」。

## 二、能力完整提示语（复制即用，已内含通用前置）

下面五条整段复制发给 agent 即可。本地 agent、远程测试机 agent、新加入的 agent 均适用。

### 1. 测试设计

```
【huaweicloud-devkit 测试】前置准备：
1. 第一次在 ~/devkit-test/<你的客户端名>/ 目录下 clone 两个仓库：
   - 测试仓库：git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git
   - 源码仓库：git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk
2. 读测试仓库根目录 AGENTS.md（能力索引 + 公共前置 + 红线），自我识别客户端名与 OS。

任务：测试设计 <版本/需求>。为 huaweicloud-devkit 新版本/新功能设计测试用例。
- 读设计文档 docs/upstream-designs/<版本>/（或指定路径），固定范围（版本 commit / 代码变更 / 多终端基线）。
- 按 skills/test-design/SKILL.md 产出候选测试设计：test-design.md + candidate-matrix.csv + status.md（写 HERMES_DRAFT_READY，禁止自写 TEST_DESIGN_READY）。
- 评审放行（TEST_DESIGN_READY）由维护者统一执行。
```

### 2. 测试执行（每日）

```
【huaweicloud-devkit 测试】前置准备：
1. 第一次在 ~/devkit-test/<你的客户端名>/ 目录下 clone 两个仓库：
   - 测试仓库：git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git
   - 源码仓库：git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk
2. 读测试仓库根目录 AGENTS.md（能力索引 + 公共前置 + 红线），自我识别客户端名与 OS。

任务：每日测试。按 skills/test-execution/SKILL.md 完整执行当天测试：
init_day 建包 → P0→P1→P2 执行 + 证据落盘 → 回填执行状态/时间 → 出测试报告 + FINDINGS → 每 10 分钟提报 → 全量测完统一提单 + push。
只提交自己 results/<你的客户端>/ 目录，不碰 Summary、不碰其他客户端、不改 test-cases 母版。
```

### 3. 缺陷回归

```
【huaweicloud-devkit 测试】前置准备：
1. 第一次在 ~/devkit-test/<你的客户端名>/ 目录下 clone 两个仓库：
   - 测试仓库：git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git
   - 源码仓库：git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk
2. 读测试仓库根目录 AGENTS.md（能力索引 + 公共前置 + 红线），自我识别客户端名与 OS。

任务：回归 #<编号>。对已提单缺陷定向复测，按 skills/test-regression/SKILL.md 完整执行 Step 0-4：
拿 issue 上下文 → 确认修复真合入（git log -S 核实代码真落地）→ 复现 + 根因定位 → 写回归用例 → 跑生成器 + 门禁 → 定向复测 → 结论落 results/Regression/<日期>/问题回归-<编号>.md。
只动自己负责的 issue 目录与生成器，禁手改 CSV，不 close/reopen/评论 issue。
```

### 4. 源码覆盖核对

```
【huaweicloud-devkit 测试】前置准备：
1. 第一次在 ~/devkit-test/<你的客户端名>/ 目录下 clone 两个仓库：
   - 测试仓库：git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git
   - 源码仓库：git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk
2. 读测试仓库根目录 AGENTS.md（能力索引 + 公共前置 + 红线），自我识别客户端名与 OS。

任务：覆盖核对 [<维度>]。按 skills/source-coverage/SKILL.md 核对用例是否覆盖源码能力：
提取源码能力清单 → 对照用例覆盖点 → 正确性核对（函数/字段/错误码）→ 覆盖率核对（硬/弱缺口），缺口落用例（新 ID + 优先级 + 门禁更新）。
```

### 5. 版本全量测试

```
【huaweicloud-devkit 测试】前置准备：
1. 第一次在 ~/devkit-test/<你的客户端名>/ 目录下 clone 两个仓库：
   - 测试仓库：git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git
   - 源码仓库：git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk
2. 读测试仓库根目录 AGENTS.md（能力索引 + 公共前置 + 红线），自我识别客户端名与 OS。

任务：版本全量测试 <版本>。对某版本跑全量用例集（区别于每日精选），按 skills/test-version/SKILL.md 执行，**全程优先用仓库现成脚本，勿手写 path-rewrite / 真云探针**：
1. `prepare_env.py --update`（拉最新 + 对齐版本基线）
2. `init_day.py <客户端> <OS> --full`（母版全量建包：设计级 179 + 展开级按客户端+OS 预筛）
3. 复用参考探针：`python scripts/reuse_probes.py <客户端> <OS> [--ref OpenCode]`（自动 path-rewrite，勿手写 stage 脚本）
4. 真云实机：`node scripts/realcloud_e2e.mjs --case=D3-C1,D3-C2,D3-C3,D3-C6,D3-B7,D3-B8`（finally 归零，只删本次创建）
5. D9/D10 harness：`node eval/harness/protocol-probe.mjs` + `run-eval.mjs`（仓库现成，无需写探针）
6. 回填执行状态 + `verify_no_fake_pass.py` + `verify_coverage.py` 双门禁
7. 出报告（标题含版本号 + **三层证据口径**：真实执行/源码核对/未执行 BLOCKED，勿混报单一通过率）+ `file_issue.py` 历史查重后统一提单
8. 归档 `results/version/<版本>/{Windows,Linux}/`（放**实质**测试报告 + CSV + FINDINGS，不只 README 指针）

只提交自己 `results/<你的客户端>/` 目录；真云禁用 mock/假跑、必须真机执行（环境已具备）；历史查重命中不重复提单。
```

## 三、简短版对照（仅本地已初始化 agent 可用）

本地 agent 已 clone 两仓库、已读过 AGENTS.md 时，可只用短提示语；**新人 / 新 agent 一律用第二节完整版**。

| 能力 | 完整版（新人 / 新 agent） | 简短版（仅本地老 agent） |
|---|---|---|
| 测试设计 | 第二节 · 1 | `测试设计 <版本/需求>` |
| 测试执行 | 第二节 · 2 | `每日测试` |
| 缺陷回归 | 第二节 · 3 | `回归 #<编号>` |
| 覆盖核对 | 第二节 · 4 | `覆盖核对 [<维度>]` |
| 版本全量测试 | 第二节 · 5 | `版本全量测试 <版本>` |

## 四、维护者专属（Hermes 本机，不跨 agent 分发）

| 提示语 | 用途 |
|---|---|
| `全链路测 <版本>` | 版本需求全链路（含 Codex 评审闭环） |
| `全链路测 <版本> --light` | 跳过 Codex 评审的快速版 |
| `全链路测 #<编号>` | 问题全链路回归 |

## 五、文档分工

| 文件 | 谁读 | 内容 |
|---|---|---|
| 本文件 `PROMPTS.md` | 开发 / 测试人员 | 提示语清单（自带前置） + 复制示例 |
| `AGENTS.md` | 任意 agent | 能力索引 + 公共前置 + 全局红线 |
| `skills/<能力>/SKILL.md` | 任意 agent | 单个能力的完整执行流程 |