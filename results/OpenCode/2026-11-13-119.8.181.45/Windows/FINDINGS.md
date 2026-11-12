# FINDINGS — 缺陷分诊清单（OpenCode-DeepSeek-V4.1-Flash-1017）

> **生成路径**：`results/OpenCode/2026-11-13-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-13 05:35:00（北京时间）
> 被测版本：`huaweicloud-devkit@1.1.13`（源码 `hdk` @ `8a6d8be2`，tag v1.1.13）

---

## #1【P0】D1-39 Windows 更新检测链静默降级（dist-tags 数组被丢弃）

- **现象**：Windows + npm 12 环境下 `huaweicloud_check_update` / `queryDistTagsSync` 恒返回 `distTags=null`、`result=check_failed`，用户永远收不到更新提示；不报错、不抛协议错误，属静默降级。
- **断言**：`queryDistTagsSync()` 必须返回 `{latest,next}` 非空对象，`judgeUpdate` 结果不得为 `check_failed`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:86` — `parseDistTagsOutput` 显式 `Array.isArray(parsed)` 即返回 `null`；而本机 `npm view huaweicloud-devkit dist-tags --json` 实际输出为数组 `[{"latest":"1.1.13","next":"2.0.0-next.3"}]`（实测 npm 12.1.0）。
- **影响**：P0；所有 Windows/npm 12 用户更新通知失效，D1-27/D1-28/D1-31 的真实查询路径均被同一缺陷架空。
- **证据**：`evidence/D1-39/stdout.log`（含 `npmRaw` 实测输出）、`evidence/D1-41/stdout.log`（result=check_failed）
- **状态**：待提单

## #2【P0】D4-19 确认流程风险预检未生效（plan 未合并风险规则）

- **现象**：对 `VPC CreateSecurityGroupRule …remote_ip_prefix=0.0.0.0/0` + 22 端口调用 `huaweicloud_plan_cli_command`，返回 `warnings: ["Missing required parameters: …"]`、`sgFindings: []`，无 `blockedByRiskRule`、无 deny/warn finding，高危公网放通未被风险预检拦截。
- **断言**：确认流程中 `safeToRun=false` 且 findings 含 `hwc-network-public-admin-port`（deny）或等价拦截标记。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1319`（`plan_cli_command` → `planHcloudCommand`）与 `src/hcloud-cli.mjs:371` 仅做只读/写分类，未调用 `risk-rule-engine.evaluateCommandRisk` 合并风险决策。
- **影响**：P0；审批流仅拦截“写 vs 只读”，公网暴露/管理员端口等高危参数可被直接批准执行。
- **证据**：`evidence/D4-19/stdout.log`
- **状态**：待提单

## #3【P1】D2-10 profile 参数以两参数形式传递，KooCLI 报 USE_ERROR

- **现象**：`huaweicloud_show_profile_redacted` 规划命令为 `hcloud configure show --cli-profile default`，KooCLI 返回 `[USE_ERROR]参数default的格式错误,正确格式为:--param=value`。
- **断言**：`plan.args` 必须包含单参数 `--cli-profile=default`，且 KooCLI 执行无 USE_ERROR。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1988`（`args.push('--cli-profile', String(profile))`）；同类问题见 `tools.mjs:2052`。
- **影响**：P1；profile 查看/凭据诊断链路在真实 KooCLI 上不可用，凭据排障能力退化。
- **证据**：`evidence/D2-10/stdout.log`
- **状态**：待提单

## #4【P1】D3-B3 只读工具认证源选择错误：KooCLI profile 可用却返回 APIGW.0301

- **现象**：`huaweicloud_run_readonly_command {ECS ListServersDetails}` 返回 `ok:false, errorCode:APIGW.0301 Unauthorized`；同一时刻直连 `hcloud ECS ListServersDetails --cli-region=cn-north-4` 返回 `code=0`（真实实例清单）。
- **断言**：KooCLI profile 可用时，`run_readonly_command` 必须成功返回实例清单（ok=true）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1806` 使用 `resolveCredentialsWithRuntime()` 取得占位 S1 凭证，`src/hcloud-cli.mjs:300` `resolveStsInjectArgs` 将其作为 `--cli-access-key/--cli-secret-key` 注入，覆盖了本可用的 KooCLI profile。
- **影响**：P1；MCP 只读通道在“S1 为测试/占位凭证但 KooCLI profile 有效”场景全面不可用。
- **证据**：`evidence/D3-B3/stdout.log`（tool 错误 + 直连成功对照）
- **状态**：待提单

## #5【P1】D4-8 hook 双路径判定不一致（源码 deny vs MCP 工具 warn）

- **现象**：同一命令 `hcloud ECS DeleteServer --server_id=abc`，`safety-policy.classifyTextCommand` 判 `deny`（write），`huaweicloud_hook_check_command` 判 `warn`（仅 destructive 规则）。
- **断言**：两条可达路径对同一命令的 `decision` 必须一致。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1334` — `hook_check_command` 仅调用 `evaluateCommandRisk`，未走 `classifyTextCommand` 的 write/credential 分类合并。
- **影响**：P1；客户端若依赖 MCP hook 工具而非 `hooks/huaweicloud-safety.mjs`，删除类写操作只会告警、不会阻断。
- **证据**：`evidence/D4-8/stdout.log`
- **状态**：待提单

