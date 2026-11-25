# FINDINGS — 缺陷分析清单（OpenCode-DeepSeek-V4.1-Flash-1017）

> **归档路径**：`results/OpenCode/2026-11-26-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-26 05:20:00（北京时间）
> **被测版本**：`huaweicloud-devkit@2.0.0-next.6`（hdk 源码 HEAD `e99b9ee8`）
> **执行范围**：daily 精选 146（设计级 107 + 展开级 39）；PASS 128 / FAIL 11 / BLOCKED 4 / SPEC-MISMATCH 3 / NOT_RUN 0
> **执行方式**：真实执行（MCP stdio 协议、hcloud 真机 API、源码级直调），证据落 `evidence/<case-id>/`

---

## #1【P0】D1-39 Windows 升级检测链 queryDistTagsSync 返回 null 导致静默降级

- **现象**：Windows + npm 环境下 `queryDistTagsSync()` 返回 `null`，`judgeUpdate` 得出 `result=check_failed`（current=2.0.0-next.6, distTags=null）；同源异步 `queryDistTagsFetch()` 能被 npm registry 正常返回。
- **断言**：`queryDistTagsSync()` 应返回非空 `{latest,next}`，`judgeUpdate().result` 应为 `update_available|up_to_date`，不得为 `check_failed`。
- **根因**：`plugins/huaweicloud-core/src/update-registry.ts:403`（queryDistTagsSync）→ `:412` `spawnSync('npm ... dist-tags --json')`；`parseDistTagsOutput`（同文件 :40 附近）空 stdout 即返回 null，`update-hint.ts` judgeUpdate 将 null 判 check_failed。
- **影响**：P0；Windows/npm 用户升级通知全链路失效并静默。
- **证据**：`evidence/D1-39/stdout.log`（distTags:null，result:check_failed）。
- **状态**：待提单

## #2【P0】D4-19 确认流安全预检未生效，plan 未合并安全结论

- **现象**：对 `VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口执行 `huaweicloud_plan_cli_command`，`classification.decision=deny` 但 `sgFindings=[]`，确认流程未展示安全风险。
- **断言**：确认流对公网管理端口暴露应输出 `findings`，至少含一条 `severity=deny` 的公开暴露结论。
- **根因**：`plugins/huaweicloud-core/src/hcloud-plan.ts:311 planHcloudCommand` 仅做读/写分类，未合并 `src/risk-rule-engine.ts` 的 `evaluateCommandRisk` 结果。
- **影响**：P0；安全预检失效，高危写操作（管理端口暴露/公网开放）绕过确认提示。
- **证据**：`evidence/D4-19/stdout.log`。
- **状态**：待提单

## #3【P0】D10-4 风控规则库数量与用例契约漂移（SPEC-MISMATCH）

- **现象**：`loadRiskRules()` 实测 15 deny + 14 warn（共 29 条）；用例契约要求 9 deny + 7 warn（16 条），warn 多 7 条。
- **断言**：规则库 severity 计数应与契约一致（9 deny + 7 warn），否则视为契约漂移。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增多条 warn 规则（public FunctionGraph、IAM high-risk write、sandbox missing ttl 等）但未同步契约/文档。
- **影响**：P0；实现与文档契约不一致，风控预期无法判定。
- **证据**：`evidence/D10-4/stdout.log`。
- **状态**：待提单

## #4【P1】D2-10 profile 参数以空格分隔，KooCLI 报 USE_ERROR

- **现象**：`huaweicloud_show_profile_redacted` 生成命令 `hcloud configure show --cli-profile default`，KooCLI 返回 `[USE_ERROR]参数 default 的格式错误，正确格式为:--param=value`。
- **断言**：`plan.args` 应为单元素 `--cli-profile=default`，KooCLI exit 0 并返回 profile 内容。
- **根因**：`plugins/huaweicloud-core/src/packs/huaweicloud-cli/tools.ts:73` `args.push('--cli-profile', String(profile))`；同源 `src/packs/obs/tools.ts:76`。
- **影响**：P1；profile 查看/凭证自检链路在真实 KooCLI 下不可用。
- **证据**：`evidence/D2-10/stdout.log`。
- **状态**：待提单

## #5【P1】D2-4 凭证脱敏用例因 profile 读取失败无法验证（同源 D2-10）

