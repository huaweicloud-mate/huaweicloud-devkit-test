# FINDINGS — 缺陷发现清单（OfficeAce-glm-5.2）

> **落盘路径**：`results/OfficeAce/2026-10-09-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-10-09 09:00:00（北京时间）
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

## #3【P1】EXP-E01~E14 serviceCatalog 路由未命中中文意图（11 条用例同根因）

- **现象**：serviceCatalog 路由层接收中文意图（如"创建ECS"、"查看VPC列表"等）时，返回 MISS（"Run hcloud --help to list available services."），未路由到对应服务。影响 EXP-E01~E05, E07, E10~E14 共 11 条评测用例
- **断言**：serviceCatalog(中文意图) 必须返回 recommendedServices 含对应服务名（如 serviceCatalog("创建ECS") 含 ECS）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2191` — 分词器 it.split(/[\s,./-]+/) 不在 CJK 与拉丁字符间切分。"创建ECS" 经 toLowerCase() → "创建ecs"，无分隔符 → 整体成为一个 token "创建ecs"。路由匹配 tokens.has('ecs') → false（实际 token 是 "创建ecs"），所有路由条目均不命中 → MISS
- **影响**：中文意图路由失败率升高（基线 21.4% MISS），用户需手动指定服务名
- **证据**：`evidence/EXP-E01/stdout.log`（代表），其余 EXP-E02~E05/E07/E10~E14 同源
- **状态**：待提单

## #4【P2】D1-66 sanitizeValue 未清除换行/制表符

- **现象**：sanitizeValue 处理含换行符 \n 和制表符 \t 的字符串时，输出 "hello/nworld/ttab" 而非 "hello world tab"（换行/制表符未被替换为空格）
- **断言**：sanitizeValue("hello\nworld\ttab") 必须返回 "hello world tab"（\n 和 \t 替换为空格）
- **根因**：`plugins/huaweicloud-core/src/telemetry.mjs` sanitizeValue 函数 — 截断逻辑（>255 字符截断 + "..."）正常工作，但未对换行符 \n 和制表符 \t 做替换/清除处理
- **影响**：遥测数据中含换行/制表符的值可能破坏日志格式或注入额外行
- **证据**：`evidence/D1-66/stdout.log`（pass=6 fail=1，仅 sanitize-newlines 子项失败）
- **状态**：待提单

## #5【P2】D1-69 --version 输出版本号匹配逻辑未命中

- **现象**：执行 `--version` 时 stdout 输出 "HuaweiCloud DevKit CLI: 1.1.8-next.1"，但版本号检测逻辑返回 undefined（期望 true）
- **断言**：--version 输出必须包含可识别的版本号格式（如 semver x.y.z 或 x.y.z-next.n），检测逻辑返回 true
- **根因**：`plugins/huaweicloud-core/src/cli.mjs` --version 输出格式 "HuaweiCloud DevKit CLI: 1.1.8-next.1" 与检测正则不匹配。输出含多行插件列表（OpenCode/Codex/OpenClaw 等），版本号检测可能只检查首行或使用了不匹配的格式假设
- **影响**：自动化脚本/CI 检测版本号时无法正确解析，影响版本校验流程
- **证据**：`evidence/D1-69/stdout.log`（pass=10 fail=1，仅 version-output 子项失败）
- **状态**：待提单