## #6【P1】D10-3 serviceCatalog 中文意图路由准确率 86.7% < 90% 门禁

- **现象**：`eval/prompts/eval-set-v1.csv` 15 条中文意图逐条路由，13 条命中，2 条落兜底（`Run hcloud --help to list available services.`）：EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」、EXP-E08「我的ECS启动失败了 帮我分析原因」。
- **断言**：路由准确率 ≥90%（≥14/15）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2298` `serviceCatalog` routeMap —— ECS 关键词含“云服务器/弹性云服务器/服务器”但缺“云主机”；诊断类（explain_error）无独立路由条目。
- **影响**：P1；中文自然语言入口对常见表述（云主机、启动失败诊断）无法激活正确 skill。
- **证据**：`evidence/D10-3/stdout.log`（含 15 条明细与 miss 列表）、`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`
- **状态**：待提单

## #7【P2】D1-68 HUAWEICLOUD_REGION 未优先于 HW_REGION

- **现象**：同时设置 `HUAWEICLOUD_REGION=cn-east-3` 与 `HW_REGION=cn-north-4` 时，`resolveCredentials().region` 取 `cn-north-4`。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225` — `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`（顺序相反）。
- **影响**：P2；多环境变量共存时默认区域与文档契约不一致。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：待提单

## #8【P2】D8-9 sanitizeValue 未脱敏 AK/SK/token 等敏感值

- **现象**：`sanitizeValue('market.token=abc123 password=Passw0rd …')` 仅去除控制字符与截断，`abc123`/`Passw0rd` 原样保留。
- **断言**：`sanitizeValue` 必须将 AK/SK/token/password 等敏感值替换为占位符。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` — 仅替换 `[\r\n\t]` 与控制长度，无敏感 pattern 替换。
- **影响**：P2；遥测/事件 value 可能携带明文凭证片段。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #9【P2】D10-4 风险规则数量契约漂移（SPEC-MISMATCH）

- **现象**：`loadRiskRules()` 实测 19 条 = 9 deny + 10 warn；用例契约要求 9 deny + 7 warn。
- **断言**：`{deny:9, warn:7}`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增了 3 条 warn 规则而未同步用例契约（新增规则本身合理，属契约文档滞后）。
- **影响**：P2；规则数量断言失效，需统一用例/文档口径。
- **证据**：`evidence/D10-4/stdout.log`
- **状态**：契约确认（非产品缺陷，建议调整用例契约）

## #10【P1】D9-9 initialize 未声明取消能力（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities={"tools":{}}`，无 `cancellation/cancel`；设计要求的“取消通知后 2s 内中止、超时 -32000”无实现依据。
- **断言**：按 capabilities 实测；不存在取消能力应标注 SPEC-MISMATCH（已标注）。实际校验：缺参调用在 0ms 内返回 `-32602`，无悬挂请求。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:50` — capabilities 仅声明 `tools`。
- **影响**：P1；客户端无法感知取消能力，长任务中断语义缺失（设计契约 vs 实现漂移）。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：契约确认

## #11【非产品缺陷】D3-C7 错误码断言与 hcloud 实际 API 行为不一致

- **现象**：`hcloud ECS ListServersDetails --server_id=nonexistent-1113` 返回 `count=1` 且 `fault: "Instance nonexistent-1113 could not be found."`，未返回用例要求的精确错误码 `Ecs.0200`。
- **说明**：区域参数断言（`--cli-region`）已通过；该差异源于 KooCLI/ECS API 对不存在 id 的返回形态，非 devkit 实现缺陷，建议【改用例】把断言改为 `fault 含 could not be found` 或改用 `ShowServer` 类接口。
- **证据**：`evidence/D3-C7/stdout.log`
- **状态**：不单独提单

## #12【非产品缺陷】EXP-E01 / EXP-E08 路由 miss（与 #6 同源）

- **现象**：两条评测意图落兜底路由。
- **说明**：与 #6（D10-3）为同一根因，合并到 #6 跟踪，不重复开单。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`
- **状态**：不单独提单