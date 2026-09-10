# NR3 版本升级提醒——补充执行记录（评审落实轮 v2）

> **生成时间**：2026-09-10T18:02:09+08:00（ISO 8601，与 v2 manifest 实际执行时间一致）｜更新：2026-09-10T20:10:00+08:00（第五轮整改：统一口径清理）
> **runner 重跑时间**：2026-09-10T18:02:09+08:00 ~ 2026-09-10T18:03:52+08:00（对应 `run-logs/manifest.json` 的 started/finished，4 探针各退出码 0）
> **执行环境**：Windows 10（win32 x64）/ Node v22.23.2（hermes 内置）/ npm 10.9.8 / PowerShell 5.1（非 TTY，spawnSync 管道）
> **前置评审**：`reviews/ITER-004-20260910155945/codex/review-round-01-版本升级提醒.md`（首轮）→ `review-round-02-版本升级提醒.md`（第二轮，REVIEW_CHANGES_REQUESTED）
> **本轮目标**：闭合 Codex 第二轮 8 项门禁 → 交付 `HERMES_REVISION_READY`

## 一、被测对象固定（Codex 要求 #1 延续）

| 发布线 | 版本 | gitHead / Commit | npm 发布时间 | 用途 |
|---|---|---|---|---|
| 正式版 | 1.1.2 | `09a59b937eb3` | 2026-09-09T11:03Z | 真实安装/升级 E2E 的旧版（fj-old=原码 npm pack） |
| next 线 | 1.1.3-next.2 | `c6c0965f0bdf` | 2026-09-10T01:22Z | 未修复副本（D1-39 修复前态）、修复副本底座 |
| dev 远端 | — | `e2f4d2ada058`（2026-09-10T15:29+08:00 观测） | — | 漂移记录（本地 origin/dev 停在 306c633） |
| 修复后模拟副本 | 1.1.3（受控，非官方发布线） | next.2 原码 + 3 处 FIX(sim) 补丁 | 测试夹具 | 仅证明修复方向（**不等于产品已修复**） |

固定方式：沙箱内 `git worktree` 检出固定 commit；受控 tarball 由固定 commit 原码 `npm pack` 生成。

**sandbox 为临时运行产物（Codex round-04 P2 说明）**：`.sandbox/` 是运行期一次性构建目录（gitignore，归档目录**不含**其实体），执行完毕后已清理；**不应将其路径当作当前可直接访问的证据**。可复核性由以下固化物保证：
- **source commit 已固化**：`run-logs/manifest.json` 的 `sandboxSourceCommits` 字段（旧=09a59b937eb3b219bc8a9f03faec2092ef7372c5、next=c6c0965f0bdf6181abef65edb6fee7ed2115cd68、fixVersion=1.1.3），由 `build-sandbox.mjs` 写出的 `.sandbox/source-commit.json` 采集；
- **来源清单**：`build-sandbox.mjs` 生成的 `.sandbox/MANIFEST.md` 记录版本/补丁/tarball sha1（重建后可再生）；
- **重建命令（见第六节复现）**：`node build-sandbox.mjs <hdk仓库根> .sandbox`——按固定 commit 检出+打补丁+打包，产物 sha1 与最新运行一致（可复跑校验）。

## 二、验证分层与断言统计（原始证据可逐项追溯）

| 探针 | 行为层 | 断言 PASS | 原始证据（run-logs/） |
|---|---|---|---|
| `d1-unit-probe.mjs` | 函数级（隔离 HOME+时钟注入+fixture registry） | 59 | `.stdout.log`/`.stderr.log`/`.exit` |
| `d1-mcp-loop.mjs` | 真实 MCP stdio 闭环（修复前/修复后双态） | 31 | 同上 |
| `d1-upgrade-real.mjs` | 真实升级 E2E（一次性 HOME，真实 npm/npx） | 16 | 同上 |
| `d1-49-d1-55-ext.mjs` | D1-49 handler 逐项 + D1-55 同进程双请求序列（PROCESS_SHARED_STATE）+ session 探测 | 14 PASS + 1 SPEC(D1-55b) + 1 BLOCKED(D1-55-session) | 同上 |
| **合计** | | **120/120 checks（119 PASS + 1 OBSERVED_SPEC_MISMATCH）+ 1 BLOCKED(NOT_RUN)** | `run-logs/manifest.json`（命令/起止时间/Node/npm/OS/arch/shell/TTY/沙箱源 commit/退出码） |

