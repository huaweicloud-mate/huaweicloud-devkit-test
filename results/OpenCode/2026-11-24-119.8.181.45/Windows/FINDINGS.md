# FINDINGS — 缺陷发现清单（OpenCode-DeepSeek-V4.1-Flash-1017）

> **归档路径**：`results/OpenCode/2026-11-24-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-24 05:30:00（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.15`（hdk 源码 HEAD `bf79b643`，release-1.1.15）
> **执行范围**：daily 精选 146（设计级 107 + 展开级 39）；PASS 128 / FAIL 10 / BLOCKED 6 / SPEC-MISMATCH 2 / NOT_RUN 0
> **执行方式**：真实执行——MCP stdio 协议、hcloud 真机 API、源码级直调；证据落盘 `evidence/<case-id>/`

---

## #1【P0】D1-39 Windows 升级检测链 queryDistTagsSync 返回 null 导致静默降级

- **现象**：Windows + npm 环境下 `queryDistTagsSync()` 返回 `null`，`judgeUpdate` 得出 `result=check_failed`；同一时刻 `queryDistTagsFetch()` 与 `npm view ... dist-tags --json` 均能返回 `{latest:1.1.15,next:1.1.15-next.2}`。
- **断言**：`queryDistTagsSync()` 在 npm dist-tags 可用时应返回 `{latest,next}` 非空，`judgeUpdate().result` 应为 `update_available|up_to_date`，不得为 `check_failed`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:370-385`（`queryDistTagsSync` 以 `spawnSync('npm.cmd', …, {shell:true})` 执行，Windows 下返回非 0/空 stdout → `parseDistTagsOutput` `:84` 判空返回 null）；同源异步实现 `:392` 正常。
- **影响**：P0，Windows/npm 用户升级通知全链路失效（静默 check_failed）。
- **证据**：`evidence/D1-39/stdout.log`（`distTags:null`、`result:check_failed`、`npmRaw` 为空）。
- **状态**：待提交（纳入统一缺陷单）

## #2【P0】D4-19 确认流程风险预检未生效，plan 未合并安全裁决

- **现象**：对 `VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` + 22 端口执行 `huaweicloud_plan_cli_command`，`classification.decision=deny` 但 `sgFindings=[]`，未生成 deny 级的安全 finding，确认流程未提示风险。
- **断言**：确认流程遇到 `hwc-network-public-admin-port` 时 `findings` 必须包含 `severity=deny` 的规则命中。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1428`（`plan_cli_command` 直接调用 `planHcloudCommand`），而 `plugins/huaweicloud-core/src/hcloud-cli.mjs:371`（`planHcloudCommand` 仅做只读/写分类，未合并 `risk-rule-engine.evaluateCommandRisk`）。
- **影响**：P0，安全预检失效，高危写操作（端口暴露/管理端口）可绕过确认提示。
- **证据**：`evidence/D4-19/stdout.log`。
- **状态**：待提交（纳入统一缺陷单）

## #3【P1】D2-10 profile 参数以空格分隔传入，KooCLI 报 USE_ERROR

- **现象**：`huaweicloud_show_profile_redacted` 规划命令为 `hcloud configure show --cli-profile default`，KooCLI 返回 `[USE_ERROR]参数 default 的格式错误,正确格式为:--param=value`。
- **断言**：`plan.args` 应包含单元素 `--cli-profile=default`，KooCLI 退出码 0 且返回 profile 内容。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2132`（`args.push('--cli-profile', String(profile))`），同源 `:2196`。
- **影响**：P1，profile 查看/凭证自检链路在真实 KooCLI 下不可用。
- **证据**：`evidence/D2-10/stdout.log`。
- **状态**：待提交（纳入统一缺陷单）

## #4【P1】D3-B3 run_readonly_command 注入无效 S1 凭证，真实 API 认证失败

- **现象**：`huaweicloud_run_readonly_command {ECS ListServersDetails}` 返回 `ok:false, errorCode=APIGW.0301 Unauthorized`；同一时刻直接 `hcloud ECS ListServersDetails --cli-region=cn-north-4` 返回 `code=0` 且可读到空清单。
- **断言**：KooCLI profile 装有有效凭证时，`run_readonly_command` 应执行成功并返回真实清单（ok=true）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1186/1430`（`run_readonly_command` 走 `runHcloud`，使用 `resolveCredentialsWithRuntime()` 的占位 S1 凭证）；`plugins/huaweicloud-core/src/hcloud-cli.mjs:300`（`resolveStsInjectArgs` 强制注入 `--cli-access-key/--cli-secret-key`，覆盖本机有效 KooCLI profile）。
- **影响**：P1，MCP 只读通道在 S1 为占位/非本机凭证的部署环境中不可用。
- **证据**：`evidence/D3-B3/stdout.log`（工具失败 + 直连成功对照）。
- **状态**：待提交（纳入统一缺陷单）

