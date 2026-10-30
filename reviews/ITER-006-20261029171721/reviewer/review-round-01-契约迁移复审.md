# ITER-006（v2.0.0 契约迁移）候选设计复审 — Round 01

- 评审者：**OpenCode**（模型 `deepseek-gw/deepseek-v4-pro-0813`），替代原 Codex 角色（Codex 侧 429 限流不可用）
- 评审时间：2026-10-30（北京时间）
- 评审目录：`reviews/ITER-006-20261029171721/`
- 评审输入：`hermes/test-design.md`、`hermes/candidate-matrix.csv`、`hermes/decision-log.md`、`hermes/v2-契约漂移-用例影响清单.md`、`hermes/status.md`
- SUT 基线：`huaweicloud-devkit` 仓 `v2` 分支 `fcfe047f`（package.json `2.0.0`）
- 评审方式：静态核对（逐行比对候选矩阵／母版／v2 源码），未执行测试、未跑真云、未修改 `hermes/` 或任何 CSV 真源

---

## 结论

**`REVIEW_CHANGES_REQUESTED`**

结构层（69 行 × 27 列 / ID 唯一 / 母版子集）、vendor gate 迁移动作机械可执行性、数字断言（56 工具 / 19 规则 / 14 gate 工具）、状态纪律、A/B/C 三表结论均核验通过；但**受影响范围存在实质漏判（9 条 vendor gate + 2 条 tool-count）与多判（3 条）**，且「受影响范围」是本轮迁移正确性的地基——漏判会让 v2 回归时残留 1.x 僵化断言、多判会把未被 gate 的 auth_sync 误加 gate 适配。该项不闭合不得放行。

---

## 一、逐项核验

### 1. 矩阵结构（69 行 × 27 列、ID 唯一、母版子集）— ✅ 已核验通过

证据（脚本机械比对）：

- `candidate-matrix.csv`：数据行 `69`，列 `27`，列名与母版 `test-cases/design/用例矩阵-设计级.csv` **完全一致**（逐列相等）。
- ID 唯一：重复 `0`，候选 `69/69` 唯一。
- 母版子集：母版 `212` 条设计级中，候选 `69` 个 ID **全部存在**，无非法 ID、无母版外 ID。
- 迁移仅落 `前置条件/操作步骤/预期结果/指引来源/依赖` 五列，未越权改 `ID/维度/优先级/测试数据/关联工具/展开规则` 等。

结论：结构层通过；「69 是否为**正确的**受影响集合」不通过，见第 5 项。

### 2. vendor gate 59 条迁移动作（机械可执行、断言唯一性）— ✅ 已核验通过（但见第 5 项的范围偏差）

证据：

- 三要素齐全：59 条 `前置条件` 含「已建立 vendor 确认（vendorConfirmed=用户确立华为云的原文引用）」、`操作步骤` 以 `⓪建立 vendor 确认…` 开头、`预期结果` 以「（gate 放行后）」加前缀。
- 与源码语义吻合：`vendor-gate.ts:93 enforceVendorGate` 要求 `args.vendorConfirmed` 为**非空字符串 quote**（`boolean true` 不再通过），与「用户确立华为云的原文引用」写法一致；`VENDOR_CHALLENGE` 为 **once-per-session** 首次断言调用 bounce 一次（`vendorChallengeConsumed` Map，`vendor-gate.ts:38-92`），与「首次触发 challenge 后原样 retry 一次放行」一致；`HUAWEICLOUD_VENDOR_CHALLENGE=off` 关闭 bounce 供确定性测试层使用，但 gate 本身无 off——迁移未虚化 gate。
- 断言唯一性未破坏：59 条 `预期结果` 去掉「（gate 放行后）」前缀后与母版**逐字相等**（脚本比对 0 差异）；「gate 放行后」仅作会话前置标注，不改原唯一判定点。
- 迁移动作机械可执行：前置条件+步骤⓪+预期结果前缀三处可脚本化回填，无歧义。

结论：动作与断言层面通过；但「59 条中 3 条不该纳入、9 条该纳入未纳入」属第 5 项范围缺陷。

### 3. dispatch 3 条改写命名与 v2 源码一致性 — ⚠ 基本通过，1 处命名不精确（[P2]）

证据（`git show fcfe047f` 逐符号核对）：

| 改写符号 | v2 源码落地 | 结果 |
|---|---|---|
| `dispatchTool` | `tools.ts:226` | ✅ |
| `callTool` | `tools.ts:207` | ✅ |
| `_decorateResult` | `mcp-protocol.ts:180` | ✅ |
| `_resetHintConsumption` / `_isHintConsumed` | `mcp-protocol.ts:194/198` | ✅ |
| `createDevkitMcpServer` | `mcp-protocol.ts:259` | ✅ |
| `createLinkedDevkitServers` | `mcp-protocol.ts:378` | ✅ |
| `runInitializeSideEffects` | `mcp-protocol.ts:220` | ✅ |
| `normalizeToolCallParams` | `mcp-protocol.ts:240` | ✅ |
| `runVersionCheck` | `packs/huaweicloud-cli/tools.ts:24` | ✅ |
| `listSkillDirs` | `lib/skill-tree.ts:16`（`tools.ts:68` 再导出） | ✅ |
| **`findSkillsRoot`**（D9-12 步骤⑤ / 指引来源） | **v2 全源无此符号**（仅 `skill-disclosure.ts:44 SKILLS_ROOT` 常量、`listSkillDirs`） | ❌ |

