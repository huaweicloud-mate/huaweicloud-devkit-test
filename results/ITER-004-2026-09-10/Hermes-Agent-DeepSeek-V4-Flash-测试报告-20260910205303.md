# Hermes-Agent-DeepSeek-V4-Flash-测试报告（NR3 版本升级提醒）

> **报告生成**：2026-09-10 20:53:03（北京时间）
> **迭代**：ITER-004-20260910155945
> **执行 Agent**：Hermes-Agent（DeepSeek-V4-Flash 模型）｜**评审方**：Codex（7 轮评审闭环）
> **被测项目**：huaweicloud/huaweicloud-devkit（版本升级提醒 NR3 设计验收）
> **设计基线**：docs/version-upgrade-design.md（D1-26~D1-55，30 条设计级用例）
> **状态**：HERMES_REVISION_READY（产品级放行需规格裁决 + 正式修复版本回归后再评审）

---

## 1. 测试范围与基线

| 维度 | 值 |
|---|---|
| 设计级用例 | D1-26~D1-55（30 条，UNASSESSED=0） |
| 终端矩阵 | `terminal-matrix.csv` 39 行 × 16 列（candidate 一致） |
| 展开级矩阵 | `用例矩阵-展开级.csv` 132 行（D5 70 + D3-C4 22 + D10 15 + NR3 25） |
| 被测版本/commit | 正式 1.1.2@09a59b937eb3；next 1.1.3-next.2@c6c0965f0bdf；FIX(sim) 1.1.3（受控副本，非官方） |
| 实机环境 | Windows 10 x64（本机）+ **Ubuntu 24.04 aarch64（testbot3/1.94.218.129）**；Node v22.23.2 / npm 10.9.8 双端同版本 |
| Agent/客户端 | Hermes（隔离 profile nr3-test，Hook，真实会话）；OpenCode（非 Hook 代表） |
| 执行窗口 | 2026-09-10 15:29 ~ 20:53（北京时间 ISO 8601 归档） |

## 2. 发现的问题清单（本轮共 12 项）

> **提单状态（2026-09-10 21:10）**：产品侧 5 项（SPEC 4 项 + remote 部署约束）已按用户要求合并为**单个问题单 #614**（附件：`results/ITER-004-2026-09-10/附件-NR3客户端问题定位与根因.md`，含定位过程与根因）；原独立单 #606~#610 已关闭并指向 #614。产品缺陷 D1-39 → **#554**（保持独立）。

### 2.1 产品缺陷（1 项 P0）

| ID | 严重度 | 问题 | 实锤证据 | 状态 |
|---|---|---|---|---|
| **D1-39** | **P0** | **Windows 下插件 spawnSync 直启 `npm.cmd` 无 `shell:true` 触发 EINVAL**，check_update 静默失败（npm view 返回 null→check_failed），**存量用户收不到升级提醒**；升级腿同时不可用 | 函数级探针（EINVAL 稳定复现）+ 真实 MCP/升级端到端 + 真实存量用户态（双机） | 已报上游 **#554**（OPEN/critical）；FIX(sim) 副本验证修复方向有效（shell:true/统一弃 .cmd）；**正式产品修复版本未发布**，回归待 #554 发布后执行 |

### 2.2 设计—实现规格差异（4 项 SPEC-MISMATCH，待开发裁决）

| ID | 用例 | 设计承诺 | 实现实测 | 影响 |
|---|---|---|---|---|
| **D1-29** | pre 用户提醒策略 | 文档未明确 pre 线提醒行为 | 实现按用户当前线（pre 用户仅提醒 next 线） | 独立提单 **#609**（OPEN）；需裁决文档口径 |
| **D1-43c** | 失败态 dismiss | 失败不应伪造结果 | registry 失败 + dismiss:true 返回 `up_to_date`（伪结果）+ current 伪冷却落盘 | 独立提单 **#607**（OPEN）；需裁决是否接受或防御性封装 |
| **D1-46g** | doQuery 异常 | 应封装为 check_failed | reject 直接上抛（框架层日志） | 独立提单 **#608**（OPEN）；需裁决是否防御性封装 |
| **D1-55b** | 会话级提示隔离 | 「会话中第一个 tool 调用附加」承诺 | `hintConsumed` 为模块级**单例按进程共享**——remote 双客户端/同进程多请求 A 消费后 B 拿不到提示；**Windows 与 Linux 双平台复现** | 独立提单 **#606**（OPEN）；需裁决改会话级 key 或明确按进程语义 |

### 2.3 部署/产物约束观察（3 项，如实记录，非 PASS 项）

| ID | 观察 | 说明 |
|---|---|---|
| **D1-55c2** | remote transport 无 `updatePrewarm`（仅 stdio 有） | 仅调普通工具时 hint 永不生成——远程部署第二层兜底不可达（须先调 check_update） |
| **D1-55d** | skip 文件按 server 进程共享 | 单进程单 HOME 部署下 dismiss 为部署级，多用户隔离需独立 HOME/进程 |
| **D1-55e2** | cachedDistTags 与外部 dist-tags 变更不同步 | TTL 1h/重启才刷新（缓存按进程共享=合理设计，记录为部署约束） |

