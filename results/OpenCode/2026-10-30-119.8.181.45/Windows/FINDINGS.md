# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-10-30-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-30 05:15:00（北京时间）
> **被测版本**：1.1.13-next.0

---

## #1【P0】D2-4 凭证脱敏正确性 — lowercase ak= 未脱敏

- **现象**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 返回值包含明文 AK 和 SK（akLeak=true, skLeak=true）
- **断言**：`redactSecrets('config: ak=<testAk> sk=<testSk>')` 返回值不得包含 `<testAk>` 或 `<testSk>` 子串
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `.replace(/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g, '$1=<redacted>')` 正则表达式仅匹配大写 `AK`/`SK`（无 `i` 标志），小写 `ak=`/`sk=` 模式未被任何规则匹配（第42行规则匹配 `access_key`/`secret_key` 等完整词，不匹配裸 `ak`/`sk`）
- **影响**：凭证可能在日志/输出中以小写 `ak=`/`sk=` 格式泄露，安全风险
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文secret API拦截 — KMS DecryptData 未被拦截

- **现象**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy')` 返回 `decision=allow`，未拦截。KMS DecryptData 返回明文密钥数据，应被 deny。
- **断言**：`classifyTextCommand('hcloud KMS DecryptData ...')` 返回 `decision` 为 `deny` 或 `warn`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:56` — `hwc-command-secret-value-read` 规则的 regex 仅匹配 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue`，未包含 `DecryptData` 或 `DecryptDatakey`。DEW skill 文档明确标注 `KMS DecryptData` 为 BLOCKED 操作，但风险规则引擎未实现该拦截。
- **影响**：明文密钥可能通过 KMS DecryptData 命令泄露到 agent 上下文
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01 service_catalog 路由 — "云主机" 关键词未命中 ECS

- **现象**：`huaweicloud_service_catalog({ intent: '帮我查一下我账号在华北北京四有哪些云主机' })` 返回 `recommendedServices: ['Run hcloud --help to list available services.']`，未路由到 ECS
- **断言**：`recommendedServices` 包含 `'ECS'`
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2200-2212` — ECS 路由的 keywords 列表包含 `弹性云服务器`、`云服务器`、`服务器`、`虚拟机`，但未包含 `云主机`。"云主机"是华为云控制台和中文用户常用同义词。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
