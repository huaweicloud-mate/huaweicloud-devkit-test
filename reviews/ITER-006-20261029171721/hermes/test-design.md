# Hermes 测试设计候选 — ITER-006（v2.0.0 契约迁移）

> 评审目录：`reviews/ITER-006-20261029171721/`
> 生成时间：2026-10-29 17:20:00（北京时间）
> 角色：Hermes 测试设计提交；等待 Codex 复审
> 状态：`HERMES_DRAFT_READY`（待 Codex 评审放行，**禁止自签 TEST_DESIGN_READY**）
> 本轮范围：v2.0.0 契约迁移（**只改受影响用例的断言/指引来源/前置，非全量重设计**）。未执行测试、真实探针、真云操作、真实升级。

## 一、SUT 基线（被测项目，P1 可复现）

- SUT：源码仓 v2 分支 `fcfe047f`（package.json 2.0.0，npm 未发布）
- 工具注册源：`plugins/huaweicloud-core/src/tool-definitions.ts` → `TOOL_DEFINITIONS` **56 个**（实测 grep `name:` 去重）
- 关键变更：TS 化重构（`.mjs`→`.ts`）、tools 拆 `packs/*/tools.ts`、vendor gate 新增、mcp-protocol 工厂化、remote 升级 Streamable HTTP
- 设计输入：`results/version/v2.0.0/FINDINGS.md`（8 条漂移定性）、`产品反馈-v2-契约漂移.md`（产品侧裁决已回，见本目录 `decision-log.md`）

## 二、本轮范围（契约迁移，非全量重设计）

v2 相对 1.x 的 8 条契约漂移中，经产品侧裁决后，按「测试侧改断言适配 v2 行为」处理。

**受影响用例 = 69 条设计级**（`candidate-matrix.csv` 全量 27 列迁移后版本）：

| 漂移 | 裁决 | 受影响用例数 | 迁移动作 |
|---|---|---|---|
| #1 vendor gate 14 工具需 vendorConfirmed | 安全增强，不放宽；测试侧带暗号+retry | **59** | 前置条件加「建立 vendor 确认」；操作步骤加「⓪带 vendorConfirmed+challenge retry 放行」；预期结果补「gate 放行后」前缀 |
| #2 dispatch 删除 | breaking change，不做 shim | **3**（D1-36/D1-45/D9-12） | 断言/指引来源改 `tools.ts dispatchTool` / 工厂函数语义 |
| #3 remote Streamable HTTP | 规范升级，非缺陷 | **1**（D9-10） | 断言加「双 Accept 200 / 单 Accept 406 / Mcp-Session-Id」 |
| #4 假漂移（DEBUG/telemetry/ws 搬位） | 符号搬位置，非删除 | **3**（D1-65/D1-66/D9-11） | 只改指引来源路径，断言不变 |
| #5 规则集 16→19 | 已接受 | **1**（D10-4） | 断言改「9 deny + 10 warn」 |
| #6 工具面 43→56 | 已接受 | **2**（D9-1/D5-1） | 断言改 56 工具 |

> 关键更正：首版影响清单写「约 40 条」低估了——vendor gate 的 14 个工具含 auth 系列（`auth_status/auth_init/auth_switch/auth_sync/check_cli/show_profile_redacted` 等），把 **D2 认证域 25 条**也卷进来。精确数 69 条（59 vendor_gate + 3 dispatch + 1 remote + 3 fake-move + 1 rule + 2 toolcount）。

## 三、放行检查对照（§二 A/B/C 三表结论）

### A. 覆盖完整性（六技术）

- 等价类/边界值：v2 迁移不改维度覆盖结构，69 条均为既有用例的断言适配，无新增维度。
- 状态转换：vendor gate 引入「未确认→challenge→retry→放行」新状态，已在 vendor_gate 类步骤⓪ 覆盖。
- 场景法：真云 E2E 链路（D3-C1 等）的 gate 前置已在步骤⓪ 覆盖，不另拆场景。
- 结论：**无新增覆盖缺口**（本迁移不剪枝、不新增维度；工具面 56 里 13 个新增工具的覆盖待 `source-coverage` 单独核对，不在本迁移范围）。