> 以上 3 项部署约束已打包独立提单 **#610**（OPEN，P3）。

### 2.4 测试环境/基建问题（2 项）

| ID | 问题 | 处置 |
|---|---|---|
| **HER-1** | Hermes 测试 venv mcp SDK 漂移（2.1.1 vs 声明 1.28.1）致全部 MCP 工具调用 `isError` AttributeError | 已对齐修复并复测（**属测试环境前置条件，非被测项目修复**）；s1.out.log 留作根因基线 |
| **PDB-1（探针平台化）** | 探针硬编码 `npm.cmd`/`npx.cmd` 与 Windows EINVAL 语义，Linux 实机补跑产生 13 项平台误报（判读后 Linux 功能正常） | 矩阵已按真实语义更新（D1-39/49/55 Linux PASS）；探针平台化补丁纳入后续整改 |

### 2.5 遗留阻断（5 行 BLOCKED，非缺陷）

Linux-D1-52 升级链（探针平台限制，安装链已 PASS）、macOS/ARM（无机器）、CodeArtsSpace Hook（无客户端环境）、TTY/PTY（无 PTY）、D1-55-session（产品 remote transport 无 MCP-Session-Id/状态绑定）——均含原因/影响/解除条件，未伪造执行。

## 3. 统计汇总

| 口径 | 结果 |
|---|---|
| **设计级（30）** | PASS 25 / SPEC-MISMATCH 4 / FAIL 1（D1-39 修复前）/ BLOCKED 0 |
| **终端矩阵（39）** | **PASS 29 / SPEC-MISMATCH 4 / FAIL 1 / BLOCKED 5** |
| **展开级（132）** | D5 70 + D3-C4 22 + D10 15 + NR3 25 |
| **探针观测（Windows）** | 120/120 checks（119 PASS + 1 OBSERVED_SPEC）+ 1 BLOCKED(NOT_RUN) |
| **Linux 实机补跑** | ext 探针 14 PASS + 1 SPEC + 1 NOT_RUN（与 Windows 一致）；unit 54 PASS；构建 tarball sha1 与 Windows 一致（跨平台可复现） |
| **Hermes Agent E2E** | 5 真实会话 / 48 工具调用 / S1·S2·S3·S4·S6 全 PASS（SKILL→check_update→征询→升级 1.1.2→1.1.3→重启生效→dismiss 3 天冷却→离线不阻塞） |

## 4. 关键行为验证点（无退化确认）

- 升级提醒 7 态契约（up_to_date / update_available / dismissed / check_failed / manual / blocked / skip_check）函数级 + MCP 层双覆盖
- 冷却持久化：dismiss 落盘 3 天精确（dismissedAt/expireAt），重启后跨进程生效
- 真实升级链：Windows OpenCode 布局 + Hermes Hook 布局（隔离目录）均 1.1.2→1.1.3 成功、重启生效、配置未丢失
- 离线降级：registry 不可达 → check_failed（"检测失败，不影响使用"），本地功能不阻塞
- 多 Agent 隔离：双 HOME 双进程 skip 互不污染

## 5. 结论与放行建议

- **测试设计（含多终端矩阵）已达 HERMES_REVISION_READY**，执行证据可审计、可复现（build-sandbox/run-probes/gen_matrix 一键重生成）。
- **产品级验收放行（TEST_DESIGN_READY/发布）前需闭合**：
  1. 规格裁决 4 项：D1-29、D1-43c、D1-46g、D1-55b（含 remote transport 是否补 session 支持）；
  2. D1-39：`#554` 官方修复版本发布后 Windows 全链回归（FIX(sim) 不作产品证据）；
  3. 环境接入：macOS/ARM CI、CodeArtsSpace、PTY 会话；Linux D1-52 升级链探针平台化后补跑；
  4. 全部条件满足后由 Codex 复评签署。

## 6. 证据索引

- 矩阵：`reviews/ITER-004-20260910155945/terminal-matrix.csv`（与 hermes/candidate-matrix.csv 一致）
- 展开级：`test-cases/expanded/用例矩阵-展开级.csv`（132 行）
- 探针日志：`results/ITER-004-2026-09-10/evidence/nr3/run-logs/`（Windows，20 文件）+ `linux-logs/`（Linux 补跑 13 文件）
- Hermes E2E：`evidence/nr3/run-logs/hermes-e2e-s1b/s2/s3/s4/s6.out.log` + `hermes-e2e-manifest.json`
- 执行记录：`results/ITER-004-2026-09-10/NR3版本升级提醒-补充执行记录.md`（§一~§十，含裁决清单与测试装置坑）
- 评审闭环：`reviews/ITER-004-20260910155945/codex/review-round-01~06`（round-07 待本轮材料复评）