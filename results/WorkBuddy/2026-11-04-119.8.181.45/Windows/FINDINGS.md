# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-11-04-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-04 05:08:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P0】D2-4 凭证脱敏正确性 - 小写 ak=/sk= 攻击未被脱敏

- **现象**：输入 `config: ak=TESTAKXXXXXXXXXXXXXXXX sk=TESTSKYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY` 调用 `redactSecrets`，返回值仍含完整 TESTAK 与 TESTSK 明文（akLeak=true, skLeak=true）。
- **断言**：`redactSecrets` 对 `ak=<value>` / `sk=<value>` 小写形式必须脱敏为 `<redacted>`，返回值不得包含原始 AK/SK 字符串。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — 正则 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 只匹配大写 `AK`/`SK`，未加 `i` 忽略大小写标志，导致小写 `ak=`/`sk=` 形式的凭证值不被脱敏。攻击者可用小写键名绕过脱敏输出。
- **影响**：凭证泄露风险 — 含 AK/SK 的日志/输出中小写键名变体可绕过脱敏，导致明文凭证落盘/落日志。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 明文 secret API 拦截 - KMS DecryptData 被误判 allow

- **现象**：输入 `hcloud KMS DecryptData --cipher_text=xxx --key_id=yyy` 调用 `classifyTextCommand`，返回 `decision: "allow"`（期望 deny 或 warn）。
- **断言**：`classifyTextCommand` 对 `KMS DecryptData`（解密敏感数据操作）必须返回 `deny` 或 `warn`，不得返回 `allow`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:524` `classifyTextCommand` 函数 — `classifyHcloudArgs`（行185）的风险规则中未将 `KMS DecryptData`/`DecryptData` 列入 deny/warn 规则。`classifyHcloudArgs` 仅对写操作（Delete/Create 等）和凭证文件读取做拦截，KMS 解密操作不在风险规则列表中，导致落入 `not_huaweicloud` allow 默认路径（行383）。
- **影响**：安全风险 — KMS DecryptData 可解密敏感密文，若被 allow 则用户可直接执行该命令而无需审批，存在敏感数据泄露风险。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01 service_catalog 路由 - "云主机"意图未命中 ECS

- **现象**：输入 prompt `帮我查一下我账号在华北北京四有哪些云主机` 调用 `huaweicloud_service_catalog`，返回 `recommendedServices: ["Run hcloud --help to list available services."]`（期望包含 ECS），verdict=MISS。
- **断言**：`serviceCatalog` 对含"云主机"关键词的意图必须路由到 ECS 服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2263` `serviceCatalog` 函数的 routeMap 中 ECS 关键词列表（行2271-2284）含 `云服务器`、`服务器`、`虚拟机` 但 **未含 `云主机`**。"云主机"是华为云 ECS 的常见中文别名，缺失导致路由失败返回 fallback 消息。
- **影响**：用户用"云主机"描述需求时无法路由到 ECS 服务，影响用户体验和工具可用性。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
