# FINDINGS — 缺陷发现清单（CodeArtsWork-GLM-5.2）

> **落盘路径**：`results/CodeArtsWork/2026-09-17-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-17 06:55:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.5

---

## #1【P0】D4-2 凭证env打印拦截缺失 HW_ 前缀

- **现象**：`hook_check_command('echo $HW_SECRET_KEY')` 返回 `allow`，凭证环境变量打印未被拦截
- **断言**：hook_check_command 对包含 `$HW_SECRET_KEY` / `$HW_ACCESS_KEY` / `printenv HW_ACCESS_KEY` 的命令应返回 `decision: deny`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则 `hwc-command-env-dump` regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 缺少 `HW_` 前缀。`safety-policy.mjs:418` 有正确 regex `(?:HUAWEICLOUD|HWC|HW|OS)_` 但 `hook_check_command` 用 `risk-rule-engine.mjs` 而非 `safety-policy.mjs`
- **影响**：凭证环境变量可通过 echo/printenv 泄露到 agent 上下文
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文secret API拦截缺失 ShowSecret 模式

- **现象**：`hook_check_command('hcloud CSMS ShowSecret --secret-id test-secret')` 返回 `allow`，CSMS ShowSecret 命令未被拦截
- **断言**：hook_check_command 对包含 `CSMS ShowSecret` / `ShowSecret` 的命令应返回 `decision: deny`（secret 类别）
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则 `hwc-command-secret-value-read` regex `(ShowSecretVersion|DownloadSecret|GetSecretValue)` 缺少 `ShowSecret`。`safety-policy.mjs:432` 也只有 `ShowSecretVersion` 不含 `ShowSecret`
- **影响**：CSMS ShowSecret 返回的明文 secret 可泄露到 agent 上下文
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】D1-39 Windows 升级检测链失败

- **现象**：`check_update` 在 Windows 上返回 `result: check_failed`，`latestStable: null`，检测链不可用
- **断言**：Windows 下 check_update 应返回 `latestStable` 非空且 `result` 为 `up_to_date` 或 `update_available`
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` `queryDistTagsSync`/`queryDistTagsFetch` 在 Windows 上无法获取 dist tags（spawn `npm view` 失败或 fetch 网络问题）
- **影响**：Windows 用户无法收到升级提醒
- **证据**：`evidence/D1-39/stdout.log`
- **状态**：待提单

## #4【P1】D4-6 adminPass 参数回显无警告

- **现象**：`hook_check_command('hcloud ECS CreateServers --adminPass MyPassword123')` 返回 `allow`，adminPass 明文密码参数未触发警告
- **断言**：hook_check_command 对包含 `adminPass` 参数的命令应返回 `decision: warn` 或 `deny`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 无 adminPass 参数检测规则
- **影响**：adminPass 明文密码可出现在命令中而无安全警告
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：待提单

## #5【P1】D10-3 / EXP-E01~E14 serviceCatalog 中文意图路由 MISS（11/15 未命中）

- **现象**：eval harness 显示 serviceCatalog 对 11/15 条中文意图路由失败，返回 "Run hcloud --help to list available services" 而非正确服务
- **断言**：serviceCatalog 应将中文意图正确路由到对应华为云服务（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 函数中文关键词匹配覆盖不足，11 条中文意图未命中任何服务路由规则
- **影响**：中文用户意图无法正确路由到对应华为云服务，影响中文用户体验
- **证据**：`eval/results/eval-run-20260916225056.csv`
- **状态**：待提单
