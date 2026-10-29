# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-10-29-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-29 21:22:39（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D4-15 hook绕过尝试-大小写变体未拦截

- **现象**：classifyTextCommand 对 "Deleteserver --server-ids=xxx" 和 "DELETEserver --server-ids=xxx" 返回 decision=allow，未拦截大小写变体的删除命令。而 "hcloud ECS DeleteServers --server-ids=xxx" 正确返回 decision=deny。
- **断言**：classifyTextCommand("Deleteserver --server-ids=xxx").decision === "deny"（当前实际为 "allow"，不符合预期）
- **根因**：`safety-policy.mjs:classifyTextCommand` 中写动词匹配使用大小写敏感的正则/字符串匹配，未对命令中的 delete/destroy 等关键词做 case-insensitive 匹配，导致大小写变体绕过安全规则
- **影响**：攻击者可通过大小写变体（Deleteserver/DELETEserver/deleteSERVER）绕过 hook 安全检查执行破坏性操作，安全风险高
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：待提单

## #2【P1】EXP-E01 serviceCatalog路由未命中-中文ECS查询意图

- **现象**：serviceCatalog 对中文意图 "帮我查一下我账号在华北北京四有哪些云主机" 返回 "Run hcloud --help to list available services." 而非路由到 ECS 服务。路由准确率 14/15=93.3%，此条为唯一 MISS。
- **断言**：serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") 应命中 ECS 服务（actualServices 包含 "ECS"），当前实际返回 "Run hcloud --help"
- **根因**：`tools.mjs:serviceCatalog` routeMap 中 ECS 路由关键词未覆盖 "云主机" 这一中文别名（仅匹配 "ECS"/"云服务器"/"instance" 等），"云主机" 在中文语境中是 ECS 的常见称呼但未被纳入路由关键词
- **影响**：用户使用 "云主机" 描述 ECS 查询意图时，Agent 无法正确路由到 ECS 服务，导致用户体验下降
- **证据**：`evidence/EXP-E01/stdout.log`（eval harness 结果：expected=ECS, actual=Run hcloud --help, verdict=MISS）
- **状态**：待提单
