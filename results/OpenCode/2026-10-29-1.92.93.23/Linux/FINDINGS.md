# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-29-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-29 05:15（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.12（hdk gitHead 4ed0780）

---

## #1【P0】D4-2 凭证env打印拦截不完整（裸 access_key 漏网）

- **现象**：`env | grep -i access_key` 实测 `decision=allow risk=not_huaweicloud`（应 deny）。classify.log 行 18-19。
- **断言**：`env | grep -i access_key` 应返回 `decision=deny risk=credential`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:546-556` env-dump 门 regex 仅用 `HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_` 前缀判定，裸 `access_key` 词根漏网。
- **影响**：凭证 env 变量可通过裸关键词 dump 绕过拦截，属安全红线（I 类）风险。
- **证据**：`evidence/D4-2/stdout.log`、`evidence/D4-2/stdout.txt`
- **状态**：待提单

## #2【P0】D4-21 hook_check_artifacts 对全域管理员策略漏检

- **现象**：`--[admin-full]` 输入 `huaweicloud AdministratorFullAccess` 判 `allow`；HCL `actions=["*"]` 判 allow；`data ... AdministratorFullAccess` 判 allow（均无 findings）。
- **断言**：`AdministratorFullAccess` 托管策略引用 / HCL `actions:["*"]` 应 `decision=deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196-209` hwc-iam-admin-policy 的 regex 仅匹配 JSON `"Action":"*"` 形态，未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess` 数据源引用。
- **影响**：IaC/策略制品中的全域管理员越权无法在预检阶段拦截。
- **证据**：`evidence/D4-21/stdout.log`（hcl-probe.log）
- **状态**：待提单

## #3【P0】D9-12 initialize 握手缺少版本检查 + 非法时序不拒

- **现象**：① initialize 阶段未调用 runVersionCheck（版本检查下沉 prewarm/check_cli，属契约漂移）；② 未 initialize 直接 tools/list 未被拒 -32600（listed=true）。
- **断言**：未 initialize 先 tools/list 应返回 `-32600`；initialize 应执行版本检查。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:30` dispatch 无 initialize 前置状态机；initialize 分支不接 runVersionCheck。
- **影响**：协议升级校验缺失与非法时序放行，破坏 MCP 握手安全基线。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #4【P1】D4-6 adminPass 回显警告缺失

- **现象**：`hook_check_command(--admin-pass)` 返回 `ok:true decision:allow findings:[]`，无 adminPass 回显 warning。
- **断言**：`--admin-pass` 触发的含明文口令命令应有 adminPass 暴露告警（findings 非空）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:68` hwc-command-adminpass-exposure 的 stages 仅 artifact/deploy_plan，未覆盖 command 阶段。
- **影响**：口令明文回显风险在命令预检阶段不告警。
- **证据**：`evidence/D4-6/stdout.log`（supplement.log）
- **状态**：待提单

## #5【P1】D4-17 hook 模糊输入 fail-open

- **现象**：空串/空白/`&& rm -rf /*`/`$(curl|sh)`/含 NUL 的模糊输入均判 ok（未 deny）。
- **断言**：模糊/破坏性输入应 fail-closed（deny），不判 ok。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` 无规则命中时 `decision = hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，默认 allow（fail-open）。
- **影响**：模糊输入绕过安全 hook，破坏 fail-closed 契约。
- **证据**：`evidence/D4-17/stdout.log`（supplement.log）
- **状态**：待提单

## #6【P1】D3-S7 复合意图未分解部署目标 + RDS 最小创建失败

- **现象**：存储+托管复合意图 routing `services=["RDS"]`（RDS 命中=true）但部署目标命中=false；`RDS CreateInstance` 报 `--password` 与 KooCLI 系统参数重名，创建失败。
- **断言**：复合意图应命中 RDS + 部署目标；最低配置 RDS CreateInstance 应返回可用的 job/instance 信息。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 单意图匹配，未分解部署目标；RDS 前置 vpc/subnet/sg 未满足且 `--password` 与 KooCLI 系统参数冲突。
- **影响**：跨服务交付场景无法端到端落地（RDS 步受阻）。
- **证据**：`evidence/D3-S7/stdout.log`（new-fg-rds.log）
- **状态**：待提单

## #7【P1】EXP-E01 serviceCatalog 缺「云主机」别名

