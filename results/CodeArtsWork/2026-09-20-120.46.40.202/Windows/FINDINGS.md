# FINDINGS — CodeArtsWork/Windows 2026-09-20

## FINDING-1: D4-2 凭证env打印拦截缺失

- **级别**: FAIL (P0)
- **用例ID**: D4-2
- **描述**: hook_check_command 未拦截 `echo $HW_SECRET_KEY` 命令，凭证环境变量打印未被检测
- **断言**: hook_check_command 对 `echo $HW_SECRET_KEY` 应返回 decision:deny 或 findings 非空
- **实际**: `{ok:true, decision:"allow", findings:[]}`
- **根因**: `plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 凭证环境变量检测规则缺失，当前规则仅匹配 hcloud 命令和凭证文件路径，未覆盖 shell 命令直接打印凭证环境变量的场景
- **证据**: evidence/D4-2/stdout.log
- **修复建议**: 新增规则检测 shell 命令中 `echo $HW_SECRET_KEY`、`printenv HW_ACCESS_KEY` 等凭证环境变量打印模式

## FINDING-2: D4-3 明文secret参数拦截缺失

- **级别**: FAIL (P0)
- **用例ID**: D4-3
- **描述**: hook_check_command 未拦截 `hcloud ECS CreateServers --adminPass MySecret123` 中的明文 adminPass
- **断言**: hook_check_command 对含 `--adminPass` 明文参数的命令应返回 findings 非空
- **实际**: `{ok:true, decision:"allow", findings:[]}`
- **根因**: `plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 明文 secret 参数检测规则缺失，未对 `--adminPass`、`--password` 等敏感参数进行模式匹配
- **证据**: evidence/D4-3/stdout.log
- **修复建议**: 新增规则检测 hcloud 命令中 `--adminPass`、`--password`、`--secret` 等敏感参数的明文值
