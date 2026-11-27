# FINDINGS — 缺陷分析清单（OpenCode-DeepSeek-V4.1-Flash-1017）

> **归档路径**：`results/OpenCode/2026-11-28-119.8.181.45/Windows/FINDINGS.md`
> **测试时间**：2026-11-28 05:20:00（东八区时间）
> **被测版本**：`huaweicloud-devkit@2.0.1-next.1`（hdk 源码 tag `v2.0.1-next.1`，HEAD `d9687a34`）
> **执行范围**：daily 精选 146（设计级 107 + 展开级 39）：PASS 128 / FAIL 11 / BLOCKED 4 / SPEC-MISMATCH 3 / NOT_RUN 0
> **执行方式**：真实执行（MCP stdio 协议、hcloud 真云 API、源码级直调验证），证据落 `evidence/<case-id>/`

---

## #1【P0】D1-39 Windows 更新检测链 `queryDistTagsSync` 返回 null 导致静默降级

- **现象**：Windows + npm 环境下 `queryDistTagsSync()` 返回 `null`，`judgeUpdate` 得出 `result=check_failed`（current=2.0.1-next.1，distTags=null），同源异步 `queryDistTagsFetch()` 能正常从 npm registry 拉取。
- **预期**：`queryDistTagsSync()` 应返回非空 `{latest,next}`；`judgeUpdate().result` 应为 `update_available|up_to_date`，而非 `check_failed`。
- **根因**：`plugins/huaweicloud-core/src/update-registry.ts:403`（queryDistTagsSync）、`:412` `spawnSync('npm ... dist-tags --json')`；`parseDistTagsOutput`（同文件 :40）解析 stdout 失败返回 null；`update-hint.ts` judgeUpdate 遇 null 即 check_failed。
- **影响**：P0，Windows/npm 用户更新通知全链路失效且静默。
- **证据**：`evidence/D1-39/stdout.log`（distTags:null, result:check_failed）。
- **状态**：待提单。

## #2【P0】D4-19 确认流程未生效：plan 未合并安全检查

