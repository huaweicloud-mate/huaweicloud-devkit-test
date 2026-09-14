# AGENTS — huaweicloud-devkit 每日测试执行指南

> 每个客户端 agent（OpenCode/Codex/CodeArtsAgent/CodeArtsWork/WorkBuddy/DSH/OfficeAce/Hermes/OpenClaw/AtomCode）读本文件即开始执行当天测试。**不自行 close/reopen/评论任何 GitHub issue（由维护者统一操作）**；收到带 issue 编号的「全链路/回归」指令时，按下方「问题单号回归」节执行（走回归路线，而非每日全量）。
>
> **完成标准** = 本机 `results/<你的客户端>/<日期>-<IP>/<OS>/` 已含「测试报告.md + 3 份 CSV」且已 push 远端；只读文档 / 只建目录 / 中途退出都不算完成。

## 仓库地址

| 仓库 | URL | 用途 |
|---|---|---|
| 测试仓库 | `https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git` | 结果记录 + 测试用例 + 脚本 |
| 源码仓库 | `https://github.com/huaweicloud/huaweicloud-devkit.git` | 源码检查/根因定位/写探针（clone 到 `hdk`） |
| 被测包 | `huaweicloud-devkit@next`（npm） | 真实场景黑盒测试 |

## 专属目录（预置条件，必须）

每个智能体须新建**与自己同名的专属目录** `~/devkit-test/<智能体>/`，用于保存两个仓库：

```
~/devkit-test/<智能体>/
├── huaweicloud-devkit-test/     # 测试仓库 clone
└── hdk/                          # 源码仓库 clone
```

例：`~/devkit-test/OpenCode/`、`~/devkit-test/Codex/`。**切勿共用同一目录**，否则多 agent 互相覆盖冲突。

clone 命令（在 `~/devkit-test/<智能体>/` 目录内执行）：
```bash
mkdir -p ~/devkit-test/OpenCode && cd ~/devkit-test/OpenCode   # 换成你的智能体名
git clone https://github.com/huaweicloud-mate/huaweicloud-devkit-test.git
git clone https://github.com/huaweicloud/huaweicloud-devkit.git hdk
npm install -g huaweicloud-devkit@next
```

首次可用 `python scripts/init_agent.py <客户端>` 自动建该目录结构（含测试仓库 + 源码仓库）。

## 0. 自我识别 + 前置准备

> **推送凭证 + 初始化（分散部署必读）**：每台 agent 机器**首次**先跑 `python scripts/init_agent.py`（交互输入 fine-grained token，自动 clone 仓库 + 装 next 包 + 验证环境）。
> 之后每次 push 凭证二选一：① 环境变量 `HDK_GH_TOKEN`；② 本机 gh 登录有 huaweicloud-mate write 权限的账号。
> 脚本优先读 `HDK_GH_TOKEN`，否则尝试本机 gh shuangheaven token。

1. **自我识别身份**（无需人工告知）：
   - **客户端名**：从你的运行环境/系统提示/进程名判断你是 10 个客户端中的哪一个——OpenCode、Codex、CodeArtsAgent、CodeArtsWork、WorkBuddy、DSH、OfficeAce、Hermes、OpenClaw、AtomCode。
   - **OS**：用 `platform.system()` 或运行环境判断 Windows / Linux。
   - 识别不出：**显式输出失败原因后退出**（禁止静默退出、禁止瞎猜冒充其他客户端、禁止假装完成）。无人值守环境没有「询问用户」通道，卡住会被调度器判 idle 杀掉。
2. 前置（`python scripts/prepare_env.py --update` 一键完成）：
   - 测试仓库 pull main 最新
   - 源码仓库 `hdk` checkout 到 npm `@next` 对应 commit（源码检查用）
   - `npm install -g huaweicloud-devkit@next` 安装最新被测包（黑盒测试用）

> **环境 PATH**：node/npm/gh 若装在用户目录（`~/nodejs/bin`、`~/bin`），非交互 shell 不自动加载。执行前先 `export PATH=$HOME/nodejs/bin:$HOME/bin:$PATH`（脚本 `prepare_env.py` 会自动加入 PATH，无需手动）。

