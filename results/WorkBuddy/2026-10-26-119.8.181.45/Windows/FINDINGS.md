# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-26-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-26 05:10:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D2-4 凭证脱敏正确性（小写 ak= / sk= 未脱敏）

- **现象**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 输出原样保留 ak/sk 值，`akLeak=true skLeak=true`。
- **断言**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 应将 ak/sk 值替换为 `<redacted>`，且 `akLeak=false skLeak=false`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:20-30` `isSecretKeyName(key)` 将 key 小写化并移除非字母数字后匹配 `/access.*key|secret.*key|.../`，`ak` 归一化为 `ak`，不含 `access` 或 `secret` 子串；`safety-policy.mjs:45` `redactString` 的 `(AK|SK)\s*[:=]` 正则只匹配大写 `AK=`/`SK=`，不匹配 JSON 中的 `"ak":"..."` 或命令行中的 `ak=...` 小写形式。
- **影响**：凭证泄漏——小写 `ak=`/`sk=` 形式的 AK/SK 在日志/错误消息中原样输出，违反凭证脱敏基线。
- **证据**：`evidence/D2-4/stdout.log` — `akLeak=true skLeak=true`，`redacted` 字段原样保留测试 AK/SK
- **状态**：待提单（与 2026-10-25 同一缺陷，历史单待复核）

## #2【P0】D4-3 明文 secret API 拦截（KMS DecryptData 未拦截）

- **现象**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy').decision === 'allow'`，KMS DecryptData 返回明文密文解密结果，属 secret-retrieval API，应被 deny。
- **断言**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy').decision === 'deny'`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:249-254` `policy.blockedSecretOperations.some(op => op.toLowerCase() === operation.toLowerCase())` 列表来自 `safety/policy.json:26`：`["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，**缺 `DecryptData`/`Decrypt`**；`safety-policy.mjs:257` `secret[_-]?string|secret[_-]?binary|showsecret|showsecretversion|getsecretvalue` 正则未覆盖 `decryptdata` 操作名。
- **影响**：安全绕过——KMS DecryptData 可解密密文返回明文，未拦截属 secret-retrieval 防护缺口。
- **证据**：`evidence/D4-3/stdout.log` — `decision=allow`
- **状态**：待提单（与 2026-10-25 同一缺陷，历史单待复核）

## #3【P0】D4-16 命令包裹穿透（$(...) 命令替换包裹未拦截）

- **现象**：`classifyTextCommand('$(hcloud KMS DecryptData)').decision === 'allow'`，`$(...)` 命令替换包裹的 hcloud 调用未被 unwrap 拦截。同时 `$(hcloud ECS NovaListServers)` 也返回 `allow read_only`，说明 `$(...)` 内的 hcloud 命令未被 extractInnerCommand 提取后重新分类。
- **断言**：`classifyTextCommand('$(hcloud KMS DecryptData)').decision === 'deny'`（应 unwrap `$(...)` 后识别 hcloud KMS DecryptData 为 secret 操作并 deny）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:440-446` `extractInnerCommand` 的 `cmdSubst = /\$\(([^)]+)\)/g` 正则**会**提取 `$(hcloud KMS DecryptData)` 的内层 `hcloud KMS DecryptData`，但 `safety-policy.mjs:532` `classifyTextCommand` 把 `[text, ...extractInnerCommand(text)]` 作为 candidates 逐个分类，对 `hcloud KMS DecryptData` 这个 candidate 应判 deny（因 D4-3 缺陷 DecryptData 不在 blockedSecretOperations 列表）——故根因与 D4-3 同源：`$(...)` unwrap 生效，但 unwrap 后的 `hcloud KMS DecryptData` 因 D4-3 缺陷未被识别为 secret 操作。**D4-16 FAIL 是 D4-3 缺陷的衍生表现**：unwrap 链路本身正常（`bash -c "hcloud IAM DeleteUser"` → deny 写操作正常拦截），但 `$(hcloud KMS DecryptData)` 因 DecryptData 未在 secret 黑名单，unwrap 后仍判 allow。修复 D4-3 后 D4-16 应同步恢复 PASS。
- **影响**：攻击者可用 `$(hcloud KMS DecryptData ...)` 命令替换绕过安全预检，解密密文返回明文。
- **证据**：`evidence/D4-16/stdout.log` — `$(hcloud KMS DecryptData)` decision=allow，其余 6 组包裹攻击均 deny
- **状态**：待提单（D4-3 衍生缺陷，修复 D4-3 后同步验证）

## #4【P1】EXP-E01 serviceCatalog 中文意图路由 MISS（「云主机」→ECS 未识别）

- **现象**：`huaweicloud_service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 返回 `recommendedServices = ["Run hcloud --help to list available services."]`，verdict=MISS。
- **断言**：`huaweicloud_service_catalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'}).recommendedServices` 含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层对「云主机」中文意图未做语义匹配（应映射到 ECS），返回兜底 "Run hcloud --help"。基线 21.4% HIT，本轮 13/14 HIT=92.9%，E01 是少数 MISS 项之一。
- **影响**：中文意图路由准确率——「云主机」是 ECS 的常见中文同义词，未识别影响中文用户体验。
- **证据**：`evidence/EXP-E01/stdout.log` — `verdict=MISS expect=ECS got=Run hcloud --help`
- **状态**：待提单（与 2026-10-25 同一缺陷，历史单待复核）

## #5【P2】D4-25 错误消息中 Bearer token 未脱敏

- **现象**：`redactSecrets('Authorization: Bearer abc123 token=xyz.ak.sk')` 输出 `Authorization: <redacted> abc123 token=<redacted>`，`abc123`（Bearer token 值）原样泄漏。
- **断言**：`redactSecrets('Authorization: Bearer abc123 token=xyz.ak.sk')` 应将 `abc123` 替换为 `<redacted>`，输出不含 `abc123`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的正则匹配 `Authorization` 头但只脱敏 `Authorization:` 后到第一个空格的部分（即 `Bearer` 被误判为值），未覆盖 `Authorization: Bearer <token>` 形式中的 Bearer token 值。`safety-policy.mjs` 缺少 `bearer\s+[a-z0-9._-]+` 或 `Authorization:\s*Bearer\s+[^\s]+` 的脱敏规则。
- **影响**：HTTP Authorization Bearer token 在错误日志中原样输出，违反凭证脱敏基线（OAuth/JWT token 可被重放）。
- **证据**：`evidence/D4-25/stdout.log` — `redacted` 字段含 `abc123`
- **状态**：待提单（新缺陷，2026-10-26 首次发现）

