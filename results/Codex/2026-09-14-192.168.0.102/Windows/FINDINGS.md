# FINDINGS - 缺陷发现清单（Codex-GPT-5）

> 生成时间：2026-09-14（北京时间）

## #1【P1】安装自动探测结果与测试契约不一致

- **现象**：Windows Node 测试 `install auto-detect with multiple agents requires explicit target in non-interactive shells` 期望只报告 `opencode, workbuddy`，实际报告 `opencode, workbuddy, officeace`；`install --target all` 和无代理场景也分别出现退出码不符合预期。
- **断言**：多代理非交互安装的 stderr 必须匹配 `Multiple agents detected (opencode, workbuddy)`，无代理自动探测必须退出码为 1。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:3027-3079` 的 `detectAgents()`/非交互分支将 OfficeAce 纳入探测集合，导致测试契约中的检测集合与实际输出漂移，并连带改变相关退出路径。
- **影响**：Windows 自动安装可能向未预期客户端扩散配置，且无代理场景不能按契约失败。
- **证据**：`evidence/D1-2/stdout.log`、`evidence/D1-39/stdout.log`（源码 Node 测试完整输出，测试 25/29/30/31）
- **状态**：待提单

## #2【P1】Windows 会话 ID 路径过滤未移除路径穿越字符

- **现象**：测试 `skip-path: 危险 session 值(路径穿越)被过滤为安全名` 实际生成 `devkit-skip.json.___evil___id`，测试断言要求危险 session 值转换为安全的会话后缀。
- **断言**：`resolveSkipFilePath('../evil/..id')` 返回路径的会话后缀不得包含 `..` 或路径分隔语义。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:156-174` 的 `sanitizeSessionId()` 在 Windows 下将 `../evil/..id` 转换为 `___evil___id`，但保留了连续点号，未满足测试定义的安全后缀约束。
- **影响**：会话隔离状态文件命名不符合安全过滤契约，可能造成路径标识歧义。
- **证据**：`evidence/D1-39/stdout.log`（源码 Node 测试 441）
- **状态**：待提单
