# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-11-19-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-19（北京时间）
> **被测版本**：huaweicloud-devkit@2.0.0-next.4（源仓 commit 16a24814）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

## #1【P0】D4-16 命令包裹穿透（hook_check_command 对 sh -c 内层凭证 env 打印未拦截）

- **现象**：`hook_check_command(command='sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `decision=allow, findings=[]`；裸 `env | grep HUAWEICLOUD_ACCESS_KEY` 返回 `deny`（hwc-command-env-dump）。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应由 hook_check_command 拦截（`deny`），与裸命令一致。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:35` `hwc-command-env-dump` 规则的 env 匹配 regex 为 `(^|\s)(env|printenv|...)`，仅匹配「行首/空白后跟 env」的裸形态；`evaluateCommandRisk`（`plugins/huaweicloud-core/src/risk-rule-engine.ts:278`）不做 shell 包裹展开，对 `sh -c "env | ..."` 中引号内的 `env`（前导字符为 `"`）不命中；`safety-policy.classifyTextCommand`（`src/safety/classify-text.ts:743`）虽能经 `splitShellSegments`+`-c` 提取内层并收敛 deny，但 `hook_check_command` 工具面（`src/tools.ts:397-398`）走 `evaluateCommandRisk` → 未拦截。
- **影响**：P0 凭证红线——经 shell 包裹的凭证 env 打印可穿透 hook_check_command 工具面。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P2】D8-9 遥测值脱敏缺口（sanitizeValue 不脱敏 AK/SK/token）

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回明文。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值（预期结果契约「移除 AK/SK/token 等敏感值与非法字符，不改变合法值」）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry-values.ts:27` `sanitizeValue` 仅 replace 换行 + trim + 截断（MAX_VALUE_LENGTH），无敏感值脱敏；telemetry 全链路（`telemetry/*.ts`）无 `redactSecrets` 调用。
- **影响**：遥测事件 value 字段可能携带明文凭证值（若敏感值混入 value）。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01 路由 MISS（serviceCatalog「云主机」口语别名未命中 ECS）

- **现象**：`serviceCatalog(intent='帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices=['Run hcloud --help to list available services.']`，期望 `ECS`。
- **断言**：中文「云主机」意图应路由命中 ECS（我方 EXP-E01 断言 ECS）。
- **根因**：`plugins/huaweicloud-core/src/capability-catalog.ts:24-36` ECS 路由关键字含 `弹性云服务器/云服务器/服务器/虚拟机` 但缺「云主机」口语化别名，`routeMap` 单意图匹配下「云主机」落空。
- **影响**：D10 路由准确率 92.9%（14/15 HIT，EXP-E01 唯一 MISS）；「云主机」是高频口语别名，路由 MISS 影响服务目录引导准确性。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单