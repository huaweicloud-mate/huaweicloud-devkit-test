# FINDINGS — CodeArtsWork/Windows 2026-09-21

> **生成时间**: 2026-09-21 05:15 (UTC+8)
> **被测版本**: huaweicloud-devkit@1.1.5

## #1【P0】D4-2 凭证env打印拦截缺失

- **现象**: hook_check_command 对 `echo $HW_SECRET_KEY` 返回 `{ok:true, decision:"allow", findings:[]}`，凭证环境变量打印未被检测
- **断言**: hook_check_command 对 `echo $HW_SECRET_KEY` 应返回 decision:deny 或 findings 非空
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:26` — `hwc-command-env-dump` 规则的命令正则仅匹配 `env|printenv|Get-ChildItem Env:|gci Env:|dir Env:`，未覆盖 `echo $HW_*` 单变量打印；且环境变量前缀正则仅匹配 `HUAWEICLOUD|HWC_|HCLOUD|OS_`，未含 `HW_` 前缀（HW_SECRET_KEY/HW_ACCESS_KEY）
- **影响**: 攻击者可通过 `echo $HW_SECRET_KEY` 直接打印凭证环境变量，绕过 hook 安全预检
- **证据**: evidence/D4-2/stdout.log
- **状态**: 历史问题 #561（open），v1.1.5 复核仍成立

## #2【P0】D4-3 明文secret参数拦截缺失

- **现象**: hook_check_command 对 `hcloud ECS CreateServers --adminPass MySecret123` 返回 `{ok:true, decision:"allow", findings:[]}`，明文 adminPass 未被检测
- **断言**: hook_check_command 对含 `--adminPass` 明文参数的命令应返回 findings 非空（警告明文密码）
- **根因**: `plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:47` — `hwc-command-secret-value-read` 规则仅匹配 `ShowSecretVersion|DownloadSecret|GetSecretValue|secret_string|secret_binary` 等模式，未对 `--adminPass`、`--password`、`--secret` 等敏感命令参数进行模式匹配
- **影响**: 明文密码可能被记录到日志或暴露在命令历史中
- **证据**: evidence/D4-3/stdout.log
- **状态**: 历史问题 #561（open），v1.1.5 复核仍成立