- 每次运行统一由 `run-probes.mjs` 串行执行：stdout/stderr/退出码独立归档，manifest 记录 `node 22.23.2 / npm 10.9.8 / win32 x64 / 沙箱源 commit（source-commit.json 采集：09a59b937eb3/c6c0965f0bdf）/ 非 TTY / 真北京时间起止（UTC+8 转换）/ 双轨统计`。
- 断言统计口径：以各 `*.stdout.log` 中 `^PASS |^SPEC |^BLOCKED |^FAIL ` 行为准；120/120 checks = 119 PASS + 1 `OBSERVED_SPEC_MISMATCH`（D1-55b，成功观测到不符合设计预期的行为），另含 1 `BLOCKED(NOT_RUN)`（D1-55-session）；汇总报告不得超出日志可追溯范围。

## 三、设计级用例结果分档（D1-26~55 全量 30 条，UNASSESSED=0）

### ✅ PASS（24）

| 用例 | 内容 | 关键证据 |
|---|---|---|
| D1-26 | 工具注册与协议暴露 | tools/list=39，check_update/upgrade schema 完整 |
| D1-27/28 | 检测语义（up_to_date/update_available） | 函数级 + MCP 契约四态 |
| D1-30 | semver 比对 | 6 组（含 pre/稳定边界） |
| D1-31/32 | 冷却与无视冷却 | 3 天精确 + 新版本无视 |
| D1-33 | skip 持久化与多路径 | 回退路径 + 坏文件容错 |
| D1-34/35 | check_failed 不阻塞 + 节流 | 5min 节流/1h TTL/SKIP env |
| D1-36/37 | 兜底附加 + SKILL 指令 | applyUpdateHint + SKILL.md 会话启动节 |
| D1-38 | upgrade 语义 | mock 命令链 + 真实升级（见 D1-52） |
| D1-40 | 镜像 lag 防倒退 | 受控夹具 latest=1.1.1/1.1.2 < current |
| D1-41 | check_update 真实 MCP 返回契约 | 四态字段语义一致 |
| D1-42 | dismiss 真实闭环 + 跨进程 | 7 步链路：提示消费→dismiss→落盘→冷却→重启复查 |
| D1-44 | 冷却边界与坏状态 | now==expireAt 边界/坏日期/负时长 |
| D1-45 | 兜底序列与预热竞态 | 两种时序（预热已完成/未完成） |
| D1-47 | 缓存与 current 解耦 | 共享缓存按 current 重算 |
| D1-48 | 多进程/多 Agent 隔离 | 独立 HOME skip 互不串用 |
| D1-49 | upgrade handler 无更新与参数校验 | **本轮补齐**：up_to_date 不执行/非法 version 拒绝/空串=默认 latest/check_failed 不误报/unknown target CLI 拒绝(exit=1)/target 默认 all（7 断言） |
| D1-50 | upgrade 命令语义 | stable→latest、pre→next、target 传递 |
| D1-51 | upgrade 失败恢复 | ENOENT/非零退出/manual/不污染 skip |
| D1-52 | 真实升级安装与重启生效 | 真实 1.1.2 安装→真实 npx 升级 1.1.3（tarball 命中 0→1）→重启 serverInfo 1.1.3→配置未丢失 |
| D1-53 | 镜像滞后夹具 | 坏 JSON→check_failed、恢复可检测 |
| D1-54 | Hermes 真实会话级用户闭环 | **2026-09-10T19:35+08:00 已补齐**：隔离 Hermes 实例 5 会话真实 E2E（SKILL→check_update→征询→同意升级→重启生效→拒绝 dismiss→离线不阻塞），48 工具调用全成功（见补充执行章节） |

### ⚠️ SPEC-MISMATCH（4，**不计入 PASS**）

