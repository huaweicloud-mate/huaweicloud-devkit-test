# FINDINGS - Codex Windows 每日测试

> 生成时间：2026-09-15 09:36:07（北京时间）
> 被测版本：huaweicloud-devkit 1.1.4，源码 commit 9b67256e

## #1【P1】Windows 自动探测把 OfficeAce 误纳入多 Agent 结果

- **现象**：源码单并发测试 `agent-install.test.mjs` 中，多 Agent 非交互安装实际输出 `Multiple agents detected (opencode, workbuddy, officeace)`，与测试契约要求的 `(opencode, workbuddy)` 不符；单 Agent 与无 Agent 场景也随 Windows 本机 OfficeAce 目录被探测而失败。
- **断言**：仅创建 `~/.config/opencode` 和 `~/.workbuddy` 时，非交互安装 stderr 必须精确包含 `Multiple agents detected (opencode, workbuddy)`；仅无支持客户端时退出码必须为 1。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:3093-3112` 的 `detectAgents()` 将 `officeaceCapabilitiesDir()` 存在作为无条件探测信号，导致测试隔离 HOME 下仍把 OfficeAce 纳入 detected 集合。
- **影响**：自动安装在 Windows 上可能将未请求的客户端纳入探测范围，且非交互安装/无 Agent 退出语义不符合契约。
- **证据**：`evidence/D1-2/stdout.log`；`evidence/final-suite/stdout.log`
- **状态**：待提单

## #2【SPEC-MISMATCH】MCP 工具数契约仍写 39，正式包实际暴露 40

- **现象**：标准 MCP `initialize` 成功后，`tools/list` 实际返回 40 个工具，且每项均有 `name`、`description` 和 `inputSchema`；设计级/展开级用例仍以 39 个为断言。
- **断言**：测试母版的工具全集数量应与被测版本 `tools/list` 的正式工具集合一致；当前实测集合数量为 40。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:180-855` 的 `TOOL_DEFINITIONS` 已包含新增 `huaweicloud_obs_set_website_config`（定义于约 852 行），但测试口径仍保留 39 工具基线。
- **影响**：工具全量枚举用例无法同时满足旧数量断言与正式包实际集合，需维护者裁决是更新母版基线还是移除新增工具。
- **证据**：`evidence/EXP-D5-2-3/stdout.log`；`evidence/mcp-tools/response.json`
- **状态**：待裁决

## #3【测试侧】测试源码仓库单并发套件缺少本地 `undici` 开发依赖

- **现象**：`npm test -- --test-concurrency=1` 共 487 项，468 PASS、5 FAIL、14 SKIP；其中 `proxy-agent.test.mjs` 因源码测试工作树未安装 `undici` 报 `ERR_MODULE_NOT_FOUND`。
- **说明**：被测 npm 正式包的 `doctor` 已确认 Runtime deps（undici）通过；该项是源码测试 checkout 的依赖准备问题，不作为产品缺陷提单。
- **证据**：`evidence/final-suite/stdout.log`；`evidence/cli/stdout.log`

