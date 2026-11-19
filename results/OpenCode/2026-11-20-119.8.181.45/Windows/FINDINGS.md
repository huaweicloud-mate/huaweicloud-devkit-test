# FINDINGS — 缺陷发现清单（OpenCode-DeepSeek-V4.1-Flash-1017）

> **落盘路径**：`results/OpenCode/2026-11-20-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-20 05:20:00（北京时间）
> **被测版本**：huaweicloud-devkit 1.1.14（npm latest 正式版；hdk 源码 commit bd985051）
> **客户端 / OS**：OpenCode + DeepSeek-V4.1-Flash-1017 / Windows Server 2022
> **执行包**：146 用例 = 设计级 107 + 展开级 39（P0 21 / P1 95 / P2 30）

## #1【P0】D1-39 Windows 升级检测链 dist-tags 解析失败导致静默降级

- **现象**：Windows + npm 环境下 `huaweicloud_check_update` 的 `queryDistTagsSync()` 返回 `distTags=null`，`judgeUpdate` 判定 `result=check_failed`；用户侧表现为「检测失败、不影响使用」，新版本提示丢失（本次 current=1.1.14，latest 实为 1.1.14）。
- **断言**：`dist-tags --json` 输出非空时 `queryDistTagsSync()` 必须返回 `{latest,next}` 非空对象，`judgeUpdate().result` 必须为 `update_available|up_to_date` 之一，不得为 `check_failed`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:81-86`（`parseDistTagsOutput()` 对 `npm.cmd` 包装输出前置 banner 解析失败返回 `null`）；`update-check.mjs:116/120` 据此返回 `check_failed`。
- **影响**：P0。Windows/npm 用户升级通知全链路失效；D1-27/D1-28/D1-31/D1-41 走同一查询路径，存在一并被掩盖风险。
- **证据**：`evidence/D1-39/stdout.log`（含 `distTags:null`、`result=check_failed` 实测结果）
- **状态**：历史问题（关联单见 HISTORY_LINKS.md）

## #2【P0】D4-19 确认流程风险预检未生效：plan 未合并风险裁定

- **现象**：对 `VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口调用 `huaweicloud_plan_cli_command`，返回 `safeToRun=false` 仅因 write 分类，`sgFindings=[]`、未返回 `blockedByRiskRule` 或 deny/warn 级风险 finding。
- **断言**：确认流程中 `safeToRun=false` 时 `findings` 必须包含 `hwc-network-public-admin-port`（severity=deny）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1349`（`plan_cli_command` 调 `planHcloudCommand`），`src/hcloud-cli.mjs:371` 只做只读/写操作分类，未调用 `risk-rule-engine.evaluateCommandRisk` 合并裁定。
- **影响**：P0。安全防线失效——端口暴露/管理员端口等高危写操作可直接进入确认执行。
- **证据**：`evidence/D4-19/stdout.log`
- **状态**：历史问题

## #3【P1】D2-10 profile 参数以空格分隔两参数形式传入，KooCLI 报 USE_ERROR

- **现象**：`huaweicloud_show_profile_redacted` 规划命令为 `hcloud configure show --cli-profile default`，KooCLI 返回 `[USE_ERROR]参数 default 的格式错误,正确格式为:--param=value`。
- **断言**：`plan.args` 必须为单个元素 `--cli-profile=default`，KooCLI 执行退出码 0。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2048`（`args.push('--cli-profile', String(profile))`，同源 `tools.mjs:2112`）。
- **影响**：P1。profile 查看/凭证自检链路在真实 KooCLI 下不可用，凭证问题定位受阻。
- **证据**：`evidence/D2-10/stdout.log`
- **状态**：历史问题

## #4【P1】D4-8 hook 双路径判定不一致（源码 deny vs MCP 工具 warn）

- **现象**：同一命令 `hcloud ECS DeleteServer --server_id=abc`：`safety-policy.classifyTextCommand` 判 `deny`（write 类），`huaweicloud_hook_check_command` 判 `warn`（destructive 规则），两条路径严重级别不同。
- **断言**：同一命令在 `classifyTextCommand` 与 `hook_check_command` 两条路径上的 `decision` 必须一致。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1363-1364`（`hook_check_command` 仅调 `evaluateCommandRisk`，未与 `classifyTextCommand` 的 write/credential 分类合并）。
- **影响**：P1。客户端依赖 MCP hook 工具做安全门，删除/写操作仅告警不拦截，本地保护被削弱。
- **证据**：`evidence/D4-8/stdout.log`
- **状态**：历史问题

## #5【P1】D10-3 serviceCatalog 意图路由准确率 86.7% < 90% 门禁

