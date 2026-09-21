# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）

> **落盘路径**：`results/OpenCode/2026-09-22-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-22 21:30:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D1-39 Windows 升级检测链 EINVAL 静默失败

- **现象**：`check_update` MCP 工具返回 `result=check_failed`，`latestStable=null`，`latestNext=null`。源码级 `queryDistTagsSync()` 返回 null。Windows 下 npm registry 查询静默失败。
- **断言**：Windows 下 `queryDistTagsSync()` 应返回 `{latest, next}` 非空对象，`check_update` 的 `result` 应为 `up_to_date` 或 `update_available`，不得为 `check_failed`
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs` `queryDistTagsSync`/`queryDistTags` — Windows 下 child_process spawn npm 查询遇到 EINVAL 错误，返回 null 而非抛出或 fallback
- **影响**：Windows 用户无法收到升级提醒，影响版本更新链路
- **证据**：`evidence/D1-39/stdout.log`（check_update 返回 check_failed + queryDistTags 返回 null）
- **状态**：待提单（关联 #554）

## #2【P0】D4-2 凭证 env 打印拦截缺失

- **现象**：`hook_check_command("printenv HW_ACCESS_KEY HW_SECRET_KEY")` 返回 `decision=allow`，无 findings。凭证环境变量打印命令未被拦截。
- **断言**：`printenv HW_ACCESS_KEY` / `echo $HW_SECRET_KEY` 等凭证 env 打印命令应返回 `decision=deny`，ruleId 应匹配凭证泄露规则
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `loadRiskRules()` — `hwc-command-credential-file` 规则仅匹配 `cat|type|Get-Content` 后跟 `.hcloud|.huaweicloud` 路径模式，不覆盖 `printenv`/`echo` 后跟 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 环境变量名
- **影响**：Agent 可通过 printenv/echo 读取并泄露凭证环境变量，安全风险
- **证据**：`evidence/D4-2/stdout.log`（hook_check_command 返回 allow，0 findings）
- **状态**：待提单

## #3【P0】D4-3 明文 secret API 拦截缺失

- **现象**：`hook_check_command("hcloud IAM KeystoneListUserCredentials --cli-region=cn-north-4")` 返回 `decision=allow`，无 findings。返回明文 AK/SK 的 IAM API 未被拦截。
- **断言**：`hcloud IAM KeystoneListUserCredentials` / `hcloud IAM CreateAccessKeyV5` 等返回明文凭证的 API 应返回 `decision=deny` 或 `warn`
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `loadRiskRules()` — 无规则匹配 IAM 凭证列表/创建类 API（KeystoneListUserCredentials、CreateAccessKeyV5 等），这些 API 返回明文 AK/SK
- **影响**：Agent 可调用 IAM API 获取明文 AK/SK 并泄露到上下文
- **证据**：`evidence/D4-3/stdout.log`（hook_check_command 返回 allow，0 findings）
- **状态**：待提单

## #4【P0】D4-28 Node 安全 hook 链路凭证泄露检测缺失

- **现象**：`hook_check_command("echo HW_SECRET_KEY=abc123 && hcloud ECS CreateServers")` 返回 `decision=allow`，无 findings。echo 打印凭证 env 未被 Node 安全 hook 检测。
- **断言**：含 `echo HW_SECRET_KEY=...` 的命令应被 `classifyTextCommand` 判为 `deny`，输出 `permissionDecision=deny`
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` — 同 D4-2 根因，`hwc-command-credential-file` 规则不覆盖 echo/printenv 环境变量打印场景。`safety-policy.mjs classifyTextCommand` 未补充 env-dump 检测
- **影响**：与 D4-2 同一根因，Node hook 链路未检测凭证 env 打印
- **证据**：`evidence/D4-28/stdout.log`（hook_check_command 返回 allow，0 findings）
- **状态**：待提单（与 D4-2 同一根因，建议合并修复）

## #5【P1】EXP-E01~E14 serviceCatalog 中文意图路由准确率低（21.4%）

- **现象**：`run-eval.mjs` 跑 15 条中文意图评测集，仅 3 条 HIT（EXP-E06 DCS、EXP-E09 CCE、EXP-E15 Voucher），11 条 MISS。多数意图返回 "Run hcloud --help to list available services." 未命中对应服务路由。
- **断言**：serviceCatalog 中文意图路由准确率应 ≥90%，每条意图应命中对应 service
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog`（通过 `callTool` 内部调用）— 中文意图关键词匹配规则不完整，ECS/RDS/EIP/CBR/FunctionGraph/BSS/CES/ELB/IAM 等服务的中文意图未被正确路由
- **影响**：用户中文意图无法正确路由到对应华为云服务，影响用户体验
- **证据**：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`；`eval/results/eval-run-20260921211046.csv`
- **状态**：待提单（已知基线 21.4% MISS）

## #6【非产品缺陷】D4-24 确认令牌过期与重复确认边界测试阻塞

- **现象**：D4-24 确认令牌过期与重复确认边界测试需要真实云资源创建（最小规格 ECS）来测试令牌生命周期，测试环境不具备安全清理保证。
- **说明**：非产品缺陷，为测试侧环境限制。approvalToken 机制在源码级已验证（UUID 格式、TTL 60s），完整边界测试需真实云写操作环境。
