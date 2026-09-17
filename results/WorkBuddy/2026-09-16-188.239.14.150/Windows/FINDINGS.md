# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-16-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-16 07:00:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.5 (latest)
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

## #1【P0】D4-2 hook_check_command 未拦截 printenv HW_ACCESS_KEY 凭证环境变量打印

- **现象**：`hook_check_command("printenv HW_ACCESS_KEY HW_SECRET_KEY")` 返回 `decision=allow`，凭证环境变量打印未被拦截。同样 `env | grep HW_ACCESS_KEY` 也返回 `allow`。
- **断言**：`hook_check_command("printenv HW_ACCESS_KEY")` 应返回 `decision=deny`（凭证环境变量打印被阻断）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1104` — `hook_check_command` MCP 工具调用 `evaluateCommandRisk(args.command)` (risk-rule-engine)，而非 `classifyTextCommand()` (safety-policy.mjs)。`classifyTextCommand` 在 `safety-policy.mjs:417-426` 已有 `printenv HW_` 拦截修复（#650），但 MCP 工具层未使用该函数，导致修复未生效。
- **影响**：任何 MCP 客户端可通过 `hook_check_command` 检查 `printenv HW_ACCESS_KEY` 获得 `allow`，误以为安全，实际凭证可能被泄露。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P0】D4-9/D4-22 hook_check_deploy_plan 未检测公网暴露部署计划

- **现象**：`hook_check_deploy_plan({resources:[{type:"ecs",publicIP:true,securityGroup:"0.0.0.0/0"}],cleanup:"none"})` 返回 `decision=allow, findings=[]`。公网暴露+EIP+0.0.0.0/0安全组+无清理的部署计划未被标记任何风险。
- **断言**：包含 `publicIP:true` + `securityGroup:"0.0.0.0/0"` + `cleanup:"none"` 的部署计划应返回 `decision=warn` 或 `decision=deny`，findings 包含公网暴露/破坏性风险规则
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:119` — `evaluateDeployPlan` 的规则未匹配 `publicIP` 字段（源码级 `evaluateDeployPlan({resources:[{type:'ecs',public:true}]})` 返回 `warn`，但 MCP 工具传入的 `publicIP` 字段名不匹配规则中的 `public` 字段名）；或 `tools.mjs` 中 `hook_check_deploy_plan` 的 plan 传递格式与 `evaluateDeployPlan` 期望不一致。
- **影响**：高危部署计划（公网暴露+开放安全组+无清理）通过安全检查，可能导致资源暴露风险。
- **证据**：`evidence/D4-9/stdout.log`、`evidence/D4-22/stdout.log`
- **状态**：待提单

## #3【P0】D1-39 Windows 下 queryDistTagsSync 返回 null（升级检测链失效）

- **现象**：`queryDistTagsSync()` 在 Windows 上返回 `null`（latest=undefined, next=undefined）。`NPM_BIN='npm.cmd'`，`spawnSync(NPM_BIN, ['view','huaweicloud-devkit','dist-tags','--json'])` 静默失败。关联 #554。
- **断言**：Windows 下 `queryDistTagsSync()` 应返回 `{latest:"1.1.5", next:"..."}` 非空结果，不得返回 null 静默失败
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:236-248` — `spawnSync(NPM_BIN, ...)` 在 Windows 非 TTY 环境下可能因 `npm.cmd` 路径解析或 `shell:true` 缺失导致 `result.status !== 0`，函数返回 null 而非抛出异常。
- **影响**：Windows 用户升级检测链失效，无法检测新版本，`check_update` 返回 `check_failed`。
- **证据**：`evidence/D1-39/stdout.log`
- **状态**：待提单

## #4【P1】D9-2 JSON-RPC invalid params 未返回 -32602 错误码

- **现象**：protocol-probe 发送非法参数的 JSON-RPC 请求，服务端未返回 `{code:-32602, message:"Invalid params"}` 错误对象。
- **断言**：非法参数的 tools/call 请求应返回 JSON-RPC error `{code:-32602}` (Invalid params)
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46` — `dispatch` 函数对非法参数未做 -32602 错误码校验，直接返回空结果或非标准错误。
- **证据**：`evidence/D9-2/stdout.log`、`eval/results/protocol-probe-20260915225941.json`
- **状态**：待提单

## #5【P1】D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）

- **现象**：`initialize` 返回的 `capabilities` 中未声明 `notifications.cancellation`。协议规定如支持取消应声明此能力。
- **断言**：`initialize.result.capabilities.notifications.cancellation` 应存在（如支持取消）或明确声明不支持
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` — initialize 响应的 capabilities 对象未包含 `notifications.cancellation` 声明
- **证据**：`evidence/D9-9/stdout.log`、`eval/results/protocol-probe-20260915225941.json`
- **状态**：待提单（SPEC-MISMATCH 待裁决）

## #6【P1】D10-3 serviceCatalog 中文意图路由准确率仅 21.4%（11/14 MISS）

- **现象**：eval harness 测试 15 条中文意图，HIT=3, MISS=11, N/A=1，准确率=21.4%。11 条中文意图（ECS查询/创建、OBS部署、EIP绑定、RDS查询、CBR备份、FunctionGraph部署、BSS费用、CES监控、ELB证书、IAM审计）均未命中对应服务，返回 "Run hcloud --help to list available services."
- **断言**：serviceCatalog 中文意图路由准确率应 ≥90%（设计目标），当前仅 21.4%
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` — `huaweicloud_service_catalog` 的中文意图匹配逻辑不完善，大部分中文自然语言意图未匹配到对应服务，返回 hcloud --help 通用提示而非推荐服务。
- **影响**：中文用户使用自然语言描述需求时，Agent 无法正确路由到对应华为云服务。
- **证据**：`evidence/D10-3/stdout.log`、`eval/results/eval-run-20260915225925.csv`
- **状态**：待提单

## #7【P1】D1-45 applyUpdateHint 未设置 _updateInfo

- **现象**：`applyUpdateHint(result, name, hint)` 调用后，result 对象上 `_updateInfo` 字段未设置（undefined）。
- **断言**：`applyUpdateHint` 应在 result 上设置 `_updateInfo` 字段，携带更新提示信息
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:361` — `applyUpdateHint` 函数内部逻辑可能未正确赋值 `_updateInfo`，或条件判断导致跳过赋值。
- **证据**：`evidence/D1-45/stdout.log`
- **状态**：待提单

## #8【P1】EXP-C4-14/EXP-C4-18 DMS/DEW 服务 list_operations 返回"不支持的服务名称"

- **现象**：`list_operations("DMS")` 和 `list_operations("DEW")` 均返回 `[USE_ERROR]不支持的服务名称`。KooCLI 不支持 DMS 和 DEW 作为顶层服务名。
- **断言**：list_operations 应对 DMS/DEW 返回有效操作列表，或提示正确的服务名（如 DMS.Kafka/DMS.RocketMQ/KPS）
- **根因**：KooCLI 的服务名映射不包含 DMS 和 DEW 作为顶层服务；devkit 的 list_operations 未做服务名别名映射。
- **证据**：`evidence/EXP-C4-14/stdout.log`、`evidence/EXP-C4-18/stdout.log`
- **状态**：待提单
