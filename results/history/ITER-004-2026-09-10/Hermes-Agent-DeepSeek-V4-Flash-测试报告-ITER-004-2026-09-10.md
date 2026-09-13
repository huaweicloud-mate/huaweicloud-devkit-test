# Hermes-Agent-DeepSeek-V4-Flash-测试报告-ITER-004-2026-09-10

> Agent：Hermes-Agent｜模型：DeepSeek-V4-Flash（0731）｜迭代：ITER-004-2026-09-10
> 事项：① NR3「存量用户版本升级提醒」需求测试（设计文档 version-upgrade-design.md）② issues 回归验证（含已关闭问题）

## 一、概述

| 项 | 值 |
|---|---|
| 被测对象 | huaweicloud-devkit：**1.1.2 正式版**（gitHead `09a59b93`，2026-09-10 09:22 发布）+ dev `306c633` + next 线 **1.1.3-next.2**（`c6c0965f`） |
| 对照基线 | 1.1.2-next.4（`608b120`，ITER-003 基线） |
| 变更规模（next.4→1.1.2） | 增量 PR #579/#580/#581/#582/#584 等；dev 另 +24 commits（auth project-id 自动解析/telemetry 改造） |
| 需求文档 | `hdk/docs/version-upgrade-design.md`（与飞书 wiki 同源，飞书需登录无法直取，本地面存量文档） |
| 测试范围 | NR3 需求全链路（检测/提醒/升级/冷却/兜底/兼容性）15 用例（D1-26~40 新增）+ issues 回归 9 项 |
| 环境 | Windows 10 / Node v22.23.2 / npm 10.9.x，默认镜像 mirrors.huaweicloud.com |
| 报告模型 | 源码级函数直调 + MCP 协议层端到端 + 发布线 commit 追溯 + 真源 dist-tags 对照 |

## 二、执行摘要度量

| 度量 | 值 |
|---|---|
| 设计级矩阵 | **138 条**（123 既有 + 15 新增 NR3；CSV 真源动态计数，评审稿 245 条 ALL PASS） |
| NR3 用例执行 | **15/15 执行，14 通过，1 未通过（D1-39 P0）**，另 1 差异点（D1-29 P3 文档） |
| 探针断言 | 函数级 **45/46 PASS**（unused：D1-39d async 亦 FAIL）+ MCP 端到端 2 项 |
| issues 回归 | 9 项核验：**5 已解决（#518/#574/#520/#516/#560）、1 修复滞后（#533 仅 next 线）、1 未修复 P0（#554）、2 部分/待查（#530 + D1 批次）** |
| 新增缺陷候选 | **P0×1（NR3-1=#554 未修复当前态）**、P3×2（D1-29 文档差异/固定官方源建议） |
| 新提单 | 0（D1-39 与 #554 同根因，未重复提单；是否独立上报升级提醒验收缺陷待用户决策） |

## 三、分维度结果

### 3.1 NR3 版本升级提醒（D1-26~40）

**结论：逻辑层设计完整、函数级全部通过；Windows 平台端到端不可用 → 需求验收不通过（P0）。**

| 维度 | 用例 | 结果 | 关键证据 |
|---|---|---|---|
| 协议暴露 | D1-26 | ✅ | tools/list=39 工具，check_update/upgrade 注册且 schema 完整 |
| 检测语义 | D1-27/28 | ✅ | up_to_date / update_available + targetVersion 正确 |
| 版本比对 | D1-29/30 | ⚠️ | semver 6 组全过；**文档-实现差异**：文档表「pre 不提醒 next」，实现 pre 用户会被提醒 next 更新（P3） |
| 冷却机制 | D1-31/32/33 | ✅ | 3 天冷却、新版本无视冷却、skip 文件结构/容错/多路径 |
| 失败降级 | D1-34/35 | ✅ | check_failed 不阻塞 + 5min 节流 + 1h 缓存 + SKIP env |
| 兜底包装 | D1-36/37 | ✅ | 首调用附加 _updateInfo；SKILL.md 会话启动指令齐备 |
| 升级语义 | D1-38 | ✅(mock) | version 校验/manual 提示/officeace 文案/失败不崩溃 |
| **Windows 可用性** | **D1-39** | ❌ **P0** | **spawnSync('npm.cmd') EINVAL（error.code=EINVAL 直捕），对照 shell:true 成功；async 同挂；MCP 端到端 check_update 返回 latestStable=null=检测失败静默** |
| 镜像环境 | D1-40 | ✅+残留 | 当前无滞后；防倒退兜底生效；未固定官方源（建议） |

### 3.2 issues 回归验证

| issue | 关闭/状态 | 验证方法 | 判定 |
|---|---|---|---|
| #518 镜像滞后+倒退提示 | CLOSED 09-09 | 1.1.2/next.2 README 含 mirror-lag 说明（git show 实读）+ judgeUpdate 防倒退（D1-27） | ✅ 已解决 |
| **#554 Windows 更新检测 EINVAL** | **OPEN** | **本机 queryDistTagsSync/queryDistTags 实测 EINVAL + check_update 端到端 null** | ❌ **未修复（P0）** |
| #533 authEncrypt 指纹误报 | CLOSED 09-09 | merge-base 追溯：afeeb03 ∈ next.2 ∉ 1.1.2；1.1.2 reconcile.mjs 无 authEncrypt 分支 | ⚠️ 修复在 next 线，1.1.2 用户未生效 |
| #574 cli-domain-id 根因 | CLOSED 09-09 | 64b253e ∈ 1.1.2/next.2，skills 文档纠正实读 | ✅ 已解决 |
| #560 OfficeAce CLOSE_TIMEOUT | CLOSED 09-08 | ITER-003 已闭环 | ✅ 已解决 |
| #520 README credential 冲突 | CLOSED 09-09 | 1.1.2 README env 字段说明在 | ✅ 已解决 |
| #516 version 版本不对 | CLOSED 09-09 | 1.1.2 version 读 PACKAGE_ROOT/package.json | ✅ 已解决（有限确认） |
| #530 BSS/README/参数校验 | CLOSED 09-09 | BSS 差异归属 KooCLI 侧（技能实证）；README 侧 1.1.2 已含 | 部分 |
| #510/#512/#508/#485/#479 | CLOSED | 文档/流程侧，非本轮重点 | 待下轮抽查 |

