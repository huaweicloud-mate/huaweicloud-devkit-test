# ITER-006（v2.0.0 契约迁移）候选设计复审 — Round 02

评审者：OpenCode (deepseek-gw/deepseek-v4-pro-0813)
评审时间：2026-10-30 15:23:45（北京时间）
替代原因：原 Codex 侧 429 限流不可用，由 OpenCode 顶替
本轮：Round 02 复审（核查 Round 01 六项整改落实）

---

## 结论

**`REVIEW_CHANGES_REQUESTED`**

Round 01 六项整改（多判 3 移出、漏判 7 纳入、tool-count 2 纳入、D9-12 符号修正、影响清单 §4 订正、D2-23/D2-27 书面排除）均已落实到位，数字断言（56 工具 / 19 规则=9 deny+10 warn / 14 gate 工具）与 v2 源码逐项吻合，D2-23/D2-27 的排除论证成立。但存在 **1 处新漏判（D1-71）** 与 **候选矩阵工作区与文档声明不一致** 两项机器可闭合整改项，须闭合后方可放行。

---

## 一、Round 01 六项整改逐项复核

### 1. [P1] 多判 3 条移出 D2-24/D2-26/D2-3 — ✅ 已核验通过

证据：按 ID 检索候选矩阵，`D2-24`、`D2-26`、`D2-3` 均不存在（.bak-round01 备份中仍在，整改后工作区已移除）。`vendor-gate.ts:33` 明示 `auth_sync/auth_confirm` deliberately ungated，`VENDOR_GATED_TOOLS`（vendor-gate.ts:38-53，14 项）不含 `auth_sync`，故这三条（关联工具 auth_sync）移出 gate 集合正确。

### 2. [P1] 漏判 vendor gate 7 条纳入 — ✅ 已核验通过

证据：`D10-3 / D4-24 / D6-8 / D2-1 / D3-A3 / D3-A4 / D3-C9` 全部在候选矩阵中，且三件套完整（前置「已建立 vendor 确认（vendorConfirmed=用户确立华为云的原文引用）」 + 步骤 `⓪建立 vendor 确认…` + 预期结果「（gate 放行后）」前缀 + 依赖列「契约依赖: vendorConfirmed 语义 已裁决…」）。机械校验：63 条 vendor gate 类三件套完整率 100%、无残缺。

### 3. [P1] 漏判 tool-count 2 条纳入 D1-56/D5-3 — ✅ 已核验通过

证据：
- `D1-56` 预期结果已由「恰好 40 工具（数量=40…）」改为「恰好 56 工具（数量=56 且无重复）」；指引来源含 `tool-definitions.ts TOOL_DEFINITIONS(=56)`。
- `D5-3` 预期结果已由「40 工具全量可达」改为「56 工具全量可达(=tool-definitions.ts 注册源数量)」。
- 源码实测 `tool-definitions.ts` `name:` 去重 = **56**（grep 唯一工具名 56 个）。

### 4. [P2] D9-12 `findSkillsRoot` → `SKILLS_ROOT` — ✅ 已核验通过

证据：候选矩阵与 `test-design.md` 全文 grep `findSkillsRoot` = **0 命中**；D9-12 行 `SKILLS_ROOT` 出现 3 处（操作步骤⑤ / 预期结果 / 指引来源），且标注 `SKILLS_ROOT(skill-disclosure.ts:44)`。源码 `skill-disclosure.ts:44` 确为 `export const SKILLS_ROOT = join(__dirname, '..', 'skills')`，v2 全源无 `findSkillsRoot`。无残留。

### 5. [P2] 影响清单 §4 假漂移表去掉 D9-10 — ✅ 已核验通过

证据：`v2-契约漂移-用例影响清单.md` 中 `D9-10` 仅出现在 §#3 remote 表格（第 61 行，归属正确）；§#4 假漂移表仅剩 `D1-65 / D1-66 / D9-11`（第 72-74 行）。已删，假漂移仅剩三条。

### 6. D2-23/D2-27 归因复核 — ✅ 排除成立（书面排除正确）

证据（对母版 + v2 源码双源核对）：
- `D2-23`（agent 注册状态）：关联工具列写 `auth_status`，但操作步骤为「查询 agent 注册状态」、指引来源 `agent-registration.getAgentRegistrationStatuses(223)/SUPPORTED_AGENT_TARGETS(7)` —— 走**内部函数直调**，不经 `huaweicloud_auth_status` MCP 工具层，不触发 vendor gate。关联工具列 `auth_status` 属母版误归因。
- `D2-27`（KooCLI 版本管理）：关联工具列写 `auth_status`，但操作步骤为 `getKooCliVersion/parseHcloudVersion/compareVersion/kooCliDownloadBase`、指引来源 `koocli-version.*`（源码 `koocli-version.ts:14/25/32/50` 逐一命中）——与 `auth_status` 无关。排除成立。

