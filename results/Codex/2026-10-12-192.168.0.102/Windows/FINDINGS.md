# FINDINGS - Codex-Codex

> 生成时间：2026-10-12 05:09（北京时间）
> 被测版本：huaweicloud-devkit 1.1.8

## #1【P0】D4-16 命令包裹穿透
- **现象**：sh 包裹高危命令返回 allow。
- **断言**：shell 包裹后的高危内层命令必须 deny。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:1` 未递归解析 sh wrapper。
- **影响**：命令包裹可绕过安全拦截。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P0】D4-15 hook 绕过尝试
- **现象**：大小写/编码/拼接变体中存在非 deny 结果。
- **断言**：高危命令变体不得绕过安全策略。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:1` 归一化与变体识别覆盖不完整。
- **影响**：高危命令存在绕过路径。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：待提单

## #3【P0】D4-23 全局规则注入
- **现象**：规则文件及安装注入检查均为 false。
- **断言**：安装目标应注入 huawei-agent-rules.md。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:1` 未发现规则注入路径。
- **影响**：全局安全约束可能未生效。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：待提单

## #4【P0】D2-11 STS token 拒绝落盘
- **现象**：带 token 的 persist 请求未返回 deny/warn。
- **断言**：securityToken 不得持久化。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:1` 未拦截 auth_switch persist token。
- **影响**：短期令牌存在落盘风险。
- **证据**：`evidence/D2-11/stdout.log`
- **状态**：待提单

## #5【P1】D4-11 提示注入防护
- **现象**：提示注入样本被判定 allow。
- **断言**：注入样本应被阻断或至少告警。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:1` 未覆盖该注入模式。
- **影响**：安全策略可能被提示注入绕过。
- **证据**：`evidence/D4-11/stdout.log`
- **状态**：待提单

## #6【P1】D9-10 MCP remote transport
- **现象**：HTTP/WS 远程传输探针失败。
- **断言**：声明支持的 remote transport 应建立并维持协议连接。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:1` 未满足 remote transport 探针要求。
- **影响**：远程 MCP 集成不可用。
- **证据**：`evidence/D9-10/stdout.log`
- **状态**：待提单