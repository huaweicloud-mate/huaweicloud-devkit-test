# AI Test Manager（决策引擎）

对齐 `test-ai-orchestration-architecture.md` 三层生成模型的 **Layer 1（策略）** 与 **Layer 2（使命）**：
Manager 只做决策不写细节——输出策略 + 使命，具体测试用例由 Worker Agent 自主展开（能力层见 `skills/mission-expand/`）。

## 组成

| 文件 | 职责 |
|---|---|
| `module-map.mjs` | 源码模块 ↔ D 维度 / 风险级 / 代表性用例 映射表（**确定性**决策数据源） |
| `tm-plan.mjs` | 决策引擎（纯函数）：`analyzeImpact` → `aggregateRisk` → `generateStrategy` → `generateMissions` → `planTestRun`；策略生成支持**注入** affectedDimensions（供 LLM 路径复用） |
| `tm-impact-llm.mjs` | **LLM 影响域分析**（架构 §2.2 目标态）：`analyzeImpactLLM` + `analyzeImpactAuto`（LLM 不可用/输出不合法 → 自动回退确定性映射表） |
| `tm-analyze.mjs` | 质量分析器（架构 §2.4）：复用 `eval/replay/compare.mjs` 的差异分类，把 verdict 映射为 `PASS / FAIL / NEED_REVIEW` |
| `tm-report.mjs` | 结构化报告生成：汇总 + 明细 + 失败详情 + 需复核 + 建议 |
| `tm-baseline.mjs` | 录制基线更新：**fail-closed**（须 `approvedByUser=true`），支持 `dryRun` |
| `run-plan.mjs` | CLI：读 `git diff` 变更文件 → 输出 `test-strategy.md` + `missions/*.yaml`；`--analyzer rules\|auto` |
| `mcp-server.mjs` | MCP 服务端（stdio · Content-Length 帧 · 零依赖）：把上述能力包装为 **7 个 MCP 工具**，供 agent/编排器在会话内直接调用 |

## 用法

```bash
# 基于 git diff 生成策略（确定性路径，默认）
node test-manager/run-plan.mjs --version v1.2.0 --diff main..HEAD --out ./out

# LLM 影响域（需 TM_LLM_ENDPOINT / TM_LLM_API_KEY；不可用自动回退确定性）
node test-manager/run-plan.mjs --version v1.2.0 --diff main..HEAD --analyzer auto --out ./out

# 库式调用（CI/Worker 消费）
import { planTestRun } from './test-manager/tm-plan.mjs';
const { strategy, missions } = planTestRun({ version, changeScope: { changedFiles } });
```

### MCP 调用（会话内取策略/使命/判结果/出报告，无需落盘）

```bash
node test-manager/mcp-server.mjs          # 或 npm run tm:mcp；stdio 服务端
node test-manager/mcp-server.mjs --selftest   # 自检：工具数/协议/影响域/分析/报告
```

暴露 **7 个工具**：

| 工具 | 作用 |
|---|---|
| `tm_analyze_impact` | 影响域分析（`analyzer: rules`(默认) / `auto`） |
| `tm_generate_strategy` | 测试策略（风险 + 维度 + 建议范围 + 固定基线） |
| `tm_generate_missions` | 使命清单（供 Worker 自主展开用例） |
| `tm_plan_test_run` | 一站式：策略 + 使命 |
| `tm_analyze_result` | **质量分析**（§2.4）：三态决策 `PASS/FAIL/NEED_REVIEW` + 差异分类 + 敏感泄漏检查 |
| `tm_generate_report` | **结构化报告**（§五 Step 5）：汇总/明细/失败详情/需复核/建议 |
| `tm_update_baseline` | **基线更新**（§五 Step 6）：**必须 `approvedByUser=true`**（fail-closed），支持 `dryRun` |

客户端注册示例（MCP 标准 stdio 配置）：

```json
{ "mcpServers": { "devkit-test-manager": { "command": "node", "args": ["<repo>/test-manager/mcp-server.mjs"] } } }
```

输出：
- `test-strategy.md`：风险等级 + 受影响维度 + 推荐执行范围 + 固定安全基线
- `missions/mission-XXX.yaml`：每个受影响维度一个使命（`missionId` / `domain` / `priority` / `scope` / `affectedTools` / `qualityCriteria` / `affectedCases` / `estimatedDuration`），供 Worker 展开用例

## 风险定级

- `high`（D2 凭证 / D4 安全 / D9 协议）→ 全量回归、固定基线禁剪、使命 P0
- `medium`（D1 / D5 / D6 / D7 / D10）→ 该维度全跑
- `low`（D3 / D8）→ 冒烟 + 变更直接相关用例

## LLM 影响域（`--analyzer auto` / `analyzer: "auto"`）

- 配置：`TM_LLM_ENDPOINT`（OpenAI 兼容 base url）、`TM_LLM_API_KEY`、`TM_LLM_MODEL`（默认 `deepseek-v4-flash`）。
- **校验**：LLM 输出必须通过「维度 ∈ D1~D10 + 风险 ∈ low/medium/high」，任一不合法即整体判不可信 → **回退确定性分析**（结果带 `fallbackReason`）。
- **数据真源不变**：LLM 只决定「哪些维度受影响」，模块与用例仍取 `module-map`（映射表没有的维度标注来源）。
- 无凭证时 `auto` 等同于 `rules` —— 默认路径始终是确定性的，CI 不依赖任何外部服务。

## 校验

`test/unit/tm-plan.test.mjs`（13 用例）验证影响域命中、风险聚合、策略/使命生成契约（含注入路径），已接入
`contract-unit-tests.yml` CI。

`test/unit/tm-mcp.test.mjs`（14 用例）验证 MCP 包装协议契约：握手 / 工具枚举（7 工具） / 各工具调用 /
错误码语义（-32601 / -32602） / 参数非法 fail-closed / 畸形帧不崩且继续服务 / 同日输出一致。

`test/unit/tm-analyze.test.mjs`（9）/ `tm-report.test.mjs`（6）/ `tm-baseline.test.mjs`（7）/ `tm-impact-llm.test.mjs`（12）
覆盖三态决策映射、报告结构、基线 fail-closed 与路径穿越防护、LLM 输出校验与回退，同样接入 CI。