## #5【P1】D4-8 hook 双路径判定不一致（源码 deny vs MCP hook warn）

- **现象**：同一命令 `hcloud ECS DeleteServer --server_id=abc`，`safety-policy.classifyTextCommand` 判 `deny`（write 类），`huaweicloud_hook_check_command` 判 `warn`（destructive 规则），两路径返回值不一致。
- **断言**：同一输入经 `classifyTextCommand` 与 `hook_check_command` 两条路径的 `decision` 必须一致。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1447-1448`（`hook_check_command` 仅走 `evaluateCommandRisk`，未与 `classifyTextCommand` 的 write/credential 分类合并取最严）。
- **影响**：P1，依赖 MCP hook 的客户端安全门较宽，删除/写操作告警被降级。
- **证据**：`evidence/D4-8/stdout.log`。
- **状态**：待提交（纳入统一缺陷单）

## #6【P1】D10-3 serviceCatalog 意图路由准确率 86.7% < 90% 门禁

- **现象**：`eval/prompts/eval-set-v1.csv` 15 条中文意图逐条路由，仅 13 条命中，2 条兜底：EXP-E01（华北北京四查云主机未命中 ECS）、EXP-E08（ECS 创建失败后的解释未命中 explain_error）。
- **断言**：路由准确率 ≥ 90%（≥14/15）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2574`（`serviceCatalog`）/`:2576`（`routeMap`）/`:2805`（匹配循环）——ECS 关键词表缺「云主机/实例」同义词，缺诊断类（explain_error）意图词。
- **影响**：P1，常用中文查询/故障排查意图高概率落入兜底。
- **证据**：`evidence/D10-3/stdout.log`（15 条明细 miss 列表）、`evidence/EXP-E01/stdout.log`、`evidence/EXP-E08/stdout.log`。
- **状态**：待提交（纳入统一缺陷单）

## #7【P1】D10-3-EXP-E01 「华北北京四有哪些云主机」未命中 ECS

- **现象**：`huaweicloud_service_catalog({intent:"帮我查一下我账号在华北北京四有哪些云主机"})` 返回兜底路由 `services=["Run hcloud --help to list available services."]`。
- **断言**：`recommendedServices` 应包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2576`（`routeMap` 的 ECS 关键词缺少「云主机/服务器/实例」中文同义词）。
- **影响**：P1（与 #6 同源）。
- **证据**：`evidence/EXP-E01/stdout.log`。

## #8【P1】D10-3-EXP-E08 「ECS 创建失败后如何解释」未命中 explain_error

- **现象**：`huaweicloud_service_catalog({intent:"ECS 创建失败，帮我解释错误"})` 返回兜底路由，未命中 `explain_error`。
- **断言**：`recommendedServices`/`recommendedSkills` 应包含 explain_error/诊断类工具。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2576`（`routeMap` 缺「解释错误/排障/诊断」意图词）。
- **影响**：P1（与 #6 同源）。
- **证据**：`evidence/EXP-E08/stdout.log`。

