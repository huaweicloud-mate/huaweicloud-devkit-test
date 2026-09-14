---
name: test-regression
description: "huaweicloud-devkit 缺陷回归能力：拿 issue 上下文→确认修复真合入→复现+根因定位→写回归用例→跑生成器+门禁→定向复测(函数级探针/单测/真机三层)→结论落 results/Regression。Use when: 收到「回归 #<编号>」/「全链路测 #<编号>」提示语，对已提单缺陷做定向回归。"
version: 1.0.0
tags: [testing, huaweicloud, devkit, regression, defect]
---

# huaweicloud-devkit 缺陷回归能力

对已提单缺陷做**定向回归**。区别于「每日测试」的全量执行：本能力只复测该 issue 关联用例，结论落 `results/Regression/`。

## 触发语

```
回归 #<编号>                  # 例：回归 #614
全链路测 #<编号>              # 例：全链路测 #562
回归 #<编号> 用版本 1.1.4-next.5   # 带版本号的，该版本即回归基线（checkout 到其 commit）
```

出现「回归」「全链路」+「#编号」即触发本能力（走回归路线，**不是每日全量**）。**不自行 close/reopen/评论任何 issue（维护者统一操作）**。

## 前置（统一见根 AGENTS.md §0）

clone 两仓库、自我识别客户端/OS、推送凭证 `HDK_GH_TOKEN`、真云 AK/SK，统一见仓库根 `AGENTS.md` 的「专属目录」「0. 自我识别 + 前置准备」节，此处不重复展开。

**每次回归前必先跑 `python scripts/prepare_env.py --update` 拉最新**（源码仓库 checkout 到 latest 正式版对应 commit、测试仓库 pull 最新、装最新正式包；勿因「今天跑过」跳过）。

## Step 0 定位 + 确认修复是否真合入

1. **拿缺陷上下文**（从编号 → 明确缺陷，别裸跑）：
   - 上游 issue 全文：`gh issue view <编号> --repo huaweicloud/huaweicloud-devkit`；无 gh 时 `curl -s https://api.github.com/repos/huaweicloud/huaweicloud-devkit/issues/<编号>`（issue 公开可读）。
   - 本地归档回归用例：`ls test-cases/issues/<编号>-*/`，读 `回归用例.md` 的「根因 + 复现步骤 + 断言契约 + 修复实现 commit」。
2. **开发称「已修复」先确认代码真落地（勿信自报）**：
   ```bash
   git -C ../hdk log --all -S "<关键函数名>" --oneline -5   # 全历史空 = 未实现（方案冻结 ≠ 已实现）
   npm view huaweicloud-devkit version gitHead        # 拿当前 latest 正式版 commit sha
   git -C ../hdk fetch origin <sha> && git -C ../hdk checkout <sha>   # npm 发布常领先 GitHub 推送
   ```
3. `git -C ../hdk show <sha> --stat` 锁定改动文件/函数 = 回归靶心。

## Step 1 复现 + 根因定位

按回归用例复现，根因定位到 `文件:行号`，记 `FINDINGS.md`（断言字段必填）。

## Step 2 回归用例设计

- 产出 `test-cases/issues/<编号>-<slug>/回归用例.md`：复现步骤 + 精确断言 + 结论模板（复现/已修复/仍存在）。
- P0 缺陷同步进 daily 盯防：改 `test-cases/gen_daily.py` 纳入该用例 → `cd test-cases && python gen_daily.py` + 门禁。

## Step 3 用例输出（跑生成器 + 门禁，禁手改 CSV）

- 新增/改动落到生成器（改 `gen_matrix.py`/`gen_tracing.py`）：`add()` 定义 + `BATCH_TS` + `NEW_REVIEW_IDS_*` 三处联动，`verify_new` 行数列断言同步。
- `cd test-cases/design && python gen_matrix.py && python gen_tracing.py` → `python verify_new.py`（exit 0）+ `python scan_gaps.py`（GATE-PASS）。
- 版本冻结快照 + 补「迭代测试设计.md」；同步 README 数量 + check_docs。

## Step 4 测试验证（定向复测，验证分层递增）

`init_day` 建包 → 只跑该 issue 关联回归用例 → 回填「执行状态」+「执行时间」。

**验证分层（证据强度递增，优先 1+2，必要时 3）**：
1. **函数级探针**（快、可复现）：临时 `.mjs` 直接 import 被测模块跑断言，跑完删；隔离 `HUAWEICLOUD_HOME` 临时目录避免污染真实凭证；脱敏 SK 只出前 3 位 + len。
2. **既有单测**：`cd ../hdk && node --test test/<相关>.test.mjs`（exit 0 = 全绿）。
3. **真机**（需独立环境时）：SSH 到测试机跑（凭据读「测试机账号.txt」，不打印）。

