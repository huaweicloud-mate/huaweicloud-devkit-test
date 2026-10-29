# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-10-30-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-10-30 05:27（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.13-next.0（hdk gitHead 47170d1）

---

## #1【P0】D4-2 凭证env打印拦截不完整（裸 access_key 漏网）

- **现象**：`env | grep -i access_key` 实测 `decision=allow risk=not_huaweicloud`（应 deny）。
- **断言**：`env | grep -i access_key` 应返回 `decision=deny risk=credential`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` env-dump 门 regex 仅用 `HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_` 前缀判定，裸 `access_key` 词根漏网。
- **证据**：`evidence/D4-2/stdout.log`、`evidence/D4-2/stdout.txt`

## #2【P0】D4-21 hook_check_artifacts 对全域管理员策略漏检

- **现象**：`AdministratorFullAccess` 托管策略引用 / HCL `actions=["*"]` / `data ... AdministratorFullAccess` 均判 allow（无 findings）。
- **断言**：`AdministratorFullAccess` 引用 / HCL `actions:["*"]` 应 `decision=deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` hwc-iam-admin-policy 的 regex 仅匹配 JSON `"Action":"*"` 形态，未覆盖 HCL `actions=["*"]` 与 `AdministratorFullAccess` 数据源引用。
- **证据**：`evidence/D4-21/stdout.log`

## #3【P0】D9-12 initialize 握手缺少版本检查 + 非法时序不拒

- **现象**：① initialize 阶段未调用 runVersionCheck（版本检查下沉 prewarm/check_cli）；② 未 initialize 直接 tools/list 未被拒 -32600（直接返回 tools 列表）。
- **断言**：未 initialize 先 tools/list 应返回 `-32600`；initialize 应执行版本检查。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` dispatch 无 initialize 前置状态机；initialize 分支不接 runVersionCheck。
- **证据**：`evidence/D9-12/stdout.log`

## #4【P1】D4-6 adminPass 回显警告缺失

- **现象**：`hook_check_command(--admin_pass=...)` 返回无 adminPass 告警 finding（findings 不含 hwc-command-adminpass-exposure）。
- **断言**：`--admin-pass` 含明文口令命令应有 adminPass 暴露告警（findings 非空）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` hwc-command-adminpass-exposure 的 stages 仅 artifact/deploy_plan，未覆盖 command 阶段。
- **证据**：`evidence/D4-6/stdout.log`

## #5【P1】D4-17 hook 模糊输入 fail-open

- **现象**：空串/空白/`&& rm -rf /*`/`$(curl|sh)` 模糊输入均判 ok（未 deny）。
- **断言**：模糊/破坏性输入应 fail-closed（deny），不判 ok。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无规则命中时 `decision = allow`（fail-open），无 fail-closed 兜底。
- **证据**：`evidence/D4-17/stdout.log`

## #6【P1】D3-S7 复合意图未分解部署目标 + RDS 最小创建受阻

- **现象**：`部署带 MySQL 数据库的 Web 应用` 复合意图 routing 未同时命中 RDS + 部署目标（仅单一路由）。
- **断言**：复合意图应同时命中 RDS + 部署目标。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog routeMap 单意图匹配，未分解复合意图（存储+托管）。
- **证据**：`evidence/D3-S7/stdout.log`

## #7【P1】EXP-E01 serviceCatalog 缺「云主机」别名

- **现象**：「帮我查一下我账号在华北北京四有哪些云主机」serviceCatalog 路由 MISS，未命中 ECS。
- **断言**：「云主机」意图应路由 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap ECS keywords 含云服务器/服务器/虚拟机但缺口语化别名「云主机」。
- **证据**：`evidence/EXP-E01/stdout.log`

## #8【P1】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：initialize 返回 `capabilities = {"tools":{}}`，无 cancellation 声明。
- **断言**：协议 capabilities 应声明 `cancellation`（tools/call 超时取消语义）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` capabilities 仅 `{tools:{}}`，未声明 cancellation。
- **证据**：`evidence/D9-9/stdout.log`

## #9【P2】D3-S5 复合意图分层路由未分解

- **现象**：「物联网+时序数据+前端托管」复合意图 storage/hosting 均未命中，仅回退 help。
- **断言**：复合意图应分解命中多个 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 单意图匹配，无复合意图分解。
- **证据**：`evidence/D3-S5/stdout.log`

## #10【P2】D3-S6 FunctionGraph 删除函数归零失败

- **现象**：CreateFunction 成功但 DeleteFunction 归零失败（func_urn 含 `:latest` 后缀触发 Invalid parameter）。
- **断言**：测后 DeleteFunction 应删函数归零（ListFunctions 无本次 function）。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs` 未归一 func_urn `:latest` 版本后缀。
- **证据**：`evidence/D3-S6/stdout.log`

## #11【P2】D4-26 findings.evidence 脱敏不完整

- **现象**：evidence 中 `secret_key`/`adminPass` 明文残留（仅 access_key 被脱敏）。
- **断言**：findings.evidence 中 secret_key/adminPass 应无明文。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` redactEvidence 正则 key `\s*[:=]` 不匹配 JSON 带引号 key。
- **证据**：`evidence/D4-26/stdout.log`

## #12【P2】D4-25 Python hook 写操作遥测分类错标

- **现象**：`hcloud vpc CreateVpc` 遥测分类为 `cli:invoke`（应 `cli:write`）。
- **断言**：CreateVpc 应分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` WRITE_OPERATION_RE 前置捕获组致写操作误入 invoke 分类。
- **证据**：`evidence/D4-25/stdout.log`

## #13【P2】D8-9 sanitize 不脱敏敏感值（SPEC-MISMATCH）

- **现象**：`sanitizeValue('access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET')` 明文保留。
- **断言**：sanitizeValue 应移除 AK/SK/token 敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` sanitizeValue 仅去控制字符+超长截断，无 AK/SK/token 脱敏。
- **证据**：`evidence/D8-9/stdout.log`

## #14【P0】D10-4 规则库计数断言滞后（SPEC-MISMATCH）

- **现象**：规则库实际 19 条（deny=9 warn=10），用例断言仍按 16 条（9 deny+7 warn）计数。
- **断言**：用例断言应与规则库实际条数一致。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则数 16→19（新增 warn），用例断言计数滞后（测试基线滞后，非产品缺陷）。
- **证据**：`evidence/D10-4/stdout.log`