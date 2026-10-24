# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-25-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-25 05:10:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.12
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。

## #1【P0】D2-4 凭证脱敏对缩写 key ak=/sk= 失效

- **现象**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 返回原样字符串，ak/sk 值未替换为 `<redacted>`。`akLeak=true skLeak=true`。
- **断言**：`redactSecrets` 对包含 `ak=<value>` / `sk=<value>` 的输入应将 value 替换为 `<redacted>`，不应泄漏原值。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:20-30` `isSecretKeyName(key)` 将 key 小写化并移除非字母数字后匹配 `/access.*key|secret.*key|.../`，`ak` 归一化为 `ak` 不含 `access`/`secret` 子串；`safety-policy.mjs:45` `redactString` 的 `(AK|SK)\s*[:=]` 正则大小写敏感，不匹配 JSON/命令行中的小写 `ak=`/`sk=`。`safety/policy.json:26` `secretKeyNamePatterns` 列表也无 `ak`/`sk` 缩写模式。
- **影响**：凭证 JSON 或命令行参数中的小写 `ak`/`sk` 键值对会原样进入 agent 上下文/日志，造成 AK/SK 泄漏。
- **证据**：`evidence/D2-4/stdout.log` — `akLeak=true skLeak=true redacted="config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY"`
- **状态**：待提单

## #2【P0】D4-3 KMS DecryptData 未拦截（明文secret API）

- **现象**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy').decision` 返回 `'allow'`，未拦截。KMS DecryptData 返回密文解密后的明文，属 secret-retrieval API。
- **断言**：`classifyTextCommand('hcloud KMS DecryptData ...').decision === 'deny'`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:249-254` `policy.blockedSecretOperations.some(op => op.toLowerCase() === operation.toLowerCase())` 列表来自 `safety/policy.json:26`：`["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，缺 `DecryptData`/`Decrypt`。`safety-policy.mjs:257` `secret[_-]?string|secret[_-]?binary|showsecret|showsecretversion|getsecretvalue` 正则未覆盖 `decryptdata` 操作名。
- **影响**：KMS DecryptData 调用未被安全策略拦截，密文解密结果（明文 secret）可能进入 agent 上下文。
- **证据**：`evidence/D4-3/stdout.log` — `decision=allow`
- **状态**：待提单

## #3【P1】EXP-E01 serviceCatalog 中文意图路由 MISS（云主机→ECS）

- **现象**：`huaweicloud_service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 返回 `recommendedServices=["Run hcloud --help to list available services."]`，verdict=MISS，未识别「云主机」→ECS。
- **断言**：`recommendedServices` 应包含 `ECS`（中文「云主机」是 ECS 的标准同义词）
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层对「云主机」中文意图未做语义匹配，返回兜底 "Run hcloud --help"。基线 21.4% HIT，本轮 E02-E15 多数 HIT，仅 E01 MISS。
- **影响**：用户用中文描述 ECS 查询意图时，serviceCatalog 无法路由到正确服务，需用户手动指定。
- **证据**：`evidence/EXP-E01/stdout.log` — `verdict=MISS expect=ECS got=Run hcloud --help`
- **状态**：待提单
