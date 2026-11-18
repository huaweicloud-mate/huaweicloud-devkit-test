# FINDINGS - Codex GPT-5

> 生成时间：2026-11-19 05:13:00（北京时间）
> 被测版本：huaweicloud-devkit 1.1.14（gitHead `bd985051`）

## #1【P0】D2-4 小写 AK/SK 短键未脱敏

- **现象**：调用 `redactSecrets("config: ak=TESTAK... sk=TESTSK...")` 后，两个固定测试值均原样保留。
- **断言**：输入字符串中的小写 `ak=` 与 `sk=` 值必须全部替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 的短键正则仅匹配大写 `(AK|SK)` 且没有 `i` 标志，导致小写短键绕过脱敏。
- **影响**：使用小写短键记录配置时，访问密钥可能进入日志或 Agent 上下文。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待查重提单

## #2【P0】D4-3 KMS DecryptData 未被明文 secret 策略阻断

- **现象**：`classifyTextCommand("hcloud KMS DecryptData ...")` 返回 `decision=allow`。
- **断言**：`hcloud KMS DecryptData` 的分类结果必须为 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:249` 仅按 `blockedSecretOperations` 精确匹配，`plugins/huaweicloud-core/src/safety-policy.mjs:257` 的明文读取正则也未覆盖 `DecryptData`。
- **影响**：解密后的明文数据可能进入 Agent 上下文，违反明文 secret API 阻断要求。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待查重提单

## #3【P1】EXP-E01 中文“云主机”查询未路由到 ECS

- **现象**：对“帮我查一下我账号在华北北京四有哪些云主机”调用 service catalog，返回通用 hcloud 帮助提示而非 ECS。
- **断言**：包含“云主机”的中文查询意图必须在 `recommendedServices` 中返回 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2362` 的 ECS 关键词表包含“云服务器”等词，但缺少常用同义词“云主机”，`plugins/huaweicloud-core/src/tools.mjs:2591` 因而无法命中。
- **影响**：常见中文 ECS 查询无法进入只读 ECS 路由，降低意图识别准确率。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待查重提单
