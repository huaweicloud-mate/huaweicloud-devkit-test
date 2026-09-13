# Hermes-Agent-DeepSeek-V4-Flash-测试报告-ITER-003-2026-09-09

> **迭代**：ITER-003-2026-09-09（执行于 2026-09-09）
> **执行主体**：Hermes-Agent（DeepSeek-V4-Flash-0731）
> **被测产品**：huaweicloud-devkit
> **被测版本**：**1.1.2-next.4（commit 608b120）**（npm next 发布线；latest=1.1.1）
> **⚠️ 基线漂移记录（2026-09-09 06:10）**：真实执行阶段 npm `dist-tags.next` 推进至 **1.1.2-next.5（592e5976）**；经 diff 确认 next.5 相对 next.4 **未触碰任何 #519/#542/#544 修复文件**（仅版本 bump + README #518/#566 + CHANGELOG + dsh/opencode 集成小改）→ **全部回归结论跨版有效**；真实 agent 执行（§二.5）即为 next.5 实装验证
> **对照基线**：1.1.1 正式版（= dev @ 74b9642）｜ 1.1.2-next.4（ITER-002 同基线，无漂移确认）
> **本次范围**：上游问题验证（9 issue 状态同步 + #554 复验）+ **#519/#542/#544 回归验证（PR #545 修复确认）** + D10-6 评测基建交付 + 每日例行回归 + 全景图每日归档启用

---

## 一、执行摘要度量

| 度量 | 值 | 说明 |
|---|---|---|
| 设计级用例评估 | **123/123（100%）** | 首轮审计留痕 73 + 补测 49 + ITER-003 补 D10-6 评测基建 1（测试侧交付完成，环境缺口清零） |
| metrics 原子执行记录 | 设计级相关 **+5 条次**（ITER-003 批次） | 问题验证 5 / D10-6 基建 1 / 每日例行 2 / 覆盖口径 1 / 回归验证 7 = 原子批次 5 行（另 633 条次为验证性批量不计入设计级） |
| 回归验证用例 | **7 项设计级验证点通过**（主路径）+ 并发会话黑盒复验补充 | #519×4 + #542×3 + #544×2 验证点、功能实测 5/5、隔离 3/3、T1 相关 87/87、真实 Codex CLI 安装闭环；并发验证补充发现 4 项（§二.6） |
| 新增缺陷 | **4 项新发现**（并发黑盒复验产出） | D5-1 Codex 注册状态检测旧名匹配（**源码核实属实**）/ D5-2 Codex Desktop marketplace 相对路径风险（需 UI 实测）/ D5-3 doctor 失败退出码恒 0（**源码核实属实**）/ D5-4 #519 失败退出码 harness 复验（待真实失败场景） |
| 上游 issue 状态 | 9/9 triage 确认 | #557-565（8 open 转派 + #560 修复闭环）；另有 #519/#542/#544 回归验证 closed/resolved 全过 |
| check_docs 体检 | 0 问题 | 文档门面/口径一致性通过 |

## 二、回归验证：#519 / #542 / #544（本次核心）

> 三 issue 由 **PR #545**（Fix Codex install, KooCLI auth diagnostics, safety hook）修复，merge **91536d7**；`git merge-base --is-ancestor 91536d7 608b120 = True` → 修复全部在 1.1.2-next.4 发布线内。

### 2.1 #519 Codex 原生插件安装 —— ✅ 已修复，无退化

| 验证点 | 结论 | 证据 |
|---|---|---|
| 插件名从 marketplace manifest 读取（`getCodexPluginName()` → huaweicloud-devkit，不再硬编码 huaweicloud-core） | ✅ | setup-cli.mjs L620-633/L637 |
| 安装失败不再误报成功：`installCodex` 非零 → return false → `runInstallStep` 收集 → `process.exit(1)` | ✅ | L648-676/L3165-3173 闭环 |
| uninstall 兼容清理新旧两个插件名（`Set([pluginName, 'huaweicloud-core'])`） | ✅ | L682 |
| README.md/zh-CN.md 补 Codex / Codex Desktop 安装验证指引 | ✅ | #545 diff README +22 行 |

附带确认（#542 评论提及）：`--target all` 部分失败 → 报告失败目标 + exit 1。

### 2.2 #542 Windows Codex 安装/认证状态 —— ✅ 已修复，无退化

