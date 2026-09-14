# 测试能力提示语速查手册

> huaweicloud-devkit 测试体系的**提示语集中清单**，面向**开发与测试人员**：想触发哪个测试能力，复制下方对应提示语发给 agent 即可。
>
> 本文件只回答「**怎么下指令**」；agent 收到后按 `skills/<能力>/SKILL.md` 执行，公共前置与全局红线见仓库根 `AGENTS.md`。

## 一、能力提示语一览

| 能力 | 提示语（复制即用） | 用途 | 完整说明 |
|---|---|---|---|
| 测试设计 | `测试设计 <版本/需求>` | 为新版本/新功能设计测试用例（产出候选设计 + 用例矩阵） | [skills/test-design](skills/test-design/SKILL.md) |
| 测试执行 | `每日测试` | 执行当天全量测试（建包→执行→回填→报告→提单） | [skills/test-execution](skills/test-execution/SKILL.md) |
| 缺陷回归 | `回归 #<编号>` 或 `全链路测 #<编号>` | 对已提单缺陷定向复测 | [skills/test-regression](skills/test-regression/SKILL.md) |
| 覆盖核对 | `覆盖核对 [<维度>]` | 源码能力 ↔ 用例覆盖核对 | [skills/source-coverage](skills/source-coverage/SKILL.md) |

## 二、完整触发示例（复制即用）

### 测试设计

```
测试设计 v1.1.4
测试设计 docs/upstream-designs/570-cred-placeholder-r11/方案.md
```

- 触发条件：出现「测试设计」+「版本号 / 需求名 / 设计文档路径」。
- 只设计新版本/新功能的用例；`回归 #<编号>` 走缺陷回归，不是本能力。

### 测试执行

```
每日测试
```

- 触发条件：出现「每日测试」或「执行今天的测试任务」。
- 走当天全量执行；agent 自我识别客户端 + OS，无需你指定。

### 缺陷回归

```
回归 #614
全链路测 #562
回归 #570 用版本 1.1.4-next.5     # 带版本号 = 指定回归基线
```

- 触发条件：出现「回归」/「全链路」+「#编号」。
- 只复测该 issue 关联用例，结论落 `results/Regression/`，不 close/reopen/评论 issue。

### 覆盖核对

```
覆盖核对              # 全量核对所有维度
覆盖核对 D2           # 只核对认证维度（D2）
```

- 触发条件：出现「覆盖核对」。
- 维度可选 D1 安装升级 / D2 认证 / D3 功能 / D4 安全 / D9 协议 等。

## 三、分发到远程测试机（multica / gateway）

> 本地 agent 直接发上面第二节的短提示语即可。**分发给远程测试机的 agent** 时，提示语必须自带完整上下文——项目名 + 两个仓库地址 + 读 `AGENTS.md` + 自我识别客户端/OS——否则无上下文的 agent 不会执行。

### 每日测试（分发版）

```
【huaweicloud-devkit 测试】每日测试：首次建 ~/devkit-test/<你的客户端>/ 目录，clone 测试仓库(github.com/huaweicloud-mate/huaweicloud-devkit-test.git) + 源码仓库(github.com/huaweicloud/huaweicloud-devkit.git → hdk)。先读测试仓库根 AGENTS.md，自我识别客户端+OS，按「每日测试」能力(skills/test-execution/SKILL.md)完整执行当天测试（建包→执行→回填→报告→统一提单→push）。
```

### 缺陷回归（分发版）

```
【huaweicloud-devkit 测试】回归 #<编号>：首次建 ~/devkit-test/<你的客户端>/ 目录，clone 测试仓库(github.com/huaweicloud-mate/huaweicloud-devkit-test.git) + 源码仓库(github.com/huaweicloud/huaweicloud-devkit.git → hdk)。先读测试仓库根 AGENTS.md，自我识别客户端+OS，按「回归」能力(skills/test-regression/SKILL.md)完整执行 Step 0-4（含自己写回归用例 + 跑生成器 + 门禁），结论落 results/Regression/<日期>/问题回归-<编号>.md。只动自己负责的 issue 目录与生成器，禁手改 CSV，不 close/reopen/评论 issue。
```

## 四、维护者专属（Hermes 本机，不跨 agent 分发）

维护者（Hermes）另有一套「全链路编排」能力——把测试设计 → Codex 评审闭环 → 用例输出 → 测试验证串成一条流水线，真源在 Hermes 本机技能，**不随本仓库分发**（跨 agent 用的是上面第一节的原子能力）：

| 提示语 | 用途 |
|---|---|
| `全链路测 <版本>` | 版本需求全链路（含 Codex 评审闭环） |
| `全链路测 <版本> --light` | 跳过 Codex 评审的快速版 |
| `全链路测 #<编号>` | 问题全链路回归 |

## 五、文档分工

| 文件 | 谁读 | 内容 |
|---|---|---|
| 本文件 `PROMPTS.md` | 开发 / 测试人员 | 提示语清单 + 复制示例 + 分发模板 |
| `AGENTS.md` | 任意 agent | 能力索引 + 公共前置 + 全局红线 |
| `skills/<能力>/SKILL.md` | 任意 agent | 单个能力的完整执行流程 |