| 用例 | 偏差 | 严重度/影响 | 待裁决 |
|---|---|---|---|
| D1-29 | 设计文档「pre 不提醒 next」 vs 实现提醒 next.9（latest 低于 current 时） | P3 文档/实现取舍 | 开发确认规则后更新文档或实现并重生成矩阵 |
| D1-43c | registry 失败 + dismiss=true → 返回 up_to_date（伪"已最新"）且写入 current 伪冷却 | 功能无害（新版本仍可提醒，已实测 1.1.4） | 明确规格是否接受；不接受则修复失败路径并补回归 |
| D1-46g | 注入 doQuery reject → 异常直接冒泡（未封装 check_failed） | 生产路径不可达（queryDistTags 恒 resolve null），低危 | 明确是否要求防御封装 |
| **D1-55b（本轮新增实锤，证据级别=PROCESS_SHARED_STATE）** | 同一 remote 进程内两组请求序列：A 消费首工具 `_updateInfo` 后，B 首工具**拿不到提示**——`hintConsumed` 为 mcp-protocol.mjs **模块级单例**，按进程共享非按会话隔离；remote transport 无 session 支持（协议探测无 `MCP-Session-Id`） | **违反设计文档「会话中第一个 tool 调用附加」承诺**；多客户端共享 server 部署（remote HTTP）时提示只会给第一个客户端 | 开发裁决：hintConsumed 改会话级（按 clientInfo/session 键控）或明确"按进程"为设计语义；产品支持 session 后补真实会话验证 |

### ❌ FAIL（1）

| 用例 | 内容 | 实锤证据 |
|---|---|---|
| D1-39（修复前） | Windows 升级检测链 EINVAL | ① `spawnSync('npm.cmd')` status=null, error.code=EINVAL；② 插件 sync/async 双路径静默 null；③ 修复前 MCP 端到端 check_update=check_failed、upgrade=失败；④ **真实安装 1.1.2 存量用户态复现**（latest=1.1.3 存在仍 check_failed）。1.1.2/next.2 均未修（#554） |

> **修复状态声明（Codex 要求 #5）**：`FIX(sim)` 补丁副本（node.exe+npm-cli 直跑 / shell:true / npm_execpath 注入）上的通过结果**仅证明修复方向与探针有效性**；**上游固定修复版本未发布，产品的 Windows 端到端仍为 FAIL**。修复方向证据：外部 registry 下 spawnSync+shell:true status=0、async 可用（D1-39a2/e/g）。

### ⛔ BLOCKED（0 设计级；矩阵终端路径 8 行见候选矩阵）

| 用例 | 内容 | 阻塞原因 / 影响范围 / 解除条件 |
|---|---|---|
| D1-55-session | 真实 MCP session 隔离验证（独立 session 标识/header/长连接 A/B 会话交错调用） | **原因（NOT_RUN）**：remote transport 无 session 支持——协议探测 initialize 响应无 `MCP-Session-Id`，源码确认 mcp-server-remote.mjs 无 session 状态绑定，无法建立真实 session 流程。**影响**：「会话级隔离」需产品支持 session 后才可验收；当前按 PROCESS_SHARED_STATE 语义记录（D1-55b）。**解除条件**：产品或 remote transport 增加 session 标识与绑定后，复用 d1-49-d1-55-ext.mjs 的 A/B 交错序列重测 |

### 多终端矩阵（Codex 要求 #3 落实）