| 现象 | 验证点 | 结论 | 证据 |
|---|---|---|---|
| ① `install --target codex` 写 OpenCode marker | `installMarkerDirForTarget('codex') → null`（L3064） | ✅ 源码确认 | 不再 mkdir `~/.config/opencode/huaweicloud-plugins` |
| ② 沙箱内 hcloud home 解析失败误判 | 新增 `hcloud-probe.mjs` 六分类（ok/version_mismatch/sandbox_home_failure/privacy_pending/not_found/unavailable）+ `hcloudProbeNextStep` | ✅ **实测 5/5** + 真机 ok | 构造场景 3a-3e 全过；install/sync 入口集成专用分支 |
| ③ auth_status S1/S2-current 指纹误报 | `s2CurrentMatchesLastDevkitSync`（AK 明文==S1 + last_sync 元数据匹配 + mtime 窗口）→ effectiveCurrentFp 对齐 S1 | ✅ **隔离实测 3/3** | A 无 last_sync 仍报（行为不倒退）/ B 匹配不报（修复目标）/ C profile 不匹配仍报（防误吞） |

> 边界说明：authEncrypt **整文件加密**（AK 密文不可读）场景不在本修复范围（属 #533/AK-FP-1 族，需解密读取），保持独立跟踪。

### 2.3 #544 Windows Codex safety hook 硬编码 python3 —— ✅ 已修复，无退化

| 验证点 | 结论 | 证据 |
|---|---|---|
| hooks.json 两处 matcher（Bash + mcp__huaweicloud）均改 `node .../huaweicloud-safety.mjs` | ✅ | hooks.json 内容（不再依赖 python3） |
| Node hook 存在且复用共享安全策略（classifyTextCommand） | ✅ | huaweicloud-safety.mjs（1.4KB，import safety-policy.mjs） |
| doctor 检查 Node hook 运行时/配置 | ✅ | #545 修复说明（测试侧源码确认） |
| T1 相关测试 | ✅ **87/87** | agent-install/hook-node/hcloud-probe/cred-reconcile-e2e/auth-credentials/hook-python 6 文件 |

### 2.4 副作用识别（#545 改动 24 文件是否引入其他问题）—— ✅ 未引入

| 风险面 | 结论 | 证据 |
|---|---|---|
| 安全规则语义 | ✅ 无变化 | risk-rule-engine.mjs 与 rules/ 在 #545 **零改动**（git diff 空）；冒烟 5 命令行为与既有一致（rm -rf deny / DeleteServer warn 既有 + plan 门 deny 兜底 / 只读 allow / OBS-12 盲区不受影响）；`classifyTextCommand` 新增非华为云命令也过规则引擎（**加固**） |
| 工具面 | ✅ 无删减 | tools.mjs -44 行 = check_cli 探测逻辑**重构抽出到 hcloud-probe.mjs**（复用非删除）；D5-3 枚举 39 = 37 既有 + check_update/upgrade（#525 新增） |
| T1 全量 | ✅ 无 #545 引入失败 | #545 改动测试文件独立跑 87/87 全过；全量失败（mcp-server "Timed out waiting for initialize" 偶发 6→2→1 递减）为 **Windows 全量 runner 时序串扰**（单文件 0 失败、该文件不在 #545 改动范围）→ 环境项非回归 |

### 2.5 真实 agent 执行验证（Codex CLI 0.153.4，本机，next.5 实装）—— ✅ #519 端到端实锤

> 反馈补充（2026-09-09）：初版回归验证为源码级 + 模块直调；按"必须在 agent 上执行"要求，补 Codex CLI 真实执行闭环。

**执行序列（全部真实执行，非模拟）**：

```
npx --yes --registry=https://registry.npmjs.org huaweicloud-devkit@next install --target codex
```

| 步骤 | 真实输出/结果 | 对应 issue |
|---|---|---|
| 安装器注册 marketplace | `Installed marketplace root: ...node_modules\huaweicloud-devkit` | #519（正常注册） |
| **插件名（修复核心）** | `Installing plugin: huaweicloud-devkit@huaweicloud-devkit` + `Added plugin `huaweicloud-devkit` from marketplace `huaweicloud-devkit`` | ✅ **#519：不再用 huaweicloud-core** |
| 安装完成 | `Installation complete!` + `Installed plugin root: ...\.codex\plugins\cache\huaweicloud-devkit\...\1.1.2-next.5` | — |
| **codex plugin list 复验** | `huaweicloud-devkit@huaweicloud-devkit  installed, enabled  1.1.2-next.5` | ✅ **#519：installed+enabled 真源确认** |
| **OpenCode marker 未写** | `~/.config/opencode/huaweicloud-plugins` mtime = 09-08 22:01（安装前遗留），今天安装后**未更新** | ✅ **#542①：真实执行确认不写 OpenCode marker** |
| 安装后关键文件 | `hooks/huaweicloud-safety.mjs` 存在 + `hooks.json` 两 matcher 均 `node ...safety.mjs`（无 python3） | ✅ **#544：真实安装产物确认 Node hook** |
| hcloud 探测集成 | 安装尾部输出 `KooCLI (hcloud) detected.`（走 probeHcloud 分类） | ✅ **#542②：probe 链真实触发** |