> **镜像 fallback**：GitHub clone/pull 失败时，脚本自动 fallback 到 GitCode 镜像 `gitcode.com/hd-vector/huaweicloud-devkit-test.git`（国内快）。需本机配 `GITCODE_TOKEN` 环境变量或 `~/.gitcode_token` 文件。

> **真云凭证（AK/SK）**：真云 E2E 用例（建删资源、审计等）需华为云 AK/SK，固定位置 `~/.config/huaweicloud/credentials.json`（格式 `{ak, sk, region}`，统一账号 hw018619646，已预置于每台测试机）。执行前可用 `python scripts/prepare_env.py` 自检。**读不到 AK/SK 时，真云类用例标 `BLOCKED`（blockedReason=`无 AK/SK`），禁止 mock 假跑、禁止标 PASS**。

## 1. 建当日执行包

```bash
python scripts/init_day.py <客户端> <OS>
# 例：python scripts/init_day.py OpenCode Windows
```
生成 `results/<客户端>/<日期>-<IP>/<OS>/`：复制 **daily 精选**用例 CSV（设计级 81 + 展开级 71 + 追踪表），并为设计级/展开级**追加「执行状态」+「evidencePath」空列**供回填（daily 纯设计定义、无执行态）。**机器 IP 自动检测**（环境变量 HDK_MACHINE_IP → ~/.hdk_ip 文件 → socket 自动），多机同客户端靠 `<日期>-<IP>` 区分，互不冲突。**用例来源是 daily 精选（非母版全量 179），daily 由 `test-cases/gen_daily.py` 生成**。

## 2. 执行

按 **P0 → P1 → P2** 逐条执行副本 CSV 用例，证据（probe 脚本 + stdout.log）落盘 `results/<客户端>/<日期>-<IP>/<OS>/evidence/<case-id>/`。

**执行中每步持续输出进度**（当前用例 / 已跑数 / 耗时），长用例中途也输出中间状态——长时间无输出会被调度器判 idle 杀掉，前功尽弃。

## 3. 回填执行状态

结果回填副本 CSV 两列：
- **「执行状态」列**，枚举：`PASS`（有证据）/ `FAIL`（不符预期，记根因）/ `BLOCKED`（环境阻塞，记 blockedReason）/ `SPEC-MISMATCH`（契约漂移）/ `NOT_RUN`。
- **「执行时间」列**：执行该用例时的北京时间，紧凑 14 位 `YYYYMMDDHHmmss`（如 `20260913185030`），**与「执行状态」同一动作回填**（每条用例执行完即落时间戳，追踪表同样）。

**NOT_RUN 纪律（覆盖率红线，违反即不达标）**：
- **P0 用例一律不得 NOT_RUN 或留空**——P0 必测，要么 PASS/FAIL，要么 BLOCKED（写 blockedReason）。
- NOT_RUN 仅限「明确不适用本客户端/本 OS」的用例，且每条必须写原因；「环境不满足」应标 **BLOCKED** 而非 NOT_RUN。
- 回填后**必须**跑 `python scripts/verify_coverage.py <客户端> <OS>`：P0 出现 NOT_RUN/空、或 NOT_RUN+空 总占比 > 15% → 判定执行不达标，补齐被跳过用例后重跑才算完成。

## 4. 出测试报告

按**统一模板** `templates/daily-agent-report.md` 输出 `results/<客户端>/<日期>-<IP>/<OS>/<客户端>-<模型>-测试报告.md`，八节固定：① 测试概述 ② 执行摘要 ③ 状态汇总（设计级+展开级） ④ 缺陷清单（级别+描述+精确断言+根因文件行号+证据） ⑤ 阻塞项 ⑥ 安全/红线 ⑦ 资源释放 ⑧ 遗留建议。**所有 agent 用同一模板、字段完整**；逐用例执行态已回填副本 CSV「执行状态」+「evidencePath」列，报告不再重复逐用例结果。

**同时记录缺陷清单**：每个 FAIL/SPEC 缺陷按 `templates/findings.md` 写 `results/<客户端>/<日期>-<IP>/<OS>/FINDINGS.md`，每项须含 **级别 + 描述(现象) + 断言(唯一可判定断言) + 根因(文件:行号) + 证据**；这是提单脚本 `file_issue.py` 的解析输入，**格式必须严格**，否则自动提单失败。提单 issue 须含完整缺陷清单 + 测试报告链接（`file_issue.py` 自动带出）。

