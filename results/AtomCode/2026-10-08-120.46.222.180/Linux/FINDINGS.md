# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-10-08-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-10-08 05:30:00`（北京时间）
> **被测版本（SUT）**：`hdk gitHead ffd7b47`（v1.1.8-next.1；全局 CLI `--version`=1.1.8-next.1，doctor/--help 横幅仍显示 v1.1.7）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 按标题与「根因」字段解析，格式需严格遵循。

---

## #1【P0】D2-4 凭证脱敏对 JSON 键值形态漏脱敏

- **现象**：`redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}')` 原样返回，未脱敏（d2-auth 探针 `redact-json` FAIL；supplement 直调佐证）
- **断言**：JSON 字符串内的 ak/sk/token 键值应全部脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42-45` — `redactString` 键名正则仅匹配 `key[:=]value`（扁平 `key:value`）形态，不识别 JSON `"key":"value"` 结构
- **影响**：凭证以 JSON 形态经日志/遥测/会话输出时明文泄漏（I 类风险）
- **证据**：`evidence/D2-4/stdout.log`

## #2【P1】D9-2 JSON-RPC 非法参数未返回 -32602

- **现象**：`tools/list` 传非法 params 未返回 `-32602`（protocol-probe `D9-2b invalid-params` FAIL，实际=无 error 对象）
- **断言**：非法 params 应返回 JSON-RPC 标准错误码 `-32602 (Invalid params)`
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57-59` — `tools/list` 分支直接返回工具列表，无 params 类型/合法性校验，未按 JSON-RPC 规范返回 -32602
- **影响**：MCP 客户端错误参数时得不到规范错误码，协议合规性缺失
- **证据**：`evidence/D9-2/stdout.log`

## #3【P1】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities.notifications` 缺失（protocol-probe `D9-9a-capabilities.cancellation` SPEC-MISMATCH；实际=未声明）
- **断言**：`initialize.result.capabilities.notifications` 应声明 `cancellation` 通知能力
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49` — `capabilities` 仅声明 `tools`，未声明 `notifications.cancellation`
- **影响**：实现与 MCP 协议契约漂移，客户端无法依赖标准取消通知
- **证据**：`evidence/D9-9/stdout.log`

## #4【P1】D4-27 双路径输出脱敏漏小写 ak=/sk= 短形

- **现象**：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` → `token=<redacted> ak=AKID456 sk=secret789`（ak=/sk= 小写短形仍明文）
- **断言**：`ak=`/`sk=` 的值应与 `token=` 一样脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — 仅有 `(AK|SK)\s*[:=]` 大写短形，缺小写 `ak`/`sk` 短形键名
- **影响**：凭证以紧凑 `key=value` 形态输出时 ak/sk 明文残留
- **证据**：`evidence/D4-27/stdout.log`

## #5【P1】D3-S1 自然语言「只读查 ECS」未路由到 ECS

- **现象**：`service_catalog('列出cn-north-4的ECS，只读不改')` 返回 `Run hcloud --help` 未命中 ECS（supplement 直调 MISS）
- **断言**：含「ECS + 只读」的自然语言整句应命中 ECS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2191-2195` — 纯 ASCII 关键词走 `tokens.has(kw)` 精确分词匹配，英文缩写粘中文后（如「的ECS」）无法命中
- **影响**：用户用自然语言描述 ECS 只读查询时路由落空，退化 help
- **证据**：`evidence/D3-S1/stdout.log`

## #6【P1】D3-S2 自然语言「删 VPC 先确认」未路由到 VPC

- **现象**：`service_catalog('删除测试VPC，先列命令确认')` 返回 `Run hcloud --help` 未命中 VPC（supplement 直调 MISS）
- **断言**：含「VPC + 先确认」的自然语言整句应命中 VPC 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2191-2195` — 同 D3-S1，「VPC」粘中文后未分词为独立 token，`tokens.has('vpc')` 为假
- **影响**：删除 VPC 类写操作意图无法进入审批流，退化为 help
- **证据**：`evidence/D3-S2/stdout.log`

## #7【P1】D3-S3 自然语言「沙箱预览」未路由到 Sandbox

- **现象**：`service_catalog('部署当前项目到沙箱给我预览链接')` 返回 `Run hcloud --help` 未命中 Sandbox（supplement 直调 MISS）
- **断言**：含「沙箱/预览」的自然语言整句应命中 Sandbox 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2146-2158` — Sandbox routeMap 中文关键词仅「网站/网页/静态」，缺「沙箱」「预览」等核心中文表述
- **影响**：沙箱预览场景（高频）路由落空，退化为 help
- **证据**：`evidence/D3-S3/stdout.log`

## #8【P1】EXP-E01 中文意图「云主机」未路由到 ECS

- **现象**：`service_catalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 `Run hcloud --help`，未命中 ECS（run-eval D10-3 EXP-E01 MISS；路由准确率 92.9%，仅此 1 条 MISS）
- **断言**：「云主机」意图应命中 ECS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1978-1980` — ECS routeMap 关键词缺「云主机」这一常见中文别名
- **影响**：用户用「云主机」描述 ECS 时路由落空，退化为 help
- **证据**：`evidence/EXP-E01/stdout.log`

## #9【P2】D3-S5 复合意图分层路由未命中多服务

- **现象**：`service_catalog('物联网+时序数据+前端托管')` 返回 `Run hcloud --help`，未命中 OBS/DDS/DCS 等多服务（supplement 直调 MISS）
- **断言**：复合意图（物联网+时序+前端托管）应分层命中多个服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1968-2188` — routeMap 缺「物联网/时序数据/前端托管」等复合意图关键词，且为单服务命中模型，无分层多服务路由
- **影响**：复合意图场景路由落空，退化为 help
- **证据**：`evidence/D3-S5/stdout.log`

## #10【P2】D8-9 遥测值未脱敏

- **现象**：`sanitizeValue('AK=ABC123XYZ')` 原样返回，未脱敏（supplement 直调佐证）
- **断言**：遥测值中的凭证（AK/SK/token）应脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` — `sanitizeValue` 仅裁剪空白与长度，未调用 `redactSecrets`，遥测事件凭证字段明文上报
- **影响**：遥测上报数据中凭证值明文残留（信息泄漏）
- **证据**：`evidence/D8-9/stdout.log`

## #11【P2】D4-25 Python hook 写命令未分类 cli:write

- **现象**：`record_cli_event('hcloud ECS CreateServers --adminPass=x')` 事件键为 `cli:invoke`（预期 `cli:write`）；`cli:read`（ListServers）/`cli:invoke`（未知动作）均正确
- **断言**：写命令（Create/Delete/Update 等 write verb）事件键应为 `cli:write`
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` — `WRITE_OPERATION_RE` 边界 `(^|[A-Za-z0-9])` 要求写前缀前无空格，无法命中标准的空格分隔 `Service Operation` 命令格式（如 `ECS CreateServers`），`is_write` 落入 else 分支 `cli:invoke`
- **影响**：写操作遥测分类缺失，安全干预数据不完整（分类键错标，不影响拦截决策但影响遥测归因）
- **证据**：`evidence/D4-25/stdout.log`、`evidence/supplement/probe-supplement2.mjs.out.log`（`D4-25 事件键 cli:write => false`）