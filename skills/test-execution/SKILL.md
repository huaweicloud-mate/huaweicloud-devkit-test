---
name: test-execution
description: "huaweicloud-devkit 每日测试执行能力：自我识别客户端+OS → prepare_env 拉最新 → init_day 建包 → P0→P1→P2 执行+证据落盘 → 回填执行状态/时间 → 出报告+FINDINGS → 每10分钟提报 → 全量测完统一提单+push。Use when: 收到「每日测试」提示语，执行当天测试任务。"
version: 1.0.0
tags: [testing, huaweicloud, devkit, daily, execution]
---

# huaweicloud-devkit 每日测试执行能力

每个客户端 agent 按统一流程完成当天测试任务：复制用例 → 执行 → 回填 → 出报告 → 提单 → push。

## 触发语

```
每日测试
```

出现「每日测试」即触发本能力（也可触发于「执行今天的测试任务」）。**完成标准** = 本机 `results/<你的客户端>/<日期>-<IP>/<OS>/` 已含「测试报告.md + 3 份 CSV」且已 push 远端；只读文档 / 只建目录 / 中途退出都不算完成。

## 前置（统一见根 AGENTS.md §0）

clone 两仓库、自我识别客户端/OS、推送凭证 `HDK_GH_TOKEN`、真云 AK/SK（`~/.config/huaweicloud/credentials.json`），统一见仓库根 `AGENTS.md` 的「专属目录」「0. 自我识别 + 前置准备」节，此处不重复展开。

**每次执行测试前，必先跑 `python scripts/prepare_env.py --update` 拉最新**——一天可能不止执行一次，每次都要重新取最新，勿因「今天跑过」跳过：
- 测试仓库 pull main 最新（含其他 agent 最新改动/脚本）
- 源码仓库 hdk checkout 到 npm 最新包（默认 latest 正式版）对应 commit
- `npm install -g huaweicloud-devkit` 装最新正式包（latest）

## 六步执行流程

### 1. 建当日执行包
```bash
python scripts/init_day.py <客户端> <OS>
```
生成 `results/<客户端>/<日期>-<IP>/<OS>/`：复制 **daily 精选**用例 CSV（设计级 81 + 展开级 71 + 追踪表），追加「执行状态」+「evidencePath」空列。机器 IP 自动检测（`HDK_MACHINE_IP` 环境变量 → `~/.hdk_ip` → socket），多机同客户端靠 `<日期>-<IP>` 区分。

### 2. 执行
按 **P0 → P1 → P2** 逐条执行副本 CSV 用例，证据（probe 脚本 + stdout.log）落盘 `evidence/<case-id>/`。**执行中持续输出进度**（当前用例/已跑数/耗时），长用例也输出中间状态——长时间无输出会被调度器判 idle 杀掉。

### 2.5 展开级已按客户端+OS 预筛（init_day 建包即过滤，不再下发非本客户端用例）

`init_day.py` 复制展开级时已按「`agent` 列（执行客户端）+ `OS` 列（执行系统）」预筛，**你拿到的展开级用例都是归你执行、且匹配你 OS 的**，不会再有「别的客户端 / 别的 OS」的展开级。

- 展开级直接执行，**无需再判「不适用本客户端/OS」**——那部分在建包时已剔除（不再下发）。
- `NOT_RUN` 只用于「归你执行但你明确没跑」的场景（P0 铁律：P0 不得 NOT_RUN/留空）。
- `BLOCKED` 只用于「归你执行，但环境/权限/凭证阻塞跑不了」，必须写 blockedReason。
- 设计级用例（无精确 agent/OS 列，全量下发）仍按「终端覆盖类型 / 展开规则代表段」判定执行归属；不适用本 OS/凭证的标 NOT_RUN 或 BLOCKED，不得虚标 PASS。

### 3. 回填执行状态 + 执行时间
- 「执行状态」枚举：`PASS`（有证据）/ `FAIL`（不符预期，记根因）/ `BLOCKED`（环境阻塞，记 blockedReason）/ `SPEC-MISMATCH`（契约漂移）/ `NOT_RUN`。
- 「执行时间」：北京时间紧凑 14 位 `YYYYMMDDHHmmss`，**与「执行状态」同一动作回填**（执行完即落）。
- **NOT_RUN 纪律**：P0 一律不得 NOT_RUN/留空（P0 必测，要么 PASS/FAIL 要么 BLOCKED）；NOT_RUN 仅限「明确不适用本客户端/OS」且写原因；「环境不满足」标 BLOCKED 而非 NOT_RUN。
- 回填后跑 `python scripts/verify_coverage.py <客户端> <OS>`：P0 出现 NOT_RUN/空、或 NOT_RUN+空总占比 > 15% → 不达标，补齐重跑。

