# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-11-03-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-03 05:12:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**，否则自动提单解析失败/漏缺陷。

---

## #1【P0】D2-4 凭证脱敏正则缺 i 标志，小写 ak=/sk= 攻击泄漏 AK/SK 原文

- **现象**：`redactSecrets('config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY')` 返回 `config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`，AK/SK 原文未被替换
- **断言**：输入含 `ak=<值> sk=<值>`（小写）时，`redactSecrets` 返回字符串不得包含原 AK/SK 值（应替换为 `<redacted>`）
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `redactString` 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 未加 `i` 标志，无法匹配小写 `ak=/sk=` 前缀；上一行（line 42）的 `access_key/secret_key` 正则已加 `i`，此处遗漏
- **影响**：攻击者构造 `ak=xxx sk=xxx` 小写输入可绕过脱敏，凭证在日志/findings/回显中原文泄漏，属 I 类安全红线
- **证据**：`evidence/D2-4/stdout.log` — `akLeak=true, skLeak=true, redacted="config: ak=TESTAK... sk=TESTSK..."`
- **状态**：待提单

## #2【P0】D4-3 KMS DecryptData 未被安全策略拦截，decision=allow

- **现象**：`classifyTextCommand('hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy')` 返回 `decision='allow'`，解密敏感数据的 API 未触发 deny/warn
- **断言**：`classifyTextCommand('hcloud KMS DecryptData ...')` 返回 `decision` 必须为 `deny` 或 `warn`（敏感解密操作必须拦截）
- **根因**：`plugins/huaweicloud-core/safety/policy.json` — `blockedSecretOperations` 列表仅含 `["ShowSecret","ShowSecretVersion","DownloadSecret","GetSecretValue"]`，未包含 `DecryptData`；`writeOperationPrefixes` 也不含 `Decrypt` 前缀，导致 KMS DecryptData 被当作未知操作默认 allow
- **影响**：KMS DecryptData 可解密密文敏感数据，未被安全策略拦截属 I 类安全红线，攻击者可通过 Agent 调用该 API 解密受保护数据
- **证据**：`evidence/D4-3/stdout.log` — `decision="allow"`
- **状态**：待提单

## #3【P1】EXP-E01 service_catalog 路由表缺「云主机」别名，ECS 意图 MISS

- **现象**：`huaweicloud_service_catalog(intent='帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices=["Run hcloud --help to list available services."]`，未命中 ECS
- **断言**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 必须含 `ECS`
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2199-2215` — ECS 路由 keywords 为 `['ecs','server','vm','instance','compute','flavor','image','弹性云服务器','云服务器','服务器','虚拟机','镜像']`，不含 `云主机`；`云主机` 是华为云控制台/用户常用 ECS 别名
- **影响**：用户使用「云主机」描述 ECS 需求时，serviceCatalog 路由 MISS，无法推荐 ECS 技能/服务，影响用户体验
- **证据**：`evidence/EXP-E01/stdout.log` — `verdict="MISS", got=["Run hcloud --help to list available services."]`
- **状态**：待提单
