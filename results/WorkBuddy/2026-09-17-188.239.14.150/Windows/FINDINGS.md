# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-17-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-17 07:00:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D4-2 hook_check_command 未拦截 printenv HW_ACCESS_KEY

- **现象**：`hook_check_command("printenv HW_ACCESS_KEY")` 返回 `decision=allow, findings=[]`，凭证环境变量可被打印
- **断言**：`hook_check_command("printenv HW_ACCESS_KEY")` → `decision=deny`（含 hwc-command-credential-env 规则）
- **根因**：`tools.mjs:1104` — `return hookResult(evaluateCommandRisk(args.command || ''))` 使用 `evaluateCommandRisk` 而非 `classifyTextCommand`。`classifyTextCommand` 在 `safety-policy.mjs:417-426` 已有 `printenv HW_` 拦截修复，但 MCP 工具层未调用
- **影响**：Agent 会话中可通过 printenv/echo 打印凭证环境变量，绕过安全策略
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P0】D4-9/D4-22 hook_check_deploy_plan 未检测公网暴露部署计划

- **现象**：`hook_check_deploy_plan({resources:[{type:"ecs",publicIP:true,securityGroups:["0.0.0.0/0"]}],cleanup:false})` 返回 `decision=allow, findings=[]`
- **断言**：公网IP + 0.0.0.0/0安全组 + 无清理 → `decision=warn/deny`（含公网暴露规则）
- **根因**：`risk-rule-engine.mjs:119` — `evaluateDeployPlan` 规则未匹配 `publicIP` 字段，仅检查 sandbox TTL
- **影响**：高危部署计划（公网暴露+无清理）不会被预警，可能导致安全风险
- **证据**：`evidence/D4-9/stdout.log`、`evidence/D4-22/stdout.log`
- **状态**：待提单

## #3【P0】D1-39 Windows queryDistTagsSync 返回 null

- **现象**：`queryDistTagsSync({timeoutMs:15000})` 在 Windows 上返回 `null`，升级检测链不可用
- **断言**：`queryDistTagsSync()` 返回 `{latest:"1.1.5", next:"..."}` 非空对象
- **根因**：`update-check.mjs:236-248` — `spawnSync('npm.cmd', ...)` 在 Windows 非 TTY 下静默失败，返回 null 而非抛出错误
- **影响**：Windows 用户无法检测到新版本，升级提醒功能失效
- **证据**：`evidence/D1-39/stdout.log`
- **状态**：待提单

## #4【P0】D4-15 Deleteserver 变体未被 hook_check_command 拦截

- **现象**：`hook_check_command("Deleteserver --instance-id xxx")` 返回 `decision=allow`，delete 关键词未被检测
- **断言**：含 delete/Delete 关键词的命令 → `decision=warn/deny`（至少识别为潜在写操作）
- **根因**：`tools.mjs:1104` — `evaluateCommandRisk` 仅匹配 `hcloud` 前缀命令的写动词，未检测裸 delete 关键词
- **影响**：通过省略 hcloud 前缀或大小写变体可能绕过安全检查
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：待提单

## #5【P1】D10-3 serviceCatalog 路由准确率仅 21.4%

- **现象**：serviceCatalog 对 15 条中文意图评测集路由准确率仅 3/14=21.4%（EXP-E01~E15），远低于 90% 目标
- **断言**：serviceCatalog 中文意图路由准确率 ≥90%（至少 13/14 HIT）
- **根因**：`tools.mjs:1776` — `serviceCatalog` 使用英文关键词匹配（如 'ecs','server','vm'），中文意图（如"云主机""云数据库""费用情况""备份策略"）无法匹配
- **影响**：中文用户意图无法正确路由到对应华为云服务，影响用户体验
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01~E15/stdout.log`
- **状态**：待提单

## #6【P1】D1-45 applyUpdateHint 未设置 _updateInfo

- **现象**：`applyUpdateHint(result, toolName, hint)` 调用后 `result._updateInfo` 仍为 `undefined`
- **断言**：`applyUpdateHint` 调用后 `result._updateInfo` 存在且包含 updateAvailable/targetVersion 等字段
- **根因**：`update-check.mjs:361` — `applyUpdateHint` 函数未正确设置 `result._updateInfo` 字段
- **影响**：用户无法在工具调用结果中看到升级提醒信息
- **证据**：`evidence/D1-45/stdout.log`
- **状态**：待提单

## #7【P1】EXP-C4-14 DMS list_operations 不支持

- **现象**：`list_operations("DMS")` 返回 `[USE_ERROR]不支持的服务名称:DMS`
- **断言**：`list_operations("DMS")` 返回 DMS 操作列表（如 ListInstances, CreateInstance 等）
- **根因**：KooCLI 服务名映射缺失 DMS，需使用 KooMacro 或正确服务名
- **影响**：DMS（消息队列服务）操作无法通过 KooCLI 执行
- **证据**：`evidence/EXP-C4-14/stdout.log`
- **状态**：待提单

## #8【P1】EXP-C4-18 DEW list_operations 不支持

- **现象**：`list_operations("DEW")` 返回 `[USE_ERROR]不支持的服务名称:DEW`
- **断言**：`list_operations("DEW")` 返回 DEW/KMS/CSMS 操作列表
- **根因**：KooCLI 服务名映射缺失 DEW，DEW 操作分散在 KMS/CSMS 等子服务名下
- **影响**：DEW（数据加密服务）操作无法通过 KooCLI 直接执行
- **证据**：`evidence/EXP-C4-18/stdout.log`
- **状态**：待提单

## #9【P2】D6-3 MCP 冷启探针未捕获 stdout

- **现象**：MCP server 冷启动后 5 秒内未捕获到 stdout 输出，coldStart=99999ms
- **断言**：MCP server 冷启时间 <5s（从 spawn 到首条 stdout 输出）
- **根因**：探针脚本未发送 initialize 请求，MCP server 在收到 initialize 前不输出数据。探针需先发送 initialize 再计时
- **影响**：性能基准无法测量（测试侧问题，非产品缺陷）
- **证据**：`evidence/D6-3/stdout.log`
- **状态**：待提单

## #10【非产品缺陷】D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）

- **现象**：MCP server initialize 响应的 capabilities 中未声明 `notifications/cancelled`
- **断言**：如支持取消，capabilities 应声明 `notifications.cancelled`
- **根因**：`mcp-server.mjs` initialize 响应 capabilities 缺少 cancellation 声明
- **影响**：客户端无法知道服务端是否支持取消操作
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（待裁决）
