# FINDINGS — Codex-GPT-5

## #1【P1】EXP-D5-2-1 Codex 插件清单与注册缺失

- **现象**：Codex discovery fixture 实测 2 项 PASS、3 项 FAIL；`.mcp.json`、`openclaw.plugin.json`、MCP 注册与 bundle manifest 断言失败。
- **断言**：Codex 宿主存在时，插件清单、`huaweicloud-devkit` MCP 注册和 Codex bundle manifest 应全部满足 fixture 期望。
- **根因**：待维护者根据 fixture 输出定位；当前证据已确认实现/安装布局不满足 `eval/harness/fixtures/exp-d5-2-1-codex-discovery.mjs:45-63` 的断言。
- **影响**：Codex 宿主无法按预期发现并加载插件。
- **证据**：`evidence/EXP-D5-2-1/command.log`
- **状态**：待提单

## #2【P1】D10-3 路由准确率不足

- **现象**：路由 harness 实测 HIT=3、MISS=11、N/A=1，准确率 21.4%。
- **断言**：D10-3 评测集的期望服务路由应命中对应服务；当前 11 条未命中。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815` 的 `serviceCatalog` 当前对多数中文意图返回通用帮助或错误服务。
- **影响**：Agent 可能激活错误 skill 或无法形成正确的只读/审批路由。
- **证据**：`evidence/D10-3/command.log`
- **状态**：待提单
