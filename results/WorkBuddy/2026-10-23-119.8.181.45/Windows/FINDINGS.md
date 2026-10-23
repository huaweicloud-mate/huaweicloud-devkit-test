# FINDINGS — 2026-10-23 WorkBuddy Windows

## #1【P0】D2-4 凭证脱敏遗漏小写 ak=/sk= 模式

- **级别**：P0
- **用例ID**：D2-4
- **维度**：D2 认证
- **描述（现象）**：`redactSecrets()` 函数对包含小写 `ak=`/`sk=` 的输入未脱敏，导致凭证明文泄漏到日志/上下文
- **断言（唯一可判定）**：`redactSecrets("config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY")` 返回的字符串不应包含原始 AK/SK 值
- **实际**：返回原文，akLeak=true, skLeak=true
- **根因（文件:行号）**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，缺少 `i` 标志或未覆盖小写 `ak=`/`sk=` 模式
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-3 KMS DecryptData 敏感操作未拦截

- **级别**：P0
- **用例ID**：D4-3
- **维度**：D4 安全
- **描述（现象）**：`classifyTextCommand()` 将 `hcloud KMS DecryptData` 分类为 `allow`，敏感解密操作未被拦截
- **断言（唯一可判定）**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy').decision` 应返回 `deny` 或 `warn`
- **实际**：返回 `decision="allow"`
- **根因（文件:行号）**：`plugins/huaweicloud-core/safety/policy.json` 的 `blockedSecretOperations` 数组仅含 `['ShowSecret','ShowSecretVersion','DownloadSecret','GetSecretValue']`，缺少 `DecryptData`
- **证据**：`evidence/D4-3/stdout.log`

## #3【P1】EXP-C4-08/EXP-C4-18 list_operations IAM/DEW 超时无响应

- **级别**：P1
- **用例ID**：EXP-C4-08, EXP-C4-18
- **维度**：D3 功能
- **描述（现象）**：`huaweicloud_list_operations` MCP 工具对 IAM 和 DEW 服务的 tools/call 请求超时无响应（id=2 未返回）
- **断言（唯一可判定）**：`mcpToolCall('huaweicloud_list_operations', { service: 'IAM' })` 应返回 id=2 的 content 响应
- **实际**：仅返回 id=1（initialize），id=2（tools/call）超时未返回
- **根因（文件:行号）**：`plugins/huaweicloud-core/src/mcp-server.mjs` list_operations 对 IAM/DEW 调用 `hcloud IAM --help` / `hcloud DEW --help` 超时
- **证据**：`evidence/EXP-C4-08/stdout.log`, `evidence/EXP-C4-18/stdout.log`

## #4【P1】EXP-E01 service_catalog 中文意图路由 MISS

- **级别**：P1
- **用例ID**：EXP-E01
- **维度**：D10 评测
- **描述（现象）**：`service_catalog` 对中文意图"帮我查一下我账号在华北北京四有哪些云主机"未路由到 ECS
- **断言（唯一可判定）**：`service_catalog({ intent: "帮我查一下我账号在华北北京四有哪些云主机" }).recommendedServices` 应包含 `"ECS"`
- **实际**：返回 `["Run hcloud --help to list available services."]`，verdict=MISS
- **根因（文件:行号）**：`plugins/huaweicloud-core/src/tools.mjs` service_catalog 中文意图路由未覆盖"帮我查云主机"表述变体
- **证据**：`evidence/EXP-E01/stdout.log`
