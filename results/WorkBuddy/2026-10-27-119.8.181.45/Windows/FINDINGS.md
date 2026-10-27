# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-27-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-27 09:38:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D2-4 凭证脱敏正确性（小写 ak= / sk= 未脱敏）

- **现象**：`redactSecrets('config: ak=ABCDEFGHijkl0123456789XYZ sk=AbCdEfGhIjKlMnOpQrStUv0123456789 securityToken=abc.def.ghi')` 输出原样保留 ak/sk 值，`akLeak=true skLeak=true`。
- **断言**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 应将 ak/sk 值替换为 `<redacted>`，且 `akLeak=false skLeak=false`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的 `(AK|SK)\s*[:=]` 正则只匹配大写 `AK=`/`SK=`，不匹配 JSON 中的 `"ak":"..."` 或命令行中的 `ak=...` 小写形式；`safety-policy.mjs:20-30` `isSecretKeyName(key)` 将 key 小写化并移除非字母数字后匹配 `/access.*key|secret.*key|.../`，`ak` 归一化为 `ak`，不含 `access` 或 `secret` 子串。
- **影响**：凭证泄漏——小写 `ak=`/`sk=` 形式的 AK/SK 在日志/错误消息中原样输出，违反凭证脱敏基线。
- **证据**：`evidence/D2-4/stdout.log` — `akLeak=true skLeak=true`，`redacted` 字段原样保留测试 AK/SK
- **状态**：待提单（与 2026-10-25/26 同一缺陷，历史单待复核）

## #2【P0】D4-3 明文 secret API 拦截（KMS DecryptData 未拦截）

- **现象**：`classifyTextCommand('hcloud KMS DecryptData --cli-region=cn-north-4 --cipher_text=xxx').decision === 'allow'`，KMS DecryptData 返回明文密文解密结果，属 secret-retrieval API，应被 deny。
- **断言**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy').decision === 'deny'`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:249` `policy.blockedSecretOperations.some(op => op.toLowerCase() === operation.toLowerCase())` 列表来自 `plugins/huaweicloud-core/safety/policy.json:26`：`["ShowSecret", "ShowSecretVersion", "DownloadSecret", "GetSecretValue"]`，**缺 `DecryptData`/`Decrypt`**；`safety-policy.mjs:257` `secret[_-]?string|secret[_-]?binary|showsecret|showsecretversion|getsecretvalue` 正则未覆盖 `decryptdata` 操作名。
- **影响**：安全绕过——KMS DecryptData 可解密密文返回明文，未拦截属 secret-retrieval 防护缺口。
- **证据**：`evidence/D4-3/stdout.log` — `decision=allow`
- **状态**：待提单（与 2026-10-25/26 同一缺陷，历史单待复核）

## #3【P1】EXP-E01 serviceCatalog 中文意图路由未命中（"云主机"→ECS）

- **现象**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 `Run hcloud --help to list available services.`，未命中 ECS 路由。
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应命中 ECS 查询路由（expect=ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由层对中文别名"云主机"未建立到 ECS 服务的映射；`eval/harness/run-eval.mjs` 基线 21.4% MISS 中本条稳定复现（2026-10-27 复测仍 MISS）。
- **影响**：中文用户意图"云主机"无法路由到 ECS 服务，用户需手动指定服务名，影响中文场景可用性。
- **证据**：`evidence/EXP-E01/stdout.log` + `eval/results/eval-run-20261027013809.csv` — `verdict=MISS, got=Run hcloud --help to list available services.`
- **状态**：待提单
