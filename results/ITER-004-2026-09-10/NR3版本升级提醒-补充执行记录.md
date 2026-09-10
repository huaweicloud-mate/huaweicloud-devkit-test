# NR3 版本升级提醒——补充执行记录（评审落实轮 v2）

> **生成时间**：2026-09-10T17:20:00+08:00（ISO 8601）｜更新：2026-09-10T17:20:00+08:00
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

固定方式：沙箱内 `git worktree` 检出固定 commit；受控 tarball 由固定 commit 原码 `npm pack` 生成；来源清单 `.sandbox/MANIFEST.md`（沙箱为运行期构建产物，删除后可经 `build-sandbox.mjs` 重建）。

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

### ⛔ BLOCKED（1）

| 用例 | 内容 | 阻塞原因 / 影响范围 / 解除条件 |
|---|---|---|
| D1-54 | Hermes 真实会话级用户闭环 | **原因**：本机 Hermes 未安装 huaweicloud-plugins（ENV-1），且按隔离纪律不得为测试污染日常安装；需要可交互模型会话才能验证"首次操作先 check_update/询问/同意升级/拒绝 dismiss"完整用户流。**影响**：真实 Hermes 会话的 SKILL 驱动与提示消费未被验收；协议层闭环（D1-41/42/45）与 CLIENT 生命周期（D1-52 OpenCode 布局）为等价覆盖但**不得写成会话级 PASS**。**解除条件**：在测试专用 Hermes 实例安装插件（或上游修复后升级），再进行真实会话 E2E |
| D1-55-session | 真实 MCP session 隔离验证（独立 session 标识/header/长连接 A/B 会话交错调用） | **原因（NOT_RUN）**：remote transport 无 session 支持——协议探测 initialize 响应无 `MCP-Session-Id`，源码确认 mcp-server-remote.mjs 无 session 状态绑定，无法建立真实 session 流程。**影响**：「会话级隔离」需产品支持 session 后才可验收；当前按 PROCESS_SHARED_STATE 语义记录（D1-55b）。**解除条件**：产品或 remote transport 增加 session 标识与绑定后，复用 d1-49-d1-55-ext.mjs 的 A/B 交错序列重测 |

### 多终端矩阵（Codex 要求 #3 落实）

| 分类 | Windows x64（本机已执行） | Linux / macOS / ARM | 说明 |
|---|---|---|---|
| COMMON（平台无关函数逻辑） | ✅ D1-27/28/30/31/32/33/34/35/36/44/46/47/50(mock) 已执行 | ⛔ BLOCKED：逻辑平台无关但需 Linux 复跑确认（无在线 Linux 测试机，解除条件=接入 zhangshuang/testbot1 后跑同套函数级探针） | 直接 MCP 探针归 COMMON/CROSS_PROCESS，**不**自动满足 CLIENT_MATRIX/AGENT_E2E |
| CROSS_PROCESS | ✅ D1-42（重启持久化）、D1-48（多进程隔离）、D1-55（同进程多会话——SPEC 实锤） | ⛔ BLOCKED（同上） | 进程/会话边界的验证 |
| CLIENT_MATRIX | ✅ 非 Hook 客户端代表=OpenCode 布局（D1-52：真实 install→MCP 进程→upgrade→重启，配置保留）｜⛔ Hook 客户端（CodeArtsSpace/WorkBuddy/Hermes）BLOCKED：需客户端会话环境，解除=专用测试实例安装后补会话级 | ⛔ BLOCKED | 至少 1 Hook + 1 非 Hook 已满足非 Hook 侧；Hook 侧未满足 |
| AGENT_E2E | ⛔ BLOCKED：D1-54 Hermes 会话（见上）；OpenCode agent 会话内提示消费同样止于 MCP 进程级 | ⛔ BLOCKED | 直接 MCP 进程测试**不能替代**真实 Agent/宿主生命周期证据 |
| OS_MATRIX | ✅ Windows 10 x64 | ⛔ BLOCKED：Linux/macOS/ARM 为声明支持的路径，无执行环境；影响=跨平台 npm spawn 行为与升级链未验；解除=测试机接入 | — |
| remote / TTY | ✅ remote：D1-55 HTTP 双客户端实测（含 remote 无 prewarm 观察）｜⛔ TTY：交互式确认/升级提示需真实 TTY 会话，未执行 | ⛔ BLOCKED | — |

### 本轮新增观察（如实记录，非 PASS 项）

1. **D1-55c2（P3 观察）**：remote transport 无 `updatePrewarm`（仅 stdio 有），仅调普通工具时 hint 永不生成 → **远程部署下「第二层兜底」不可达**（remote 会话须先调 check_update 才有提示）。
2. **D1-55d（设计约束）**：同一 remote server 单进程单 HOME → dismiss skip 文件按 server/部署级共享；多用户部署需每用户独立 HOME/进程才能获得隔离。
3. **D1-55e2（部署约束）**：进程级 cachedDistTags 与外部 dist-tags 变更不同步（TTL 1h 或重启才刷新）；缓存按 server 进程共享属合理设计（避免重复 npm view）。

## 四、口径声明

- 当前设计级追踪（Codex round-03 口径延续）：**PASS 24 / SPEC-MISMATCH 4（D1-29、D1-43、D1-46、D1-55）/ FAIL 1（D1-39 修复前）/ BLOCKED 1（D1-54）/ UNASSESSED 0**。
- 探针观测：**120/120 checks（119 PASS + 1 OBSERVED_SPEC_MISMATCH(D1-55b)）+ 1 BLOCKED(NOT_RUN)(D1-55-session)**，由 `run-logs/*.stdout.log` 逐项追溯；checks 通过≠设计级 PASS。
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

## 七、待开发裁决清单（供 Codex 第三轮复核）

1. **D1-29**：pre 用户是否提醒 next（文档 vs 实现取舍）。
2. **D1-43c**：失败态 dismiss 是否接受"返回 up_to_date + current 伪冷却"。
3. **D1-46g**：doQuery reject 是否要求防御性封装为 check_failed。
4. **D1-55b**：hintConsumed 按会话隔离（设计承诺）vs 按进程共享（当前实现）——是否改会话级。
5. **D1-39**：`#554` 上游修复（统一弃用 .cmd 直启或 npm JS API）后，需在**固定修复版本**上重跑 D1-39 全链 + 真实 MCP/升级回归（FIX(sim) 不算）。
6. **D1-54**：Hermes 真实会话 E2E 解除条件满足后补验。