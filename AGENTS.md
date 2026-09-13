# AGENTS — huaweicloud-devkit 每日测试执行指南

> 每个客户端 agent（OpenCode/Codex/CodeArtsAgent/CodeArtsWork/WorkBuddy/DSH/OfficeAce/Hermes/OpenClaw/AtomCode）读本文件即开始执行当天测试。**不要处理任何 GitHub issue，本任务只做测试执行。**
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

## 4. 出测试报告

按**统一模板** `templates/daily-agent-report.md` 输出 `results/<客户端>/<日期>-<IP>/<OS>/<客户端>-<模型>-测试报告.md`，九节固定：① 测试概述 ② 执行摘要 ③ 状态汇总（设计级+展开级） ④ 逐用例结果 ⑤ 缺陷清单（级别+描述+精确断言+根因文件行号+证据） ⑥ 阻塞项 ⑦ 安全/红线 ⑧ 资源释放 ⑨ 遗留建议。**所有 agent 用同一模板、字段完整**，逐用例结果必须与副本 CSV「执行状态」+「evidencePath」列一致。

**同时记录缺陷清单**：每个 FAIL/SPEC 缺陷按 `templates/findings.md` 写 `results/<客户端>/<日期>-<IP>/<OS>/FINDINGS.md`（标题 `## #N【级别】标题` + `- **根因**：文件:行号`），这是统一提单脚本 `file_issue.py` 的解析输入，**格式必须严格**，否则自动提单失败。

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
# ②③ 提交 push results
git add results/<客户端> && git commit -m "test: <客户端> <OS> 执行回填"
git -c credential.helper="!gh auth git-credential" push origin main
```

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

| 状态 | 含义 |
|---|---|
| PASS | 通过，有证据 |
| FAIL | 不符预期 |
| BLOCKED | 环境/权限阻塞 |
| SPEC-MISMATCH | 实现与设计契约漂移 |
| NOT_RUN | 未执行 |

## 脚本清单（本仓库 scripts/）

**agent 用**：`init_agent.py` 初始化 · `prepare_env.py` 环境准备 · `init_day.py` 建包 · `verify_no_fake_pass.py` PASS 门禁 · `hourly_sync.py` 每 10 分钟提报 · `file_issue.py` 统一提单

**维护者用**：`build_summary.py` 汇总生成 Summary（agent 不跑，统一由维护者汇总，避免共享冲突）· `report_html.py` 生成 HTML 汇总报告 · `send_email.py` SMTP 邮件发送 · `run_daily_report.py` 每日汇总流水线（收集→HTML→邮件，配合 Windows 计划任务定时跑）