### B. 用例质量（六要素）

- 迁移只动「前置条件/操作步骤/预期结果/指引来源/依赖」五列，单一验证点不破坏。
- 断言仍唯一可判定：vendor_gate 类加「gate 放行后」前缀，不改原断言唯一性；D10-4 精确到「9 deny + 10 warn」；D9-1 精确到「56 工具」。
- 结论：**六要素满足**。

### C. 源码能力核对（四步）

| 核对项 | 结论 |
|---|---|
| v2 vendor-gate.ts `VENDOR_GATED_TOOLS` 14 工具 | ✅ 与 59 条受影响用例「关联工具」逐一对应 |
| v2 tool-definitions.ts `TOOL_DEFINITIONS`=56 | ✅ D9-1/D5-1 断言已改为 56 |
| v2 cloud-risk-rules.json=19（9 deny+10 warn） | ✅ D10-4 断言已改 |
| v2 mcp-protocol.ts dispatch 已删（工厂化） | ✅ 3 条断言改 dispatchTool/工厂语义 |
| v2 mcp-server-remote Streamable HTTP | ✅ D9-10 断言加双 Accept/406/Mcp-Session-Id |

## 四、状态分离规则（继承 ITER-005 纪律）

1. `设计状态=DESIGN_COVERED` 只表示设计完整，≠ 执行通过。
2. 本迁移不产生执行结果；受影响用例执行态在迁移后一律回到 `NOT_RUN`（契约已变，历史 PASS 作废复测）。
3. 3 条漂移裁决后不再标「契约依赖待冻结」，改为「测试侧适配」——但 vendor gate 类用例执行前仍须真机验证 challenge+retry 流程。

## 五、本轮不改动范围（边界声明）

- 不受 8 条漂移影响的其余 **143 条设计级**（212−69）保持 1.x 断言原样。
- 展开级 137 条：多数是设计级展开（D5 客户端矩阵等），受影响的是继承自 69 条的展开行，**展开级迁移在候选设计评审通过后、用例输出（Step 3）阶段随生成器一并处理**，本候选矩阵只覆盖设计级 69 条。
- 工具面 13 个新增工具的覆盖性缺口，另行 `source-coverage` 核对，不在本迁移。

## 六、待 Codex 复审项

1. vendor gate 类「⓪建立 vendor 确认」步骤是否足够机械可执行（暗号来源、challenge retry 次数）。
2. dispatch 3 条改写的 `dispatchTool`/工厂函数命名是否与 v2 源码精确一致。
3. 59 条 vendor_gate 影响范围是否漏判/多判（尤其 auth 系列是否确属 gate 管辖——已按 `VENDOR_GATED_TOOLS` 名单核对，请复验）。
4. D10-4 规则集「9 deny + 10 warn」数值与 `cloud-risk-rules.json` 是否一致。

> 已自查修正（2026-10-30，源码逐行核对后回填 candidate-matrix.csv）：`dispatchTool`→`tools.ts:226`；`_decorateResult`→`mcp-protocol.ts:180`（非 tools.ts 内，D9-12 曾误写掉下划线）；DEBUG→`update-registry.ts:44` + `telemetry/telemetry.ts:143`（D1-65 原写 update-check.ts）；applyUpdateHint→`update-cache.ts:87`（D1-36）；updatePrewarm 已并入 `mcp-protocol.ts` initialize side effects（D1-45）；ws 隧道→`ws-exec/hwlink-tunnel-channel.ts`（D9-11）；`tools.mjs.callTool`→`tools.ts.callTool`（D9-12）。

## 七、仍未解决

- 唯一外部依赖：产品侧 #3 的「发版文档明示 Accept 头 + Mcp-Session-Id 要求」须在 v2 发版时落地（测试侧可先作断言项，不阻塞设计放行）。