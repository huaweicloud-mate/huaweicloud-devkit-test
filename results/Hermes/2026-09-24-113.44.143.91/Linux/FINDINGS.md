# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-24-113.44.143.91/Linux/FINDINGS.md`
> **生成时间**：2026-09-24 12:05（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.7-next.1（npm next，gitHead `657ceb7b`，PR #806）
> **执行方式**：源码级探针直调 `hdk/plugins/huaweicloud-core/src/*`（safety-policy / tools / mcp-protocol / telemetry / risk-rule-engine）+ `eval/harness/run-eval.mjs` 中文意图路由 + 真云 E2E（D3-S1/S2/S3/S4/C13 建删归零、D4-13 只读子账号、D3-S6 FunctionGraph）
> **提单说明**：缺陷全部实测复现、根因已定位到文件:行号；经上游 open issue 查重后不重复开单（见 file_issue.py 历史查重结果）。

---

## #1【P0】D2-4 凭证脱敏缺小写 ak=/sk=

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文不脱敏；大写 `AK=`/`SK=` 正常 `<redacted>`、对象路径 accessKeyId/secretAccessKey/securityToken 正常脱敏。
- **断言**：小写 `ak=`/`sk=` 格式凭证值应被替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 末段 `/\.replace(/(AK|SK)\s*[:=]\s*(...)/g, '$1=<redacted>')` 大小写敏感且无 `/i`，小写 `ak=`/`sk=` 漏网。
- **影响**：obsutil 配置与小写凭证字段不脱敏，AK/SK 明文进入日志/对话/报告。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-16 命令包裹穿透（shell 包裹单引号内 env-dump/credential 失配 allow）

- **现象**：`sh -c 'printenv HUAWEICLOUD_ACCESS_KEY_ID'`、`bash -c 'printenv HUAWEICLOUD_ACCESS_KEY_ID'` 返回 `allow`；无引号 `sh -c printenv ...`、裸 `printenv ...` 返回 `deny`。
- **断言**：shell 包裹（`sh -c`/`bash -c`）内层含 env-dump / credential 打印命令，`classifyTextCommand` 决策应为 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:397-419` env-dump 正则 `/(^|\s)(env|printenv|...)/i` 与 printenv 引用正则 `/(?:^|\s)printenv\s+(?:HUAWEICLOUD|...)/` 均以 `(^|\s)`/`(?:^|\s)` 为前缀锚点；单引号包裹时 printenv 前是 `'` 非空白，正则失配穿透 allow。`stripExecutable` 解包（同文件 :67-101）仅作用于 `classifyHcloudArgs` 的 hcloud 写命令路径，未前移到 `classifyTextCommand` 的 env-dump 检测。
- **影响**：未审批凭证 dump 可经 shell 单词引号包裹穿透安全门（#650 修复残留边界）。
- **证据**：`evidence/D4-16/stdout.log`

## #3【P0】D4-23 全局规则 huawei-agent-rules.mdc 安装未注入

- **现象**：`install --target <agent>` 后安装目标目录无 `rules/huawei-agent-rules.mdc` 产物；仅 skills/commands/src/safety/hooks 被复制。
- **断言**：install 后安装目标应含全局 MUST 级规则文件 `huawei-agent-rules.mdc`（11 安装目标生效）。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs:420-422` 安装流程仅 `readdirSync(join(PLUGIN_ROOT, 'skills'))` 复制 skills 目录，未复制 `rules/` 目录；全文件无对 `rules/huawei-agent-rules.mdc` 的引用。
- **影响**：设计强制的全局约束规则未交付到任何 agent 安装目标。
- **证据**：`evidence/D4-23/stdout.log`

## #4【P1】D4-27 双路径输出脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets('ak=AKID12345678 sk=SK...')` 与 `redactOutput`（文本路径）均返回原文；大写 `AK=`/`SK=` 正常脱敏。
- **断言**：小写 `ak=`/`sk=` 后跟值应替换 `<redacted>`；`redactOutput` 文本路径同脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45`（同 #1）+ `hcloud-cli.mjs:587` `redactOutput` 内部调 `redactSecrets`，(AK|SK) 正则大小写敏感缺 `/i`（与 D2-4 同源）。
- **影响**：`token=`/小写凭证经日志与 CLI 输出双路径泄漏。
- **证据**：`evidence/D4-27/stdout.log`

## #5【P1】D9-2 JSON-RPC tools/list 非法参数无 -32602

- **现象**：`tools/list` 带非法参数（params 非空对象）直接返回 `{ tools: [...] }`，无 `-32602 Invalid params` error 对象；未知方法已正确返回 `-32601`、`tools/call` 未知工具/缺参已返回 `-32602`。
- **断言**：`tools/list` 收到非法参数应返回 `-32602` JSON-RPC error 对象。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57-59` `if (method === 'tools/list') return { tools: TOOL_DEFINITIONS }` 直接返回、完全忽略 `params`，未做参数校验（-32602 分支仅覆盖 `tools/call` 的 :66/:77 与未知方法 :100）。
- **影响**：MCP 客户端向 tools/list 传非法参数不被拒绝，协议健壮性缺口。
- **证据**：`evidence/D9-2/stdout.log`