- **现象**：对 `VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口执行 `huaweicloud_plan_cli_command`，`classification.decision=deny` 但 `sgFindings=[]`，确认流程未展示安全风险。
- **预期**：确认流程针对公网端口暴露应给出 `findings`，至少含一条 `severity=deny` 的公网暴露风险。
- **根因**：`plugins/huaweicloud-core/src/hcloud-plan.ts:311 planHcloudCommand` 仅做命令/写操作分类，未合并 `src/risk-rule-engine.ts` 的 `evaluateCommandRisk` 结果。
- **影响**：P0，安全预检失效，高危写操作（公网端口暴露/开放策略）绕过确认提示。
- **证据**：`evidence/D4-19/stdout.log`。
- **状态**：待提单。

## #3【P0】D10-4 风险规则库与用例契约漂移（SPEC-MISMATCH）

- **现象**：`loadRiskRules()` 实为 15 deny + 14 warn（共 29 条），用例契约要求 9 deny + 7 warn（16 条），warn 多 7 条。
- **预期**：规则 severity 数量应与契约一致（9 deny + 7 warn），否则按契约漂移处理。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增的 warn 规则（public FunctionGraph、IAM high-risk write、sandbox missing ttl 等）未同步到契约/文档。
- **影响**：P0，实现与文档契约不一致，测试预期无法判定。
- **证据**：`evidence/D10-4/stdout.log`。
- **状态**：待提单。

## #4【P1】D2-10 profile 参数以空格分隔，KooCLI 报 USE_ERROR

- **现象**：`huaweicloud_show_profile_redacted` 构造 `hcloud configure show --cli-profile default`，KooCLI 返回 `[USE_ERROR]参数 default 的格式错误（正确格式为:--param=value）`。
- **预期**：`plan.args` 应为单元素 `--cli-profile=default`，KooCLI exit 0 并返回 profile 内容。
- **根因**：`plugins/huaweicloud-core/src/packs/huaweicloud-cli/tools.ts:73` `args.push('--cli-profile', String(profile))`；同源 `src/packs/obs/tools.ts:76`。
- **影响**：P1，profile 查看/凭证自检链路在真实 KooCLI 下不可用。
- **证据**：`evidence/D2-10/stdout.log`。
- **状态**：待提单。

## #5【P1】D2-4 凭证脱敏自检因 profile 读取失败无法验证（同源 D2-10）

- **现象**：`huaweicloud_show_profile_redacted` 返回 `ok=false`（PARAM_ERROR），`--cli-profile default` 空格分隔导致 profile 解析失败；`leak=false`，未发现明文凭证。
- **预期**：`show_profile_redacted` 应 `ok=true` 返回脱敏结果且不含 AK/SK；`leak` 应为 false。
- **根因**：同 D2-10，`plugins/huaweicloud-core/src/packs/huaweicloud-cli/tools.ts:73` 参数拼接错误导致读取失败。
- **影响**：P1，凭证脱敏能力无法被实证。
- **证据**：`evidence/D2-4/stdout.log`。
- **状态**：待提单，与 D2-10 合并。

## #6【P1】D3-B3 run_readonly_command 注入无效 S1 凭证导致真实 API 校验失败

- **现象**：`huaweicloud_run_readonly_command {ECS ListServersDetails}` 返回 `ok:false, errorCode=APIGW.0301 Unauthorized`；同机直接 `hcloud ECS ListServersDetails --cli-region=cn-north-4` 返回 code=0 且可读清单。
- **预期**：KooCLI profile 已装有效凭证时，`run_readonly_command` 应执行成功并返回真实清单（ok=true）。
- **根因**：`plugins/huaweicloud-core/src/hcloud-sts.ts:34 resolveStsInjectArgs` 强制注入 `--cli-access-key/--cli-secret-key`，S1 占位/无效凭证覆盖了 KooCLI profile 的有效凭证，导致只读调用使用无效临时凭证。
- **影响**：P1，MCP 只读通道在 S1 为占位凭证的部署环境下不可用。
- **证据**：`evidence/D3-B3/stdout.log`（工具失败 + 直连成功对照）。
- **状态**：待提单。

## #7【P1】D4-8 hook 双路径判定不一致（源码 deny vs MCP hook warn）

- **现象**：同一命令 `hcloud ECS DeleteServer --server_id=abc`，`safety-policy.classifyTextCommand` 判 `deny`（write 类），`huaweicloud_hook_check_command` 返回 `warn`（destructive 规则），两路 decision 不一致。
- **预期**：同一命令经 `classifyTextCommand` 与 `hook_check_command` 两路径的 `decision` 应一致。
- **根因**：`plugins/huaweicloud-core/src/tools.ts:397` 的 hook 分支只走 `evaluateCommandRisk`，未与 `src/safety/classify-text.ts:744` 的 write/credential 分类合并取严。
- **影响**：P1，依赖 MCP hook 的客户端安全把关被绕过（删除/写入仅告警）。
- **证据**：`evidence/D4-8/stdout.log`。
- **状态**：待提单。

## #8【P1】D10-3 serviceCatalog 路由准确率 86.7% < 90% 门禁

- **现象**：`eval/prompts/eval-set-v1.csv` 15 条中文意图仅 13 条命中（86.7%），2 条未命中（EXP-E01 服务器创建、EXP-E08 ECS 调用失败解释）。
- **预期**：路由准确率 ≥ 90%（14/15）。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:20 serviceCatalog` / `:22 routeMap` / `:266` 匹配循环关键词覆盖不足（ECS 缺「服务器/实例/创建」同义词；缺「报错/异常/失败」意图词）。
- **影响**：P1，产品服务查询/故障排查意图路由落空。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`。
- **状态**：待提单。

## #9【P1】EXP-E01 服务器创建意图未命中 ECS

- **现象**：`huaweicloud_service_catalog({intent:"帮我找一台服务器，在华为云上创建，需要哪些服务"})` 返回兜底路由。
- **预期**：`recommendedServices` 应包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:22` routeMap 中 ECS 关键词缺「服务器/实例/创建」同义词。
- **影响**：P1，与 D10-3 同源。
- **证据**：`evidence/EXP-E01/stdout.log`。
- **状态**：待提单，与 D10-3 合并。

## #10【P1】EXP-E08 ECS 调用失败后的解释意图未命中 explain_error