修改指令（[P2]，机器可闭合）：D9-12 操作步骤⑤与指引来源中的 `findSkillsRoot` 改为 v2 真实符号——建议 `SKILLS_ROOT`（`skill-disclosure.ts:44`）或 `listSkillDirs`（`lib/skill-tree.ts:16`），不得引用 v2 中不存在的 `findSkillsRoot`。

### 4. 数字断言核对 — ✅ 已核验通过

证据：

- `tool-definitions.ts` `TOOL_DEFINITIONS`：`name:` 条目去重后 **= 56**（`D9-1` 断言「56 工具 schema 均合法」、`D5-1` 断言「56 工具清单」均正确）。
- `safety/rules/cloud-risk-rules.json`：`rules` 数组 **= 19 条**，severity 计数 **deny=9 / warn=10**（`D10-4` 断言「9 deny + 10 warn」正确）。
- `vendor-gate.ts:38` `VENDOR_GATED_TOOLS`：**= 14 工具**，含 `auth_status / auth_init / auth_switch / check_cli / show_profile_redacted`（auth 系列），**不含 `auth_sync / auth_confirm`**（`vendor-gate.ts:33` 注释明确「deliberately ungated … auth_sync/auth_confirm …」）。

关键结论：D2 认证域受 gate 影响的**只有关联工具含 `auth_status/auth_init/auth_switch/show_profile_redacted` 的用例**，**`auth_sync` 不在 gate 名单**——这正是第 5 项「多判」的判据来源。

### 5. 受影响范围漏判 / 多判 — ❌ 必须整改（[P0]/[P1]，机器可闭合）

#### 5a. 多判（候选内 3 条，关联工具全部不在 `VENDOR_GATED_TOOLS`）

| 用例 | 关联工具 | 问题 |
|---|---|---|
| `D2-24` | `auth_sync` | auth_sync **未被 gate**，不应有「已建立 vendor 确认 / ⓪ / gate 放行后」三件套 |
| `D2-26` | `huaweicloud_auth_sync` | 同上，且其实际用途是 `backupGlobalCredentials/restoreGlobalCredentialsBackup` |
| `D2-3` | `auth_sync` | 同上（auth sync 幂等） |

证据：`vendor-gate.ts:33` 明示 `auth_sync/auth_confirm` 为 deliberately ungated；`VENDOR_GATED_TOOLS`（`:38-52`）14 项中无 `auth_sync`。

修改指令：将这 3 条从 vendor gate「受影响集合」移出，恢复 1.x 断言（去除「已建立 vendor 确认 / ⓪ / gate 放行后 / 契约依赖: vendorConfirmed」四处改动）。这同时修正 `test-design.md:31` 的表述错误——「auth 系列含 auth_sync」不成立，`auth_sync` 不在 gate 管辖内。

#### 5b. 漏判（候选外 11 条，受漂移影响但未纳入）

**（i）vendor gate 漏判（9 条，关联工具含 gated 工具但不在候选）**

| 用例 | 关联工具（含 gated） | 优先级 | 来源 |
|---|---|---|---|
| `D10-3` | 直调 `serviceCatalog`（关联工具列误标「harness」） | P1 | 影响清单 §1 明示「未传 vendorConfirmed → 全 MISS」 |
| `D4-24` | `plan_cli_command` | P1 | 影响清单 §1 明示（`D4-4/D4-18/D4-24`） |
| `D6-8` | `run_readonly_command/plan_cli_command` | P1 | 影响清单 §1 明示（真云链路） |
| `D2-1` | `huaweicloud_auth_init` | P1 | 三端落位 E2E，auth_init 被 gate |
| `D3-A3` | `service_catalog` | P1 | 沙箱vs生产路由直调 serviceCatalog |
| `D3-A4` | `list_regions` | P2 | region 映射直调 list_regions |
| `D3-C9` | `run_readonly_command` | P1 | 资源状态操作引导 |
| `D2-23` | `auth_status` | P2 | 关联工具列归因待复核（步骤内容与 auth_status 关系弱） |
| `D2-27` | `auth_status` | P2 | 关联工具列归因待复核（步骤内容为 KooCLI 版本解析） |

**（ii）tool-count 漏判（2 条，僵化「40 工具」断言未迁 56）**

