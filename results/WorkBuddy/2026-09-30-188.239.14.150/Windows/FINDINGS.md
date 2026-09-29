# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-30-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-30 05:10:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1

## 缺陷汇总

本次测试共发现 19 项 FAIL/SPEC-MISMATCH（设计级 8 + 展开级 11），全部为历史已知缺陷的复核确认，无新增缺陷。

## #1【P0】D4-16 命令包裹穿透

- **现象**: `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision: 'allow'`，命令未被拦截
- **断言**: `classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision: 'deny'`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:384-430` — `classifyTextCommand` 在 hcloud regex 不匹配时直接 fallthrough 到 allow，未调用 `stripExecutable` 解包 `sh -c` wrapper；正则 `/(^|\s)(env|printenv|...)/i` 和 `/(?:^|\s)printenv\s+HUAWEICLOUD_/i` 均要求 printenv 前面是 `^` 或 `\s`，但引号内的 printenv 前面是 `"` 不匹配
- **影响**: 安全绕过——攻击者可用 `sh -c` 包裹敏感命令绕过安全分类
- **证据**: `evidence/D4-16/stdout.log` + `evidence/d4-security/stdout.log`
- **状态**: 历史关联 #731，不重复提单

## #2【P0】D2-4 凭证脱敏正确性（字符串输入漏脱敏）

- **现象**: `redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 返回原字符串未脱敏
- **断言**: `redactSecrets` 对含 `ak`/`sk` 键的 JSON 字符串输入返回脱敏后的字符串（不含原始 SK 值）
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:34-46` — `redactString` 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK` 前缀，未覆盖小写 `ak`/`sk` 键名。`redactSecrets` 对对象输入走 `isSecretKeyName`（匹配 policy.json 的 `ak`/`sk` pattern）正常脱敏，但对字符串输入走 `redactString` 正则路径漏脱敏
- **影响**: 当凭证 JSON 以字符串形式传入 `redactSecrets` 时，小写 `ak`/`sk` 键对应的值不会被脱敏，可能导致凭证泄露
- **证据**: `evidence/D2-4/stdout.log` + `evidence/d2-auth/stdout.log`
- **状态**: 历史关联 #694/#791，不重复提单

## #3【P0】D4-27 双路径输出脱敏

- **现象**: MCP + 直调双路径均未脱敏 lowercase `ak`/`sk`（与 D2-4 同根因）
- **断言**: MCP + 直调双路径均脱敏 `ak`/`sk`
- **根因**: `plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` regex 仅匹配大写 `AK`/`SK`
- **影响**: 双路径输出均可能泄露凭证
- **证据**: `evidence/D4-27/stdout.log`
- **状态**: 历史关联 #694/#791，不重复提单

## #4【P0】D9-12 initialize 握手协议安全基线

- **现象**: `capabilities.notifications.cancellation` 未声明（SPEC-MISMATCH）；`tools/list` 非法参数类型未返回 -32602 Invalid params
- **断言**: initialize 返回 protocolVersion + capabilities + serverInfo；capabilities 含 notifications.cancellation；tools/list 非法参数返回 -32602
- **根因**: `plugins/huaweicloud-core/src/mcp-server.mjs` — capabilities 响应缺少 notifications.cancellation 声明；params 校验未返回标准 JSON-RPC 错误码
- **影响**: MCP 协议客户端无法使用 cancellation 能力；协议错误处理不完整
- **证据**: `evidence/D9-12/stdout.log`
- **状态**: 历史关联，不重复提单

## #5【P0】D10-4 安全干预-静态规则层

- **现象**: `evaluateCommandRisk('hcloud ECS DeleteServers --servers.1.id=abc')` 返回 `decision: 'warn'` 而非 `deny/confirm`
- **断言**: 高危命令（删资源）判 deny
- **根因**: `plugins/huaweicloud-core/src/risk-rule-engine.mjs` + `safety/rules/cloud-risk-rules.json:225-249` — DeleteServers 匹配 `hwc-destructive-delete-operation` 规则（severity: warn）而非 deny 规则
- **影响**: 破坏性删除操作仅 warn 而非硬拦截，存在误放行风险
- **证据**: `evidence/D10-4/stdout.log`
- **状态**: 历史关联，不重复提单

## #6【P1】D9-2 JSON-RPC错误码

- **现象**: `tools/call` 非法参数未返回 `-32602` (Invalid params) 错误码，实际返回无 error 对象
- **断言**: 非法 params 调用返回 JSON-RPC `-32602` 错误码
- **根因**: `plugins/huaweicloud-core/src/mcp-server.mjs` — params 校验未返回标准 JSON-RPC `-32602` 错误
- **影响**: 协议错误处理不完整，客户端无法据错误码区分错误类型
- **证据**: `evidence/D9-2/stdout.log`
- **状态**: 历史关联 #731（与 D9-12 同包），不重复提单

## #7【P1】D9-9 tools/call 超时协议语义与取消

- **现象**: `initialize.result.capabilities.notifications` 未声明 `cancellation`
- **断言**: capabilities 含 `notifications.cancellation` 声明
- **根因**: `plugins/huaweicloud-core/src/mcp-server.mjs` — initialize 响应 capabilities 未声明 cancellation notification 能力
- **影响**: MCP 客户端无法获知 server 支持 cancellation，无法发起取消请求
- **证据**: `evidence/D9-9/stdout.log`
- **状态**: 历史关联（与 D9-12 同包），不重复提单

## #8【P1】D10-3 路由准确率+混淆矩阵

- **现象**: `serviceCatalog` 路由层对 15 条中文评测意图仅 4 条命中（26.7% HIT），11 条 MISS
- **断言**: 15 条评测集意图全部路由命中（HIT）
- **根因**: `plugins/huaweicloud-core/src/hcloud-cli.mjs` serviceCatalog 路由层覆盖不全（基线 21.4% MISS，与历史一致）
- **影响**: 评测集意图路由不完整，部分中文意图无法正确路由到对应云服务
- **证据**: `evidence/D10-3/stdout.log` + `evidence/c4-service-matrix/stdout.log`
- **状态**: 历史关联，不重复提单

## #9~#19【P1】EXP-E01~E14 serviceCatalog 路由 MISS（11 条）

- **现象**: `eval/harness/run-eval.mjs` 跑 serviceCatalog 路由层，15 条评测集中 11 条未命中（EXP-E01,E02,E03,E04,E05,E07,E10,E11,E12,E13,E14 MISS；E06,E08,E09,E15 HIT）
- **断言**: 15 条评测集意图全部路由命中（HIT）
- **根因**: `plugins/huaweicloud-core/src/hcloud-cli.mjs` serviceCatalog 路由层覆盖不全（基线 21.4% MISS，与历史一致）
- **影响**: 评测集意图路由不完整，部分中文意图无法正确路由到对应云服务
- **证据**: `evidence/c4-service-matrix/stdout.log`（EXP-E01~E14 逐条结果）
- **状态**: 历史关联，不重复提单