结论：这两条应**维持排除**，不得纳入 vendor gate 集合（见下述第 10 项的一致性冲突）。

---

## 二、常规核验

### 7. 结构核验 — ⚠ 列/唯一性/母版子集通过；**行数与文档声明不一致**

- 列：**27 列**，列名与母版 `test-cases/design/用例矩阵-设计级.csv` 逐列一致。
- ID 唯一：重复 0。
- 母版子集：所有候选 ID ∈ 母版 212 条设计级，无母版外 ID。
- **行数不一致**：`test-design.md:20` / `status.md:41` 声明「受影响 75 条（vendor_gate 63 / dispatch 3 / remote 1 / fake-move 3 / rule 1 / toolcount 4）」；但评审时工作区 `candidate-matrix.csv` 实测 **78 数据行 / 66 条 vendor gate**——多出的 3 条（含 `D1-71`、`D2-23`、`D2-27`）与文档计数及 status.md 第 6 项「已书面排除 D2-23/D2-27」直接冲突。该项属 [P1] 数据完整性整改（见整改项 1、2）。

### 8. vendor gate 类三件套机械可执行 + 断言唯一性 — ✅ 已核验通过

证据：逐条机械校验 63（文档口径）vendor gate 用例：三件套完整率 100%；`预期结果` 去掉「（gate 放行后）」前缀后与母版逐字 diff = **0 差异**（断言唯一性未破坏）。三件套措辞与 `vendor-gate.ts:93-102` 语义吻合（`vendorConfirmed` 须非空字符串 quote；once-per-session challenge 首次 bounce 一次 retry 放行）。

### 9. dispatch 3 条改写命名 + 数字断言 — ✅ 已核验通过

证据（v2 源码逐符号核对）：

| 符号 | 落地 | 判定 |
|---|---|---|
| `dispatchTool` | `tools.ts:226` | ✅ |
| `callTool` | `tools.ts:207` | ✅ |
| `_decorateResult` | `mcp-protocol.ts:180` | ✅ |
| `_resetHintConsumption` / `_isHintConsumed` | `mcp-protocol.ts:194/198` | ✅ |
| `createDevkitMcpServer` / `createLinkedDevkitServers` | `mcp-protocol.ts:259/378` | ✅ |
| `runInitializeSideEffects` / `normalizeToolCallParams` | `mcp-protocol.ts:220/240` | ✅ |
| `applyUpdateHint` | `update-cache.ts:87` | ✅ |
| `runVersionCheck` | `packs/huaweicloud-cli/tools.ts:24` | ✅ |
| `listSkillDirs` | `lib/skill-tree.ts:16` | ✅ |
| `SKILLS_ROOT` | `skill-disclosure.ts:44` | ✅ |

数字断言：`tool-definitions.ts TOOL_DEFINITIONS`=**56**；`safety/rules/cloud-risk-rules.json`=**19（severity deny=9 / warn=10）**；`vendor-gate.ts VENDOR_GATED_TOOLS`=**14**。全部正确。

（备注，非阻塞：D9-12 指引来源把 `_resetHintConsumption/_isHintConsumed` 与 `tools.ts dispatchTool` 连写，未单列 `mcp-protocol.ts` 归属；二者实际在 `mcp-protocol.ts:194/198`。属指引来源文件归属的小瑕疵，不影响断言正确性）

### 10. 新增漏判/多判 — ❌ 发现 1 处新漏判 [P1]

**新漏判：`D1-71`（sandbox_expose_tunnel 沙箱隧道暴露）**

- 母版 D1-71 关联工具列 = `sandbox_expose_tunnel`（**ungated**，vendor-gate.ts:34 明示 expose_tunnel deliberately ungated），故机械按「关联工具」扫描未命中。
- 但其**操作步骤① = `sandbox_connect 获取 workspace_id`**，而 `huaweicloud_sandbox_connect` ∈ `VENDOR_GATED_TOOLS`（vendor-gate.ts:50，**gated**）。
- 依据与 Round 01 对 D10-3「直调 serviceCatalog（关联工具列误标 harness）仍判受影响」完全一致的 oracle（操作步骤触及 gated 工具即受影响），`D1-71` 的执行路径在 v2 首步即被 vendor gate 拦截，必须施加「已建立 vendor 确认 / ⓪ / gate 放行后」三件套。
- 对照同级用例 D3-C3、D3-S3（关联工具列均列 `sandbox_connect` 且已 gated）印证：凡步骤调用 `sandbox_connect` 者均须 gated。D1-71 属漏判。