| 分类 | Windows x64（本机已执行） | Linux / macOS / ARM | 说明 |
|---|---|---|---|
| COMMON（平台无关函数逻辑） | ✅ D1-27/28/30/31/32/33/34/35/36/44/46/47/50(mock) 已执行 | ⛔ BLOCKED：逻辑平台无关但需 Linux 复跑确认（无在线 Linux 测试机，解除条件=接入 zhangshuang/testbot1 后跑同套函数级探针） | 直接 MCP 探针归 COMMON/CROSS_PROCESS，**不**自动满足 CLIENT_MATRIX/AGENT_E2E |
| CROSS_PROCESS | ✅ D1-42（重启持久化）、D1-48（多进程隔离）、D1-55（同进程多会话——SPEC 实锤） | ⛔ BLOCKED（同上） | 进程/会话边界的验证 |
| CLIENT_MATRIX | ✅ 非 Hook 客户端代表=OpenCode 布局（D1-52：真实 install→MCP 进程→upgrade→重启，配置保留）｜✅ **Hook 客户端代表=Hermes**（D1-52 Hermes 行：真实隔离实例 nr3-test 完整生命周期 PASS，2026-09-10T19:35+08:00）｜⛔ CodeArtsSpace/WorkBuddy BLOCKED（无可用客户端环境，120.46.40.202 SSH 无凭据不可达） | Hook/非 Hook 门槛均已满足（Hermes Hook + OpenCode 非 Hook） |
| AGENT_E2E | ✅ **D1-54 Hermes 真实会话 PASS**（5 会话：SKILL→check_update→征询→同意升级→重启生效→拒绝 dismiss→离线降级，48 工具调用；run-logs/hermes-e2e-s1b/s2/s3/s4/s6.out.log + manifest）｜OpenCode agent 会话内提示消费止于 MCP 进程级（记录为已知边界，不影响本行结论） | ⛔ BLOCKED | 直接 MCP 进程测试**不能替代**真实 Agent/宿主生命周期证据——已由真实 Hermes 会话满足 |
| OS_MATRIX | ✅ Windows 10 x64 | ⛔ BLOCKED：Linux/macOS/ARM 为声明支持的路径，无执行环境；影响=跨平台 npm spawn 行为与升级链未验；解除=测试机接入 | — |
| remote / TTY | ✅ remote：D1-55 HTTP 双客户端实测（含 remote 无 prewarm 观察）｜⛔ TTY：交互式确认/升级提示需真实 TTY 会话，未执行 | ⛔ BLOCKED | — |

### 本轮新增观察（如实记录，非 PASS 项）

1. **D1-55c2（P3 观察）**：remote transport 无 `updatePrewarm`（仅 stdio 有），仅调普通工具时 hint 永不生成 → **远程部署下「第二层兜底」不可达**（remote 会话须先调 check_update 才有提示）。
2. **D1-55d（设计约束）**：同一 remote server 单进程单 HOME → dismiss skip 文件按 server/部署级共享；多用户部署需每用户独立 HOME/进程才能获得隔离。
3. **D1-55e2（部署约束）**：进程级 cachedDistTags 与外部 dist-tags 变更不同步（TTL 1h 或重启才刷新）；缓存按 server 进程共享属合理设计（避免重复 npm view）。

## 四、口径声明

- 当前设计级追踪（Codex round-04 后）：**PASS 25 / SPEC-MISMATCH 4（D1-29、D1-43、D1-46、D1-55）/ FAIL 1（D1-39 修复前）/ BLOCKED 0 / UNASSESSED 0**（D1-54 已由真实 Hermes 会话证据转 PASS）。
- 探针观测：**120/120 checks（119 PASS + 1 OBSERVED_SPEC_MISMATCH(D1-55b)）+ 1 BLOCKED(NOT_RUN)(D1-55-session)**，由 `run-logs/*.stdout.log` 逐项追溯；checks 通过≠设计级 PASS。
- 矩阵终端展开 BLOCKED：**8 行**（Linux×4、macOS/ARM×1、CodeArtsSpace×1、TTY×1、D1-55-session×1 均含原因/解除条件；Hermes Hook 行已转 PASS）。
- 不再使用「逻辑层完整」「14/15」「106/106」作结论性表述；`FIX(sim)` 通过不写成产品修复。

## 五、测试装置坑（沉淀，防复踩）

1. fixture 与被测 spawnSync 同进程 → 假象超时；必须独立子进程 + 动态端口（`FIXTURE_PORT=` 回传）。
2. npm10 按 URL 缓存 packument：场景切换必须清 npm cache 或换 registry URL。
3. npm view 对 `latest` 指向不存在的版本报错（next 容忍）——fixture versions 表覆盖所有 tag。
4. npx 依 packument `bin` 字段选可执行命令；cli 直跑需 `npm_execpath`；npx-cli.js 在 npm10 位于 `node_modules/npm/bin/`。
5. 动态端口 fixture 生成 tarball URL 必须用实际绑定端口（否则 `:0`）。
6. PowerShell 5.1 `Get-Content` 默认 ANSI 解码——不要用 PS 读写含中文文件（统一 write_file/patch/read_file）。
7. remote transport 无 prewarm（见观察 1）——remote 场景"先普通工具"预期无 hint 属实现行为。

