# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-09-24-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-24 05:12（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.7-next.1`（npm @next，gitHead 657ceb7b）
> **说明**：本轮 daily 全量执行设计级 100 + 展开级 39。共 19 项缺陷（18 FAIL + 1 SPEC-MISMATCH），与 2026-09-21 历史提单（v1.1.5）及 2026-09-23 复核（v1.1.6）逐条一致，#1~#19 全部为历史/同源缺陷（v1.1.7-next.1 未修复）。展开级 12 项 EXP-E 路由 miss 同源于 #7（D10-3 serviceCatalog 中文路由缺陷），不重复开单。

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=（obsutilconfig 格式）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文未脱敏；`access_key=`/`secret_key=`/`AK=` 大写键与对象路径均正常脱敏。
- **断言**：小写 `ak=`/`sk=` 格式凭证值应替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 大小写敏感且仅覆盖大写 `AK|SK`，未覆盖 obsutilconfig 的小写 `ak=`/`sk=`。
- **影响**：真实 obsutil 配置的小写凭证字段不脱敏，AK/SK 可经 agent 上下文泄漏（红线 I 类）。
- **证据**：`evidence/D2-4/stdout.log`（FAIL `小写 ak=/sk= 脱敏` → `ak=AK123456 sk=SKsecret`）

## #2【P0】D4-3 明文 secret API 拦截漏 kms DecryptData

- **现象**：`hcloud kms DecryptData --ciphertext x` 判 `decision=allow`、`risk=unknown_read`；`hcloud csms ShowSecretVersion` 正确 deny。
- **断言**：`hcloud kms DecryptData`（返回明文 secret）应判 `decision=deny`、`risk=secret`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:432` secret 正则 `/ShowSecretVersion|GetSecretValue|secret_string|secret_binary/i` 未覆盖 KMS `DecryptData`/`DecryptDataKey`。
- **影响**：明文解密 API 可被调用，明文 secret 进入 agent 上下文（红线）。
- **证据**：`evidence/D4-3/stdout.log`（FAIL `kms DecryptData deny` → `allow`）

## #3【P0】D4-15 hook 命令替换绕过（$(...))

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `allow/unknown_read`（shell 展开后等价破坏性删除）。
- **断言**：该命令应判 `deny`（命中破坏性删除规则）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:49-53` `conditionMatches()` 纯文本正则，不做 shell 命令替换展开，`$(...)` 破坏 `hcloud <service> <op>` 匹配。
- **影响**：P0 安全 hook 可被命令替换规避，破坏性删除绕过审批。
- **证据**：`evidence/D4-15/stdout.log`（FAIL `命令替换 $(...) deny`）

## #4【P0】D4-16 shell 包裹穿透未完全根除（bash -c "hcloud ..." 仍 allow）

- **现象**：`bash -c "hcloud ecs DeleteServers --server-id 1"` 仍判 `allow/not_huaweicloud`；`sh -c "echo x && hcloud rds CreateInstance"` 已判 `deny`。
- **断言**：内层含 `hcloud <Svc> Delete*/Create*` 的包裹命令应判 `deny`。
- **根因**：`classifyHcloudArgs` 内 `stripExecutable`/`findHcloudCommandSegments` 已修复 `&&` 链接，但 `plugins/huaweicloud-core/src/safety-policy.mjs:428` 入口正则 `/(^|\s)hcloud(\.exe)?\s+/i` 仍不匹配引号包裹的 `bash -c "hcloud ..."`。
- **影响**：破坏性写操作仍可借 `bash -c "..."` 引号包裹绕过审批门（P0）。
- **证据**：`evidence/D4-16/stdout.log`（FAIL `bash -c hcloud Delete deny`）

## #5【P1】D4-17 hook 畸形输入 fail-open（应 fail-closed）

