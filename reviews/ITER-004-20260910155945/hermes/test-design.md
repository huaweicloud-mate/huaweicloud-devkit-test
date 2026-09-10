# Hermes 测试设计交接版（版本升级提醒 NR3）

> 当前迭代：`ITER-004-20260910155945`
> 状态：`HERMES_REVISION_READY`（由 Hermes 更新；**不得提前签署 `TEST_DESIGN_READY`**，需 Codex 第四轮复评）
> 生成时间：2026-09-10T19:40:00+08:00（ISO 8601）｜更新：2026-09-10T19:40:00+08:00（Hermes Agent E2E / Hook 客户端真实证据已补齐）
> 设计文档：`C:\Users\Administrator\devkit-test\hdk\docs\version-upgrade-design.md`（归档仓库 `docs/` 下无副本）
> 被测项目：`C:\Users\Administrator\devkit-test\hdk`（huaweicloud/huaweicloud-devkit）
> Codex 评审：`codex/review-round-01/02/03-版本升级提醒.md`；本轮按 round-03 七项整改闭合

## 一、设计基线

| 项 | 值 |
|---|---|
| 正式版（旧版载体） | 1.1.2 @ `09a59b937eb3`（npm 发布 2026-09-09T11:03Z） |
| next 线（未修复副本） | 1.1.3-next.2 @ `c6c0965f0bdf`（npm 发布 2026-09-10T01:22Z） |
| dev 远端（观测） | `e2f4d2ada058`（2026-09-10T15:29+08:00） |
| FIX(sim) 修复副本 | next.2 原码 + 3 处补丁，版本号 1.1.3 受控**非官方发布线**（仅证明修复方向） |
| Node / npm | v22.23.2 / 10.9.8 |
| OS / 架构 | Windows 10 / win32 x64（本机可执行基线） |
| Shell / TTY | powershell.exe 5.1 / 非 TTY（spawnSync 管道） |
| 执行 Agent | Hermes（本机） |
| 风险 | 升级写操作仅在一次性隔离 HOME（`evidence/nr3/.sandbox`，gitignore）；真实云资源零触碰 |

## 二、设计范围与分层

设计级用例 D1-26~D1-55（30 条）＋ NR3 终端展开级 24 条（`EXP-NR3-01~24`，已入唯一真源 `test-cases/expanded/`）。分层与闭环文档第 2 步补充规则一致：

| 分层 | 定义 | 覆盖 |
|---|---|---|
| COMMON | 平台无关核心逻辑（函数级，Windows 探针执行，需 Linux 复跑确认） | D1-27/28/30/31/32/33/34/35/36/44/46/47/50(mock) |
| CLIENT_MATRIX | 客户端安装布局与生命周期（Hook/非 Hook） | D1-52（非 Hook=OpenCode 布局）；D1-41/42/45/49（stdio 协议闭环） |
| OS_MATRIX | 操作系统差异路径 | D1-39（Windows FAIL/Linux BLOCKED/macOS BLOCKED）、D1-52（升级链） |
| AGENT_E2E | 真实 Agent 宿主会话 | D1-54（BLOCKED，需测试专用实例） |
| CROSS_PROCESS | 跨进程/跨会话状态边界 | D1-42、D1-48、D1-55（PROCESS_SHARED_STATE 证据） |

## 三、候选用例矩阵（评审确认后同步正式矩阵）

- `hermes/candidate-matrix.csv`（候选，**39 行 × 16 列**）
- `reviews/ITER-004-20260910155945/terminal-matrix.csv`（**评审确认后的顶层正式矩阵，内容与候选一致**）
- 矩阵状态分布：PASS **26** / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED **8 行**（Linux×4、macOS/ARM×1、CodeArtsSpace(Hook)×1、TTY×1、D1-55-session NOT_RUN×1）
- **D1-54 已转 PASS**：隔离 Hermes 实例（profile nr3-test）5 会话真实 Agent E2E（SKILL→check_update→征询→同意升级→重启生效→拒绝 dismiss→离线不阻塞），48 工具调用全成功，证据 `run-logs/hermes-e2e-s*.out.log` + `hermes-e2e-manifest.json`；同时构成 **Hermes Hook 客户端完整生命周期**证据（真实 npx 安装/升级/重启/dismiss/离线，升级仅落隔离目录）
- **D1-55 证据分级**：remote transport 无 session 支持（协议探测无 `MCP-Session-Id`，源码确认 mcp-server-remote.mjs 无 session 状态绑定）→ 当前证据级别 = `PROCESS_SHARED_STATE`（同进程双请求序列）；新增 `D1-55-session` 行 = `BLOCKED(NOT_RUN)`，解除条件=产品支持 session 后复用 A/B 交错序列重测。D1-55b 保持 `SPEC-MISMATCH` 不改写为 PASS。

## 四、执行证据索引（第三轮修正后）

