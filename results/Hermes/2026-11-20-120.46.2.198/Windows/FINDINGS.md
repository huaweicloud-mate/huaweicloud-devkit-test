# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-11-20-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-20 05:45:00（北京时间）
> **被测对象**：huaweicloud-devkit@2.0.0-next.4（gitHead 16a24814）

## #1【P1】D3-C13 OBS 静态网站托管配置 STS 签名缺陷（403 InvalidAccessKeyId）

- **现象**：`huaweicloud_obs_set_website_config`（action=get）对任意桶返回 `{ok:false, status:403, body:"InvalidAccessKeyId / The security token is invalid"}`；set 动作因写审批 gate 返回 `USER_CONFIRMATION_REQUIRED`。
- **断言**：get website 配置应返回干净成功/无配置（非 403 签名错误）；set 经审批应可执行。
- **根因**：`plugins/huaweicloud-core/dist/lib/hw-request-signing.js`（AWS4 签名器：STS 临时凭证场景下 x-amz-security-token 未纳入 SignedHeaders / security token 传递不完整，导致签名校验失败 403）。该缺陷自 1.1.14 延续至 2.0.0-next.4（历史 400 InvalidArgument → 现 403 InvalidAccessKeyId）。
- **影响**：OBS 静态网站托管（website config）工具不可用，D3-C2 静态站 E2E 无法闭环。
- **证据**：`evidence/D3-C13/stdout.log`、`evidence/D3-C2/stdout.log`

## #2【P1】D3-C2 OBS 静态站 E2E 未闭环（set 审批 gate + get STS 403）

- **现象**：建桶成功、删桶归零成功（signed DELETE 204），但 set website 返回 `USER_CONFIRMATION_REQUIRED`（写操作需审批 token，未经审批执行），get website 返回 403 InvalidAccessKeyId。
- **断言**：建桶→set website→get→删桶归零 全链路应闭环。
- **根因**：与 #1 同根因（OBS website config STS 签名缺陷）+ 写操作审批 gate 变更（obs_set_website_config 在 2.0.0-next.4 起纳入写审批）。
- **影响**：OBS 静态站完整交付流程不可用。
- **证据**：`evidence/D3-C2/stdout.log`

## #3【P2】D10-4 安全规则数漂移（29 vs 文档 16）

- **现象**：`loadRiskRules()` 返回 `{version, rules}` 共 29 条（severity 拆分 15 deny + 14 warn），文档/用例断言 9 deny + 7 warn = 16。
- **断言**：规则库数量应与文档快照一致（或文档同步至实际数量）。
- **根因**：`plugins/huaweicloud-core/dist/risk-rule-engine.js`（规则库扩展至 29 条，规则快照文档未同步）。
- **影响**：安全规则覆盖文档与实际漂移，审计口径不一致。
- **证据**：`evidence/D10-4/stdout.log`

## #4【P2】D8-9 telemetry sanitizeValue 未脱敏凭证明文

- **现象**：`sanitizeValue('AKID-abc\nSK-xyz password=hunter2')` 返回 `"AKID-abc SK-xyz password=hunter2"`（仅 strip 换行/截断），AK/SK/password 仍以明文保留。
- **断言**：遥测值脱敏函数应对 AK/SK/密码类敏感字段替换为占位符。
- **根因**：`plugins/huaweicloud-core/dist/telemetry/telemetry-values.js:21`（sanitizeValue 仅做控制字符清洗 + 长度截断，脱敏职责仍在 redactSecrets 独立路径，遥测录入链路未接脱敏）。
- **影响**：遥测事件若录入含凭证值，存在明文落盘风险。
- **证据**：`evidence/D8-9/stdout.log`

## #5【P2】D9-2 未知工具未以 JSON-RPC error 返回 -32602

- **现象**：`tools/call` 传不存在的工具名，服务端返回 `{content:[{type:'text', text:'MCP error -32602: Tool not_a_tool not found'}], isError:true}`，而非 JSON-RPC 错误响应（error.code=-32602）。
- **断言**：未知工具应返回 JSON-RPC error -32602；未知方法已正确返回 -32601（`mcp-stdio-transport.js:198`）。
- **根因**：`plugins/huaweicloud-core/dist/mcp-server.js`（tools/call 分发层将未知工具错误包装为 isError:true 结果，未对齐 transport 层 -32601 的 JSON-RPC 错误语义）。
- **影响**：协议客户端无法按标准错误码区分未知工具，需解析 content 文本。
- **证据**：`evidence/D9-2/stdout.log`

## #6【P1】EXP-E01 服务目录路由缺「云主机」同义别名（历史 #705）

- **现象**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 未命中 ECS，返回兜底 `"Run hcloud --help to list available services."`；评测 15 条中 1 条 MISS，准确率 92.9%。
- **断言**：「云主机」应路由到 ECS（与「云服务器/弹性云服务器」等价）。
- **根因**：`plugins/huaweicloud-core/dist/capability-catalog.js:17`（serviceCatalog routeMap ECS 关键词含「云服务器/弹性云服务器/服务器/虚拟机」但缺「云主机」同义别名）。
- **影响**：中文口语「云主机」高频意图路由失败，D10 评测命中率下降。
- **证据**：`evidence/EXP-E01/stdout.log`