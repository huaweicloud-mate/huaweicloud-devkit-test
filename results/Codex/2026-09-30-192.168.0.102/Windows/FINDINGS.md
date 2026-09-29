## #1【P0】D4-16 命令包裹穿透

- **现象**：MCP hook 对 `sh -c`/shell 包裹的 hcloud 写命令未稳定返回 deny。
- **断言**：命令包裹后的高危写操作必须被识别并拦截。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:489` 的文本命令入口与 shell 包裹解包路径存在覆盖缺口。
- **影响**：攻击者可通过命令包装绕过写操作审批边界。
- **证据**：`evidence/D4-16/stdout.log`

## #2【P1】D4-27 双路径输出脱敏泄露凭证

- **现象**：`redactSecrets`/`redactOutput` 对测试输入中的 JSON `ak`/`sk` 与裸 token 未全部替换。
- **断言**：工具返回与 CLI 输出不得包含 AK、SK、token 明文。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:49` 与 `hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs:774` 的规则未覆盖该字段形态。
- **影响**：凭证可能进入日志或工具响应。
- **证据**：`evidence/D4-27/stdout.log`

## #3【P0】D9-12 initialize 协议参数校验缺失

- **现象**：协议探针发送非法 `tools/list` 参数时未返回 JSON-RPC `-32602`。
- **断言**：非法参数必须返回结构化 Invalid params 错误。
- **根因**：`hdk/plugins/huaweicloud-core/src/mcp-server.mjs` 的请求参数校验未覆盖该调用路径。
- **影响**：客户端无法可靠区分协议参数错误。
- **证据**：`evidence/D9-12/stdout.log`

## #4【P0】D9-13 tools/call 凭证脱敏不完整

- **现象**：认证/安全探针的 `redact-json` 与 `redact-dual` 断言失败，响应仍包含测试凭证值。
- **断言**：tools/call 返回必须移除 AK/SK/token 明文，并保持权限决策正确。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:49` 的敏感字段规则覆盖不完整。
- **影响**：调用响应可能泄露运行时凭证。
- **证据**：`evidence/D9-13/stdout.log`

## #5【P1】EXP-E01 serviceCatalog 路由 MISS

- **现象**：评测意图 EXP-E01 未命中预期服务。
- **断言**：输入意图应路由到预期 Huawei Cloud 服务目录。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的 `serviceCatalog` 规则未覆盖该意图。
- **证据**：`evidence/EXP-E01/stdout.log`

## #6【P1】EXP-E02 serviceCatalog 路由 MISS

- **现象**：EXP-E02 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E02/stdout.log`

## #7【P1】EXP-E03 serviceCatalog 路由 MISS

- **现象**：EXP-E03 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E03/stdout.log`

## #8【P1】EXP-E04 serviceCatalog 路由 MISS

- **现象**：EXP-E04 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E04/stdout.log`

## #9【P1】EXP-E05 serviceCatalog 路由 MISS

- **现象**：EXP-E05 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E05/stdout.log`

## #10【P1】EXP-E07 serviceCatalog 路由 MISS

- **现象**：EXP-E07 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E07/stdout.log`

## #11【P1】EXP-E10 serviceCatalog 路由 MISS

- **现象**：EXP-E10 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E10/stdout.log`

## #12【P1】EXP-E11 serviceCatalog 路由 MISS

- **现象**：EXP-E11 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E11/stdout.log`

## #13【P1】EXP-E12 serviceCatalog 路由 MISS

- **现象**：EXP-E12 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E12/stdout.log`

## #14【P1】EXP-E13 serviceCatalog 路由 MISS

- **现象**：EXP-E13 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E13/stdout.log`

## #15【P1】EXP-E14 serviceCatalog 路由 MISS

- **现象**：EXP-E14 路由结果为 MISS。
- **断言**：评测意图应命中预期服务。
- **根因**：`hdk/plugins/huaweicloud-core/src/tools.mjs:1966` 的意图匹配规则覆盖不足。
- **证据**：`evidence/EXP-E14/stdout.log`