- **现象**：`huaweicloud_service_catalog({intent:"ECS 调用失败了，帮我解释错误"})` 返回兜底路由，未命中 `explain_error`。
- **预期**：`recommendedServices`/`recommendedSkills` 应包含 explain_error/排障指引。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:22` routeMap 缺「报错/异常/失败」意图词。
- **影响**：P1，与 D10-3 同源。
- **证据**：`evidence/EXP-E08/stdout.log`。
- **状态**：待提单，与 D10-3 合并。

## #11【P1】D2-16 auth_switch import 行为契约漂移（SPEC-MISMATCH）

- **现象**：`auth_switch mode=import` 返回 `USER_CONFIRMATION_REQUIRED`，未批准前 `creds-import.json` 未被擦除（existedBefore=true, after=true）。契约由「读取后立即擦除」漂移为「审批后擦除」。
- **预期**：按现有契约，import 成功读取后应立即擦除 `creds-import.json`；若为安全改动，应同步更新契约。
- **根因**：`plugins/huaweicloud-core/src/lib/credentials.ts:79 peekImportFile`（改为只读探测）+ `src/approval-gate.ts:320`（creds-import.json 纳入保护路径）导致审批门控先于 `clearImportFile` 执行。
- **影响**：P1，安全增强下的契约漂移，自动化测试失效。
- **证据**：`evidence/D2-16/stdout.log`。
- **状态**：待提单。

## #12【P1】D9-9 initialize capabilities 未声明取消能力（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities={"tools":{"listChanged":true}}`，未声明 cancellation/cancel；设计要求取消通知 2s 内截止并返回 -32000，缺实现依据。
- **预期**：capabilities 应声明取消能力（cancellation），或删除该契约断言。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.ts:319 createDevkitMcpServer` 仅注册 tools 能力，取消能力未声明。
- **影响**：P1，客户端无法得知取消语义，与协议契约漂移。
- **证据**：`evidence/D9-9/stdout.log`。
- **状态**：待提单。

## #13【P2】D1-68 HUAWEICLOUD_REGION 未优先于 HW_REGION

- **现象**：同时设置 `HUAWEICLOUD_REGION=cn-east-3` 与 `HW_REGION=cn-north-4`，最终取 `cn-north-4`（HW_REGION 优先）。
- **预期**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credential-resolver.ts:32` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`（顺序相反）；同源 `src/auth/init-cli.ts:44`、`src/auth/codearts-context.ts:53/106`。
- **影响**：P2，多环境变量共存时默认 region 与官方文档不一致，容易误配。
- **证据**：`evidence/D1-68/stdout.log`。
- **状态**：待提单。

## #14【P2】D8-9 sanitizeValue 未移除 AK/SK/token 等敏感值

- **现象**：`sanitizeValue('market.token=abc123 password=Passw0rd 测试')` 仅去控制字符/截断，`abc123`/`Passw0rd` 原样保留；`installId` 稳定 `stable=true`。
- **预期**：`sanitizeValue` 应将 AK/SK/token/password 等键值替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts:27` 仅做控制字符替换 + 长度截断，无敏感键值模式替换。
- **影响**：P2，遥测/事件 value 可能携带敏感凭证片段。
- **证据**：`evidence/D8-9/stdout.log`。
- **状态**：待提单。

---

## 非产品缺陷 / 环境阻塞（不纳入统一缺陷单）

- **D3-C3（BLOCKED）**：DevStation 沙箱上游不可用 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败`（trace b482bcf3698d463fb461e9876bad371c）；解除条件：HDKIT 服务恢复实名查询。
- **D3-C6（BLOCKED）**：7 个沙箱工具均注册，但 `check_user` 上游 `HDKIT_UPSTREAM_ERROR`（trace 0cb758ba7b2a45a7bb6716bc64bc6897）；解除条件：HDKIT 服务恢复。
- **D3-C14（BLOCKED）**：`sandbox_credentials` 凭证校验失败（IAM 401）+ `sandbox_connect` 25s 无响应；解除条件：HDKIT 服务恢复。
- **D3-S7（BLOCKED）**：沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环；解除条件：HDKIT 恢复 + 具备 RDS 写权限凭证。

---

## 统计

| 层级 | 条目 | 数量 |
|---|---|---|
| P0 | D1-39、D4-19、D10-4(SPEC) | 3 |
| P1 | D2-10、D2-4、D3-B3、D4-8、D10-3、EXP-E01、EXP-E08、D2-16(SPEC)、D9-9(SPEC) | 9 |
| P2 | D1-68、D8-9 | 2 |
| **合计（产品缺陷/契约漂移）** | | **14** |
| 环境阻塞（不纳入缺陷单） | D3-C3、D3-C6、D3-C14、D3-S7 | 4 |