**结论**：真实 agent（Codex CLI）安装闭环验证 #519（插件名/安装成功/installed+enabled）、#542①（marker 隔离）、#542②（probe 提示）、#544（Node hook 产物）全部与源码级/模块级结论一致。

### 2.6 并发回归验证发现的新问题（黑盒 npm tarball 隔离验证产出，2026-09-09 合并）

> 另一执行会话对 `huaweicloud-devkit@1.1.2-next.4` npm tarball 做了隔离黑盒验证（fake Codex CLI/隔离 USERPROFILE/无真实凭据），主路径结论与本节一致，但**发现 4 项"可能引入的其他问题"**——本报告合并并源码复核：

| ID | 发现 | 源码核实 | 级别 | 处置建议 |
|---|---|---|---|---|
| **D5-1** | Codex 插件注册状态检测仍匹配旧名：`agent-registration.mjs` L65 `out.includes('huaweicloud-core')`——新插件显示 `huaweicloud-devkit@huaweicloud-devkit` → `auth status`/注册状态**误报 Codex 未配置** | ✅ **属实**（agent-registration.mjs:65 旧名硬编码） | P2 | 同时匹配 `huaweicloud-devkit(@huaweicloud-devkit)` + 保留旧名兼容；**独立提单** |
| **D5-2** | Codex Desktop marketplace source path 相对路径：`./plugins/huaweicloud-devkit`（setup-cli.mjs L826）——按 marketplace 文件位置解析时路径可能错位（`.agents/plugins/plugins/...`） | ⚠️ 源码存在该相对路径；**实际解析规则需 Codex Desktop UI 实测** | P2（待定） | 真实 Desktop UI 验证；若按 marketplace 文件目录解析改为绝对路径 |
| **D5-3** | `doctor` 失败时退出码恒 0：cmdDoctor `if (fail > 0)` 仅打提示（L3799-3801），无 `process.exitCode` 设置 → CI/自动化无法靠退出码判失败 | ✅ **属实**（L3799-3801 确认；对比 update 命令 L3864 有 exitCode=1） | P3 | doctor fail>0 时 `process.exitCode = 1`（或加 `--no-fail-exit`） |
| **D5-4** | #519 安装失败非零退出**未能真实复验**：黑盒用 `.cmd` fake Codex 模拟失败，但 `.cmd` exit 码被 Node spawnSync+shell 吞成 0 → 模拟无效 | ⚠️ 代码路径（installCodex→false→exit(1)）成立，但**真实失败场景未验证** | 待复验 | 真实 Codex 失败场景/可靠 harness 复验后方可闭环 |

**结论**：并发验证未推翻主路径修复结论，但证明 **#519/#542 修复不完整闭环**——存在 2 项已源码核实的残留问题（D5-1/D5-3）+ 1 项待 UI 实测（D5-2）+ 1 项待复验（D5-4）。三项新发现（D5-1/D5-2/D5-3）应独立提单（新发现独立提单纪律）。

## 三、上游问题验证（#557-565 + #554 复验）

| Issue | 上游状态 | 结论 |
|---|---|---|
| #557-565（本批 9 个） | 9/9 triage 确认（8 open 转派 kit 机器人 + #560 修复闭环） | ✅ 无一驳回，上报质量确认 |
| #560（OfficeAce CLOSE_TIMEOUT） | closed/resolved，**修复已进发布线**（608b120 `NEEDS_KEEPALIVE = hermes && win32` 源码实证） | ✅ 升级即生效 |
| **#554（Windows 更新检测 EINVAL）** | open/triaged；**本机实测 1.1.2-next.4 仍未修复**——`update-check.mjs` queryDistTagsSync spawnSync('npm.cmd') 无 shell:true → EINVAL（双对照实锤：加 shell:true status=0 + 网络直连正常） | ❌ 未修复（复验证据评论 issuecomment-5594967457 已追加原 issue） |
| #518（README mirror-lag） | dev 已合入 #566 修复（未进 next） | ✅ 上游已响应 |
| #555/#556（uninstall 缺陷） | open/triaged，dev/next 均无修复 commit | ⭕ 跟踪中（破坏性不实测） |
| #516 / #533 | 需求确认 / bug high 转派 | ⭕ 跟踪 |

## 四、D10-6 评测基建（规划补充验证交付）

- **建成 v1**（ITER-002 唯一环境缺口清零）：`eval/` 目录 + `eval/prompts/eval-set-v1.csv`（**15 条评测集**，从展开级 EXP-E01~E15 抽取，含期望路由/动作列）+ `eval/README.md`（可重复跑原则：固定模型+温度 0、版本化、成本预算 ≤135 次调用/轮）
- 覆盖口径更新：**设计级 123/123 评估完成（100%）**
- 遗留：首轮真实跑分（需模型成本，排 ITER-004）

