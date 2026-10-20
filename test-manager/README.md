# AI Test Manager（决策引擎）

对齐 `test-ai-orchestration-architecture.md` 三层生成模型的 **Layer 1（策略）** 与 **Layer 2（使命）**：
Manager 只做决策不写细节——输出策略 + 使命，具体测试用例由 Worker Agent 自主展开（未在本仓库实现）。

## 组成

| 文件 | 职责 |
|---|---|
| `module-map.mjs` | 源码模块 ↔ D 维度 / 风险级 / 代表性用例 映射表（决策数据源） |
| `tm-plan.mjs` | 决策引擎（纯函数）：`analyzeImpact` → `aggregateRisk` → `generateStrategy` → `generateMissions` → `planTestRun` |
| `run-plan.mjs` | CLI：读 `git diff` 变更文件 → 输出 `test-strategy.md` + `missions/*.yaml` |
| `mcp-server.mjs` | MCP 服务端（stdio · Content-Length 帧 · 零依赖）：把决策引擎包装为 4 个 MCP 工具，供 agent/编排器在会话内直接取策略与使命（`docs/test-ai-orchestration-architecture.md` §六「MCP 包装」落点） |

## 用法

```bash
# 基于 git diff 生成策略（改到了哪个源码模块 → 触发哪些维度）
node test-manager/run-plan.mjs --version v1.2.0 --diff main..HEAD --out ./out

# 库式调用（CI/Worker 消费）
import { planTestRun } from './test-manager/tm-plan.mjs';
const { strategy, missions } = planTestRun({ version, changeScope: { changedFiles } });
```

### MCP 调用（会话内取策略/使命，无需落盘）

```bash
node test-manager/mcp-server.mjs          # 或 npm run tm:mcp；stdio 服务端
node test-manager/mcp-server.mjs --selftest   # 自检：工具数/协议版本/影响域命中
```

暴露 4 个工具：`tm_analyze_impact` / `tm_generate_strategy` / `tm_generate_missions` / `tm_plan_test_run`，
入参统一为 `{ version?, changeScope: { changedFiles?, changedTools? } }`。客户端注册示例（MCP 标准 stdio 配置）：

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

## 校验

`test/unit/tm-plan.test.mjs`（11 用例）验证影响域命中、风险聚合、策略/使命生成契约，已接入
`contract-unit-tests.yml` CI。

`test/unit/tm-mcp.test.mjs`（9 用例）验证 MCP 包装协议契约：握手 / 工具枚举 / 4 工具调用 /
错误码语义（-32601 / -32602）/ 参数非法 fail-closed / 畸形帧不崩且继续服务 / 同日输出一致，同样接入 CI。