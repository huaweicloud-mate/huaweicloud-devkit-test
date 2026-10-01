# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-10-02-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：`2026-10-02 05:30:00`（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。
> **被测版本（SUT）**：`huaweicloud-devkit@1.1.8-next.1`（npm next；源码 gitHead `ffd7b47`）

---

## #1【P0】D2-4 凭证脱敏对 JSON 键值形态漏脱敏

- **现象**：`redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}')` 原样返回，未脱敏（d2-auth 探针 `redact-json` FAIL；supplement 直调佐证）
- **断言**：JSON 字符串内的 ak/sk/token 键值应全部脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` — `redactString` 键名正则仅覆盖 `access_key|secret_key|token|password|admin_pass|credential` 等长形（:42-45）与大写 `AK|SK`（:47），且只匹配 `key=value`/`key:value` 分隔，不识别 JSON `"key":"value"` 结构
- **影响**：凭证以 JSON 形态经日志/遥测/会话输出时明文泄漏（I 类风险）
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单（1.1.7 已存在，1.1.8-next.1 仍存在）

## #2【P1】D4-27 双路径输出脱敏漏小写 ak=/sk= 短形

- **现象**：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` → `token=<redacted> ak=AKID456 sk=secret789`（ak=/sk= 小写短形仍明文）
- **断言**：`ak=`/`sk=` 的值应与 `token=` 一样脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:47` — 仅有 `(AK|SK)\s*[:=]` 大写短形，缺小写 `ak`/`sk` 短形键名
- **影响**：凭证以紧凑 `key=value` 形态输出时 ak/sk 明文残留
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单（1.1.7 已存在，1.1.8-next.1 仍存在）

## #3【P1】EXP-E01 中文意图「云主机」未路由到 ECS

- **现象**：`service_catalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 `Run hcloud --help`，未命中 ECS（run-eval D10-3 EXP-E01 MISS；路由准确率 92.9%，仅此 1 条 MISS）
- **断言**：「云主机」意图应命中 ECS 服务
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1970-1983` — ECS routeMap 关键词含「弹性云服务器/云服务器/服务器/虚拟机/镜像」，但缺「云主机」这一常见中文别名
- **影响**：用户用「云主机」描述 ECS 时路由落空，退化为 help（1.1.8-next.1 已大幅补齐中文关键词，仅剩此别名缺口）
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #4【P1】D9-2 JSON-RPC 非法参数未返回 -32602

- **现象**：`tools/list` 传非法 params 未返回 `-32602`（protocol-probe `D9-2b invalid-params` FAIL，实际=无 error 对象）
- **断言**：非法 params 应返回 JSON-RPC 标准错误码 `-32602 (Invalid params)`
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57-60` — `tools/list` 分支直接返回工具列表，无 params 类型/合法性校验，未按 JSON-RPC 规范返回 -32602
- **影响**：MCP 客户端错误参数时得不到规范错误码，协议合规性缺失
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：待提单（1.1.7 已存在，1.1.8-next.1 仍存在）

## #5【P1】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities.notifications` 缺失（protocol-probe `D9-9a-capabilities.cancellation` SPEC-MISMATCH；实际=未声明）
- **断言**：`initialize.result.capabilities.notifications` 应声明 `cancellation` 通知能力
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46-48` — `capabilities` 仅声明 `tools`，未声明 `notifications.cancellation`
- **影响**：实现与 MCP 协议契约漂移，客户端无法依赖标准取消通知
- **证据**：`evidence/D9-9/stdout.log`（protocol-probe D9-9a）
- **状态**：待提单

## #6【P2】D8-9 遥测值未脱敏

- **现象**：`sanitizeValue('AK=ABC123XYZ')` 原样返回，未脱敏（supplement 直调佐证）
- **断言**：遥测值中的凭证（AK/SK/token）应脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` — `sanitizeValue` 仅裁剪空白与长度，未调用 `redactSecrets`，遥测事件凭证字段明文上报
- **影响**：遥测上报数据中凭证值明文残留（信息泄漏）
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单（1.1.7 已存在，1.1.8-next.1 仍存在）