| 资产 | 路径 |
|---|---|
| 原始运行日志（stdout/stderr/退出码 ×4 探针，v2 重跑） | `results/ITER-004-2026-09-10/evidence/nr3/run-logs/` |
| 环境 manifest（v2：**真北京时间 ISO 8601**、沙箱源 commit 采集、双轨统计） | `run-logs/manifest.json` |
| 探针源码（含 v2 修正：session 探测/SPEC 分档输出） | `evidence/nr3/{d1-unit-probe,d1-mcp-loop,d1-upgrade-real,d1-49-d1-55-ext,run-probes,build-sandbox,fixture-server}.mjs` |
| 沙箱来源清单 + 结构化 commit（runner 采集源） | `.sandbox/MANIFEST.md` + `.sandbox/source-commit.json`（构建产物，gitignore，可重建） |
| 执行记录（v2：分档/多终端/裁决清单） | `results/ITER-004-2026-09-10/NR3版本升级提醒-补充执行记录.md` |

## 五、当前统计口径（第三轮修正：探针与设计级分离）

- **探针观测**：120/120 checks（119 PASS + 1 `OBSERVED_SPEC_MISMATCH`（D1-55b），另含 1 `BLOCKED(NOT_RUN)`（D1-55-session）），4 探针退出码 0；`checks passed` 仅表示观测到预设行为，**不等于设计级 PASS**。
- **设计级结果（D1-26~55，30 条，UNASSESSED=0）**：
  - ✅ PASS **25**（D1-26/27/28/30/31/32/33/34/35/36/37/38/40/41/42/44/45/47/48/49/50/51/52/53/**54**）
  - ⚠️ SPEC-MISMATCH 4（D1-29 pre 策略；D1-43c 失败态伪 up_to_date；D1-46g reject 直抛；**D1-55b 进程级共享 hintConsumed**）
  - ❌ FAIL 1（D1-39 修复前 Windows P0 EINVAL，双腿端到端实锤；FIX(sim) 通过≠产品修复）
  - ⛔ BLOCKED 0（设计级；终端路径 BLOCKED 8 行见矩阵）
- **矩阵展开路径 BLOCKED**：8 行（与 terminal-matrix.csv 一致，均写原因/影响/解除条件）。

## 六、放行检查（Codex 第三轮门禁对照）

| # | round-03 要求 | 落实 |
|---|---|---|
| 1 | 顶层 terminal-matrix.csv | ✅ `reviews/ITER-004-20260910155945/terminal-matrix.csv`（38 行，与候选人矩阵一致） |
| 2 | NR3 展开级矩阵同步 | ✅ `test-cases/expanded/用例矩阵-展开级.csv` 131 行 = D5 历史 70 保留 + NR3 24；gen_matrix.py 可复现（含生成时间）；verify/check_docs 全过 |
| 3 | D1-55 session 建模 | ✅ 协议探测确认 remote 无 session 支持 → 证据降级 `PROCESS_SHARED_STATE`；新增 `D1-55-session`=NOT_RUN/BLOCKED；D1-55b 保持 SPEC-MISMATCH |
| 4 | run-probes 时区/commit | ✅ 真北京时间（UTC+8 转换，去毫秒）；commit 从 `.sandbox/source-commit.json` 采集；已重跑生成 v2 日志 + manifest |
| 5 | 统计口径分离 | ✅ 探针 120/120 checks（含 1 OBSERVED_SPEC）与设计级 24/4/1/1 分开表述；D1-55b 标注 OBSERVED_SPEC_MISMATCH |
| 6 | 未解决项保留 | ✅ D1-39 FAIL、D1-29/43c/46g/55b SPEC、D1-54 BLOCKED、Linux/Hook/macOS/ARM/TTY BLOCKED 全部保留并写明原因/影响/解除条件 |
| 7 | 文件边界 | ✅ 仅改 hermes/、terminal-matrix.csv、expanded CSV 与 NR3 证据脚本/日志；codex/ 未动 |

## 七、仍需 Codex 第四轮复核 / 开发裁决

1. **规格裁决 4 项**：D1-29（pre 提醒策略）、D1-43c（失败态伪 up_to_date）、D1-46g（reject 防御封装）、D1-55b（hintConsumed 会话级 vs 进程级——含 remote transport 是否补 session 支持）。
2. **D1-39**：`#554` 上游固定修复版本发布后回归（FIX(sim) 不作产品证据）。
3. **D1-54 + Hook 客户端**：测试专用 Hermes 实例安装插件后的真实会话 E2E 与 Hook 生命周期证据。
4. **Linux/macOS/ARM/TTY 接入安排**：接入 zhangshuang/testbot1（Linux）、macOS CI runner、PTY 会话后补齐对应 BLOCKED 行。
5. **代表终端硬门槛**：当前 Windows（已覆盖）+ 非 Hook OpenCode（已覆盖）已达；Linux 与 Hook 未达——本轮交接继续保留 `HERMES_REVISION_READY`，由 Codex 第四轮确认是否需先接入环境再放行。