# FINDINGS — 缺陷发现清单（Codex-GPT-5）

> 生成时间：2026-11-28 05:20:00（北京时间）

## #1【P0】D2-4 小写 ak/sk 参数未被凭证脱敏器覆盖

- **现象**：真实调用 `redactSecrets("config: ak=TESTAK... sk=TESTSK...")` 后，返回字符串仍包含两个合成凭证原值。
- **断言**：`redactSecrets` 的返回值不得包含 `ak=` 或 `sk=` 后的原始值，键名大小写不应影响脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 的 `(AK|SK)` 正则缺少大小写不敏感标志，只覆盖大写 `AK/SK`。
- **影响**：用户或工具以小写键名输出凭证时，凭证可能进入 Agent 上下文和日志。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 KMS DecryptData 明文解密操作被分类为 allow

- **现象**：真实调用 `classifyTextCommand("hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy")` 返回 `decision=allow`。
- **断言**：KMS `DecryptData` 必须返回 `decision=deny`，防止解密后的明文进入 Agent 上下文。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` 的 `blockedSecretOperations` 未包含 `DecryptData`，而 `plugins/huaweicloud-core/src/safety-policy.mjs:249` 仅对该数组执行精确匹配。
- **影响**：安全策略无法阻断直接读取解密明文的命令。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01 “云主机”查询意图未路由到 ECS

- **现象**：真实 MCP 调用 `huaweicloud_service_catalog`，意图“帮我查一下我账号在华北北京四有哪些云主机”返回 fallback `Run hcloud --help to list available services.`，未推荐 ECS。
- **断言**：该意图的 `recommendedServices` 必须包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2578-2591` 的 ECS 关键词缺少常用中文同义词“云主机”；无匹配时 `plugins/huaweicloud-core/src/tools.mjs:2827-2829` 返回通用 fallback。
- **影响**：常见中文查询无法进入 ECS 只读工作流，降低能力发现与路由命中率。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