- **现象**：`eval/prompts/eval-set-v1.csv` 15 条中文意图逐条路由，13 条命中、2 条落兜底：EXP-E01（查北京四云主机，未命中 ECS）、EXP-E08（ECS 启动失败求分析，未命中 explain_error）。
- **断言**：路由准确率 ≥ 90%（即 ≥14/15）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2360`（`routeMap`）/`tools.mjs:2589`（遍历匹配）——ECS 关键词表缺「云主机/实例」同义项，缺排查类（explain_error）意图词。
- **影响**：P1。自然语言入口在常见查询/排障表达上频繁落兜底，用户无法直达正确 skill。
- **证据**：`evidence/D10-3/stdout.log`（15 条明细含 miss 列表）、`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`
- **状态**：历史问题

## #6【P1】D9-9 initialize capabilities 未声明取消能力（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities={"tools":{}}`，未声明 `cancellation/cancel`；用例要求的「取消通知 2s 内终止并返回 -32000」缺少实现依据（实测滞后请求 0ms 返回 -32602）。
- **断言**：capabilities 实测结果 `{"tools":{}}`；设计要求取消能力应在 capabilities 中声明，否则标 SPEC-MISMATCH。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:60`（capabilities 仅含 `tools`）。
- **影响**：P1。客户端无法感知取消能力，长任务中断依赖缺失（设计契约 vs 实现漂移）。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：历史问题（契约确认）

## #7【P2】D1-68 HUAWEICLOUD_REGION 未优先于 HW_REGION

- **现象**：同时设置 `HUAWEICLOUD_REGION=cn-east-3` 与 `HW_REGION=cn-north-4` 时，`resolveCredentials().region` 取 `cn-north-4`（HW_REGION 抢先）。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225`（`let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`，顺序相反；同源 `:173`、`:339`）。
- **影响**：P2。多环境并行时默认区域与官方变量约定不一致，跨区域误操作风险。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：历史问题

## #8【P2】D8-9 sanitizeValue 未移除 AK/SK/token 敏感值

- **现象**：`sanitizeValue('market.token=abc123 password=Passw0rd …')` 仅去除控制字符并截断，`abc123`/`Passw0rd` 原样保留；`installId` 稳定（stable=true）但敏感值未脱敏。
- **断言**：`sanitizeValue` 应将 AK/SK/token/password 等键值替换为占位符（如 `<redacted>`）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197`（仅替换 `[\r\n\t]` 并裁长度，无 pattern 级脱敏）。
- **影响**：P2。遥测/事件 value 可能携带明文凭证片段。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史问题

## #9【非产品缺陷】D3-C7 只读子账号认证失败，错误码断言无法验证

- **现象**：`hcloud ECS ListServersDetails --server_id=nonexistent-1113`（注入 test001 只读凭证）返回 `APIGW.0301 Incorrect IAM authentication information: Unauthorized` + `[USE_ERROR]缺少必填参数:project_id`，未返回用例期望的 `Ecs.0200` 业务错误码。
- **说明**：本机只读子账号 test001 与 KooCLI profile 凭证今日均认证失败（APIGW.0301），无法区分为凭证失效还是用例断言过窄；非产品缺陷，已按 BLOCKED 记录。解除条件：下发有效只读 AK/SK 后复测。
- **证据**：`evidence/D3-C7/stdout.log`
- **状态**：非产品缺陷（环境凭证阻塞）

## #10【非产品缺陷】D10-4 规则库计数与用例契约漂移（SPEC-MISMATCH）

- **现象**：`loadRiskRules()` 实为 19 条 = 9 deny + 10 warn，用例契约要求 9 deny + 7 warn（warn 多 3 条）。
- **说明**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增 3 条 warn 规则但未同步用例契约/文档。属契约需对齐（用例侧或文档侧更新），非功能缺陷，不单独提单。
- **证据**：`evidence/D10-4/stdout.log`
- **状态**：契约确认，不重复提单

## #11【非产品缺陷】EXP-E01 / EXP-E08 路由 miss，与 #5 同源

- **现象/说明**：两条展开级意图落 serviceCatalog 兜底路由，并入 #5（D10-3）统一跟踪，避免重复开单。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`
- **状态**：非产品缺陷（并入 #5）

---

## 汇总

| 级别 | 条目 | 用例 |
|---|---|---|
| P0 | 2 | D1-39、D4-19 |
| P1 | 3（产品） | D2-10、D4-8、D10-3（含 EXP-E01/E08，并入） |
| P1 | 1（契约） | D9-9（SPEC-MISMATCH） |
| P2 | 2 | D1-68、D8-9 |
| 非产品缺陷 / 契约确认 / 环境 | 3 | D3-C7（凭证阻塞）、D10-4（契约漂移）、EXP-E01·EXP-E08（并入 D10-3） |

**今日新增产品缺陷：0 项**（9 条 FAIL 与 2 条 SPEC-MISMATCH 全部命中历史单，属复核，见 HISTORY_LINKS.md）。

**环境阻塞（BLOCKED，15 条，不计缺陷）**：D3-B3、D3-C1、D3-C2、D3-C3、D3-C6、D3-C7、D3-C14、D3-S2、D3-S3、D3-S6、D3-S7、D4-13、EXP-C4-01、EXP-C4-04、EXP-C4-06。
真实根因（两类，均已实际发起调用并留存拒绝证据，云端零残留）：
1. **本机云凭证失效**：S1 全局凭证库为占位值（AK_BK_00000000000000）、KooCLI profile（test001）与只读子账号注入均被 IAM 拒绝 `APIGW.0301 Unauthorized`；写操作另受 `Pdp.0001` 权限拒绝。→ D3-B3、D3-C1、D3-S2、D3-C7、D4-13、EXP-C4-01、EXP-C4-04、EXP-C4-06。
2. **外部依赖不可用**：DevStation 沙箱上游 `HDKIT_UPSTREAM_ERROR / 25s 无响应`（D3-C3、D3-C6、D3-C14、D3-S3、D3-S7）；本机无 `obsutil` 可执行文件（D3-C2）；D3-S6 创建参数不全无法闭环。

**资源归零**：本轮所有真云调用均在创建前被 IAM 拒绝（ECS CreateServers / VPC CreateVpc / RDS / CCE），按名复检 0 台/0 个；未创建任何资源，无需销毁，云端零残留。