- 证据落 `results/Regression/<日期>/evidence/<编号>-<slug>/`（探针 + stdout.log；回归证据按 issue 归档，不散在客户端目录）。
- 结论三选一：**已修复** / **仍存在** / **BLOCKED**（环境未齐写 blockedReason）。
- 结论报告落 `results/Regression/<日期>/问题回归-<编号>.md`（复现/已修复/仍存在 + 证据链接），同步回填 `test-cases/issues/<编号>-<slug>/回归用例.md`「回归结论」段。

## SPEC-MISMATCH 发现法（回归必查）

读方案的**设计意图**，对照**代码实现**找语义冲突——尤其「方案新语义 vs 代码旧遗留逻辑」。典型：方案强调「env 三件套真值 = 平台注入 → env 兜底」，代码却残留旧「防 STS 遮蔽 → S1 优先」（`credentials.mjs:165-172`）。发现后：①记录回归用例标 SPEC-MISMATCH + 落点 ②反馈开发（独立于本缺陷，可另开 issue）。

## 码道（codearts）真机验证（不碰真实配置）

码道机器 `testbot2=124.70.78.131`（有 `~/.codeartsdoer`）。构造占位符/假值场景用 `CODEARTS_PROJECT_DIR` 伪造：设 `CODEARTS_PROJECT_DIR=<临时目录>`、在该目录放 `.codeartsdoer/mcp/mcp_settings.json` 即可喂假场景（`readCodeArtsCredentials` 的 `searchDirs[0]=process.env.CODEARTS_PROJECT_DIR`）；`isCodeArtsContext()` 仍因 homedir 真目录存在而命中码道分支，真机上下文成立且不动真实 mcp_settings。

## 权限例外（有别于「每日测试」只读）

- **可写** `test-cases/issues/<编号>-<slug>/` 与生成器（gen_matrix/gen_tracing/gen_daily）——仍禁手改 CSV。
- **可写** `results/Regression/<日期>/`（问题回归-<编号>.md + evidence）——勿落 `results/<客户端>/` 每日目录。
- **写前先拉最新**（`prepare_env.py --update`）；**push 前 fetch + rebase**。
- **一个 issue 一个 agent 领走**，避免多机并发写同一 issue；不 close/reopen/评论 issue。

## 维护者收尾（汇总各机结论后统一做，回归 agent 不碰）

1. 归档 + push：更新 `test-cases/issues/README.md` 清单行 → commit → rebase → token URL push。
2. 评论上游 issue：`_issue<编号>_comment.md`（UTF-8）→ `gh issue comment <编号> --repo huaweicloud/huaweicloud-devkit --body-file <文件>`（body-file 自读 UTF-8，中文不乱）。「已修复」→ close；「仍存在/部分修复」→ 保持 open + 追加复验评论。

## 红线

1. 真云：最低配置 → 测后删除归零 → 只删本次创建。
2. 缺陷：全量测完统一 1 单附报告，勿拆单/勿未测完就提。
3. PASS 门禁 + 状态纪律：不洗 FAIL/SPEC-MISMATCH/BLOCKED 为 PASS；不自签评审结论。
4. 凭证零进入 git；证据只存脱敏内容。

## 命令速查

| 用途 | 命令 |
|---|---|
| 上游 issue 全文 | `gh issue view <编号> --repo huaweicloud/huaweicloud-devkit` |
| 确认修复真落地 | `git -C ../hdk log --all -S "<函数名>" --oneline -5` |
| 拿最新包 commit | `npm view huaweicloud-devkit version gitHead` |
| 既有单测 | `cd ../hdk && node --test test/<相关>.test.mjs` |
| 生成器+门禁 | `cd test-cases/design && python gen_matrix.py && python gen_tracing.py && python verify_new.py && python scan_gaps.py` |
| 建回归包 | `python scripts/init_day.py <客户端> <OS>` |

## 陷阱

- `git log -S "<关键词>"` 全历史空 = 功能未实现（方案冻结 ≠ 已实现，勿当覆盖缺口）。
- 占位符/遮蔽类 bug：truthy 判断 `if(ak && sk)` 会误判占位符/脱敏值——回归断言要验证「真值」而非「非空」。
- 隔离 `HUAWEICLOUD_HOME` 临时目录，避免探针污染/读取真实凭证。
- 证据目录按 issue 归档 `Regression/<日期>/evidence/<编号>-<slug>/`，勿散落到每日客户端目录。