### 3.3 需求-实现-文档三方核对

| 设计文档要求 | 实现 | 判定 |
|---|---|---|
| 双层检测（SKILL 指令+首调用兜底） | SKILL.md 会话启动节 + applyUpdateHint | ✅ |
| 提醒语义（update_available/dismissed/check_failed） | judgeUpdate 四态 | ✅ |
| 升级流程 | upgradePackage 用 `npx huaweicloud-devkit@<tag> update`（文档三步 npm view+install+setup-cli 为整合实现，语义一致） | ✅ |
| 冷却 3 天/新版本无视 | writeSkipState/judgeUpdate | ✅ |
| 版本比对表（pre 不提醒） | determineTarget 含 next 候选 | ⚠️ 差异（D1-29） |
| 离线不阻塞 | check_failed+5min 节流 | ✅ |
| **Windows 平台可用** | — | ❌ **P0（D1-39）** |

## 四、发现明细

| ID | 维度 | 严重度 | 描述 | P/G/I | 状态 |
|---|---|---|---|---|---|
| NR3-1 | D1-39 | **P0** | Windows 升级检测链 EINVAL：check_update/upgrade 在 Windows 检测与升级均不可用，存量用户收不到升级提醒（=**#554 未修复当前态**，缺陷从 setup-cli 重构到 update-check.mjs 后跟随） | P | 未上报新单（与 #554 同根因，证据在 ITER-004/evidence/） |
| NR3-2 | D1-29 | P3 | 设计文档版本比对表（pre 不提醒）与实现（pre 用户提醒 next 更新）不一致 | P | 待开发确认文档/实现取舍 |
| NR3-3 | D1-40f | P3 | update-check 未固定官方 registry（#518 建议残留）；防倒退已兜底，非缺陷 | I | 跟踪 |

> 口径说明：P=产品缺陷候选（P0 需真机/端到端二次确认后上报）；G=环境/平台；I=建议/信息。D1-39 的 EINVAL 为运行级实锤（error.code 直捕 + shell:true 对照 + MCP 端到端），定级可信。

## 五、上报闭环

- 今日 **0 新提单**：#554（OPEN）已存在且为 root issue，D1-39 为其当前形态的补充运行证据（按用户纪律「同根因新发现」已在测试执行记录关联；是否追加 #554 评论或独立提单「NR3 Windows 不可用」由测试经理决策）
- 待跟踪：#554（P0，升级提醒域）→ 建议下一轮转派开发侧；#533 等待下个正式版发布后复核 1.1.2 用户的修复生效
- 上游 triage 状态：我方历史提单 #557~565 均 triaged 无驳回（ITER-003 已回流）

## 六、结论档位

**今日范围判定：⚠️ 有条件验收/不建议发布验收通过。**

- NR3 版本升级提醒：**逻辑层完成且函数级验证通过，但 Windows 主平台端到端不可用（D1-39 P0）**——功能对目标用户（Windows 存量）不生效；**修复 #554（spawn npm.cmd 加 shell:true 或改 npm 直调）后复测即可达标**。
- issues 回归：已关闭 5 项确认修复无退化；#554 未修复确认；#533 修复随 next 线发布（节奏正常）。
- 无行为倒退证据：D1-27/40 证明防倒退提示与镜像环境行为正确。

## 七、后续迭代建议

1. **P0 优先**：#554 修复（update-check.mjs + setup-cli 的 npm.cmd+npx.cmd spawn 统一加 shell:true 或替换为 npm 的 JS API），修复后跑 D1-39 全链复测 + 真机 check_update 端到端
2. D1-29 文档-实现差异：与开发确认版本比对策略（pre 用户是否提醒 next），同步更新设计文档表
3. D1-38 真实升级链路：升级执行（写操作）在测试机/隔离环境实测（本机未跑，避免污染 npx 缓存）
4. 矩阵同步：设计级 138/评估完成 15/15（新用例）；CSV+评审稿已重生成入仓
5. 全景图 xlsx/html 回流（收尾时执行）

## 八、数据留痕

| 资产 | 路径 |
|---|---|
| 执行记录（含逐条证据） | `results/ITER-004-2026-09-10/测试执行记录.md` |
| 探针脚本 | `results/ITER-004-2026-09-10/evidence/d1-uc-probe.mjs`（45 断言）、`d1-check-update-call.mjs`（MCP 端到端） |
| 矩阵真源 | `test-cases/design/用例矩阵-设计级.csv`（138 条）+ 评审稿 `docs/测试体系-评审稿.html` |
| 基线/影响分析 | `results/ITER-004-2026-09-10/baseline.md` / `change-impact.md` |