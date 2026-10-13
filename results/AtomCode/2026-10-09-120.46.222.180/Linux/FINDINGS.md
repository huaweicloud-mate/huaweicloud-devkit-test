# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **生成时间**：2026-10-09（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.8-next.1（gitHead `ffd7b47`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py`

## #1【P0】D2-4 凭证脱敏 JSON 键值形态漏脱敏

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 原样返回，JSON 键值形态的 ak/sk/token 未脱敏。
- **断言**：JSON 内 ak/sk/token 值应全部返回 `<redacted>`。
- **根因**：`safety-policy.mjs:41-45` — `redactString` 的键值正则 `(?:access_key|secret_key|token|... )\s*[:=]\s*(...值...)` 只匹配「未加引号键名 + 冒号/等号 + 值」形态，无法识别 JSON `"ak":"value"`（键名带引号、冒号紧贴键）的键值对，故 JSON 形态整段漏脱敏。
- **影响**：凭证以 JSON 形态输出时明文泄漏，P0 安全红线。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P1】D3-S1 自然语言「只读查 ECS」未路由到 ECS

- **现象**：`service_catalog('列出cn-north-4的ECS，只读不改')` 返回 `Run hcloud --help to list available services.`，未命中 ECS。
- **断言**：该意图应命中 `ECS`（只读场景）。
- **根因**：`tools.mjs:2193-2217` — `routeMap` 关键词对整句自然语言匹配失败，全句兜底返回 `Run hcloud --help`。
- **影响**：真实中文对话场景无法路由到正确服务，降级到 help 兜底。
- **证据**：`evidence/D3-S1/stdout.log`
- **状态**：待提单

## #3【P1】D3-S2 自然语言「删 VPC 先确认」未路由到 VPC

- **现象**：`service_catalog('删除测试VPC，先列命令确认')` 返回 `Run hcloud --help to list available services.`，未命中 VPC。
- **断言**：该意图应命中 `VPC` 并走先确认审批流。
- **根因**：`tools.mjs:2193-2217` — `routeMap` 关键词对自然语言全句匹配失败。
- **影响**：删除类场景路由失效。
- **证据**：`evidence/D3-S2/stdout.log`
- **状态**：待提单

## #4【P1】D3-S3 自然语言「沙箱预览」未路由到 Sandbox

- **现象**：`service_catalog('部署当前项目到沙箱给我预览链接')` 返回 `Run hcloud --help to list available services.`，未命中 Sandbox。
- **断言**：该意图应命中 `Sandbox` 沙箱预览。
- **根因**：`tools.mjs:2193-2217` — `routeMap` 关键词对自然语言全句匹配失败。
- **影响**：沙箱预览场景路由失效。
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：待提单

## #5【P1】D4-27 双路径输出脱敏漏小写短形 ak=/sk=

- **现象**：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` 返回 `token=<redacted> ak=AKID456 sk=secret789`，小写 ak=/sk= 值明文残留。
- **断言**：ak=/sk= 等小写短形键的值也应脱敏为 `<redacted>`。
- **根因**：`safety-policy.mjs:45` — `(AK|SK)\s*[:=]...` 短形正则仅匹配大写 AK/SK，未覆盖小写 `ak`/`sk`。
- **影响**：双路径输出（命令行日志等）凭证小写键值明文泄漏。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #6【P1】D9-2 JSON-RPC 非法参数未返回 -32602

- **现象**：`tools/list` 传非法 params 时无 error 对象返回，未遵循 JSON-RPC `-32602 Invalid params`。
- **断言**：非法参数应返回 `-32602`。
- **根因**：`mcp-protocol.mjs:57-59` — `tools/list` 分支无 params 类型校验，直接返回工具列表（-32602 仅用于已配置的 unknownTool 与 tools/call 缺字段分支，未覆盖 tools/list 的 params）。
- **影响**：协议合规性不足，客户端无法按标准错误码处理非法调用。
- **证据**：`eval/results/protocol-probe-20261008210818.json`（D9-2b FAIL）
- **状态**：待提单

## #7【P1】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize.result.capabilities` 仅声明 `tools`，未声明 `notifications.cancellation`。
- **断言**：按 MCP 契约应声明 `notifications.cancellation`。
- **根因**：`mcp-protocol.mjs:47-49` — `capabilities` 对象仅含 `tools`，缺 `notifications.cancellation` 声明。
- **影响**：MCP 标准能力缺失（SPEC 待裁决）。
- **证据**：`eval/results/protocol-probe-20261008210818.json`（D9-9a SPEC-MISMATCH）
- **状态**：待提单

## #8【P1】EXP-E01 中文意图「云主机」未路由到 ECS

- **现象**：`service_catalog('帮我查一下我账号在华北北京四有哪些云主机')` MISS，未命中 ECS。
- **断言**：该中文意图应命中 `ECS`。
- **根因**：`tools.mjs:2193-2217` — `routeMap` 缺失「云主机」中文关键词。
- **影响**：D10-3 路由评测准确率 92.9%（14 条中 1 条 MISS）。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #9【P2】D3-S5 复合意图分层路由未命中多服务

- **现象**：`service_catalog('物联网+时序数据+前端托管')` MISS，未命中 OBS/DDS/DCS 等多服务。
- **断言**：复合意图应正确拆分并命中多个对应 service。
- **根因**：`tools.mjs:2193-2217` — `routeMap` 缺复合意图/时序类关键词拆分。
- **影响**：复合中文意图无法分层路由。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：待提单

## #10【P2】D8-9 遥测值未脱敏

- **现象**：`sanitizeValue('AK=ABC123XYZ')` 原样返回 `AK=ABC123XYZ`，未脱敏。
- **断言**：遥测上报前应脱敏 AK/SK/token 等敏感值。
- **根因**：`telemetry/telemetry.mjs:189-196` — `sanitizeValue` 仅裁剪空白/长度，未调用 `redactSecrets` 做脱敏。
- **影响**：遥测数据可能带明文凭证上传。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #11【P2】D4-25 Python hook 写命令未分类 cli:write

- **现象**：`record_cli_event('hcloud ECS CreateServers --adminPass=x')` 事件键 = `cli:invoke`（预期 `cli:write`）。
- **断言**：写操作事件键应为 `cli:write`。
- **根因**：`hooks/huaweicloud-safety.py:46` — `WRITE_OPERATION_RE` 边界 `(^|[A-Za-z0-9])` 无法命中空格分隔的 `Service Operation` 格式（CreateServers 前是空格而非字母数字）。
- **影响**：Python hook 遥测把写命令误分类为普通调用，审计/审批遥测失真。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：待提单