| 用例 | 现状 | 问题 |
|---|---|---|
| `D1-56` | `tools/list 恰好 40 工具（数量=40 且无重复）` | 应迁 56 工具 |
| `D5-3` | `40 工具全量可达(=tools.mjs 注册源数量)` | 应迁 56 工具 + `tool-definitions.ts TOOL_DEFINITIONS` |

证据：`tool-definitions.ts` = 56 工具；影响清单 §6 已把 `D9-1/D5-1` 迁 56，却漏了同为硬编码「40 工具」的 `D1-56/D5-3`。

修改指令：将上述 11 条纳入受影响集合并完成迁移（vendor gate 9 条走第 2 项三件套；tool-count 2 条改断言「56 工具」+ 指引来源 `tool-definitions.ts TOOL_DEFINITIONS(=56)`）；其中 `D2-23/D2-27` 建议先复核母版「关联工具」归因（若确不涉 gate 工具则不必纳入）。

> 说明：本轮评审以「关联工具列含 gated 工具」+「源码 `VENDOR_GATED_TOOLS`/`TOOL_DEFINITIONS` 事实」双源机械判定；`D2-23/D2-27` 属关联工具列自身归因存疑，已单独标注。

### 6. 状态纪律 — ✅ 已核验通过

证据：`status.md:3` 状态=`HERMES_DRAFT_READY`（明确「不得标记 TEST_DESIGN_READY」）；`status.md:5` 与 `test-design.md:7` 均声明「未执行测试、真实探针、真云操作、真实升级」。合规。

### 7. test-design.md 放行检查 A/B/C 三表 — ✅ 已核验通过

证据：`test-design.md §三` 三张检查表均有明确结论——A 覆盖完整性→「无新增覆盖缺口」；B 用例质量→「六要素满足」；C 源码能力核对→5 行逐列给出结论（工具 56 / 规则 19 / gate 14 / dispatch 工厂化 / remote Streamable HTTP）。三表齐全且结论落在「已核验」语义，无空表、无「待定」残留。

---

## 二、整改项汇总

### 🟢 机器可闭合（无外部依赖，改矩阵/文档即可）

| # | 严重度 | 项 | 修改指令 |
|---|---|---|---|
| 1 | [P1] | 多判 3 条：`D2-24/D2-26/D2-3` | 从 vendor gate 集合移出，恢复 1.x 断言（去「已建立 vendor 确认 / ⓪ / gate 放行后 / 契约依赖: vendorConfirmed」）；同步更正 `test-design.md:31` 的「auth_sync 属 auth 系列」表述 |
| 2 | [P1] | 漏判 vendor gate 9 条：`D10-3/D4-24/D6-8/D2-1/D3-A3/D3-A4/D3-C9`（硬漏判）+ `D2-23/D2-27`（归因复核后纳入/不纳入） | 补入候选并完成 vendor gate 三件套迁移 |
| 3 | [P1] | 漏判 tool-count 2 条：`D1-56/D5-3` | 断言「40 工具」→「56 工具」+ 指引来源 `tool-definitions.ts TOOL_DEFINITIONS(=56)` |
| 4 | [P2] | D9-12 `findSkillsRoot` 符号不存在 | 改 `SKILLS_ROOT`（`skill-disclosure.ts:44`）或 `listSkillDirs`（`lib/skill-tree.ts:16`） |
| 5 | [P2] | 影响清单 §4 假漂移表误列 `D9-10` | `D9-10` 属 remote（漂移 #3），非假漂移；假漂移仅 `D1-65/D1-66/D9-11`，订正该表（候选矩阵本身已正确处理，仅文档不一致） |

> 整改后受影响集合建议重新核算：`69 − 3（多判）+ 11（漏判）= 77`（其中 `D2-23/D2-27` 视归因复核结果 ±2）。

### 🔴 外部依赖（不阻塞设计放行，仅记录）

- 无新增外部依赖。仅存 `test-design.md:81` 已声明的产品侧遗留项：`#3` remote 的「发版文档明示 Accept 头 + Mcp-Session-Id」须在 v2 发版时落地；测试侧已作断言项处理，不阻塞放行。

---

## 三、验证方法（可复现）

- 矩阵结构 / 子集 / ID 唯一：`candidate-matrix.csv` 与 `test-cases/design/用例矩阵-设计级.csv` 逐列比对（python csv，header 逐列相等；69/69 ∈ 212）。
- gate 断言唯一性：候选 `预期结果` 去「（gate 放行后）」前缀后与母版逐字 diff（0 差异）。
- 漏判/多判：以 `vendor-gate.ts VENDOR_GATED_TOOLS`（14）与 `tool-definitions.ts TOOL_DEFINITIONS`（56）为 oracle，扫描母版 212 条「关联工具/操作步骤/预期结果」中 gated 工具与「40/43 工具」硬编码断言，与候选 ID 集合求差集。
- 数字断言：`git show fcfe047f:<file>` 实测（56 / 19(9+10) / 14）。
- 符号命名：`git grep` v2 `plugins/huaweicloud-core/src` 逐符号核对（`findSkillsRoot` 0 命中）。

【评审完成】