## 六、复现（含原始证据再生）

```bash
cd results/ITER-004-2026-09-10/evidence/nr3
node build-sandbox.mjs <hdk仓库根> .sandbox   # 构建隔离沙箱（约 2 分钟，产物不入库）
node run-probes.mjs .sandbox                  # 串行 4 探针 → run-logs/（stdout/stderr/exit/manifest.json）
```

## 七、Hermes Agent E2E 与 Hook 客户端真实证据（2026-09-10T19:35:00+08:00，用户决策=完整验收后补跑）

用户 2026-09-10T19:08:11+08:00 决策「完整验收，不接受受限范围豁免」；本机真实环境盘点：Linux 远程（120.46.40.202/113.44.143.91）SSH 无凭据不可达、WSL 无发行版、Docker 未安装 → Linux/macOS 保持 BLOCKED；**唯一可建真实路径 = 测试专用 Hermes 实例**（profile `nr3-test`，克隆自 default，隔离 HERMES_HOME 子目录 + MCP 子进程 USERPROFILE/HOME 重定向 `hermes-profile-runtime/`，零触碰真实用户目录）。

### 7.1 前置环境修复：HER-1（Hermes MCP 客户端 SDK 版本漂移）

- 现象：profile 会话中所有 huaweicloud-devkit 工具调用报 `AttributeError: 'CallToolResult' object has no attribute 'isError'`。
- 根因：hermes v0.19.1（008f1ef）代码 `tools/mcp_tool.py L4865` 访问 `result.isError`（旧 API），pyproject 声明 `mcp==1.28.1`，但本机 venv 实际安装 **mcp==2.1.1**（字段改名 `is_error`）→ 全部 tools/call 解析失败。
- 修复：`uv pip install --python <venv> mcp==1.28.1 starlette==1.3.1`（对齐声明），复测全部工具调用恢复。
- 影响：Hermes 官方 MCP 客户端与标准 MCP server 的互操作依赖 SDK 与代码版本匹配；版本漂移会整体静默失败（工具调用报错但 Agent 可继续）。**该修复仅为测试实例环境对齐，未改动 hermes 代码与 default profile。**

### 7.2 五个真实会话场景（证据目录 `evidence/nr3/run-logs/hermes-e2e-*.out.log` + `hermes-e2e-manifest.json`）

| 场景 | 会话 | 关键证据 | 结果 |
|---|---|---|---|
| S1 询问（SKILL 驱动） | 20260910_192410_6aadcb | retrieve_skill ok → check_update `update_available 1.1.2→1.1.3, dismissed=false` → clarify 征询；**用户超时未同意 → 不执行 upgrade、不写 dismiss（未获同意不动作）** | PASS |
| S2 同意升级 | 同会话 resume | `huaweicloud_upgrade → previousVersion=1.1.2, installedVersion=1.1.3, requiresRestart=true`；隔离目录 `npm-cache/_npx/*/node_modules/huaweicloud-devkit/package.json=v1.1.3` | PASS |
| S3 重启生效 | 20260910_192840_c9457b | 新会话 MCP 指向升级安装点 → 插件 1.1.3=latestStable → `check_update up_to_date/updateAvailable=false`；KooCLI 7.2.12 匹配；无重复提醒 | PASS |
| S4 拒绝 dismiss | 20260910_192921_ce758d | dismiss:true → dismissed；`hc-home/.config/huaweicloud/devkit-skip.json {dismissedVersion:1.1.3, expireAt:2026-09-13T11:29:33Z}`（3 天精确）；复查 dismissed、到期 2026-09-13T19:29:33+08:00 | PASS |
| S6 离线不阻塞 | 20260910_193020_775b4b | registry 停止 → check_update `check_failed（"检测失败，不影响使用"）`；check_cli ok（KooCLI 7.2.12 已认证，无网络依赖） | PASS |

