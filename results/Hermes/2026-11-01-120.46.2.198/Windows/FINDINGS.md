# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813 / Windows）

> **落盘路径**：`results/Hermes/2026-11-01-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-01 06:15（北京时间）
> **被测对象**：huaweicloud-devkit `1.1.13-next.0`（npm @next，gitHead `47170d1f`）＋源码 v2 分支 `08554f62`
> **测试类型**：每日全量（设计级 107 + 展开级 43 = 150）

---

## #1【P1】D3-C2/D3-C13 OBS 静态网站配置在 STS 临时凭证下签名失败（HTTP 400）

- **现象**：真云实测 `huaweicloud_obs_set_website_config` set/get 返回 HTTP 400，body 报 `InvalidArgument: Request has x-amz-security-token header but signed headers not include it`。建桶/删桶正常。
- **断言**：STS 临时凭证（当前 activeSource=temporary-sts）下 set/get 应返回 ok/status 200，而非 HTTP 400。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3041` `signedHeaders = 'host;x-amz-content-sha256;x-amz-date'` 未含 `x-amz-security-token`；而 `:3078` 在 `creds.securityToken` 存在时又向请求头添加 `x-amz-security-token`，导致签名头与实际请求头不一致，AWS4 验签拒收。
- **影响**：使用 STS 临时凭证（含 securityToken）时，OBS 静态网站托管 set/get 及所有走 `obsSignedRequest` 的 OBS 签名请求均失败。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C13/stdout.log`

## #2【P1】D9-2 JSON-RPC `tools/list` 传非对象 params 未返回 -32602

- **现象**：`tools/list` 传 `params: "not-an-object"`（字符串）时，服务端正常返回工具列表（无 error 对象），未按 JSON-RPC 2.0 返回 -32602（Invalid params）。
- **断言**：`tools/list` 传非 object/array 的 params 应返回 `-32602 (Invalid params)`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:61-63` `tools/list` 分支直接 `return { tools: TOOL_DEFINITIONS }`，未校验 `params` 类型；-32602 校验仅覆盖 `tools/call`（未知工具/缺必填，`:65-83`），不覆盖 `tools/list` 的参数类型。
- **影响**：协议健壮性缺口，客户端传畸形 params 时得不到规范错误码。
- **证据**：`evidence/D9-2/stdout.log`、`evidence/D9-2/probe.mjs`

## #3【P0】D4-23 全局规则 huawei-agent-rules.mdc 仍为孤儿文件未注入任何安装目标

- **现象**：`rules/huawei-agent-rules.mdc` 存在（含 Core Principles / Secret Safety / IAM Security 规则），但全包 grep 无任何 `agent-rules`/`.mdc` 引用。
- **断言**：11 个安装目标（OpenCode/Codex/CodeArtsAgent/…/AtomCode）安装后应注入该规则且 MUST 约束可执行，无孤儿文件。
- **根因**：`bin/setup.cjs` 无「rules」引用；`plugins/huaweicloud-core/src/setup-cli.mjs` 与各插件 manifest 均无 rules 注入逻辑 → 孤儿文件（`rules/huawei-agent-rules.mdc` 未被任何安装/启动路径读取）。
- **影响**：全局 Agent 安全规则（secret safety / IAM security / 网络安全）对任何 agent 均不生效，安全姿态存在「意图-实际」gap。
- **证据**：`evidence/D4-23/stdout.log`

## #4【P1】EXP-E01 serviceCatalog 中文「查询 ECS」意图未命中 ECS 路由

- **现象**：`huaweicloud_service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回兜底「Run hcloud --help...」，未推荐 ECS（路由 MISS）；而 EXP-E02「创建…云服务器」正确命中 ECS。
- **断言**：ECS 查询意图（“查…云主机/云服务器”）应命中 `ECS` → `run_readonly`，而非落入兜底。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2197` `routeMap` 缺失「查询云主机/云服务器/查…ECS」类只读意图→ECS 的映射（仅覆盖「创建」类意图）。
- **影响**：ECS 只读查询类中文意图无法路由到 ECS，路由准确率 92.9%（13/14，唯一 MISS）。
- **证据**：`evidence/EXP-E01/stdout.log`

## #5【P1】D9-9 initialize 未声明 capabilities.notifications.cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities: { tools: {} }`，未声明 `notifications.cancellation`。
- **断言**：MCP 协议契约应声明 `capabilities.notifications.cancellation` 以支持取消/超时通知。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:51-53` capabilities 仅声明 `tools: {}`，未声明 `notifications`。
- **影响**：协议能力协商缺口，客户端无法依赖服务端支持的取消/通知能力。
- **证据**：`evidence/D9-9/stdout.log`