# FINDINGS — 缺陷发现清单（OpenCode-GLM-5.2）

> **落盘路径**：`results/OpenCode/2026-09-18-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-18 05:13:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**，否则自动提单解析失败/漏缺陷。

---

## #1【P0】D4-16 命令包裹穿透：sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID" 绕过环境变量脱敏拦截

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `decision: 'allow'`，未被拦截。MCP 工具 `huaweicloud_hook_check_command` 同样返回 `allow`。直接调用 `printenv HUAWEICLOUD_ACCESS_KEY_ID`（不带 sh -c 包裹）则正确返回 `deny`。
- **断言**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"').decision === 'deny'`（期望 deny，实际 allow）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:397-426` — `classifyTextCommand` 函数检查 env dump 模式的正则 `/(^|\s)(env|printenv|...)/i` 要求 `printenv` 前面是空白或字符串起始，但在 `sh -c "printenv ..."` 中 `printenv` 前面是双引号 `"`，正则不匹配。`stripExecutable` 函数（line 67-101）能解包 `sh -c` 但只用于 `classifyHcloudArgs`，未用于 `classifyTextCommand`。
- **影响**：攻击者可通过 `sh -c` / `bash -c` 包裹敏感命令绕过安全钩子，泄露云凭证环境变量。安全高风险。
- **证据**：`evidence/d4-security/stdout.log`（D4-16 测试项 wrap-sh FAIL）+ `evidence/mcp-tools/stdout.log`（D4-16 测试项 wrap-mcp FAIL）
- **状态**：待提单

## #2【P0】D2-4/D4-27 redactSecrets 不脱敏 JSON 字符串中的小写 sk 字段

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234"}')` 返回原字符串不变，`sk` 值未被脱敏。`redactSecrets('{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN123"}')` 同样未脱敏 `sk` 和 `token` 值。MCP 工具 `huaweicloud_show_profile_redacted` 脱敏正常（返回 `<redacted>`），说明 MCP 管道层有额外脱敏，但源码级 `redactSecrets` 函数有缺陷。
- **断言**：`!redactSecrets('{"sk":"SK1234567890abcdef"}').includes('SK1234567890abcdef')`（期望 true，实际 false）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` 函数中正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 缺少 `i` 标志（大小写敏感），JSON 中小写键 `"sk":` 不匹配大写 `SK` 模式。对比 line 42 的正则有 `gi` 标志且包含 `secret[_-]?key` 等模式，但未覆盖 `ak`/`sk` 缩写。
- **影响**：当命令输出或制品内容包含 JSON 格式的凭证（小写 `ak`/`sk` 键），`redactSecrets` 无法脱敏，密钥可能进入 agent 上下文。影响 `run_readonly_command` 和 `hook_check_command` 的输出脱敏路径。
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json FAIL + D4-27 redact-dual FAIL）
- **状态**：待提单

## #3【非产品缺陷】EXP-E01~E05,E07,E10~E14 serviceCatalog 中文意图路由未命中（已知基线）

- **现象**：`eval/harness/run-eval.mjs` 跑出 21.4% 准确率（3 HIT / 14 总），11 条中文意图路由 MISS。MISS 用例：EXP-E01(ECS), E02(ECS), E03(OBS), E04(EIP), E05(RDS), E07(CBR), E10(FunctionGraph), E11(BSS), E12(CES), E13(ELB), E14(IAM)。
- **说明**：此为已知基线问题（SKILL.md 记载基线 21.4% MISS），serviceCatalog 路由层是确定性调用，对中文自然语言意图的路由能力有限。`run-eval.mjs` harness 已建成并跑出基线，非新缺陷。已知历史单可关联。
- **证据**：`evidence/eval-harness/eval-run.csv` + `evidence/c4-service-matrix/stdout.log`
