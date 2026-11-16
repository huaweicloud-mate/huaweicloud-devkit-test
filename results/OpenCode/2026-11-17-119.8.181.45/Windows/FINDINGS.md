# FINDINGS — 缺陷分析清单（OpenCode-DeepSeek-V4.1-Flash-1017）

> **归档路径**：`results/OpenCode/2026-11-17-119.8.181.45/Windows/FINDINGS.md`
> **发现时间**：2026-11-17 05:16:00（北京时间）
> 被测版本：`huaweicloud-devkit@1.1.14`（npm 全局安装版本，源码仓 `hdk` @ `bd985051`）
> 执行范围：daily 精选 146 条（设计级 107 + 展开级 39）；PASS 121 / FAIL 11 / BLOCKED 12 / SPEC-MISMATCH 2 / NOT_RUN 0

---

## #1【P0】D1-39 Windows 升级检测链 dist-tags 解析失败导致静默降级

- **描述**：Windows + npm 12 环境下 `huaweicloud_check_update` 的 `queryDistTagsSync()` 返回 `distTags=null`，`judgeUpdate` 判定 `result=check_failed`；实测 `npm view huaweicloud-devkit dist-tags --json` 输出为 `{"latest":"1.1.14","next":"1.1.14-next.5"}`，非空，但用户侧表现为「检测失败、不影响使用」，新版本提示丢失。
- **断言**：在 npm 12 下 `dist-tags --json` 解析成功时，`queryDistTagsSync()` 必须返回 `{latest,next}` 非空对象，`judgeUpdate().result` 必须为 `update_available|up_to_date` 之一，不得为 `check_failed`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:81-86`（`parseDistTagsOutput()` 对 `npm.cmd` 包装输出前置 banner 解析失败返回 `null`）；`update-check.mjs:116/120` 据此返回 `check_failed`。
- **影响**：P0。Windows/npm 12 用户升级通知全链路失效；D1-27/D1-28/D1-31/D1-41 走同一查询路径，存在一并被掩盖风险。
- **证据**：`evidence/D1-39/stdout.log`（含 `npmRaw` 实测与 `distTags:null` 结果）
- **状态**：历史问题（历史单号见 HISTORY_LINKS.md）

## #2【P0】D4-19 确认流程风险预检未生效：plan 未合并风险裁定

- **描述**：对 `VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口调用 `huaweicloud_plan_cli_command`，未返回 `blockedByRiskRule` 或 deny/warn 级 finding，风险语义直接进入确认流程，未确认前缺少风险提示。
- **断言**：确认流程中 `safeToRun=false` 时 `findings` 必须包含 `hwc-network-public-admin-port`（severity=deny）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1348`（`plan_cli_command` 调 `planHcloudCommand`），`src/hcloud-cli.mjs:371` 只做只读/写操作分类，未调用 `risk-rule-engine.evaluateCommandRisk` 合并裁定。
- **影响**：P0。安全防线失效——端口暴露/管理员端口等高危写操作可直接进入确认执行。
- **证据**：`evidence/D4-19/stdout.log`
- **状态**：历史问题

## #3【P1】D2-10 profile 参数以空格分隔两参数形式传入，KooCLI 报 USE_ERROR

- **描述**：`huaweicloud_show_profile_redacted` 规划命令为 `hcloud configure show --cli-profile default`，KooCLI 返回 `[USE_ERROR]参数 default 的格式错误,正确格式为:--param=value`。
- **断言**：`plan.args` 必须为单个元素 `--cli-profile=default`，KooCLI 执行退出码 0。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2048`（`args.push('--cli-profile', String(profile))`，同源 `tools.mjs:2112`）。
- **影响**：P1。profile 查看/凭证自检链路在真实 KooCLI 下不可用，凭证问题定位受阻。
- **证据**：`evidence/D2-10/stdout.log`
- **状态**：历史问题

## #4【P1】D3-B3 只读凭证来源选择错误：管理注册占位凭证覆盖有效 KooCLI profile

- **描述**：`huaweicloud_run_readonly_command {ECS ListServersDetails}` 返回 `ok:false, errorCode=APIGW.0301 Unauthorized`；同一时刻直连 `hcloud ECS ListServersDetails --cli-region=cn-north-4` 返回 `code=0`，证明清单可读。
- **断言**：KooCLI profile 存在有效委托凭证时，`run_readonly_command` 必须执行成功并返回真实清单（ok=true）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1836` 使用 `resolveCredentialsWithRuntime()` 取到占位 S1 凭证；`src/hcloud-cli.mjs:300`（`resolveStsInjectArgs`）强制以 `--cli-access-key/--cli-secret-key` 注入，覆盖了本机可用 KooCLI profile。
- **影响**：P1。MCP 只读通道对 S1 为占位/非本机凭证的部署全部不可用。
- **证据**：`evidence/D3-B3/stdout.log`（工具失败 + 直连成功对照）
- **状态**：历史问题

## #5【P1】D4-8 hook 双路径判定不一致（源码 deny vs MCP 工具 warn）

- **描述**：同一命令 `hcloud ECS DeleteServer --server_id=abc`：`safety-policy.classifyTextCommand` 判 `deny`（write 类），`huaweicloud_hook_check_command` 判 `warn`（destructive 规则），两条路径严重级别不同。
- **断言**：同一命令在 `classifyTextCommand` 与 `hook_check_command` 两条路径上的 `decision` 必须一致。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1363`（`hook_check_command` 仅调 `evaluateCommandRisk`，未与 `classifyTextCommand` 的 write/credential 分类合并）。
- **影响**：P1。客户端依赖 MCP hook 工具做安全门，删除/写操作仅告警不拦截，本地保护被削弱。
- **证据**：`evidence/D4-8/stdout.log`
- **状态**：历史问题