## 5. 每 10 分钟提报（只提交自己目录）

```bash
# 长时执行时，每 10 分钟跑一次防丢失（脚本只 git add 自己 results/<客户端>/，不碰 Summary）：
python scripts/hourly_sync.py <客户端> <OS> --interval 600
```

> **你不生成 Summary**。Summary 由维护者统一跑 `python scripts/build_summary.py` 汇总生成，你只负责自己的 `results/<客户端>/` 目录，别碰 Summary/其他客户端（避免共享文件冲突）。

## 6. 统一提单 + 提交（全量测完后，必做）

> **提单是必须动作，不是可选**：凡测试有 FAIL/SPEC-MISMATCH 缺陷（FINDINGS.md 非空），全量测完后**必须**先①提单（向源码仓库 `huaweicloud/huaweicloud-devkit` 提 1 个合并 issue），再②③提交 push results。**只 push results 不提单 = 本次任务未完成**。

```bash
# ① 提单（读 FINDINGS.md → 源码仓库 1 个合并 issue，附测试报告）
python scripts/file_issue.py results/<客户端>/<日期>-<IP>/<OS>/FINDINGS.md <版本>
# ②③ 提交 push results（token 来自 HDK_GH_TOKEN 或 ~/.hdk_token，不依赖 gh CLI）
git add results/<客户端> && git commit -m "test: <客户端> <OS> 执行回填"
T=$(cat ~/.hdk_token 2>/dev/null || echo "$HDK_GH_TOKEN"); git -c credential.helper= push "https://x-access-token:$T@github.com/huaweicloud-mate/huaweicloud-devkit-test.git" main
```

## 问题单号回归 = 全链路流水线 B

**一句话触发**：只要收到带 issue 编号的指令——「回归 #614 用版本 1.1.4-next.5」「全链路测 #562」「回归 #570」——就进入本路线，别当成每日全量执行。带版本号的，该版本即**回归基线**（checkout 到它对应 commit，见 Step 0）。

收到编号即**自主走完下面五步（含自己写用例、跑生成器、定向复测、回填结论），不依赖维护者先做设计**。五步与维护者技能 `huaweicloud-devkit-full-pipeline` 的「流水线 B」一一对应；客户端无关，任意 agent（OpenCode/Codex/Hermes/...）都按此执行。**两个仓库地址见本文件上方「仓库地址」章节**——测试仓库 `huaweicloud-mate/huaweicloud-devkit-test`（结果/用例/脚本），源码仓库 `huaweicloud/huaweicloud-devkit`（clone 到 `hdk`，源码检查/根因定位/写探针）；首次先 `git clone <源码仓库URL> hdk` 再走流程。

### Step 0 定位 + 确认修复是否真合入
0. **先拿缺陷上下文（从编号 → 明确缺陷，别裸跑）**：
   - 读上游 issue 全文补上下文：`gh issue view <编号> --repo huaweicloud/huaweicloud-devkit`（缺陷现象 / 根因 / 修复方案）。无 gh 时 `curl -s https://api.github.com/repos/huaweicloud/huaweicloud-devkit/issues/<编号>`（issue 公开可读，无需 token）。
   - 定位本地归档回归用例：`ls test-cases/issues/<编号>-*/`（编号 → slug 目录），读 `回归用例.md` 的「根因 + 复现步骤 + 断言契约 + 修复实现 commit」。
   - 二者对齐后，明确「本次回归验证哪个修复、断言是什么」再往下走；归档无该 issue 目录时，以 issue 全文为准、准备自建（走 Step 2）。
1. 定位上游 issue 与本地归档缺陷：`test-cases/issues/<编号>-<slug>/回归用例.md`（复现步骤 + 断言契约 + 关联设计用例 ID + 严重级）。
2. 开发称「已修复」的先确认代码真落地（勿信自报）：
   - `git -C hdk log --all -S "<关键函数名>" --oneline -5`（全历史空 = 未实现；方案冻结 ≠ 已实现）
   - `npm view huaweicloud-devkit@next version gitHead` → `git -C hdk fetch origin <sha> && git -C hdk checkout <sha>`（npm 发布常领先 GitHub dev 推送）
3. `git -C hdk show <sha> --stat` 锁定改动文件/函数 = 回归靶心。

