# FINDINGS — 缺陷发现清单（OfficeAce-testbot4）

> **落盘路径**：`results/OfficeAce/2026-11-04-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-04 05:50:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D2-4 凭证脱敏不完整：小写 ak=/sk= 明文泄漏

- **现象**：safety-policy 对 `config: ak=TESTAKXXX... sk=TESTSK...` 无遮挡，SK 全文泄漏。实测`akLeak=true skLeak=true`。
- **断言**：输出无明文凭证字段（AK 中段遮挡、SK 全文遮挡）。
- **根因**：`hdk/hdk/plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的 AK/SK 正则 `/(AK|SK)\s*[:=]\s*(...)/g` 未加 `i` 标志且只匹配大写 `AK|SK`，小写 `ak=`/`sk=` 命中不到；`hdk/hdk/plugins/huaweicloud-core/safety/policy.json` `secretKeyNamePatterns` 虽含小写 `ak`/`sk`（仅作用于对象键名），但纯文本字符串脱敏未走该表。
- **影响**：凭证脱敏被大小写绕过，SkyKeyword 明文进入 agent 上下文，安全红线。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-3 明文 secret API 未拦截：KMS DecryptData 决策为 allow

- **现象**：`DecryptData`（返回明文/二进制 secret 的 API）无阻断，`decision=allow`。
- **断言**：应被阻断（明文 secret 不进 agent 上下文）。
- **根因**：`hdk/hdk/plugins/huaweicloud-core/safety/policy.json` `blockedSecretOperations` 仅含 `["ShowSecretVersion","DownloadSecret","GetSecretValue"]`，未纳入 KMS `DecryptData`；safety-policy.mjs 中与 operation 精确匹配的 deny 分支因此未命中，write/execution 前缀判定也不覆盖 `Decrypt`。
- **影响**：明文 secret 解密类 API 可越权调用，敏感信息明文入上下文。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P1】EXP-E01 服务路由漏配：中文「云主机」意图未识别为 ECS

- **现象**：意图「帮我查一下我账号在华北北京四有哪些云主机」路由未命中 ECS，返回兜底 `Run hcloud --help to list available services.`，`verdict=MISS expect=ECS`。
- **断言**：serviceCatalog 应命中 ECS 并走只读查询。
- **根因**：`hdk/hdk/plugins/huaweicloud-core/src/tools.mjs:1815` `serviceCatalog()` `routeMap[0]`（ECS 路由）keywords 仅英文 `ecs/server/vm/instance/compute/flavor/image`，缺中文关键词（如「云主机」「云服务器」）；中文「云服务器」在 E02 命中是因「服务器」命中自有分词，而「云主机」无对应 token。
- **影响**：ECS 相关中文意图路由失败，走兜底提示，产品能力覆盖缺失。
- **证据**：`evidence/EXP-E01/stdout.log`

## #4【非产品缺陷】环境阻塞（不计入提单）

- **现象**：D1-67 / D3-C3 / D3-C14 / D3-S3 / D3-S7 共 5 例 BLOCKED，均因沙箱（DevStation）/DSH 客户端需真实网络或特定客户端环境。
- **说明**：环境/客户端限制，非被测产物缺陷，不计入提单。