### 4. 出报告 + 缺陷清单
- 按 `templates/daily-agent-report.md` 输出 `<客户端>-<模型>-测试报告.md`，八节：①测试概述 ②执行摘要 ③状态汇总 ④缺陷清单 ⑤阻塞项 ⑥安全/红线 ⑦资源释放 ⑧遗留建议。
- 每个 FAIL/SPEC 按 `templates/findings.md` 写 `FINDINGS.md`：**级别 + 描述(现象) + 断言(唯一可判定) + 根因(文件:行号) + 证据**，这是 `file_issue.py` 的解析输入，格式必须严格。

### 5. 每 10 分钟提报（只提交自己目录）
```bash
python scripts/hourly_sync.py <客户端> <OS> --interval 600
```
只 `git add` 自己 `results/<客户端>/`，**不碰 Summary**（维护者统一 `build_summary.py` 生成）。

### 6. 统一提单 + 提交（全量测完后必做）
```bash
# ① 提单（FINDINGS.md 非空 → 源码仓库 huaweicloud/huaweicloud-devkit 1 个合并 issue，附报告）
python scripts/file_issue.py results/<客户端>/<日期>-<IP>/<OS>/FINDINGS.md <版本> --type=daily
# ②③ 提交 push（token 来自 HDK_GH_TOKEN 或 ~/.hdk_token，不依赖 gh CLI）
git add results/<客户端> && git commit -m "test: <客户端> <OS> 执行回填"
T=$(cat ~/.hdk_token 2>/dev/null || echo "$HDK_GH_TOKEN"); git -c credential.helper= push "https://x-access-token:$T@github.com/huaweicloud-mate/huaweicloud-devkit-test.git" main
```
**只 push results 不提单 = 未完成**；有 FAIL/SPEC 缺陷必须提单。

## 门禁（机械校验，虚报作废重跑）

- `python scripts/verify_no_fake_pass.py <客户端> <OS>`：标 PASS 必有 evidencePath 证据。
- `python scripts/verify_coverage.py <客户端> <OS>`：P0 无 NOT_RUN/空 + NOT_RUN+空占比 ≤ 15%。

## 红线

1. **真云**：最低配置创建 → 测后删除并归零验证 → 只删本次创建资源。
2. **缺陷**：先记根因（文件+行号），全量测完统一提单（合并 1 单），勿拆单/勿未测完就提/勿只 push 不提单。
3. **PASS 门禁**：标 PASS 必须①实测②证据落盘③evidencePath 回填，未执行禁标 PASS。
4. **环境阻塞**：标 BLOCKED + blockedReason，不得假装 PASS。
5. **目录权限**：只改 `results/<你的客户端>/`，不碰 Summary / 其他客户端 / test-cases 母版。
6. **完成门禁**：完成 = 测试报告 + 3 CSV（已回填）+ PASS 证据 + 已 push + 有缺陷时已提单；即使环境阻塞也必须回填 BLOCKED + 最小报告 + push，不得零产出。

## 状态口径

| 状态 | 含义 | 约束 |
|---|---|---|
| PASS | 通过，有证据 | ①实测②证据落盘③evidencePath 回填 |
| FAIL | 不符预期 | 记根因(文件:行号) |
| BLOCKED | 环境/权限阻塞 | 必须写 blockedReason；「环境不满足」用 BLOCKED 而非 NOT_RUN |
| SPEC-MISMATCH | 实现与设计契约漂移 | 记漂移点 |
| NOT_RUN | 未执行 | 仅限明确不适用本客户端/OS；P0 一律不得 NOT_RUN；每条写原因 |

## 命令速查

| 用途 | 命令 |
|---|---|
| 初始化 agent | `python scripts/init_agent.py <客户端>` |
| 环境准备+拉最新 | `python scripts/prepare_env.py --update` |
| 建执行包 | `python scripts/init_day.py <客户端> <OS>` |
| PASS 门禁 | `python scripts/verify_no_fake_pass.py <客户端> <OS>` |
| 覆盖率门禁 | `python scripts/verify_coverage.py <客户端> <OS>` |
| 每 10 分钟提报 | `python scripts/hourly_sync.py <客户端> <OS> --interval 600` |
| 统一提单 | `python scripts/file_issue.py <FINDINGS.md> <版本> --type=daily` |

## 陷阱

- `platform.system()` 判断 OS；客户端名要真实，别冒充（脚本有 CLIENTS 白名单，冒充会被挡）。
- 报告标题含 `Agent+模型名`；逐用例结果已回填 CSV，报告不重复逐用例。
- PowerShell `>` 产 UTF-16，探针用 `Out-String`；`Get-Content` 中文用 `-Encoding UTF8`。
- push 前 `git fetch origin main && git rebase origin/main`（多 agent 并发 push 会推进 main）；核验用「commit 是否入 main 历史」，勿用 `main==<sha>` 硬断言。