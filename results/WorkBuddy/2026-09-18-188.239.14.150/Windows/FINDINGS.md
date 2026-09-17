# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-09-18-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-18 05:10:00（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.5（gitHead e7ed6f66）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D4-1 hook_check_command 未拦截含密码的 IAM 创建命令

- **现象**：`hook_check_command("hcloud IAM CreateUser --name test --password MyPass123")` 返回 `decision=allow, findings=[]`
- **断言**：含 `--password`/`--adminPass` 等凭证参数的命令 → `decision=deny/warn`
- **根因**：`tools.mjs:1104` — `evaluateCommandRisk` 未检测 `--password`/`--adminPass` 等凭证参数关键词
- **影响**：Agent 会话中可通过 CLI 命令传递明文密码，绕过安全策略
- **证据**：`evidence/D4-1/stdout.txt`
- **状态**：待提单

## #2【P0】D4-3 hook_check_command 未拦截含 adminPass 的 ECS 创建命令

- **现象**：`hook_check_command("hcloud ECS CreateServers --adminPass Secret123!")` 返回 `decision=allow, findings=[]`
- **断言**：含 `--adminPass` 参数的命令 → `decision=deny/warn`（凭证不应出现在命令行）
- **根因**：`tools.mjs:1104` — `evaluateCommandRisk` 未检测 `--adminPass` 等凭证参数
- **影响**：明文密码可通过命令行传递，存在凭证泄露风险
- **证据**：`evidence/D4-3/stdout.txt`
- **状态**：待提单

## #3【P0】D4-7 高危命令部分未拦截

- **现象**：`hcloud IAM CreateUser --name admin` 返回 `decision=allow`，`hcloud IAM CreatePolicy --name admin --action "*"` 返回 `decision=allow`
- **断言**：IAM CreateUser/CreatePolicy 等高危操作 → `decision=warn/deny`
- **根因**：`risk-rule-engine.mjs` — `evaluateCommandRisk` 未将 IAM CreateUser/CreatePolicy 识别为高危写操作
- **影响**：高危 IAM 操作不会被预警
- **证据**：`evidence/D4-7/stdout.txt`
- **状态**：待提单

## #4【P0】D4-9 hook_check_deploy_plan 未检测公网暴露部署计划

- **现象**：`hook_check_deploy_plan({resources:[{type:"ecs",publicIP:true,securityGroups:["0.0.0.0/0"]}],cleanup:false})` 返回 `decision=allow, findings=[]`
- **断言**：公网IP + 0.0.0.0/0安全组 + 无清理 → `decision=warn/deny`
- **根因**：`risk-rule-engine.mjs:119` — `evaluateDeployPlan` 规则未匹配 `publicIP` 字段
- **影响**：高危部署计划不会被预警
- **证据**：`evidence/D4-9/stdout.txt`
- **状态**：待提单

## #5【P0】D4-15 delete 变体未被 hook_check_command 拦截

- **现象**：`hook_check_command("Deleteserver --instance-id xxx")` 返回 `decision=allow`，`DELETE /v1/servers/xxx` 返回 `decision=allow`
- **断言**：含 delete/Delete 关键词的命令 → `decision=warn/deny`
- **根因**：`tools.mjs:1104` — `evaluateCommandRisk` 仅匹配 `hcloud` 前缀命令的写动词，未检测裸 delete 关键词
- **影响**：通过省略 hcloud 前缀或使用 HTTP 方法可能绕过安全检查
- **证据**：`evidence/D4-15/stdout.txt`
- **状态**：待提单

## #6【P0】D4-17 异常输入未默认拒绝

- **现象**：`evaluateCommandRisk('')` / `evaluateCommandRisk(null)` / `evaluateCommandRisk('{bad json')` 均返回 `decision=allow`
- **断言**：异常输入（空/null/undefined/malformed）→ `decision=deny`（fail-closed 原则）
- **根因**：`risk-rule-engine.mjs` — `evaluateCommandRisk` 对异常输入未做 fail-closed 处理，默认返回 allow
- **影响**：异常输入可能绕过安全检查
- **证据**：`evidence/D4-17/stdout.txt`
- **状态**：待提单

## #7【P0】D1-39 Windows queryDistTagsSync 返回 null

- **现象**：`queryDistTagsSync({timeoutMs:15000})` 在 Windows 上返回 `null`，升级检测链不可用
- **断言**：`queryDistTagsSync()` 返回 `{latest:"1.1.5", next:"..."}` 非空对象
- **根因**：`update-check.mjs:236-248` — `spawnSync('npm.cmd', ...)` 在 Windows 非 TTY 下静默失败
- **影响**：Windows 用户无法检测到新版本
- **证据**：`evidence/D1-39/stdout.txt`
- **状态**：待提单

## #8【P1】D10-3 serviceCatalog 路由准确率仅 21.4%

- **现象**：serviceCatalog 对 15 条中文意图评测集路由准确率仅 3/14=21.4%（EXP-E01~E15），远低于 90% 目标
- **断言**：serviceCatalog 中文意图路由准确率 ≥90%（至少 13/14 HIT）
- **根因**：`tools.mjs:1776` — `serviceCatalog` 使用英文关键词匹配，中文意图（如"云主机""云数据库""费用情况"）无法匹配
- **影响**：中文用户意图无法正确路由到对应华为云服务
- **证据**：`evidence/D10-3/stdout.log`、`evidence/D10-3/eval-run-result.csv`、`evidence/EXP-E01~E15/stdout.txt`
- **状态**：待提单

## #9【P1】D1-45 applyUpdateHint 未设置 _updateInfo

- **现象**：`applyUpdateHint(result, toolName, hint)` 调用后 `result._updateInfo` 仍为 `undefined`
- **断言**：`applyUpdateHint` 调用后 `result._updateInfo` 存在且包含 updateAvailable/targetVersion 等字段
- **根因**：`update-check.mjs:361` — `applyUpdateHint` 函数未正确设置 `result._updateInfo` 字段
- **影响**：用户无法在工具调用结果中看到升级提醒信息
- **证据**：`evidence/D1-45/stdout.txt`
- **状态**：待提单

## #10【P1】D4-27 redactSecrets 未覆盖裸 AK/SK 字符串

- **现象**：`redactSecrets("AKID1234567890")` 返回原始字符串未脱敏，`redactSecrets("SK1234567890abcdef")` 同样未脱敏
- **断言**：AK/SK/token/password/adminPass 均被替换为 `<redacted>`，无明文残留
- **根因**：`safety-policy.mjs` — `redactSecrets` 仅匹配 `key=value` 模式，未覆盖裸 AK/SK 字符串模式
- **影响**：输出中可能包含未脱敏的裸凭证字符串
- **证据**：`evidence/D4-27/stdout.txt`
- **状态**：待提单

## #11【非产品缺陷】D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）

- **现象**：MCP server initialize 响应的 capabilities 中未声明 `notifications/cancelled`
- **断言**：如支持取消，capabilities 应声明 `notifications.cancelled`
- **根因**：`mcp-server.mjs` initialize 响应 capabilities 缺少 cancellation 声明
- **影响**：客户端无法知道服务端是否支持取消操作
- **证据**：`evidence/D9-9/stdout.txt`
- **状态**：SPEC-MISMATCH（待裁决）