## #6【P1】D10-3 + EXP-E01~E14 中文意图路由未命中（准确率 21.4%）

- **现象**：15 条中文意图 11 MISS + 1 诊断 miss（E08），仅 DCS(E06)/CCE(E09)/voucher(E15) HIT，路由准确率 21.4%（HIT=3 MISS=11 N/A=1）；「查云主机/创建2C4G云服务器/绑EIP/MySQL/备份/函数/费用/监控告警/HTTPS证书/权限审计」均返回 `Run hcloud --help…`。
- **断言**：各中文意图应路由到对应服务——查云主机→ECS、静态站→OBS、MySQL→RDS、备份→CBR、函数→FunctionGraph、费用→BSS、监控→CES、证书→ELB、审计→IAM。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817-1921` `routeMap` 关键词全英文（`['ecs','server','vm','instance','compute','flavor','image']` 等），无中文关键词；`serviceCatalog` 输入仅 `toLowerCase()` 未做中文映射。
- **影响**：中文意图路由准确率 21.4% < 90% 目标，绝大多数中文场景无法命中服务。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`…`EXP-E14/stdout.log`（共 12 条 FAIL）

## #7【P1】D4-24 确认令牌精确 JSON 契约未实现（SPEC-MISMATCH）

- **现象**：`auth_confirm` 仅处理 `auth_switch reconcile` 确认；token 过期时抛 `throw new Error('confirmToken not found or expired.')` 字符串异常，无 `{code:'CONFIRM_TOKEN_EXPIRED', status:'rejected'}` 也无 `{outcome:'already_processed'}` 精确字段；写审批令牌过期经 `consumeApprovalToken(APPROVAL_TTL)` 静默返回 null。
- **断言**：确认令牌过期/重复确认应返回机器可断言的精确 JSON 契约（`code`/`status`/`outcome` 字段）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1258-1269` `huaweicloud_auth_confirm` 分支未实现 R11 契约字段，仅抛非结构化 Error（订阅确认令牌契约漂移）。
- **影响**：审批流健壮性契约未实现，客户端无法机器判定令牌状态。
- **证据**：`evidence/D4-24/stdout.log`

## #8【P1】D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities: { tools: {} }`，无 `notifications` / `cancellation` 声明；超时契约 `{code:-32000, message 含 timeout}` 实测通过。
- **断言**：`initialize.result.capabilities` 应声明 `cancellation`（及其 notifications 能力）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49` `capabilities` 仅 `{ tools: {} }`，未声明 `cancellation`/`notifications`（tools/call 超时协议语义与取消能力契约漂移）。
- **影响**：客户端无法获知服务端取消能力，长耗时工具调用无法主动取消。
- **证据**：`evidence/D9-9/stdout.log`

## #9【P2】D8-9 sanitizeValue 未脱敏凭证

- **现象**：`sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123')` 返回原文（仅折叠控制字符+截断）；installId 稳定 OK。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue` 仅做控制字符折叠与长度截断，无凭证脱敏逻辑。
- **影响**：遥测值夹带凭证脱敏不完整，安装 ID 与遥测值可泄明文。
- **证据**：`evidence/D8-9/stdout.log`

## #10【P2】D4-26 findings 证据脱敏漏小写

- **现象**：`hook_check_command('... ak=AK... sk=SK...')` 的 `findings.evidence` 回显原文明文。
- **断言**：findings.evidence 中 AK/SK/token/password 应 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:25` `redactEvidence` 末段 `.replace(/(AK|SK)\s*[:=]\s*(...)/g, '$1=<redacted>')` 无 `/i`（与 D2-4 同源大小写缺口）。
- **影响**：危险命令审计证据夹带明文凭证。
- **证据**：`evidence/D4-26/stdout.log`

## #11【P2】D3-S6 中文「函数」意图不路由 FunctionGraph

- **现象**：`serviceCatalog('配置一个定时任务，定时触发函数')` 返回 `Run hcloud --help…` 未命中 FunctionGraph（真云建删函数归零见收尾记录）。
- **断言**：中文「函数/定时任务」意图应路由命中 `FunctionGraph`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817-1921` `routeMap` FunctionGraph 条目关键词为英文 `['functiongraph','serverless','function','lambda','trigger','faas']`，无中文「函数/定时」词（与 D10-3 同源，routeMap 中文关键词缺失）。
- **影响**：FunctionGraph 定时任务场景第一步路由即 miss。
- **证据**：`evidence/D3-S6/stdout.log`、`evidence/_cleanup-fg/stdout.log`

## #12【非产品缺陷】D4-13 最小权限子账号测试环境侧权限异常（不计入提单）

- **现象**：`run-as-readonly` 注入的只读子账号（credentials.readonly.json）实测 `CreateVpc` 成功（返回 VPC id），写未被 IAM 拒绝；只读 `ListVpcs` 100% 可用。
- **说明**：根因=测试环境只读子账号 IAM 策略实际含写权限（非产品源码缺陷）；本次误建 VPC 已归零删除。建议运维复核 credentials.readonly.json 对应子账号 IAM 策略。