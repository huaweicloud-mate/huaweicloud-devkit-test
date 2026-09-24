# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：`results/Hermes/2026-09-24-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-09-24 21:00:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7-next.1

## #1【P0】D4-2 凭证env打印拦截不完整（env|grep HW_ 绕过）

- **现象**：`classifyTextCommand('env | grep HW_')` 返回 `decision=allow`，`HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN` 环境变量可被 `env | grep HW_` 打印泄露
- **断言**：`classifyTextCommand('env | grep HW_')` 应返回 `decision=deny`（与 `env | grep HUAWEICLOUD` 一致）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:243` — `classifyTextCommand()` 的 env-dump 检测正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀。虽然后续 `printenv HW_ACCESS_KEY` 被 L253-258 的独立正则拦截，但 `env | grep HW_` 不匹配 `printenv` 模式，落入 allow
- **影响**：攻击者可通过 `env | grep HW_` 绕过凭证环境变量打印拦截，泄露 AK/SK
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文secret API拦截不完整（ShowServerPassword 未拦截）

- **现象**：`classifyHcloudArgs(['ECS', 'ShowServerPassword', '--server_id=test'])` 返回 `decision=allow, risk=read_only`，解密后的管理员密码可被读取
- **断言**：`classifyHcloudArgs(['ECS', 'ShowServerPassword', ...])` 应返回 `decision=deny` 或 `decision=warn`（至少标记为 secret 风险）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` — `classifyHcloudArgs()` 的操作分类逻辑将 `Show*` 操作统一判为 `read_only`，未区分 `ShowServerPassword`/`ShowKeyVersion` 等返回明文密钥的操作。risk-rule-engine.mjs 的 `hwc-command-secret-value-read` 规则只匹配 `ShowSecretVersion|GetSecretValue|secret_string|secret_binary`，未覆盖 `ShowServerPassword`
- **影响**：ECS 实例的 Windows 管理员密码可通过 `hcloud ECS ShowServerPassword` 被明文读取，绕过安全策略
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】D4-16 命令包裹穿透（shell-wrapped hcloud 命令未检测）

- **现象**：`classifyTextCommand('bash -c "hcloud ECS DeleteServer --server_id=test"')` 返回 `decision=allow`，4 种 shell 包裹方式（bash -c / sh -c / cmd /c / powershell -Command）全部绕过
- **断言**：`classifyTextCommand('bash -c "hcloud ECS DeleteServer ..."')` 应返回 `decision=deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:261` — `classifyTextCommand()` 的 hcloud 检测正则 `/(^|\s)hcloud(\.exe)?\s+/i` 仅匹配行首或空格后的 `hcloud`，不匹配引号内的 `hcloud`（如 `"hcloud ECS ..."`）。`classifyHcloudArgs` 的 `stripExecutable` 虽然能处理 `['bash','-c','hcloud ...']` 数组形式，但 `classifyTextCommand` 对字符串形式的引号包裹无穿透检测
- **影响**：攻击者可通过 `bash -c "hcloud ECS DeleteServer ..."` 绕过命令安全检查，执行破坏性操作
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #4【P0】D10-4 静态规则层 env-dump 规则缺失 HW_ 前缀

- **现象**：`evaluateCommandRisk('printenv HW_SECRET_KEY')` 返回 `decision=allow`，risk-rule-engine 未拦截 HW_ 前缀凭证变量
- **断言**：`evaluateCommandRisk('printenv HW_SECRET_KEY')` 应返回 `decision=deny`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` — `hwc-command-env-dump` 规则的 `match.all[1].regex` 为 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)`，缺少 `HW_` 前缀。`classifyTextCommand` 在 safety-policy.mjs 层面有独立拦截，但 risk-rule-engine 层面未覆盖，导致 `evaluateCommandRisk` 和 `hook_check_command` 的风险评估层不一致
- **影响**：风险评估层（hook_check_command）无法检测 `HW_*` 凭证变量打印，与 safety-policy 层行为不一致
- **证据**：`evidence/D10-4/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E01~E15 serviceCatalog 中文意图路由准确率低（21.4%）

- **现象**：`node eval/harness/run-eval.mjs` 跑 15 条中文意图评测集，仅 3 条 HIT（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 voucher），11 条 MISS，1 条 N/A，准确率 21.4%
- **断言**：serviceCatalog 应正确路由中文意图到对应云服务（如「帮我查一下云主机」→ ECS）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` — `serviceCatalog` 函数对中文意图的匹配能力不足，大部分中文意图返回 `Run hcloud --help to list available services.` 而非匹配到具体服务。可能是关键词字典不完整或中文分词/匹配逻辑有缺陷
- **影响**：用户用中文描述云服务需求时，serviceCatalog 无法正确路由到对应服务，影响用户体验
- **证据**：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`，`eval/results/eval-run-20260923212844.csv`
- **状态**：待提单（已知基线问题，21.4% 为历史基线）

## #6【非产品缺陷】EXP-E08 诊断类意图 N/A

- **现象**：`EXP-E08`（「我的ECS启动失败了 帮我分析原因」）verdict=N/A，expectedServices=(诊断)
- **说明**：该评测用例的期望路由为「诊断」类，不属于具体云服务路由，serviceCatalog 设计上不覆盖诊断类意图。verdict=N/A 是 harness 的正确判定，非产品缺陷
- **证据**：`evidence/EXP-E08/stdout.log`