- **现象**：`evaluateArtifacts([{path:'x.json', content:'{not-valid-json!!!'}])` 判 `allow`、`findings=[]`，未按 fail-closed 语义拒绝。
- **断言**：无法匹配任何规则的异常/畸形输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:104-106` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，对空匹配输入直接 allow，缺 fail-closed 兜底。
- **影响**：畸形/异常输入缺省放行，与「异常输入默认拒绝」契约漂移。
- **证据**：`evidence/D4-17/stdout.log`（FAIL `畸形制品 fail-closed(deny)` → `allow`）

## #6【P0】D4-23 全局规则 huawei-agent-rules 未随安装注入

- **现象**：`package.json` `files` 数组不含 `rules`；源码 `hdk/rules/huawei-agent-rules.mdc` 沦为孤儿文件，install 后注入为 0。
- **断言**：install 后安装目标目录应包含全局 MUST 级规则文件 `huawei-agent-rules.md`（或 `.mdc`）。
- **根因**：`package.json:8`（`files` 数组未列 `rules`），规则文件未被打包/注入任何 client。
- **影响**：全局安全约束（禁直连 CSMS/KMS 等）未交付到任何 agent，安全约束降级（P0）。
- **证据**：`evidence/D4-23/stdout.log`（`files includes rules`=false + 规则文件不存在于发布包）

## #7【P1】D10-3 serviceCatalog 中文意图路由大量 miss（准确率未达 90%）

- **现象**：eval-set-v1 15 条中文意图中仅 Redis→DCS、Kubernetes→CCE、代金券→voucher 命中；「云主机」「云服务器」「弹性公网IP」「备份策略」「费用」「监控告警」「证书」「权限审计」「函数」等大量 miss。展开级 EXP-E01~E15 中 12 条 miss。
- **断言**：中文意图「创建一台 2C4G 的 Ubuntu 云服务器」应路由到 ECS；路由准确率应 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815-1925` `serviceCatalog()` 的 `routeMap` 关键词均为英文，`String(intent).toLowerCase()` 未做中文意图映射。
- **影响**：中文用户（主要目标群体）意图路由大幅 miss（低于门槛 ≥90%）。
- **证据**：`evidence/D10-3/stdout.log`（`路由准确率` FAIL + `中文意图「云主机」→ ECS` FAIL）；`evidence/EXP-E01..E15/stdout.log`

## #8【P1】D4-13 最小权限凭证动态切换失效（run-as-readonly 注入只读 env 仍解析为管理员）

- **现象**：注入只读 test001（ak 前缀 `HPUA3X`）env 后 `resolveCredentials()` 仍返回管理员（ak 前缀 `HPUAN1`）；只读子账号直连写被 IAM 正确拒绝（`VPC.0010 PolicyNotAuthorized`，此层正确）。
- **断言**：注入只读 env 后 `resolveCredentials()` 应返回 test001（ak 前缀 `HPUA3X`）。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:152-160`（R9）：`stored.configuredBySession === true` 时无条件 `ak = stored.ak` 覆盖 env 注入；管理员 `credentials.json` 含 `configuredBySession: true`。
- **影响**：最小权限切账号路径失效——agent 试图切只读子账号时仍以管理员身份解析凭证。
- **证据**：`evidence/D4-13/stdout.log`（`resolvedPrefix=HPUAN1 期望=HPUA3X` + `只读写被 IAM 拒绝: true`）

## #9【P2】D8-1 文档与能力漂移（AGENTS.md 39 vs 实现 40 工具）

- **现象**：`TOOL_DEFINITIONS.length` 实测 40，但源码仓库 `AGENTS.md` 写「39 tools in tools.mjs」（第 27 行与第 45 行）。
- **断言**：源码仓库文档声明的工具数应与 `TOOL_DEFINITIONS.length`（40）一致。
- **根因**：`hdk/AGENTS.md:27` 未随工具新增同步（39 → 40）。
- **影响**：文档与能力漂移，误导 agent/开发者对工具全集的认知。
- **证据**：`evidence/D8-1/stdout.log`（claims39=1 vs impl=40）

## #10【P1·SPEC-MISMATCH】D9-9 tools/call 超时/取消协议契约漂移

- **现象**：`initialize` 返回 `capabilities = { tools: {} }`，未声明 `notifications.cancellation`；未知方法/超时无 `-32000 timeout` 语义。
- **断言**（按用例契约）：① 取消能力按 capabilities 实测——不存在则标 SPEC-MISMATCH；② 超时错误精确 `{code:-32000, message 含 timeout}`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47`（capabilities 仅 `{tools:{}}`，无 `notifications.cancellation`）；`mcp-server.mjs` error 统一 `-32603` 兜底。
- **影响**：MCP 客户端无法据 capabilities 判定取消能力，超时语义不可机器断言。
- **证据**：`evidence/D9-9/stdout.log`（SPEC-MISMATCH）

## #11【P1】D4-27 redactSecrets/redactOutput 双路径脱敏缺裸 token 关键字

