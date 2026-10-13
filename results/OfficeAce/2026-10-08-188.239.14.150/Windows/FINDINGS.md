# FINDINGS — 缺陷发现清单（OfficeAce-glm-5.2）

> **落盘路径**：`results/OfficeAce/2026-10-08-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-10-08 14:55:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1（gitHead: ffd7b474）

---

## #1【P0】D4-16 命令包裹穿透

- **现象**：构造 shell 包裹命令 `sh -c "hcloud ECS DeleteServers ..."` 执行时，hook_check_command 返回 decision=allow，未检测内层命令
- **断言**：hook_check_command 对包裹命令必须返回 decision=deny
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1147` — hook_check_command 调用 evaluateCommandRisk（risk-rule-engine.mjs:143），仅对原始命令字符串做正则规则匹配，从未调用 safety-policy.mjs 中的 classifyTextCommand/extractInnerCommand（shell 包裹拆解逻辑所在）。包裹命令整体送入规则引擎，无规则匹配包裹层 → 返回 allow
- **影响**：攻击者可通过 shell 包裹绕过安全检查执行任意 hcloud 命令，安全风险高
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #2【P1】D4-27 双路径输出脱敏不完整

- **现象**：redactSecrets 与 redactOutput 双路径脱敏后，输出中 {"ak":"AKID123","sk":"SK1234567890abcdef","token":"STSTOKEN1...} 凭证仍为明文
- **断言**：redactSecrets(text) 与 redactOutput(text) 均须将 ak/sk/token 明文替换为占位符（如 ***REDACTED***）
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:776-777` — redactOutput 先执行 text.substring(bracketIdx) 截掉首个 { 前的前缀文本（前缀中凭证被丢弃非脱敏）；JSON 路径仅脱敏 isSecretKeyName 能识别的键名（safety-policy.mjs:20 正则不匹配短键名 ak/sk）；字符串回退路径 redactString 仅匹配 key:=value 格式
- **影响**：凭证可能以明文形式输出到日志/终端，存在信息泄漏风险
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #3【P1】EXP-E01 serviceCatalog 路由未命中 ECS 意图

- **现象**：serviceCatalog 路由层接收中文意图"创建ECS"时，返回 MISS（"Run hcloud --help to list available services."），未路由到 ECS 服务
- **断言**：serviceCatalog("创建ECS") 必须返回 recommendedServices 含 ECS
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2191` — 分词器 it.split(/[\s,./-]+/) 不在 CJK 与拉丁字符间切分。"创建ECS" 经 toLowerCase() → "创建ecs"，无分隔符 → 整体成为一个 token "创建ecs"。路由匹配 tokens.has('ecs') → false（实际 token 是 "创建ecs"），所有路由条目均不命中 → MISS
- **影响**：中文意图路由失败率升高，用户需手动指定服务名
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