**多判（工作区实际状态）：`D2-23` / `D2-27`**

- 工作区候选矩阵含 `D2-23`（auth_status）、`D2-27`（auth_status）且带 vendor gate 三件套，与 status.md 第 6 项「已书面排除」及第 1~6 项复核结论（排除成立）直接矛盾。这两条关联工具 `auth_status` 系母版误归因，实际内容不触 `huaweicloud_auth_status` MCP 工具，**不应 gated**。

### 11. 状态纪律 — ✅ 已核验通过

`status.md:3` 状态 = `HERMES_DRAFT_READY`（明确「不得标记 TEST_DESIGN_READY」）；`status.md:6` 与 `test-design.md:7` 均声明「未执行测试、真实探针、真云操作、真实升级」。合规。

---

## 三、整改项汇总

### 🟢 机器可闭合（改矩阵/文档即可）

| # | 严重度 | 项 | 修改指令 |
|---|---|---|---|
| 1 | [P1] | 新漏判 `D1-71`（sandbox_expose_tunnel 用例，步骤①触及 gated `sandbox_connect`） | 纳入 vendor gate 受影响集合，施加完整三件套（前置「已建立 vendor 确认（vendorConfirmed=用户确立华为云的原文引用）」+ 步骤⓪ + 预期结果「（gate 放行后）」前缀 + 依赖「契约依赖: vendorConfirmed 语义 已裁决」）；同步更正关联工具列补充 `sandbox_connect`（可选：指引来源已含 `vendor-gate.ts`）。受影响总数由 75 → 76。 |
| 2 | [P1] | 工作区矩阵与文档计数不一致（78 行/66 vendor gate vs 声明 75/63），且错误包含已书面排除的 `D2-23`/`D2-27` | 从候选矩阵移除 `D2-23`/`D2-27`（恢复母版 1.x 原样，不带 gate 三件套）；重新核对矩阵行数并统一 `test-design.md`/`status.md`/`v2-契约漂移-用例影响清单.md` 的受影响计数（应 = 63 vendor + D1-71 回归后 64 vendor，总 76）。 |
| 3 | [P2] | `D5-3` 展开规则 / requiredEvidence 仍残留「tools/list **40 工具**枚举」、`D1-56` 指引来源历史注记残留「**40**工具枚举断言」（与已改为 56 的断言冲突） | 将这两处「40 工具」一并改为「56 工具」，消除 tool-count 迁移残留。 |

> 注：评审过程中工作区 `candidate-matrix.csv` 未经提交（`git status` 为 M），且观察到其行数在评审窗口内波动（75↔78）、含 status.md 已排除的 D2-23/D2-27。无论波动来源为何，均应以「文档声明 + v2 源码 oracle」为准回填为一致终态后再放行；此数据完整性属放行前置。

### 🔴 外部依赖（不阻塞设计放行，仅记录）

- 无新增。仅存 `test-design.md:81` 已声明的产品侧遗留项：`#3` remote 的「发版文档明示 Accept 头 + Mcp-Session-Id」，须 v2 发版时落地，测试侧已作断言项处理。

---

## 四、验证方法（可复现）

- 结构/子集/唯一/三件套/断言唯一性：python csv 逐列比对候选与母版；`预期结果` 去「（gate 放行后）」前缀后逐字 diff。
- 漏判/多判：以 `vendor-gate.ts VENDOR_GATED_TOOLS`（14 工具）与 `tool-definitions.ts TOOL_DEFINITIONS`（56）为 oracle，扫描母版 212 条「关联工具/操作步骤/预期结果/测试数据/前置条件」中 gated 工具引用，与候选 ID 集合求差集（命中 D1-71）。
- 数字断言：`tool-definitions.ts` name 去重=56；`cloud-risk-rules.json`=19（deny 9 / warn 10）；`VENDOR_GATED_TOOLS`=14。
- dispatch 符号：`git grep` / 直接读 `tools.ts`/`mcp-protocol.ts`/`update-cache.ts`/`packs/huaweicloud-cli/tools.ts`/`lib/skill-tree.ts`/`skill-disclosure.ts` 逐符号核对（`findSkillsRoot` 0 命中）。

【评审完成】