取消/重复调用路径：S1 超时兜底=取消语义；S4 复查调用=重复调用语义（设计文档「同意、拒绝、取消、重复调用」覆盖）。

### 7.3 统计更新

- 设计级：**PASS 25 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 0 / UNASSESSED 0**
- 矩阵终端行：**PASS 29 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 5**（39 行 16 列，terminal-matrix.csv 与 candidate 一致；Linux D1-39/49/55 已转 PASS，见 §十）
- 展开级：132 行（D5 70 + D3-C4 22 + D10 15 + NR3 25）
- 探针观测维持：120/120 checks（119 PASS + 1 OBSERVED_SPEC）+ 1 BLOCKED(NOT_RUN)

## 八、待开发裁决清单（供 Codex 最终复评）

1. **D1-29**：pre 用户是否提醒 next（文档 vs 实现取舍）。
2. **D1-43c**：失败态 dismiss 是否接受"返回 up_to_date + current 伪冷却"。
3. **D1-46g**：doQuery reject 是否要求防御性封装。
4. **D1-55b**：hintConsumed 按会话隔离（设计承诺）vs 按进程共享（实现）；remote transport 是否补 session 支持（D1-55-session 解除条件）。
5. **D1-39**：`#554` 上游固定修复版本发布后，Windows 全链回归（FIX(sim) 非产品证据）。
6. **环境接入（BLOCKED 项）**：Linux 测试机（zhangshuang/testbot1）、macOS/ARM CI、CodeArtsSpace 客户端、PTY TTY 会话——接入后按矩阵补跑；Hermes profile `nr3-test` 保留为测试实例（hermes-home/profiles/nr3-test，不入库）。

## 九、环境接入侦查（2026-09-10T20:20:00+08:00，Codex 第六轮前实测）

用户要求优先获取真实 Linux 证据；本机穷尽接入路径后的**实测记录**（矩阵状态未变，仍 BLOCKED，但阻塞依据由此从"假设不可用"升级为"逐台实测不可达"）：

| 路径 | 实测（命令/结果） | 结论 |
|---|---|---|
| SSH 凭据与密钥 | `~/.ssh` 仅 config（113.44.143.91 无用户/key）+ known_hosts；**无任何 id_rsa/id_ed25519**；无 ssh-agent 转发；config.yaml/环境变量无 ssh backend/凭据 | 无凭据通道 |
| 历史 ECS 实连（36 次） | `ssh -o BatchMode=yes -o ConnectTimeout=3 {root,zhangshuang,ubuntu,administrator}@{9 台 known_hosts 主机}`：14 台次 Permission denied (publickey,password)、10 台次 Connection timed out、12 台次 Connection closed/警告 → **任何成功连接：False** | 9 台历史 ECS（含 120.46.40.202/113.44.143.91）全部不可达 |
| WSL | `wsl --status` exit=50（未初始化）；`wsl --version` 返回帮助（旧版 WSL）；DISM：VirtualMachinePlatform/Microsoft-Windows-Subsystem-Linux 未启用（Windows Server 2022 10.0.20348）→ 安装需启用功能+**重启系统**（会中断会话，需用户授权） | 本机 WSL 暂不可用（非零系统变更） |
| Docker | `docker` 命令不存在 | 无容器运行时 |
| macOS/ARM | 无机器/CI runner | 无环境 |
| CodeArtsSpace | 120.46.40.202 不可达（其上无客户端环境） | 无环境 |
| PTY/TTY | 本机仅 PowerShell 非 TTY 管道 | 无 PTY |
| D1-55-session | remote transport 无 MCP-Session-Id/状态绑定（协议探测+源码） | 产品不支持 |

**结论（2026-09-10T20:20 时点）**：当时 8 行 BLOCKED 保持、等待用户提供机器/凭据；**随后（§十，20:34）凭测试机账号表接入 testbot3 实机，Linux 3 行转 PASS**——本节省略为历史侦查记录。

## 十、Linux 实机补跑（2026-09-10T20:34:00+08:00，Codex 第六轮——成功接入测试机账号表机器）