### Step 1 复现 + 根因定位
按回归用例复现，根因定位到 `文件:行号`，记 `FINDINGS.md`（断言字段必填）。

### Step 2 回归用例设计（agent 自己写）
- 产出 `test-cases/issues/<编号>-<slug>/回归用例.md`：复现步骤 + 精确断言 + 结论模板（复现/已修复/仍存在）。
- P0 缺陷同步进 daily 盯防：改 `test-cases/gen_daily.py` 纳入该用例 → `cd test-cases && python gen_daily.py` + 门禁。

### Step 3 用例输出（agent 自己跑生成器 + 门禁，禁手改 CSV）
- 新增/修改用例落到生成器（改 `gen_matrix.py`/`gen_tracing.py`，**禁手改 CSV**）：`add()` 定义 + `BATCH_TS` + `NEW_REVIEW_IDS_*` 三处联动，`verify_new` 行数列断言同步。
- `cd test-cases/design && python gen_matrix.py && python gen_tracing.py` → `python verify_new.py`（exit 0）+ `python scan_gaps.py`（GATE-PASS）。
- 版本冻结快照 + 补「迭代测试设计.md」；同步 README 数量 + check_docs（保证「文档提及=原子记录」）。

### Step 4 测试验证（定向复测，验证分层递增）
- init_day 建包 → 只跑该 issue 关联回归用例（P0→P1→P2）→ 回填「执行状态」+「执行时间」。

**验证分层（证据强度递增，优先 1+2，必要时 3）**：
1. **函数级探针**（快、可复现）：临时 `.mjs` 直接 import 被测模块跑断言，跑完删；隔离 `HUAWEICLOUD_HOME` 临时目录避免污染真实凭证；脱敏 SK 只出前 3 位 + len。
2. **既有单测**：`cd hdk && node --test test/<相关>.test.mjs` 确认修复没破坏既有逻辑（exit 0 = pass 全绿）。
3. **真机**（需独立环境时）：SSH 到测试机跑（凭据读「测试机账号.txt」，不打印）。

- 证据落 `results/<客户端>/<日期>-<IP>/<OS>/evidence/<case-id>/`（探针 + stdout.log）。
- 结论三选一：**已修复** / **仍存在** / **BLOCKED**（环境未齐写 blockedReason）。
- 结论报告落 `results/<客户端>/<日期>-<IP>/<OS>/问题回归-<编号>.md`（复现/已修复/仍存在 + 证据链接）。

**维护者收尾（汇总各机结论后直接做，不另问）**：
1. 归档 + push：更新 `test-cases/issues/README.md` 清单行 → commit 回归产物 → `git fetch origin main && git rebase origin/main` → `git -c credential.helper= push "https://x-access-token:$T@github.com/huaweicloud-mate/huaweicloud-devkit-test.git" main`。
2. 评论上游 issue：结论写 `_issue<编号>_comment.md`（UTF-8）→ `gh issue comment <编号> --repo huaweicloud/huaweicloud-devkit --body-file <文件>`（body-file 自读 UTF-8，中文不乱）。结论「已修复」→ `gh issue close <编号>`；「仍存在/部分修复」→ 保持 open + 追加复验评论。⚠️ 并发 push 会把 main 推进——push 前必 rebase，核验用「commit 是否入 main 历史」，勿用 `main==<sha>` 硬断言。

### 问题回归的权限例外与并发纪律
- **回归场景解除「test-cases 只读」**：执行回归的 agent 可写 `test-cases/issues/<编号>-<slug>/` 与生成器（gen_matrix / gen_tracing / gen_daily）。这是对「每日执行」只读约束的明确例外；**仍禁手改 CSV**（只改生成器再重生成）。
- **写前先拉最新**（git pull / `prepare_env.py --update`）；**push 前 fetch + rebase**，避免多机改母版冲突。
- **不 close/reopen/评论 issue**（维护者统一操作）；结果仍只落自己 `results/<客户端>/`，`results/Regression/` 由维护者汇总。

## 红线（违反即作废重来）

