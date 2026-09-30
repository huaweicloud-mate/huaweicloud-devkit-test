## #1【P0】D2-4 凭证脱敏未覆盖 JSON 字符串

- **现象**：`redactSecrets` 对包含 `ak`、`sk` 的 JSON 字符串返回原始敏感值，D2-4 探针断言失败。
- **断言**：传入 JSON 文本后，返回值不得包含原始 AK/SK 值。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:61-63` 对字符串只调用 `redactString`，没有解析 JSON 后按敏感字段递归脱敏。
- **影响**：凭证可能出现在日志、工具返回值或错误输出中。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-16 PowerShell 包裹命令未被 MCP hook 拦截

- **现象**：MCP `huaweicloud_hook_check_command` 对 PowerShell 包裹的 hcloud 写命令返回 `allow`，D4-16 失败。
- **断言**：`powershell -Command "hcloud ...写操作..."` 必须返回 `deny` 或 `confirm`，不得返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:462-467` 仅提取成对引号包裹的 PowerShell payload，当前 MCP 输入的 Windows 包裹形式未进入风险规则匹配。
- **影响**：Windows 客户端可通过 shell wrapper 绕过写操作安全边界。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #3【P1】D4-27 双路径输出脱敏遗漏 JSON 文本

- **现象**：`redactSecrets` 对包含 `ak`、`sk`、`token` 的 JSON 文本保留敏感值，D4-27 失败。
- **断言**：结构化对象路径和 JSON 文本路径均不得输出原始 secret 值。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:61-63` 的字符串路径未执行 JSON 字段级递归脱敏。
- **影响**：同一安全策略在 MCP/CLI 两条输出路径上产生不一致的泄露风险。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #4【P1】D8-4 安装引导未满足机械执行契约

- **现象**：每日版本安装引导用例的机械执行断言失败，D8-4 被真实回填为 FAIL。
- **断言**：安装文档中的命令、前置条件和结果校验必须能在干净 Windows 环境逐步执行并完成闭环。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:4485-4534` 的非交互安装路径仍会跳过确认/依赖交互，和 D8-4 的可机械执行闭环不一致。
- **影响**：无人值守 Windows 安装可能提前结束或无法验证安装结果。
- **证据**：`evidence/D8-4/stdout.log`
- **状态**：待提单

## #5【P1】D9-2 JSON-RPC 错误码契约不一致

- **现象**：D9-2 协议错误码探针真实回填 FAIL。
- **断言**：未知工具、缺少必填参数和非法请求必须分别返回约定 JSON-RPC 错误码及 `error.code`/`error.message` 字段。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:61-75` 仅覆盖部分 `tools/call` 参数错误分支，未对所有非法请求路径统一包装协议错误对象。
- **影响**：客户端无法稳定区分参数错误、方法错误和服务端错误。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：待提单

## #6【P1】EXP-E01~EXP-E05 服务目录路由 MISS

- **现象**：EXP-E01、EXP-E02、EXP-E03、EXP-E04、EXP-E05 的确定性 `serviceCatalog` 路由均为 `MISS`。
- **断言**：评测集中的每条中文服务意图必须命中预期华为云服务目录。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776` 的服务目录匹配规则未覆盖这些评测意图的关键词/别名。
- **影响**：用户请求无法路由到正确服务 skill，后续工具选择可能错误。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E02/stdout.log`、`evidence/EXP-E03/stdout.log`、`evidence/EXP-E04/stdout.log`、`evidence/EXP-E05/stdout.log`
- **状态**：待提单

## #7【P1】EXP-E07、EXP-E10~EXP-E14 服务目录路由 MISS

- **现象**：EXP-E07、EXP-E10、EXP-E11、EXP-E12、EXP-E13、EXP-E14 的确定性路由结果为 `MISS`。
- **断言**：评测集中的每条中文服务意图必须命中预期服务目录；MISS 不得作为正常结果。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776` 的目录路由表对这些服务意图的中文表达或服务别名覆盖不足。
- **影响**：多个服务领域的自然语言请求会落入未命中路径。
- **证据**：`evidence/EXP-E07/stdout.log`、`evidence/EXP-E10/stdout.log`、`evidence/EXP-E11/stdout.log`、`evidence/EXP-E12/stdout.log`、`evidence/EXP-E13/stdout.log`、`evidence/EXP-E14/stdout.log`
- **状态**：待提单

## #8【P1】D9-9 tools/call 超时取消契约漂移

- **现象**：D9-9 真实探针结果与设计的超时/取消语义不一致，标记 SPEC-MISMATCH。
- **断言**：`tools/call` 超时或取消必须返回稳定的协议错误/取消结果，不得遗留未判定的异步执行。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1945` 的工具调用包装只校验输入脱敏，未统一暴露超时取消结果契约。
- **影响**：客户端无法可靠停止或判定长时间工具调用。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：待提单
