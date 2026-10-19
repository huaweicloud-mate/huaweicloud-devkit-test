# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-20-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-20 05:10:00（北京时间）

---

## #1【P0】D2-4 凭证脱敏未覆盖小写 ak=/sk= 攻击输入

- **现象**：调 `safetyPolicy.redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')`，返回原样未脱敏，明文 AK/SK 泄漏到输出（akLeak=true skLeak=true）。
- **断言**：`redactSecrets(input)` 返回值中 `includes(testAk)` 必须为 false、`includes(testSk)` 必须为 false（即 ak=/sk= 的值被替换为 `<redacted>`）。
- **根因**：`hdk/plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` 的正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 仅匹配大写 `AK`/`SK`，未覆盖小写 `ak=`/`sk=` 攻击变体；第 42 行 `access[_-]?key|secret[_-]?key` 模式也未命中裸 `ak=`/`sk=` 简写。
- **影响**：攻击者构造 `ak=xxx sk=yyy` 小写格式可绕过脱敏，明文凭证进入 agent 上下文/日志，违反 nightly 铁律 3（凭证脱敏）。
- **证据**：`evidence/D2-4/stdout.log`（akLeak=true skLeak=true redacted 原样输出）。
- **状态**：待提单

## #2【P0】D4-3 KMS DecryptData 明文解密未拦截

- **现象**：调 `classifyTextCommand('hcloud KMS DecryptData --plaintext=Lwo3')`，返回 `decision: allow, risk: unknown_read`，未被拦截；DecryptData 会解密出明文 secret。
- **断言**：`classifyTextCommand('hcloud KMS DecryptData ...')` 返回 `decision === 'deny'`（DecryptData 属明文 secret API，应被 secret 拦截规则阻断）。
- **根因**：`hdk/plugins/huaweicloud-core/safety/policy.json:26` — `blockedSecretOperations` 仅含 `["ShowSecret","ShowSecretVersion","DownloadSecret","GetSecretValue"]`，未含 KMS `DecryptData`；`safety-policy.mjs:257` 的正则 `secret[_-]?string|secret_binary|showsecret|showsecretversion|getsecretvalue` 也不匹配 `DecryptData`。
- **影响**：KMS DecryptData 可解密出明文 secret 进入 agent 上下文，违反 secret 拦截防线。
- **证据**：`evidence/D4-3/stdout.log`（decision=allow）。
- **状态**：待提单