- **现象**：「帮我查一下我账号在华北北京四有哪些云主机」serviceCatalog 路由 MISS，实际 `Run hcloud --help`（未命中 ECS）。
- **断言**：「云主机」意图应路由 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap ECS keywords 含云服务器/服务器/虚拟机但缺口语化别名「云主机」。
- **影响**：常见中文意图命中率下降（评测集 E01 未命中）。
- **证据**：`evidence/EXP-E01/stdout.log`（eval-harness.log）
- **状态**：待提单

## #8【P2】D3-S5 复合意图分层路由未分解

- **现象**：存储+托管复合意图 `存储命中=false 托管/部署命中=false 多路命中=false`，仅回退 help。
- **断言**：复合意图（存储+托管）应分解命中多个 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 单意图匹配，无复合意图分解。
- **影响**：多服务复合意图路由失败。
- **证据**：`evidence/D3-S5/stdout.log`（new-scenario.log）
- **状态**：待提单

## #9【P2】D3-S6 FunctionGraph 删除函数归零失败

- **现象**：CreateFunction 成功但 `DeleteFunction 归零 -> ok=false`，函数残留，需手动二次删除。
- **断言**：测后 DeleteFunction 应删函数归零（ListFunctions 无本次 function）。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs`（或 tools 层）未归一 func_urn `:latest` 版本后缀，DeleteFunction 传含 `:latest` 的 func_urn 触发 Invalid parameter。
- **影响**：真云 E2E 测后资源未能自动归零，易遗留资源。
- **证据**：`evidence/D3-S6/stdout.log`（new-fg-rds.log）
- **状态**：待提单

## #10【P2】D4-25 Python hook 写操作遥测分类错标

- **现象**：`hcloud vpc CreateVpc` 遥测分类为 `cli:invoke`（应 `cli:write`）。
- **断言**：CreateVpc 应分类为 `cli:write`。
- **根因**：`hooks/huaweicloud-safety.py` WRITE_OPERATION_RE 前置捕获组致写操作误入 invoke 分类。
- **影响**：Python 侧遥测分类不准，影响写操作指标统计。
- **证据**：`evidence/D4-25/stdout.log`（new-safety.log）
- **状态**：待提单

## #11【P2】D4-26 findings.evidence 脱敏不完整

- **现象**：evidence 中 `"secret_key":"SKSECRETVALUE9"`、`"adminPass":"MyP@ss12345"` 明文残留（leaked=true），仅 `access_key` 被脱敏（AKIA***）。
- **断言**：findings.evidence 中 secret_key/adminPass 应无明文。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19-27` redactEvidence 正则 key `\s*[:=]` 不匹配 JSON 带引号 key（`"secret_key":"..."` 中 key 与 `:` 之间有引号）。
- **影响**：审计/证据回传中泄露敏感值。
- **证据**：`evidence/D4-26/stdout.log`（new-safety.log）
- **状态**：待提单

## #12【P0】D10-4 安全规则库计数断言滞后

- **现象**：规则库 version=0.1.0 规则数=19（deny=9 warn=10），用例断言仍按 16 条（9 deny+7 warn）计数。
- **断言**：用例断言应与规则库实际 19 条一致。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则数 16→19（新增 warn 规则），用例断言计数滞后。
- **影响**：SPEC-MISMATCH，属测试基线滞后（非产品缺陷，建议维护者更新断言）。
- **证据**：`evidence/D10-4/stdout.log`（new-safety.log）
- **状态**：待提单

## #13【P1】D9-9 capabilities 未声明 cancellation

- **现象**：initialize 返回 `capabilities = {"tools":{}}`，`capabilities.cancellation 存在? false`。
- **断言**：协议 capabilities 应声明 `cancellation`（tools/call 超时取消语义）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 仅 `{tools:{}}`，未声明 cancellation。
- **影响**：SPEC-MISMATCH，客户端无法得知 cancellation 支持。
- **证据**：`evidence/D9-9/stdout.log`（extended.log）
- **状态**：待提单

## #14【P2】D8-9 sanitize 不脱敏敏感值

- **现象**：`sanitize(AK=...)="AK=ABC123DEF456GHI"`、`sanitize(access_key/token=...)="access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET"`，AK/SK/token 明文保留。
- **断言**：sanitizeValue 应移除 AK/SK/token 敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏。
- **影响**：SPEC-MISMATCH，遥测 sanitize 契约未实现敏感值移除。
- **证据**：`evidence/D8-9/stdout.log`（new-config.log）
- **状态**：待提单