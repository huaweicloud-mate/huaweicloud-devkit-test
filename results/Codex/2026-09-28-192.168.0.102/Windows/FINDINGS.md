# FINDINGS — Codex-Windows

## #1【P1】D10-3 serviceCatalog 路由准确率低

- **现象**：`node eval/harness/run-eval.mjs` 实测 14 个可判定意图仅 3 个 HIT，11 个 MISS，准确率 21.4%。
- **断言**：EXP-E01~E15 中除诊断项外，每条意图必须返回其期望服务；本轮实际为 3/14。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815-1900` 的 `serviceCatalog` 依赖英文关键词，中文意图未被规范化匹配，导致大量返回空或 `Run hcloud --help` 引导。
- **影响**：中文 Agent 请求可能无法路由到正确服务，影响只读、规划和执行路径选择。
- **证据**：`evidence/EXP-E01/stdout.log`（路由 harness 汇总与 `eval/results/eval-run-20260927210940.csv`）。
- **状态**：待提单

## #2【P1】D9-9 超时后重连未恢复 MCP 工具列表

- **现象**：超时探针中的重连断言返回 `{"tools":"n/a"}`。
- **断言**：超时后重新 initialize/tools/list 必须返回 `server=huaweicloud-devkit` 且工具数 >= 1。
- **根因**：`eval/harness/fixtures/d9-9-delay-timeout.mjs` 的重连阶段未获得有效 tools/list 响应；需在 `plugins/huaweicloud-core/src/mcp-server.mjs` 生命周期处理处定位并修复。
- **影响**：客户端超时后可能无法恢复后续 MCP 调用。
- **证据**：`evidence/D9-9/stdout.log`。
- **状态**：待提单

## #3【P1】D5-1 Codex 插件 manifest/注册清单不满足 fixture 契约

- **现象**：Codex 宿主存在且 `config.toml` 引用 DevKit，但 `.mcp.json`、`openclaw.plugin.json`、bundle manifest 和 MCP server 注册检查均失败。
- **断言**：Codex 安装后应能发现插件清单、注册 `huaweicloud-devkit` MCP server，并满足 bundle manifest 契约。
- **根因**：`plugin.json:1-10` 为通用 agent-plugin manifest，未提供 fixture 期望的 Codex bundle 清单/注册文件；需维护者确认当前 Codex 安装契约。
- **影响**：Codex 配置存在引用时，宿主仍可能无法加载 MCP 插件。
- **证据**：`evidence/EXP-D5-2-1/stdout.log`。
- **状态**：待提单
