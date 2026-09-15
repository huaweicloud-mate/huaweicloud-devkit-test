# FINDINGS - Codex-GPT-5.6 Windows 每日测试

> 生成时间：2026-09-15 18:22:00（北京时间）
> 被测版本：huaweicloud-devkit 1.1.4，源码 commit 9b67256e

## #1【P2】D1-2 Windows 自动探测把 OfficeAce 误纳入多 Agent 结果

- **现象**：源码单并发测试中，多 Agent 非交互安装实际输出 `Multiple agents detected (opencode, workbuddy, officeace)`；单 Agent 与无 Agent 场景也被本机 OfficeAce 目录影响。
- **断言**：仅创建 `~/.config/opencode` 和 `~/.workbuddy` 时，stderr 必须精确包含 `Multiple agents detected (opencode, workbuddy)`；仅无支持客户端时退出码必须为 1。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:3107` 的 `detectAgents()` 将 `officeaceCapabilitiesDir()` 存在作为无条件探测信号，导致隔离 HOME 下仍把 OfficeAce 纳入 detected 集合。
- **影响**：Windows 自动安装可能将未请求的客户端纳入探测范围，且非交互安装/无 Agent 退出语义不符合契约。
- **证据**：`evidence/D1-2/stdout.log`；`evidence/final-suite/stdout.log`
- **状态**：历史问题，关联上游 #654

## #2【SPEC-MISMATCH】EXP-D5-2-3 MCP 工具数契约仍写 39，正式包实际暴露 40

- **现象**：标准 MCP `initialize` 成功后，`tools/list` 实际返回 40 个工具，且每项均有 `name`、`description` 和 `inputSchema`；展开级用例仍以 39 个为旧断言。
- **断言**：测试母版工具全集数量应与被测版本 `tools/list` 的正式工具集合一致；当前实测集合数量为 40。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:852` 已包含新增 `huaweicloud_obs_set_website_config`，而展开级测试口径仍保留 39 工具基线。
- **影响**：工具全量枚举用例无法同时满足旧数量断言与正式包实际集合，需维护者裁决版本契约。
- **证据**：`evidence/EXP-D5-2-3/stdout.log`；`evidence/mcp-tools/response.json`
- **状态**：已提单上游 #693

## #3【测试侧】源码 MCP 初始化测试在 Windows 夹具中超时

- **现象**：单并发源码套件中 `mcp-server.test.mjs` 的两个 initialize 测试超时；独立 stdio 探针成功返回 initialize、tools/list 和 40 个完整 schema。
- **说明**：这是源码测试夹具/启动时序问题，不作为产品缺陷提单。
- **证据**：`evidence/final-suite/stdout.log`；`evidence/mcp-tools/stdout.log`
