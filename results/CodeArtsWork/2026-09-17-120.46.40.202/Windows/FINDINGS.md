# FINDINGS

## FINDING-001: D4-2 凭证env打印拦截缺失 HW_ 前缀

- **级别**: P0
- **用例**: D4-2
- **描述**: `hook_check_command('echo $HW_SECRET_KEY')` 返回 `allow`，凭证环境变量打印未被拦截
- **断言**: hook_check_command 对包含 `$HW_SECRET_KEY` / `$HW_ACCESS_KEY` / `printenv HW_ACCESS_KEY` 的命令应返回 `decision: deny`
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`，规则 `hwc-command-env-dump`，regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 缺少 `HW_` 前缀。`safety-policy.mjs` line 418 有正确 regex `(?:HUAWEICLOUD|HWC|HW|OS)_` 但 `hook_check_command` 使用 `risk-rule-engine.mjs` 而非 `safety-policy.mjs`
- **证据**: evidence/D4-2/stdout.log
- **修复建议**: 在 cloud-risk-rules.json hwc-command-env-dump 规则的第二个 regex 中将 `HWC_` 改为 `HWC_|HW_`，或直接使用 `(HUAWEICLOUD|HWC|HW|HCLOUD|OS)_`

## FINDING-002: D4-3 明文secret API拦截缺失 ShowSecret 模式

- **级别**: P0
- **用例**: D4-3
- **描述**: `hook_check_command('hcloud CSMS ShowSecret --secret-id test-secret')` 返回 `allow`，CSMS ShowSecret 命令未被拦截
- **断言**: hook_check_command 对包含 `CSMS ShowSecret` / `ShowSecret` 的命令应返回 `decision: deny`（secret 类别）
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json`，规则 `hwc-command-secret-value-read`，regex `(ShowSecretVersion|DownloadSecret|GetSecretValue)` 缺少 `ShowSecret` 模式。`safety-policy.mjs` line 432 也只有 `ShowSecretVersion` 不含 `ShowSecret`
- **证据**: evidence/D4-3/stdout.log
- **修复建议**: 在 regex 中添加 `ShowSecret`：`(ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue)`

## FINDING-003: D1-39 Windows 升级检测链失败

- **级别**: P0
- **用例**: D1-39
- **描述**: `check_update` 在 Windows 上返回 `result: check_failed`，`latestStable: null`，检测链不可用
- **断言**: Windows 下 check_update 应返回 `latestStable` 非空且 `result` 为 `up_to_date` 或 `update_available`
- **根因**: `plugins/huaweicloud-core/src/update-check.mjs`，`queryDistTagsSync` / `queryDistTagsFetch` 在 Windows 上无法获取 dist tags（可能 spawn `npm view` 失败或 fetch 网络问题）
- **证据**: evidence/D1-39/stdout.log
- **修复建议**: 检查 Windows 上 `queryDistTagsSync` 的 spawn 选项是否需要 `shell: true`；增加 Windows 专项集成测试

## FINDING-004: D4-6 adminPass 参数回显无警告

- **级别**: P1
- **用例**: D4-6
- **描述**: `hook_check_command('hcloud ECS CreateServers --adminPass MyPassword123')` 返回 `allow`，adminPass 明文密码参数未触发警告
- **断言**: hook_check_command 对包含 `adminPass` 参数的命令应返回 `decision: warn` 或 `deny`
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 无 adminPass 参数检测规则
- **证据**: evidence/D4-6/stdout.log
- **修复建议**: 在 cloud-risk-rules.json 中新增 adminPass 参数检测规则

## FINDING-005: EXP-E01~E05,E07,E10~E14 serviceCatalog 中文意图路由 MISS

- **级别**: P1
- **用例**: EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **描述**: eval harness 显示 serviceCatalog 对 11/15 条中文意图路由失败，返回 "Run hcloud --help to list available services" 而非正确服务
- **断言**: serviceCatalog 应将中文意图正确路由到对应华为云服务（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM）
- **根因**: `plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 函数中文关键词匹配覆盖不足，11 条中文意图未命中任何服务路由规则
- **证据**: eval/results/eval-run-20260916161635.csv
- **修复建议**: 增强 serviceCatalog 中文关键词词典，覆盖"云主机/云服务器/公网IP/MySQL/备份/函数/费用/云监控/HTTPS证书/权限审计"等中文意图
