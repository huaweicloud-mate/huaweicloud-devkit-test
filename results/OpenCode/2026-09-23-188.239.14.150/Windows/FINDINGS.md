# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）

> **落盘路径**：`results/OpenCode/2026-09-23-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-23 05:10:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D4-2 凭证env打印拦截不完整

- **现象**：`hook_check_command` 对 `printenv HW_SECRET_ACCESS_KEY` 和 `echo AK=HWP7XXXXXXXXXXXXXXXXXX SK=xxxx` 返回 `decision=allow`，未拦截凭证环境变量打印和凭证值回显。
- **断言**：`hook_check_command("printenv HW_SECRET_ACCESS_KEY")` 应返回 `decision=deny`，实际返回 `decision=allow`
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 风险规则 `hwc-command-credential-file` 仅匹配凭证文件路径模式（`credentials.json`、`.hcloud/config.json`），未覆盖环境变量名（`HW_SECRET_ACCESS_KEY`、`HW_ACCESS_KEY`）和凭证值模式（`AK=xxx`、`SK=xxx`）的 echo/printenv 命令
- **影响**：凭证环境变量可通过 printenv/echo 命令泄露到 agent 上下文，存在安全风险
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：待提单

## #2【P1】EXP-E01~E05,E07,E10~E14 serviceCatalog中文意图路由大面积MISS

- **现象**：`eval/harness/run-eval.mjs` 对 15 条中文意图评测集执行 serviceCatalog 路由，11 条 MISS（路由到 "Run hcloud --help to list available services" 而非正确服务）。准确率仅 21.4%（3 HIT / 14 分母）。
- **断言**：serviceCatalog 应将中文意图路由到正确服务（如「帮我查一下我账号在华北北京四有哪些云主机」→ ECS），实际 11/14 路由到 "Run hcloud --help" fallback
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog()` 函数的 routeMap 中文意图匹配覆盖不全，大量常见中文云服务意图（ECS查询/创建、EIP绑定、RDS查询、CBR备份、FunctionGraph部署、BSS费用查询、CES监控、ELB证书、IAM审计）未命中路由规则，fallback 到 "Run hcloud --help"
- **影响**：用户用中文描述云服务需求时，agent 无法自动路由到正确服务，需手动指定服务名，严重影响中文用户体验
- **证据**：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`，`evidence/eval-run-result.csv`
- **状态**：待提单

## #3【非产品缺陷】D4-24 确认令牌过期与重复确认边界测试阻塞

- **现象**：D4-24「确认令牌过期与重复确认边界」测试需要真实云写操作（创建最小规格 ECS）生成 approvalToken，并注入时钟推进测试过期/重复确认，无法在测试环境安全执行。
- **说明**：源码级验证 approvalToken 为 UUID 格式，TTL 机制存在于代码中。完整边界测试需可注入时钟 + 真云写操作环境。非产品缺陷，为测试环境限制。
