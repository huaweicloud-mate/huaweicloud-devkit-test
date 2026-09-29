# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-09-30-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：`2026-09-30 05:42:00`（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。

---

## #1【P0】D2-4 凭证脱敏对 JSON 键值形态漏脱敏

- **现象**：`redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}')` 原样返回，未脱敏（d2-auth 探针 `redact-json` FAIL）
- **断言**：JSON 字符串内的键值应全部脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — `redactString` 键名正则仅覆盖 `access[_-]?key|secret[_-]?key|token|password|…` 长形，缺 `ak`/`sk` 短形；且只匹配 `key=value`/`key:value`，不识别 JSON `"key":"value"` 结构
- **影响**：凭证以 JSON 形态经日志/遥测/会话输出时明文泄漏（I 类风险）
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：历史问题（上一日已记，待复核是否既有单，勿重复开单）

## #2【P1】D4-27 裸 token=/小写 ak=/sk= 未脱敏

- **现象**：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` → `token=<redacted> ak=AKID456 sk=secret789`
- **断言**：`ak=`/`sk=` 值应与 `token=` 一样脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — 键名表含 `token` 但缺 `ak`/`sk` 短形（仅有 `access[_-]?key`/`secret[_-]?key` 长形）
- **影响**：小写/短形凭证键值泄漏
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #3【P1】D4-6 adminPass 空格分隔形式值未脱敏

- **现象**：`redactSecrets('hcloud ECS CreateServers --adminPass abc123XYZ')` 整串原样返回
- **断言**：`--adminPass <值>`（空格分隔）应脱敏
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — `redactString` 分隔符仅 `[:=]`（等号/冒号），不匹配 `--adminPass <空格>值` 形态
- **影响**：ECS 创建命令中的管理员口令经日志/审批链路泄漏
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：待提单

## #4【P1】D9-2 JSON-RPC 非法参数错误码不规范

- **现象**：`tools/list` 传 `params: 'not-an-object'` 未返回错误，正常 result（protocol-probe `D9-2b invalid-params` FAIL）
- **断言**：非法 params 应返回 `error.code = -32602`
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` — `tools/list` 分支未做 params 类型校验（`tools/call` 分支 :62 才有入参校验）
- **影响**：协议客户端无法按 -32602 识别入参错误
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：待提单

## #5【P1】D9-9 capabilities 未声明 cancellation

- **现象**：initialize 返回 `capabilities.notifications` 缺失，未声明 `notifications.cancellation`
- **断言**：应声明 `capabilities.notifications.cancellation`
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` — initialize capabilities 构造未含 notifications.cancellation
- **影响**：客户端无法协商取消语义（-32000/timeout）
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC 待裁决（契约漂移）

## #6【P1】D3-S3 沙箱预览意图未路由

- **现象**：`service_catalog('把这个前端项目部署到沙箱预览出URL')` 返回 `Run hcloud --help`（MISS）
- **断言**：沙箱预览意图应命中 Sandbox/DevStation
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1968` — serviceCatalog routeMap 缺「沙箱预览」/「预览出 URL」关键词
- **影响**：沙箱部署意图路由失败，回退到 help
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：待提单

## #7【P1】D3-S8 排障意图未路由

- **现象**：`service_catalog('我的ECS启动失败了帮我分析一下原因')` 返回 `Run hcloud --help`（MISS）
- **断言**：排障意图应路由 troubleshooting / explain_error
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1968` — routeMap 无排障/诊断分支（`explain_error` 工具未被 serviceCatalog 意图命中）
- **影响**：故障诊断类意图无法正确分流
- **证据**：`evidence/D3-S8/stdout.log`
- **状态**：待提单

## #8【P1】EXP-E01 中文「云主机」未路由 ECS

- **现象**：`service_catalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `Run hcloud --help`（MISS）
- **断言**：「云主机」意图应命中 ECS
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1971` — ECS 关键词表缺「云主机」（已有 云服务器/服务器/弹性云服务器/虚拟机/镜像）
- **影响**：常见中文表述「云主机」路由失败
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #9【P2】D3-S5 复合意图召回不全（漏 DDS）

- **现象**：`service_catalog('数据存DDS同时用OBS托管静态网站')` 返回 `OBS+Sandbox+DevStation`，漏 DDS
- **断言**：复合意图应同时召回 DDS 与 OBS
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1968` — serviceCatalog 对多服务复合意图未聚合召回（关键词命中单一意图即停止）
- **影响**：复合/多服务意图漏召回目标服务
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：待提单

## #10【P2】D8-9 遥测值未脱敏

- **现象**：`sanitizeValue('AK=ABC123XYZ')` 原样返回
- **断言**：遥测值应脱敏（不令 AK 值明文上报）
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` — sanitizeValue 仅去换行/截断，未调 `redactSecrets`
- **影响**：敏感遥测值明文上送
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单