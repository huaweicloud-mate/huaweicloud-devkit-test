# FINDINGS - 缺陷发现清单（Codex-GPT-5）

> 本轮执行时间：2026-09-14（北京时间）
> 说明：以下两项与既有 [#654](https://github.com/huaweicloud/huaweicloud-devkit/issues/654) 重复，本轮按统一流程合并提单至 [#670](https://github.com/huaweicloud/huaweicloud-devkit/issues/670)。

## #1【P1】安装自动探测结果与测试契约不一致（重复 #654）

- **现象**：Windows 单并发源码测试中，非交互多 Agent 自动探测实际输出 `opencode, workbuddy, officeace`，测试断言要求 `opencode, workbuddy`；`--target all`、单 Agent 和无 Agent 相关断言也失败。
- **断言**：多 Agent 非交互安装 stderr 必须匹配 `Multiple agents detected (opencode, workbuddy)`，无 Agent 自动探测退出码必须为 1。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:3027-3079` 的 `detectAgents()` 及安装分支使实际探测集合/退出路径与当前测试契约不一致。
- **影响**：自动安装可能覆盖未预期客户端，且无 Agent 场景退出语义不符合测试契约。
- **证据**：`evidence/D1-2/stdout-serial.log`；源码测试 `test/agent-install.test.mjs:573-735`。
- **状态**：已提单 #670（与 #654 重复）

## #2【P1】Windows 会话 ID 安全后缀过滤不满足断言（重复 #654）

- **现象**：`resolveSkipFilePath('../evil/..id')` 生成的文件名包含 `___evil___id`，测试断言未通过。
- **断言**：危险 session ID 生成的路径后缀不得保留 `..` 或路径穿越语义。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:160-178` 的 `sanitizeSessionId()` 未将该输入转换为测试契约要求的安全后缀。
- **影响**：会话隔离状态文件命名不符合安全过滤契约。
- **证据**：`evidence/D1-33/stdout-serial.log`；源码测试 `test/upgrade-session.test.mjs:134-140`。
- **状态**：已提单 #670（与 #654 重复）
