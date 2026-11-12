## #1【测试侧】D8-7 Node 测试中的 Hermes 注册断言在 Windows 失败

- **现象**：`npm test` 的 `auth-agent-registration.test.ts:179` 与 `:189` 两项断言得到 `false !== true`。
- **断言**：测试 fixture 创建 `%USERPROFILE%\.hermes\config.yaml` 后，`getAgentRegistrationStatuses('hermes').agents.hermes.configured` 应为 `true`。
- **根因**：`test/auth-agent-registration.test.ts:139-148` 的 `withAgentHome` 在 Windows 下未使被测进程的 `homedir()` 解析与 fixture 目录一致；被测路径实现位于 `plugins/huaweicloud-core/src/auth/agent-registration.ts:220-230`。属于 Windows 测试夹具兼容性问题，需先确认运行时 home 注入方式。
- **影响**：Windows 全量 Node 测试失败 2 项。
- **证据**：`evidence/D8-7/command.log`
- **状态**：测试侧，待维护者修正 fixture

## #2【测试侧】D8-7 Hook parity 失败路径假设 stderr 始终为字符串

- **现象**：`test/hook-parity.test.ts:980-1218` 的 4 项测试因 `Cannot read properties of undefined (reading 'slice')` 失败。
- **断言**：Python hook 进程失败时，测试应输出可诊断 stderr；正常返回时不应对未定义 stderr 调用 `.slice()`。
- **根因**：`test/hook-parity.test.ts:1009,1050,1105,1218` 直接调用 `py.stderr.slice(...)`，未对 `spawnSync` 返回的 undefined stderr 做空值归一；应先核对 Python hook 返回对象并使用空字符串兜底。
- **影响**：Hook 对抗性一致性、ReDoS、ANSI-C 解码及深层嵌套场景无法完成断言。
- **证据**：`evidence/D8-7/command.log`
- **状态**：测试侧，待维护者修正断言保护

## #3【非产品缺陷】本轮未执行项

- **现象**：104 条设计级、39 条展开级用例未进入专用探针执行，已逐条回填 BLOCKED。
- **说明**：本次 Codex/Windows 运行缺少独立 Hook 客户端、真实 Agent 会话和真云副作用执行器；对应证据目录中的 `stdout.log` 均明确记录补环境分类及解除条件，不计入产品缺陷提单。

## #3【测试侧】EXP-E01~EXP-E15 D10 路由 harness 未区分 MCP 错误响应

- **现象**：`node eval/harness/run-eval.mjs <mcp-server.js>` 对 EXP-E01~EXP-E07、EXP-E09~EXP-E15 均输出 `MISS`，actual service 列表为空；EXP-E08 为 harness 预期 `N/A`。
- **断言**：每个路由探针应先确认 `tools/call` 返回成功且含可解析的 `recommendedServices`，再按期望服务名判定 HIT/MISS；工具错误响应不得折叠成空路由。
- **根因**：`eval/harness/run-eval.mjs:78-86` 只读 `resp.result.content[0].text`，没有区分 JSON-RPC `error`、`result.isError` 或空 payload，导致错误响应被当作 MISS。需要先暴露完整脱敏响应再判定是否为产品路由缺陷。
- **证据**：`evidence/EXP-E01/command.log` 至 `evidence/EXP-E15/command.log`
- **状态**：测试侧待修复；本轮不提交产品 issue