## #9【P1】D9-9 initialize capabilities 未声明取消能力（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities={"tools":{}}`，未声明 `cancellation/cancel`；设计要求「取消通知 2s 内终止，迟到请求 -32000」缺实现依据。
- **断言**：capabilities 实为 `{"tools":{}}`；设计要求取消能力应对应 capabilities 字段，二者不一致 → SPEC-MISMATCH。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:60`（capabilities 仅声明 `tools`）。
- **影响**：P1，客户端无法感知取消能力，长任务中断语义缺失（契约漂移）。
- **证据**：`evidence/D9-9/stdout.log`。
- **状态**：待提交（纳入统一缺陷单）

## #10【P0】D10-4 风险规则库数量与设计契约漂移（SPEC-MISMATCH）

- **现象**：`loadRiskRules()` 实际 19 条 = 9 deny + 10 warn，设计契约要求 9 deny + 7 warn，warn 多 3 条。
- **断言**：规则库 warn 数应为 7；实际 10 → 契约不符。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 新增 3 条 warn 规则（test001 public FunctionGraph、IAM high-risk write、sandbox missing ttl 等）未同步契约/文档。
- **影响**：P0（契约漂移，设计/实现不一致）。
- **证据**：`evidence/D10-4/stdout.log`。
- **状态**：待提交（纳入统一缺陷单）

## #11【P2】D1-68 HUAWEICLOUD_REGION 未优先于 HW_REGION

- **现象**：同时设置 `HUAWEICLOUD_REGION=cn-east-3` 与 `HW_REGION=cn-north-4` 时，`resolveCredentials().region` 取 `cn-north-4`（HW_REGION 优先），与文档约定不一致。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225`（`let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`，顺序相反）；同源 `:173`、`:339`。
- **影响**：P2，多环境变量共存时默认区域与官方文档约定不一致，易产生跨区域误操作。
- **证据**：`evidence/D1-68/stdout.log`。
- **状态**：待提交（纳入统一缺陷单）

## #12【P2】D8-9 sanitizeValue 未移除 AK/SK/token 等敏感值

- **现象**：`sanitizeValue('market.token=abc123 password=Passw0rd 中文')` 仅去除控制字符并截断，`abc123`/`Passw0rd` 原样保留；`installId` 稳定 `stable=true`，但敏感值未脱敏。
- **断言**：`sanitizeValue` 应将 AK/SK/token/password 等键值替换为占位符（如 `<redacted>`）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190`（仅做控制字符替换与长度截断，无 pattern 脱敏）。
- **影响**：P2，遥测/事件 value 可能携带敏感凭证片段。
- **证据**：`evidence/D8-9/stdout.log`。
- **状态**：待提交（纳入统一缺陷单）

---

## 附：非产品缺陷 / 环境阻塞（不纳入统一缺陷单）

- **D3-C2（BLOCKED）**：OBS 静态站 E2E 无法执行——管理 AK 被 OBS 拒为 `InvalidAccessKeyId`（OBS 不识别该 AK）；只读子账号 test001 返回 `AccessDenied`；本机无 obsutil、KooCLI 无 OBS 服务。未创建任何桶，云端零残留。解除条件：下发对 OBS 有效的可写 AK/SK 或安装 obsutil。
- **D3-C3（BLOCKED）**：DevStation 沙箱上游不可用 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败`；解除条件：HDKIT 服务恢复实名查询。
- **D3-C6（BLOCKED）**：7 个沙箱工具均已注册，但 `check_user` 上游 `HDKIT_UPSTREAM_ERROR`；解除条件：HDKIT 服务恢复。
- **D3-C14（BLOCKED）**：`sandbox_credentials` 凭证校验失败（IAM 401）+ `sandbox_connect` 25s 无响应；解除条件：HDKIT 服务恢复。
- **D3-S3（BLOCKED）**：沙箱不可用，`sandbox_connect` 25s 无响应，无法产出公网 URL；解除条件：HDKIT 服务恢复。
- **D3-S7（BLOCKED）**：沙箱上游不可用 + test001 无 RDS 写权限（Pdp.0001），无法完成建库+部署+清理闭环；解除条件：HDKIT 恢复 + 具备 RDS 写权限凭证。

---

## 统计

| 级别 | 项目 | 数量 |
|---|---|---|
| P0 | D1-39、D4-19、D10-4(SPEC) | 3 |
| P1 | D2-10、D3-B3、D4-8、D10-3、EXP-E01、EXP-E08、D9-9(SPEC) | 7 |
| P2 | D1-68、D8-9 | 2 |
| **合计（产品缺陷/契约漂移）** | | **12** |
| 环境阻塞（不纳入缺陷单） | D3-C2、D3-C3、D3-C6、D3-C14、D3-S3、D3-S7 | 6 |