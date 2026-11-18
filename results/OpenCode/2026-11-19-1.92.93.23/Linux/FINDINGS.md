# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-11-19-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：`2026-11-19 05:45:00`（北京时间）
> **被测版本**：huaweicloud-devkit v2.0.0-next.4（npm next，hdk checkout `16a24814`，src/**/*.ts TypeScript 重写）
> **本清单是统一提单脚本的解析输入**：格式遵循 `## #序号【级别】标题` + `- **根因**：` + `- **断言**：`。

## #1【P1】D3-S1/EXP-E01 服务目录路由「云主机」关键词缺失 → ECS 查询意图路由 MISS

- **现象**：`huaweicloud_service_catalog(intent='帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices:["Run hcloud --help to list available services."]`（兜底），未命中 ECS；同意图在 v1 正常路由到 ECS。
- **断言**：ECS 只读查询意图「…有哪些云主机」应命中 `recommendedServices` 含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:24-36` —— serviceCatalog 的 ECS routeMap `keywords` 仅含 `'ecs','server','vm','instance','compute','弹性云服务器','云服务器','服务器','虚拟机','镜像'`，缺失高频口语词「云主机」（及「弹性云」），导致以「云主机」表述的 ECS 查询意图整条不命中，落入兜底 `Run hcloud --help`。
- **影响**：ECS 只读查询类场景（D3-S1、评测集 EXP-E01）路由准确率受损。
- **证据**：`evidence/D3-S1/stdout.log`、`evidence/EXP-E01/stdout.log`

## #2【P0】D4-16 命令包裹穿透（sh -c 内层 env 凭证泄露未拦截，与 classify-text 不一致）

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `{"decision":"allow"}`；未包裹形态 `env | grep HW_ACCESS_KEY` 正确 `deny`；同命令 `classifyTextCommand` 返回 `deny`（两条安全路径不一致）。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 等命令包裹形态的凭证 env 打印应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`（`hwc-command-env-dump`）——第一条件 regex `(^|\s)(env|printenv|...)` 要求 `env` 前为行首或空白，`sh -c "env …"` 中 `env` 前为双引号非空白，故整条规则不命中；`risk-rule-engine.ts` 的 `evaluateCommandRisk` 路径未做 `sh -c` 解包（`safety/unwrap.ts` 的展开仅在 `safety/classify-text.ts` 路径生效）。
- **影响**：命令包裹可穿透凭证 env 泄露防线（P0 红线），且 risk 与 classify 两安全面判定不一致。
- **证据**：`evidence/D4-16/stdout.log`

## #3【P0】D4-21 HCL/Terraform broad IAM 制品仅 warn 未 deny

- **现象**：`evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` 返回 `warn`（命中 `hwc-iam-wildcard-action`），JSON 形态 `{"Effect":"Allow","Action":"*"}` 返回 `deny`。
- **断言**：JSON 与 HCL/Terraform 两种形态的 broad IAM 制品均应 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`（`hwc-iam-admin-policy` deny 规则）——第三条匹配条件 regex `(\"Effect\"\s*:\s*\"Allow\"|Effect\s*[=:]\s*["']?Allow["']?)` 要求显式 `Effect: Allow`，HCL 形态隐式 Allow（`actions = ["*"]` 无 Effect 字段）三条条件不全部命中，降级到同族 `warn`（`hwc-iam-wildcard-action`）。
- **影响**：IaC（Terraform/HCL）通道 broad IAM 预检仅告警不阻断，未达 P0 安全基线。
- **证据**：`evidence/D4-21/stdout.log`

## #4【P2】D8-9 遥测 sanitizeValue 不再脱敏 AK/SK/token 明文

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回（仅去换行/截断），`AK123`/`SECRET`/`abc123` 明文残留。
- **断言**：遥测值（sanitizeValue）应脱敏凭证/密钥类明文，不得原样入库。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts:27` —— `sanitizeValue()` 实现仅 `replace(/[\r\n\t]+/g,' ')` + 超长截断，未调用安全层 `redactSecrets`，v1 的凭证脱敏逻辑在 v2 TS 重写中丢失。
- **影响**：遥测事件值可能把 AK/SK/token 明文上报到遥测端点。
- **证据**：`evidence/D8-9/stdout.log`

## #5【P0】D9-12 initialize 握手未 enforce 时序（未 init 先 tools/list 不拒绝）

- **现象**：未先 `initialize` 即发送 `tools/list`，服务端仍返回完整工具列表（58 工具），未返回 JSON-RPC `-32600`。
- **断言**：未完成 `initialize` 握手即调用 `tools/list` 应返回 `-32600 Invalid Request`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.ts:356` —— `createDevkitMcpServer` 改用 `@modelcontextprotocol/sdk` 的 `new McpServer(...)`，SDK 无 pre-initialize 守卫（同文件注释 "The SDK offers no pre-initialize hook"），v1 自研 dispatch 的 initialize 时序校验在 SDK 化后丢失。
- **影响**：MCP 协议安全基线不满足，非法时序可绕过握手取到能力清单（P0）。
- **证据**：`evidence/D9-12/stdout.log`

## #6【P1】D1-68 区域 env 优先级契约漂移（实现 HW_REGION 优先，契约期望 HUAWEICLOUD_REGION 优先）

- **现象**：区域默认值取 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，HW_REGION 优先；用例契约期望 HUAWEICLOUD_REGION 优先。
- **断言**：凭据 region 默认取值应为 `HUAWEICLOUD_REGION` 优先于 `HW_REGION`（D1-68 预期）。
- **根因**：`plugins/huaweicloud-core/src/auth/credential-resolver.ts:32` 与 `auth/init-cli.ts:44` —— `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`，与设计契约相反。
- **影响**：同时设置两个 env 时 region 解析结果与文档/契约不符，跨环境区域取值产生歧义。
- **证据**：`evidence/D1-68/stdout.log`

## #7【P2】D9-9 tools/call 取消能力未声明（notifications.cancellation 缺失）

- **现象**：`initialize` 响应 `capabilities` 未声明 `notifications.cancellation=true`，客户端无法依赖超时取消语义。
- **断言**：initialize 握手应声明 `capabilities.notifications.cancellation`（或用例要求的超时/取消能力）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.ts` —— 基于 SDK 的 `new McpServer` 未注册 `notifications/cancelled` 能力，initialize 结果未声明该 capability。
- **影响**：tools/call 超时协议语义与取消能力不可协商，客户端无法发出取消通知。
- **证据**：`evidence/D9-9/stdout.log`

## #8【非产品缺陷】D4-13 只读子账号 test001 实际具备写权限（最小权限未生效，账号侧）

- **现象**：以 `credentials.readonly.json`（test001，AK 前缀 `HPUA3X…`，与管理员 `HPUAN1…` 不同）配置临时 hcloud profile 后，`hcloud VPC ListVpcs` 读成功，但 `hcloud VPC CreateVpc` 也成功（真机创建 VPC `ro-perm-test`），创建结果已即时删除归零。
- **说明**：devkit 代码正确区分并读取了只读凭证；问题在账号 test001 的 IAM 策略未被配置为只读（具备 VPC 写权限），属账号/环境侧配置，非 huaweicloud-devkit 源码缺陷，不计入源码仓库提单。
- **证据**：`evidence/D4-13/stdout.log`