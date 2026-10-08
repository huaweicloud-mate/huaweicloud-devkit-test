# FINDINGS — OfficeAce Windows 每日测试缺陷清单
> 日期：2026-10-08
> 客户端：OfficeAce / OS：Windows
> 被测版本：huaweicloud-devkit@1.1.8-next.1（gitHead: ffd7b474）
> 测试报告：OfficeAce-glm-5.2-测试报告.md

---

## FINDING-1: D4-16 命令包裹穿透（P0）

- **级别**：P0
- **用例ID**：D4-16
- **维度**：D4安全
- **描述**：构造 shell 包裹命令（如 `sh -c "hcloud ECS DeleteServers ..."`）执行时，hook 未检查内层命令，直接返回 allow，安全检查被穿透
- **断言**：hook_check_command 对包裹命令必须返回 decision=deny
- **实际**：decision=allow，findings=[]
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1147` — hook_check_command 调用 evaluateCommandRisk（risk-rule-engine.mjs:143），仅对原始命令字符串做正则规则匹配，从未调用 safety-policy.mjs 中的 classifyTextCommand/extractInnerCommand（shell 包裹拆解逻辑所在）。包裹命令整体送入规则引擎，无规则匹配包裹层 → 返回 allow
- **证据**：evidence/D4-16/stdout.log
- **修复建议**：在 evaluateCommandRisk 前先调 classifyTextCommand/extractInnerCommand 拆解 shell 包裹，对内层命令递归检查

---

## FINDING-2: D4-27 双路径输出脱敏不完整（P1）

- **级别**：P1
- **用例ID**：D4-27
- **维度**：D4安全
- **描述**：redactSecrets 与 redactOutput 双路径脱敏时，AK/SK/token 明文未被替换为占位符，凭证仍以明文形式输出
- **断言**：redactSecrets(text) 与 redactOutput(text) 均须将 ak/sk/token 明文替换为占位符（如 ***REDACTED***）
- **实际**：{"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1...} 凭证明文未脱敏
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:776-777` — redactOutput 先执行 text.substring(bracketIdx) 截掉首个 { 前的前缀文本（前缀中凭证被丢弃非脱敏）；JSON 路径仅脱敏 isSecretKeyName 能识别的键名（safety-policy.mjs:20 正则不匹配短键名 ak/sk）；字符串回退路径 redactString 仅匹配 key:=value 格式
- **证据**：evidence/D4-27/stdout.log
- **修复建议**：不截断前缀文本，全量脱敏；isSecretKeyName 正则覆盖短键名 ak/sk/token；redactString 支持裸值格式

---

## FINDING-3: EXP-E01 serviceCatalog 路由未命中 ECS 意图（P1）

- **级别**：P1
- **用例ID**：EXP-E01
- **维度**：D10评测
- **描述**：serviceCatalog 路由层接收中文意图"创建ECS"时，未路由到 ECS 服务，返回 MISS（"Run hcloud --help to list available services."）
- **断言**：serviceCatalog("创建ECS") 必须返回 recommendedServices 含 ECS
- **实际**：MISS — recommendedServices 为空，返回 "Run hcloud --help to list available services."
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2191` — 分词器 it.split(/[\s,./-]+/) 不在 CJK 与拉丁字符间切分。"创建ECS" 经 toLowerCase() → "创建ecs"，无分隔符 → 整体成为一个 token "创建ecs"。路由匹配 tokens.has('ecs') → false（实际 token 是 "创建ecs"），所有路由条目均不命中 → MISS
- **证据**：evidence/EXP-E01/stdout.log
- **修复建议**：分词器在 CJK 与拉丁字符边界插入分隔，如 text.replace(/([\u4e00-\u9fff])([a-z])/gi, '$1 $2')，确保 "创建ecs" → ["创建", "ecs"]