- **现象**：`redactSecrets('token=TokenValueABCDEF123456')` 与 `redactOutput('token=TokenValueABCDEF123456')` 均残留明文；`security_token=`/`x-auth-token=`/`password=`/`adminPass=` 正常替换。
- **断言**：裸 `token=` 关键字后跟的值应替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString` secret 关键字列表未含裸 `token`；`hcloud-cli.mjs:587` `redactOutput` 复用 `redactSecrets`，双路径同步缺口。
- **影响**：`token=` 形式访问令牌可经日志/对话输出泄漏。
- **证据**：`evidence/D4-27/stdout.log`（`裸 token= 脱敏` FAIL ×2）

## #12【P2】D3-S5 场景-复合意图分层路由 miss（同 D10-3）

- **现象**：复合意图「物联网时序数据+前端托管」未拆分命中 DDS/GaussDB/OBS/ECS。
- **断言**：复合中文意图应正确拆分并命中多个对应 service。
- **根因**：同 #7——serviceCatalog routeMap 无中文意图映射。
- **证据**：`evidence/D3-S5/stdout.log`（`复合意图命中多个服务` FAIL）

## #13【P2】D3-S6 场景-FunctionGraph 定时任务路由 miss（同 D10-3）

- **现象**：`serviceCatalog('部署一个定时函数任务')` 未路由到 FunctionGraph。
- **断言**：中文意图「定时函数」应路由命中 FunctionGraph。
- **根因**：同 #7——serviceCatalog 英文关键词未覆盖中文「定时函数」。
- **证据**：`evidence/D3-S6/stdout.log`（`路由命中 FunctionGraph` FAIL）

## #14【P1】D3-S7 场景-跨服务（Web 应用 + RDS）复合路由不完整（同 D10-3）

- **现象**：复合意图「Web 应用 + 云数据库 RDS」未同时命中 RDS + 部署目标（sandbox/ECS/OBS），多服务编排入口缺失。
- **断言**：复合意图应命中 RDS + 部署目标（多服务）。
- **根因**：同 #7——serviceCatalog 单关键字命中后不拆分多服务。
- **证据**：`evidence/D3-S7/stdout.log`（`复合意图命中 RDS + 部署目标` FAIL）

## #15【P2】D1-65 调试模式环境变量判定不一致（telemetry 仅认 'true' 不认 '1'）

- **现象**：`update-check.mjs:211` 认 `'1'||'true'`；`telemetry/telemetry.mjs:81` 仅认 `'true'`。
- **断言**：`DEBUG=1/true` 均应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` 未接受 `'1'`。
- **影响**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 只开启 update-check 调试日志，telemetry 调试日志不开启（跨模块行为漂移）。
- **证据**：`evidence/D1-65/stdout.log`

## #16【P2】D8-9 sanitizeValue 不脱敏敏感值（仅空白归一化+截断）

- **现象**：`sanitizeValue('ak=AK123 sk=SKsecret x-admin-token=TTT')` 返回原文。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-198` `sanitizeValue()` 仅 `replace(/[\r\n\t]+/g,' ')` + trim + 截断，无敏感值脱敏。
- **影响**：遥测值中的 AK/SK/token 明文未经 sanitizeValue 收敛即进入遥测事件。
- **证据**：`evidence/D8-9/stdout.log`

## #17【P2】D4-25 Python hook 写命令分类失效（WRITE_OPERATION_RE 前缀锚定错误）

- **现象**：`record_cli_event('hcloud VPC CreateVpc --vpc.name=x')` 分类为 `cli:invoke` 而非 `cli:write`。
- **断言**：写→`cli:write`、只读→`cli:read`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(...)\w*", re.I)` 要求写前缀前是字母数字或行首，而 `hcloud VPC CreateVpc` 中 `Create` 前是空格，漏判为 `cli:invoke`；同文件 READ_OPERATION_RE 用 `\b` 正确。
- **影响**：Python hook（Windows PowerShell 客户端归口）写操作遥测分类失效。
- **证据**：`evidence/D4-25/stdout.log`（`record_cli_event(...) -> cli:write` → actual=`cli:invoke`）

## #18【P2】D4-26 findings.evidence 脱敏缺裸 token 关键字（redactEvidence 第三路径）

- **现象**：`evaluateCommandRisk('rm -rf / --token=TokenValue123')` 的 findings.evidence 残留明文 `TokenValue123`；`--adminPass=...` 正确替换。
- **断言**：findings.evidence 中 AK/SK/token/password 均应被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:17-27` `redactEvidence()` 关键字列表未含裸 `token`（与 D4-27 同源，第三处脱敏路径）。
- **影响**：risk-rule-engine 产出的 findings.evidence 中裸 `token=` 明文可泄漏。
- **证据**：`evidence/D4-26/stdout.log`

## #19【P1】D4-24 确认令牌过期/重复确认边界返回非结构化（无 {code}/{outcome} 契约）

- **现象**：`consumeApprovalToken()` 对「过期」与「已消费」两种情况均返回 `null`（无差别）；无 `{code:'CONFIRM_TOKEN_EXPIRED'}` / `{outcome:'already_processed'}` 结构化字段，机器无法区分「过期」与「重复确认」。
- **断言**（按用例契约）：过期令牌返回精确 `{code:'CONFIRM_TOKEN_EXPIRED'}`（无资源创建）；重复确认第二次返回 `{outcome:'already_processed'}`（计数不 +1）；错误/结果 JSON 字段可机器断言。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:84-96`（`consumeApprovalToken` 对过期 `Date.now()-createdAt > APPROVAL_TTL_MS` 与已消费均 `return null`，无结构化错误码）；`plugins/huaweicloud-core/src/tools.mjs`（`runApprovedCommand` 统一抛出字符串 Error）。
- **影响**：审批流健壮性（可机器断言的超时/重复边界）缺失，客户端无法精确区分超时与重复提交。
- **证据**：`evidence/D4-24/stdout.log`（`consume 双消费返回 null(无结构化 code)`）