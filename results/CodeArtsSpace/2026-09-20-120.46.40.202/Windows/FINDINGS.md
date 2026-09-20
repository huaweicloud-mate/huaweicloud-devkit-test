# FINDINGS — CodeArtsSpace/Windows 2026-09-20

## #1【FAIL】D4-2 凭证env打印拦截缺失

- **用例ID**: D4-2
- **优先级**: P0
- **现象**: hook_check_command 未拦截 `echo $HW_SECRET_KEY` 命令，凭证环境变量打印未被检测
- **断言**: hook_check_command 对 `echo $HW_SECRET_KEY` 应返回 decision:deny 或 findings 非空
- **实际**: `{ok:true, decision:"allow", findings:[]}`
- **根因**: `plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 凭证环境变量检测规则缺失，当前规则仅匹配 hcloud 命令和凭证文件路径，未覆盖 shell 命令直接打印凭证环境变量的场景
- **影响**: 攻击者可通过 shell 命令直接打印凭证环境变量，绕过 hook 安全预检
- **证据**: evidence/D4-2/stdout.log
- **修复建议**: 在 risk-rule-engine.mjs 中新增规则，检测 shell 命令中 `echo $HW_SECRET_KEY`、`printenv HW_ACCESS_KEY` 等凭证环境变量打印模式，返回 decision:deny

## #2【FAIL】D4-3 明文secret参数拦截缺失

- **用例ID**: D4-3
- **优先级**: P0
- **现象**: hook_check_command 未拦截 `hcloud ECS CreateServers --adminPass MySecret123` 中的明文 adminPass
- **断言**: hook_check_command 对含 `--adminPass` 明文参数的命令应返回 findings 非空（警告明文密码）
- **实际**: `{ok:true, decision:"allow", findings:[]}`
- **根因**: `plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 明文 secret 参数检测规则缺失，未对 `--adminPass`、`--password` 等敏感参数进行模式匹配
- **影响**: 明文密码可能被记录到日志或暴露在命令历史中
- **证据**: evidence/D4-3/stdout.log
- **修复建议**: 在 risk-rule-engine.mjs 中新增规则，检测 hcloud 命令中 `--adminPass`、`--password`、`--secret` 等敏感参数的明文值，返回 findings 警告
