# AGENTS — huaweicloud-devkit 每日测试执行指南

> 每个客户端 agent（OpenCode/Codex/CodeArtsAgent/CodeArtsWork/WorkBuddy/DSH/OfficeAce/Hermes/OpenClaw/AtomCode）读本文件即开始执行当天测试。**不自行 close/reopen/评论任何 GitHub issue（由维护者统一操作）**；收到带 issue 编号的「全链路/回归」指令时，按下方「问题单号回归」节执行（走回归路线，而非每日全量）。
>
> **完成标准** = 本机 `results/<你的客户端>/<日期>-<IP>/<OS>/` 已含「测试报告.md + 3 份 CSV」且已 push 远端；只读文档 / 只建目录 / 中途退出都不算完成。

## 能力索引（prompt-as-skill）

任何 agent 收到下列提示语即执行对应能力；完整说明翻 `skills/<能力>/SKILL.md` 或本文件对应节。

| 提示语 | 能力 | 完整说明 |
|---|---|---|
| `测试设计 <版本/需求>` | 测试设计：范围固定 → 候选设计（HERMES_DRAFT_READY）→ 评审放行由维护者统一执行 | [skills/test-design/SKILL.md](skills/test-design/SKILL.md) |
| `每日测试` | 每日测试执行：建包 → 执行 → 回填 → 报告 → 提单 | [skills/test-execution/SKILL.md](skills/test-execution/SKILL.md) |
| `版本全量测试 <版本>` | 版本全量测试：母版全量 316（或版本快照）→ 全量执行 → 回填 → 报告 → 归档 results/version | [skills/test-version/SKILL.md](skills/test-version/SKILL.md) |
| `回归 #<编号>` / `全链路测 #<编号>` | 缺陷回归：定位 → 复现 → 根因 → 用例 → 复测 → 结论 | [skills/test-regression/SKILL.md](skills/test-regression/SKILL.md) |
| `覆盖核对` | 源码能力 ↔ 用例覆盖核对（函数/字段/错误码核对 + 缺口落用例） | [skills/source-coverage/SKILL.md](skills/source-coverage/SKILL.md) |

> 能力文档与 AGENTS.md 分工：四项能力的**完整流程**落 `skills/<能力>/SKILL.md`；本文件是**入口**——能力索引 + 公共前置（仓库地址/专属目录/自我识别/凭证）+ 全局红线 + 状态口径。维护者专属能力（资产治理、汇总、邮件派发）不进本库。

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
2. 拉最新（**每次执行测试前必跑**，一天可能跑多次，每次都要重新取最新，勿因「今天跑过」跳过）——`python scripts/prepare_env.py --update` 一键完成三件事：
   - 测试仓库 pull main 最新（含其他 agent 的最新改动与脚本）
   - 源码仓库 `hdk` fetch + checkout 到 npm `@next` 最新对应 commit（源码检查/根因定位用，跟随最新代码）
   - `npm install -g huaweicloud-devkit@next` 安装最新被测包（黑盒测试用，跟随最新 next 发布）

> **环境 PATH**：node/npm/gh 若装在用户目录（`~/nodejs/bin`、`~/bin`），非交互 shell 不自动加载。执行前先 `export PATH=$HOME/nodejs/bin:$HOME/bin:$PATH`（脚本 `prepare_env.py` 会自动加入 PATH，无需手动）。

> **镜像 fallback**：GitHub clone/pull 失败时，脚本自动 fallback 到 GitCode 镜像 `gitcode.com/hd-vector/huaweicloud-devkit-test.git`（国内快）。需本机配 `GITCODE_TOKEN` 环境变量或 `~/.gitcode_token` 文件。

> **真云凭证（AK/SK）**：真云 E2E 用例（建删资源、审计等）需华为云 AK/SK，固定位置 `~/.config/huaweicloud/credentials.json`（格式 `{ak, sk, region}`，统一账号 hw018619646，已预置于每台测试机）。执行前可用 `python scripts/prepare_env.py` 自检。**读不到 AK/SK 时，真云类用例标 `BLOCKED`（blockedReason=`无 AK/SK`），禁止 mock 假跑、禁止标 PASS**。

## 1–6. 每日执行流程 → 详见 skills/test-execution/SKILL.md

六步（建包 → 执行 → 回填 → 报告 → 每 10 分钟提报 → 统一提单 + push）的完整说明见 [skills/test-execution/SKILL.md](skills/test-execution/SKILL.md)。关键纪律同见该文档「门禁」「红线」节：NOT_RUN 覆盖率红线（P0 不得 NOT_RUN）、PASS 门禁（禁虚报，标 PASS 必①实测②证据落盘③evidencePath 回填）、提单必做（只 push 不提单 = 未完成）。

## 问题单号回归 → 详见 skills/test-regression/SKILL.md

收到「回归 #<编号>」/「全链路测 #<编号>」走**回归路线**（非每日全量）。完整五步（定位 → 复现 → 根因 → 用例 → 复测 → 结论）、验证分层（函数级探针/单测/真机）、SPEC-MISMATCH 发现法、权限例外，见 [skills/test-regression/SKILL.md](skills/test-regression/SKILL.md)。回归只复测该 issue 关联用例，结论落 `results/Regression/`；不 close/reopen/评论 issue（维护者统一操作）。

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
- 标 FAIL 或 SPEC-MISMATCH 时，必须落「根因 = 文件 + 行号」（源码层定位，方法见 [skills/source-coverage/SKILL.md](skills/source-coverage/SKILL.md)：源码文件地图 + 核对四步）。

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