- **现象**：`huaweicloud_show_profile_redacted` 返回 `ok=false`（PARAM_ERROR，`--cli-profile default` 空格分隔），无 profile 输出；`leak=false`（未发现明文凭证）。
- **断言**：`show_profile_redacted` 应 `ok=true` 且输出不含明文 AK/SK；`leak` 必须为 false。
- **根因**：与 D2-10 同源，`plugins/huaweicloud-core/src/packs/huaweicloud-cli/tools.ts:73` 参数拼接错误导致读取失败。
- **影响**：P1；脱敏能力无法被实测证明。
- **证据**：`evidence/D2-4/stdout.log`。
- **状态**：待提单（与 D2-10 合并）

## #6【P1】D3-B3 run_readonly_command 注入无效 S1 凭证导致真实 API 校验失败

- **现象**：`huaweicloud_run_readonly_command {ECS ListServersDetails}` 返回 `ok:false, errorCode=APIGW.0301 Unauthorized`；同参数直连 `hcloud ECS ListServersDetails --cli-region=cn-north-4` 返回 code=0 且可读清单。
- **断言**：KooCLI profile 安装有效凭证时，`run_readonly_command` 应执行成功并返回真实清单（ok=true）。
- **根因**：`plugins/huaweicloud-core/src/hcloud-sts.ts:34 resolveStsInjectArgs` 强制注入 `--cli-access-key/--cli-secret-key`（S1 占位/无效），覆盖 KooCLI profile 有效凭证；run_readonly 调用点使用运行时凭证解析。
- **影响**：P1；MCP 只读通道在 S1 为占位凭证的部署环境下不可用。
- **证据**：`evidence/D3-B3/stdout.log`（工具失败 + 直连成功对照）。
- **状态**：待提单

## #7【P1】D4-8 hook 双路径判定不一致，源码 deny vs MCP hook warn

- **现象**：同一命令 `hcloud ECS DeleteServer --server_id=abc`，`safety-policy.classifyTextCommand` 判 `deny`（write 类），`huaweicloud_hook_check_command` 返回 `warn`（destructive 规则），两路径 decision 不一致。
- **断言**：同一命令经 `classifyTextCommand` 与 `hook_check_command` 两路径的 `decision` 必须一致。
- **根因**：`plugins/huaweicloud-core/src/tools.ts:397` 的 hook 分支仅走 `evaluateCommandRisk`，未与 `src/safety/classify-text.ts:744` 的 write/credential 分类合并取严。
- **影响**：P1；依赖 MCP hook 的客户端安全门控被绕过（删除/写操作仅告警）。
- **证据**：`evidence/D4-8/stdout.log`。
- **状态**：待提单

## #8【P1】D10-3 serviceCatalog 路由准确率 86.7% < 90% 门禁

- **现象**：`eval/prompts/eval-set-v1.csv` 15 条中文意图中 13 条命中（86.7%），2 条未命中（EXP-E01 云主机采购、EXP-E08 ECS 创建失败解释）。
- **断言**：路由准确率 ≥ 90%（≥14/15）。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:20 serviceCatalog` / `:22 routeMap` / `:266` 匹配循环关键词覆盖不足（ECS 缺“服务器/实例/主机”同义词；缺“解释/纠错/失败”意图）。
- **影响**：P1；云服务查询/故障排查意图路由落空。
- **证据**：`evidence/D10-3/stdout.log`；`evidence/EXP-E01/stdout.log`；`evidence/EXP-E08/stdout.log`。
- **状态**：待提单

## #9【P1】EXP-E01 云主机采购类意图未命中 ECS

- **现象**：`huaweicloud_service_catalog({intent:"我想买一台云主机……在华为云上有哪些服务器"})` 返回兜底路由。
- **断言**：`recommendedServices` 应包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:22` routeMap 的 ECS 关键词缺少“服务器/实例/主机”同义词。
- **影响**：P1；与 D10-3 同源。
- **证据**：`evidence/EXP-E01/stdout.log`。
- **状态**：待提单（与 D10-3 合并）

## #10【P1】EXP-E08 ECS 创建失败后纠错意图未命中 explain_error