## #6【P1】D10-3 serviceCatalog 意图路由准确率 86.7% < 90% 门禁

- **描述**：`eval/prompts/eval-set-v1.csv` 15 条中文意图逐条路由，13 条命中、2 条落兜底（`Run hcloud --help to list available services.`）：EXP-E01（查北京四云主机，未命中 ECS）、EXP-E08（ECS 启动失败求分析，未命中 explain_error）。
- **断言**：路由准确率 ≥ 90%（即 ≥14/15）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2358`（`serviceCatalog`）/`:2360`（`routeMap`）——ECS 关键词表缺「云主机/实例」同义项，缺排查类（explain_error）意图词。
- **影响**：P1。自然语言入口在常见查询/排障表达上频繁落兜底，用户无法直达正确 skill。
- **证据**：`evidence/D10-3/stdout.log`（15 条明细含 miss 列表）、`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`
- **状态**：历史问题

## #7【P1】D9-9 initialize capabilities 未声明取消能力（SPEC-MISMATCH）

- **描述**：`initialize` 返回 `capabilities={"tools":{}}`，未声明 `cancellation/cancel`；用例要求的「取消通知 2s 内终止并返回 -32000」缺少实现依据。实测校验：缺 notification 立即 0ms 返回 `-32602`，无滞后请求。
- **断言**：capabilities 实测结果 `{"tools":{}}`；设计要求取消能力应在 capabilities 中声明，否则标 SPEC-MISMATCH。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:60`（capabilities 仅含 `tools`）。
- **影响**：P1。客户端无法感知取消能力，长任务中断依赖缺失（设计契约 vs 实现漂移）。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：历史问题（契约确认）

## #8【P2】D1-68 HUAWEICLOUD_REGION 未优先于 HW_REGION

- **描述**：同时设置 `HUAWEICLOUD_REGION=cn-east-3` 与 `HW_REGION=cn-north-4` 时，`resolveCredentials().region` 取 `cn-north-4`（HW_REGION 抢先）。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225`（`let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`，顺序相反；同源 `:173`、`:339`）。
- **影响**：P2。多环境并行时默认区域与官方变量约定不一致，跨区域误操作风险。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：历史问题

## #9【P2】D8-9 sanitizeValue 未移除 AK/SK/token 敏感值

- **描述**：`sanitizeValue('market.token=abc123 password=Passw0rd …')` 仅去除控制字符并截断，`abc123`/`Passw0rd` 原样保留；`installId` 稳定（stable=true）但敏感值未脱敏。
- **断言**：`sanitizeValue` 应将 AK/SK/token/password 等键值替换为占位符（如 `<redacted>`）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197`（仅替换 `[\r\n\t]` 并裁长度，无 pattern 级脱敏）。
- **影响**：P2。遥测/事件 value 可能携带明文凭证片段。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史问题

## #10【非产品缺陷】D3-C7 外源 hcloud 实例查询返回非唯一错误码

- **描述**：`hcloud ECS ListServersDetails --server_id=nonexistent-1113` 返回 `count=1` 且 `fault: "Instance nonexistent-1113 could not be found."`，未如用例预期返回精确错误码 `Ecs.0200`。
- **说明**：属外源行为（KooCLI/ECS API 对不存在 id 的返回形态不由 devkit 控制），非产品缺陷。用例建议：断言改为 `fault contains "could not be found"` 或改用 `ShowServer` 接口。
- **证据**：`evidence/D3-C7/stdout.log`
- **状态**：非产品缺陷，不重复提单

## #11【非产品缺陷】D10-4 规则库计数与用例契约漂移（SPEC-MISMATCH）

- **描述**：`loadRiskRules()` 实为 19 条 = 9 deny + 10 warn，用例契约要求 9 deny + 7 warn（warn 多 3 条）。
- **说明**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增 3 条 warn 规则但未同步用例契约/文档。属契约需对齐（用例侧或文档侧更新），非功能缺陷，不单独提单。
- **证据**：`evidence/D10-4/stdout.log`
- **状态**：契约确认，不重复提单

## #12【非产品缺陷】EXP-E01 / EXP-E08 路由 miss，与 #6 同源

- **描述**：两条展开级意图落 serviceCatalog 兜底路由。
- **说明**：并入 #6（D10-3）统一跟踪，避免重复开单。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`
- **状态**：非产品缺陷（并入 #6）

---

## 汇总

| 级别 | 条目 | 用例 |
|---|---|---|
| P0 | 2 | D1-39、D4-19 |
| P1 | 5 | D2-10、D3-B3、D4-8、D10-3（含 EXP-E01/E08）、D9-9 |
| P2 | 2 | D1-68、D8-9 |
| 非产品缺陷 / 契约确认 | 3 | D3-C7、D10-4、EXP-E01·EXP-E08（并入 #6） |

**环境阻塞（BLOCKED，不计缺陷）**：12 条——D3-C1、D3-C2、D3-S2、D3-S4、D3-S6、D3-S7、D3-C3、D3-C6、D3-C14、D3-S3、EXP-C4-01、EXP-C4-04。真实根因：本机唯一可用凭证为只读 IAM 子账号 test001（写操作 Pdp.0001），S1 为占位凭证（APIGW.0301），DevStation 沙箱上游 HDKIT_UPSTREAM_ERROR，缺 obsutil 可执行文件，代金券接口 AK 限流。均已实际发起 API 调用并留存拒绝证据，云端零残留（ECS count=0）。