# FINDINGS - Codex-GPT-5

生成时间：2026-09-17（北京时间）  
被测版本：`huaweicloud-devkit@1.1.5`，源码 `e7ed6f6`

## #1【P0】D2-4 JSON 凭证字符串未脱敏

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 保留完整 `ak`/`sk` 值。
- **断言**：包含凭证键的 JSON 字符串输出不得包含完整 AK 或 SK。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45` 的 `redactString()` 仅匹配 `AK:`/`SK:` 及长键名格式，未匹配 JSON `"ak":`/`"sk":`。
- **影响**：字符串化 JSON 进入 Agent 上下文时可能泄漏凭证。
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json）。
- **状态**：待提单

## #2【P0】D4-16 sh 包裹写命令穿透

- **现象**：`classifyTextCommand('sh -c "hcloud ECS DeleteServer --server_id=x"')` 返回 `allow`。
- **断言**：shell 包裹的 hcloud 写操作必须返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:384-440` 的 `classifyTextCommand()` 只在文本以 `hcloud` 开头时进入 `classifyHcloudArgs()`，未解包 `sh -c` 前缀。
- **影响**：攻击者可通过 POSIX shell 包裹绕过写操作审批护栏。
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh）。
- **状态**：待提单

## #3【P1】D8-4 npm 包缺失 INSTALL.md

- **现象**：源码根目录存在 `INSTALL.md`，但 `npm pack --dry-run` 的文件清单不包含它。
- **断言**：发布 npm 包应包含安装文档 `INSTALL.md`。
- **根因**：`package.json:8-17` 的 `files` 白名单未包含根目录 `INSTALL.md`。
- **影响**：用户安装 npm 包后无法获得预期安装文档。
- **证据**：`evidence/d2-auth/stdout.log`（D8-4 install-doc）。
- **状态**：待提单

## #4【P1】D9-2 tools/list 非法参数未返回 -32602

- **现象**：向 stdio MCP server 发送 `tools/list` 且 `params` 为字符串时，没有返回 JSON-RPC error object。
- **断言**：非法参数类型必须返回 error code `-32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:156-174` 将缺省参数归一为 `{}` 并调用 dispatch，`plugins/huaweicloud-core/src/mcp-protocol.mjs:73-75` 未校验 `params` 类型。
- **影响**：协议客户端无法按标准错误码判断参数错误。
- **证据**：`evidence/D9-2/stdout.log`（D9-2b-invalid-params）。
- **状态**：待提单

## #5【P1】D9-9 未声明 cancellation capability

- **现象**：initialize 返回的 capabilities 只有 `tools`，没有 `notifications.cancellation`。
- **断言**：若测试契约要求 cancellation，initialize 应声明 `capabilities.notifications.cancellation=true`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:61-66` 构造 capabilities 时仅返回 `tools`。
- **影响**：客户端无法据 capabilities 判断服务端是否支持取消通知。
- **证据**：`evidence/D9-2/stdout.log`（D9-9a-capabilities.cancellation）。
- **状态**：待裁决（SPEC-MISMATCH）