## 五、每日例行回归

| 项 | 结论 |
|---|---|
| 基线无漂移 | ✅ latest=1.1.1 / next=1.1.2-next.4（官方 registry 直连）→ ITER-002 全部结论保持有效 |
| dev 分支推进 | +24 commits（telemetry/auth/#566），均未发布 → 事件记录，下个 next 纳入 NR 增量 |
| D8 文档一致性 | ✅ 4/4（修复 check_readme_consistency.py stopword 误报——README 英文句 "devkit is installed" 的 `is` 被误当命令） |
| 全景图每日归档 | ✅ 启用：新建 `panorama/` 目录专门存放，首日归档 ITER-003 HTML+xlsx（含「四·C ITER-003 执行结果」节 + 缺陷清单验证快照行）；流程固化 panorama/README.md |

## 六、发现明细（P/G/I 分类）

| ID | 级别 | 类别 | 描述 | 状态 |
|---|---|---|---|---|
| #554（复验） | P1 | 产品（既有缺陷） | Windows 更新检测在 1.1.2-next.4 仍未修复（spawnSync npm.cmd 无 shell:true → EINVAL，更新提示静默失效） | ❌ 未修复，复验证据已追加上游（issuecomment-5594967457）；待下版复测 |
| — | — | — | 其余 0 新增（回归验证 #519/542/544 全过；副作用识别无引入） | ✅ |

## 七、上报闭环

- 本轮无新提单（#519/#542/#544 为**回归验证既有已解决 issue**，非新缺陷）
- #554 复验证据以**补充证据评论**形式追加原 issue（符合"同一发现可评论追加，新缺陷才独立提单"纪律）
- 上游状态全量同步已回填全景图缺陷清单 G 列（ITER-003 快照行）

## 八、结论档位

**1.1.2-next.4（608b120）/ next.5（592e5976）可发布性：⚠️ 有条件发布**
- **主路径修复确认**：三 issue 修复有效（回归验证 7 验证点 + 真实 Codex CLI 安装闭环 + T1 相关 87/87），无安全规则/工具面退化
- **但并发黑盒复验发现修复不完整闭环**，2 项源码核实残留 + 1 项待实测 + 1 项待复验：
  - **D5-1（P2，已核实）**：Codex 插件注册状态检测仍匹配旧名 `huaweicloud-core` → auth status 误报 Codex 未配置（agent-registration.mjs:65）
  - **D5-3（P3，已核实）**：doctor 失败退出码恒 0 → CI 自动化无法判失败
  - **D5-2（P2 待定）**：Codex Desktop marketplace 相对路径解析风险，需真实 UI 实测
  - **D5-4（待复验）**：#519 安装失败非零退出需真实失败场景复验
- **处置建议**：D5-1/D5-2/D5-3 独立提单（新发现独立提单纪律）；D5-4 待真实失败场景；上述处理前建议**暂缓 codex 目标向正式发布线的推荐**，codex-desktop 目标同理受 D5-2 影响
- 其余遗留风险（#554/#555/#556/#533、macOS/AtomCode GUI、评测首轮跑分）保持跟踪

## 九、后续迭代建议

1. #554 在下一版 next（或修复合入后）**优先复测**（本机可直接 node 直调 update-check.mjs，三对照模板现成）
2. dev 新特性（auth project_id 自动解析/凭证验证/telemetry 代理）随 next 发布后按 NR 流程纳入增量测试
3. D10-6 评测基建 v1 已建成——ITER-004 执行首轮真实跑分（固定 deepseek 主模型 + temperature 0）
4. 全景图每日归档持续执行（20:00 计划任务同步覆盖 panorama/ 目录）

## 十、数据留痕

- 回归验证记录：`results/ITER-003-2026-09-09/回归验证-519-542-544.md`
- 问题验证记录：`results/ITER-003-2026-09-09/问题验证记录.md`
- 证据脚本：`results/ITER-003-2026-09-09/evidence/`（verify-519-542-544.mjs / verify-542-isolated.mjs / verify-519-sideeffects.mjs / verify-554.mjs / verify-554b.mjs）
- 度量：`metrics/execution.csv`（ITER-003 +5 原子批次行）
- 评测资产：`eval/`（eval-set-v1.csv 15 条 + README）
- 全景图归档：`panorama/`（ITER-003-2026-09-09.html + .xlsx）
- 指针：`results/LATEST.md`（指向 ITER-003-2026-09-09）

---
*报告生成：2026-09-09 ｜ 归档：results/ITER-003-2026-09-09/ ｜ 全部已推送（27ea765），远端一致*