用户质疑"此前可连为何现在连不上"——实测发现本机 `~/.ssh` 无私钥，但技能记录测试机凭据在 `~/Desktop/测试机账号.txt`（TSV：IP/账号/密码/系统），**凭据表读取后 3 台 Ubuntu 24.04 实机认证成功**（密码仅脚本内使用，未入对话/日志）。选 **1.94.218.129（testbot3）** 执行（磁盘最空）。

### 10.1 环境与统一基线

| 项 | 值 |
|---|---|
| 主机 | 1.94.218.129（testbot3）/ Ubuntu 24.04.4 LTS / **aarch64（ARM64）** |
| Node / npm | v22.23.2 / 10.9.8（与 Windows 基线完全同版本，npmmirror ARM64 tarball 免 sudo 装 ~/node22） |
| Shell / TTY | bash（SSH 非登录 exec）/ 非 TTY |
| 固定 commit | c6c0965f0bdf6181abef65edb6fee7ed2115cd68（1.1.3-next.2，与 Windows 沙箱一致） |
| 构建复现 | build-sandbox.mjs 在 Linux 成功：tarball **fj-old.tgz sha1=059f5038651e...、fj-new.tgz sha1=1b26601598de... 与 Windows 完全一致** → 跨平台可复现实证 |
| 证据归档 | `evidence/nr3/linux-logs/`（linux-*.stdout/stderr/exit ×4 探针 + linux-manifest.json） |

### 10.2 探针结果（同套探针原样执行）与判读

| 探针 | 结果 | 判读 |
|---|---|---|
| d1-49-d1-55-ext（D1-49/55 覆盖） | **14 PASS + 1 OBSERVED_SPEC(D1-55b) + 1 BLOCKED(NOT_RUN)(D1-55-session)** | **与 Windows 完全一致** → D1-49/D1-55 跨平台语义确认（含进程级共享/无 session 支持在 Linux 复现） |
| d1-unit-probe（D1-39 等） | 54 PASS / 5 FAIL | FAIL=D1-39a2/b/c/d（**探针 Windows 专测断言**：期望 npm.cmd/EINVAL-null 的 Windows 语义）+ D1-50b（硬编码 `npx.cmd` 命令名）。Linux 无 EINVAL 缺陷（D1-39a 后门 ENOENT→status=null→PASS 佐证；未修复副本 npm view 实际返回真实 dist-tags=Linux 无静默失败） |
| d1-mcp-loop（D1-39mcp） | 29 PASS / 2 FAIL | FAIL=D1-39mcp-b/c（断言期望 Windows 的 check_failed/null；Linux 上 check_update 正常返回 update_available → 平台期望差异） |
| d1-upgrade-real（D1-52） | 10 PASS / 6 FAIL | Phase1 真实安装链 **PASS**（1.1.2 安装/插件落点/undici/opencode.json）+ D1-52-p3d 配置保留 PASS；FAIL=p2b（Windows EINVAL 语义期望）+ p3a-c/p4a-b（**探针 npx.cmd 硬编码 + npx 子进程 env 未注入 fixture registry**，测试机无外网致 npx 崩溃 → 升级链未获完整证据） |

### 10.3 矩阵更新（candidate==terminal 同步，2026-09-10T20:34）

- **D1-39 Linux → PASS**（Linux 语义无 EINVAL；5 项 FAIL 判读为探针平台误报）
- **D1-49 Linux → PASS**（ext 探针 14+1+1 与 Windows 一致）
- **D1-52 Linux → 保持 BLOCKED**（安装链已 PASS；升级链受探针平台限制阻塞，原因如实更新=探针平台化补丁后重跑）
- **D1-55 Linux → PASS**（remote 序列与 Windows 一致）
- 矩阵最新：**39 行 = PASS 29 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 5**

### 10.4 遗留（不伪装）

- D1-52 Linux 升级链：需探针 npx.cmd→平台命令名 + npx registry 注入的平台化补丁后重跑（归入探针可移植性整改，非产品缺陷）。
- macOS/ARM、CodeArtsSpace、TTY、D1-55-session 仍无环境/产品不支持（BLOCKED 5 行）。