1. **真云**：最低配置创建 → 测后删除并归零验证 → 只删本次创建资源。
2. **缺陷**：先记根因（文件+行号），全量测完**必须统一提单**（FINDINGS.md 非空 → 源码仓库 `huaweicloud/huaweicloud-devkit` 1 个合并单），勿拆单/勿未测完就提/勿只 push 不提单。
3. **PASS 门禁（禁虚报）**：一个用例标 PASS 必须同时满足——① 已实际执行（探针/命令真实运行）② 有结果证据落到 `evidence/<case-id>/`（probe 脚本 + stdout.log）③ `evidencePath` 列回填该证据路径。**未执行(NOT_RUN)/无结果/无证据的用例，一律不得标 PASS**，只能标 NOT_RUN 或如实标 FAIL/BLOCKED。回填后跑 `python scripts/verify_no_fake_pass.py <客户端> <OS>` 机械校验，虚报视为作废重来。
4. **环境阻塞**：标 BLOCKED + 写 blockedReason，不得假装 PASS。
5. **目录权限（只提交自己）**：只改/提交 `results/<你的客户端>/` 目录，**完全不碰 Summary**（维护者统一生成）、其他客户端目录、test-cases 真源。
6. **完成门禁（禁空跑）**：任务完成的唯一判定 = `results/<你的客户端>/<日期>-<IP>/<OS>/` 已落 ①测试报告.md ②3 份 CSV（执行状态列已回填）③ PASS 用例证据 ④已 push ⑤有 FAIL/SPEC 缺陷时已向源码仓库提单。**只读文档 / 只建目录 / 中途退出 / 只 push 不提单 = 未完成**；即使环境阻塞也必须按第 4 条回填 BLOCKED + 出一份最小报告 + push，**不得零产出**。

## 用例与执行结果分离（架构铁律）

- `test-cases/`（design/expanded/tracing/daily）是**纯用例定义**（设计级 27 列 / 展开级 24 列 / 追踪表 10 列），不含执行状态/结果/证据路径。
- 执行结果只落 `results/`：你的执行包回填「执行状态」+「evidencePath」，维护者聚合到 `results/Summary/`。
- **严禁**回改 `test-cases/` 母版（真源，改动走 gen_matrix.py 重新生成 + verify_new.py 门禁）。

## 关联工具白名单（回填「关联工具」列只能填这些）

- 39 个 MCP 工具（`huaweicloud_*` 全名/简称）+ CLI 命令（install/uninstall/doctor/status/update/install-hcloud/plugins/npx/npm/auth/reconcile）+ 框架组件（mcp-server/inspector/harness）。
- 函数名/组件/脚本/概念（如 decorateResult/safety-model/风险规则）归入「指引来源 实:xxx」，**不得填关联工具列**。

## 唯一断言与根因（FAIL/SPEC 纪律）

- 预期结果写成**唯一可判定断言**（精确错误码/字段/返回值），避免「正常/合理/符合预期」等模糊词。
- 标 FAIL 或 SPEC-MISMATCH 时，必须落「根因 = 文件 + 行号」（源码层定位，方法见技能 huaweicloud-devkit-source-coverage：源码文件地图 + 核对四步）。

## 状态口径

| 状态 | 含义 | 使用约束 |
|---|---|---|
| PASS | 通过，有证据 | 必须①实测②证据落盘③evidencePath 回填 |
| FAIL | 不符预期 | 记根因(文件:行号) |
| BLOCKED | 环境/权限阻塞 | 必须写 blockedReason；「环境不满足」用 BLOCKED 而非 NOT_RUN |
| SPEC-MISMATCH | 实现与设计契约漂移 | 记漂移点 |
| NOT_RUN | 未执行 | **仅限明确不适用本客户端/OS；P0 一律不得 NOT_RUN**；每条必须写原因 |

## 脚本清单（本仓库 scripts/）

**agent 用**：`init_agent.py` 初始化 · `prepare_env.py` 环境准备 · `init_day.py` 建包 · `verify_no_fake_pass.py` PASS 门禁 · `verify_coverage.py` 覆盖率门禁 · `hourly_sync.py` 每 10 分钟提报 · `file_issue.py` 统一提单

**维护者用**：`build_summary.py` 汇总生成 Summary（agent 不跑，统一由维护者汇总，避免共享冲突）· `report_html.py` 生成 HTML 汇总报告 · `send_email.py` SMTP 邮件发送 · `run_daily_report.py` 每日汇总流水线（收集→HTML→邮件，配合 Windows 计划任务定时跑）