- **现象**：`huaweicloud_service_catalog({intent:"ECS 创建失败，帮我解释错误"})` 返回兜底路由，未命中 `explain_error`。
- **断言**：`recommendedServices`/`recommendedSkills` 应包含 explain_error/纠错工具。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:22` routeMap 缺“解释/纠错/失败”意图词。
- **影响**：P1；与 D10-3 同源。
- **证据**：`evidence/EXP-E08/stdout.log`。
- **状态**：待提单（与 D10-3 合并）

## #11【P1】D2-16 auth_switch import 擦除契约漂移（SPEC-MISMATCH）

- **现象**：`auth_switch mode=import` 返回 `USER_CONFIRMATION_REQUIRED`，未批准前 `creds-import.json` 未被擦除（existedBefore=true, after=true）；契约由“读取即擦除”漂移为“审批后擦除”。
- **断言**：按用例契约，import 成功读取后应立即擦除 `creds-import.json`；若改为审批后擦除，用例契约需同步更新。
- **根因**：`plugins/huaweicloud-core/src/lib/credentials.ts:80 peekImportFile`（无副作用读取）+ `src/approval-gate.ts:320`（creds-import.json 属受保护路径）；擦除改由执行路径 `clearImportFile` 触发。
- **影响**：P1；安全增强导致的契约漂移，自动化断言失效。
- **证据**：`evidence/D2-16/stdout.log`。
- **状态**：待提单

## #12【P1】D9-9 initialize capabilities 未声明取消能力（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities={"tools":{"listChanged":true}}`，未声明 cancellation/cancel；设计要求取消通知 2s 内终止并返回 -32000，缺实现依据。
- **断言**：capabilities 应声明取消能力（cancellation），或用例契约应删除该断言。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.ts:319 createDevkitMcpServer` 仅注册 tools 能力，取消能力未声明。
- **影响**：P1；客户端无法感知取消能力，协议契约漂移。
- **证据**：`evidence/D9-9/stdout.log`。
- **状态**：待提单

## #13【P2】D1-68 HUAWEICLOUD_REGION 未优先于 HW_REGION

- **现象**：同时设置 `HUAWEICLOUD_REGION=cn-east-3` 与 `HW_REGION=cn-north-4`，解析结果取 `cn-north-4`（HW_REGION 优先）。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credential-resolver.ts:32` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`（顺序相反）；同源 `src/auth/init-cli.ts:44`、`src/auth/codearts-context.ts:53/106`。
- **影响**：P2；多环境变量共存时默认 region 与官方文档不一致，易连错区域。
- **证据**：`evidence/D1-68/stdout.log`。
- **状态**：待提单

## #14【P2】D8-9 sanitizeValue 未移除 AK/SK/token 等敏感值

- **现象**：`sanitizeValue('market.token=abc123 password=Passw0rd 测试')` 仅去控制字符/截断，`abc123`/`Passw0rd` 原样保留；`installId` 稳定 `stable=true`。
- **断言**：`sanitizeValue` 应将 AK/SK/token/password 等键值替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts:27` 仅控制字符替换 + 长度截断，无敏感值模式替换。
- **影响**：P2；遥测/事件 value 可能携带敏感凭证片段。
- **证据**：`evidence/D8-9/stdout.log`。
- **状态**：待提单

---

## 非产品缺陷 / 环境阻塞（不纳入统一缺陷单）

- **D3-C3（BLOCKED）**：DevStation 沙箱上游不可用 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败`；解除条件：HDKIT 服务恢复实名查询。
- **D3-C6（BLOCKED）**：7 个沙箱工具均已注册，但 `check_user` 上游 `HDKIT_UPSTREAM_ERROR`；解除条件：HDKIT 服务恢复。
- **D3-C14（BLOCKED）**：`sandbox_credentials` 凭证校验失败（IAM 401）+ `sandbox_connect` 25s 无响应；解除条件：HDKIT 服务恢复。
- **D3-S7（BLOCKED）**：沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环；解除条件：HDKIT 恢复 + 具备 RDS 写权限凭证。

---

## 统计

| 级别 | 项目 | 数量 |
|---|---|---|
| P0 | D1-39、D4-19、D10-4(SPEC) | 3 |
| P1 | D2-10、D2-4、D3-B3、D4-8、D10-3、EXP-E01、EXP-E08、D2-16(SPEC)、D9-9(SPEC) | 9 |
| P2 | D1-68、D8-9 | 2 |
| **合计（产品缺陷/契约漂移）** | | **14** |
| 环境阻塞（不纳入缺陷单） | D3-C3、D3-C6、D3-C14、D3-S7 | 4 |