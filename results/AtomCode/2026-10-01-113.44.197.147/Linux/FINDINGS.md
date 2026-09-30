# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-10-01-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：`2026-10-01 06:15:00`（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。
> **被测版本（SUT）**：`huaweicloud-devkit@1.1.7`（npm latest；源码 gitHead `7456d059`）

---

## #1【P0】D2-4 凭证脱敏对 JSON 键值形态漏脱敏

- **现象**：`redactSecrets('{"ak":"AK123","sk":"SK456","token":"TOK"}')` 原样返回，未脱敏（d2-auth 探针 `redact-json` FAIL）
- **断言**：JSON 字符串内的 ak/sk/token 键值应全部脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — `redactString` 键名正则仅覆盖 `access_key|secret_key|token|password|admin_pass|credential` 等长形，缺 `ak`/`sk` 短形；且只匹配 `key=value`/`key:value`，不识别 JSON `"key":"value"` 结构
- **影响**：凭证以 JSON 形态经日志/遥测/会话输出时明文泄漏（I 类风险）
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：疑似历史问题（此前已记，待查重复核）

## #2【P0】D4-16 sh -c 命令包裹穿透未拦截（1.1.7 回归，1.1.8-next.1 曾修复）

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` 返回 `allow`，内层凭证 dump 命令未被拦截（d4-security 探针 `wrap-sh` FAIL）
- **断言**：shell 包裹（`sh -c`/`bash -c`）内层的凭证 dump/写命令应被分类为 deny
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:397-426` — env-dump 检测正则 `(^|\s)(env|printenv|…)` 与 `(?:^|\s)printenv` 只匹配命令词在行首/空白后，无法识别引号包裹内层命令；`stripExecutable`（:67）仅在 `classifyHcloudArgs` 路径生效，未用于 `classifyTextCommand` 的 shell 包裹解包
- **影响**：攻击者用 `sh -c "…"` 绕过凭证环境变量 dump 拦截（P0 安全防线穿透）
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh FAIL）
- **状态**：1.1.7 正式版仍存在，待提单

## #3【P0】D4-23 全局规则 huawei-agent-rules 未随包发布/注入

- **现象**：`hdk/rules/huawei-agent-rules.mdc` 源文件存在，但 npm 安装包内无 `rules/` 目录，`setup-cli.mjs` 无 rules 注入逻辑，11 个安装目标无一注入全局规则
- **断言**：全局规则 `huawei-agent-rules.mdc` 应被打包并注入到各安装目标
- **根因**：`hdk/package.json:8` — `files` 发布白名单缺 `rules/`；`plugins/huaweicloud-core/src/setup-cli.mjs` 无 rules 注入步骤
- **影响**：禁直连 csms/kms 等全局安全约束（MUST）对终端不生效
- **证据**：`evidence/D4-23/stdout.log`；npm 包 `ls huaweicloud-devkit/rules` 不存在
- **状态**：1.1.7 正式版仍存在，待提单

## #4【P1】D4-6 adminPass 空格分隔形式值未脱敏

- **现象**：`redactSecrets('hcloud ECS CreateServers --adminPass abc123XYZ')` 整串原样返回；`hook_check_command(admin-pass)` 返回 `decision=allow, findings=[]`
- **断言**：`--adminPass <值>`（空格分隔）应脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` — `redactString` 仅覆盖 `key=value`/`key:value` 分隔，空格分隔的 `--adminPass <值>` 不命中
- **影响**：创建 ECS 带 adminPass 时密码明文残留于输出
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：疑似历史问题，待查重

## #5【P1】D4-27 裸 token=/小写 ak=/sk= 未脱敏

- **现象**：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` → `token=<redacted> ak=AKID456 sk=secret789`
- **断言**：`ak=`/`sk=` 值应与 `token=` 一样脱敏为 `<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — 仅有 `(AK|SK)\s*[:=]` 大写短形，缺小写 `ak`/`sk` 短形键名
- **影响**：小写/短形凭证键值泄漏
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：疑似历史问题，待查重

## #6【P1】D9-2 JSON-RPC 非法参数错误码不规范

- **现象**：`tools/list` 传 `params:'not-an-object'` 未返回 `-32602`，无 error 对象（protocol-probe D9-2b invalid-params FAIL）
- **断言**：非法 params 应返回 JSON-RPC 错误码 `-32602`
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57-59` — `tools/list` 分支直接 `return { tools: TOOL_DEFINITIONS }`，无 params 类型校验（`tools/call` 分支 :62 有）
- **影响**：协议客户端无法区分参数错误，错误码不符合 JSON-RPC 2.0
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：疑似历史问题，待查重

## #7【P1】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities.tools` 但无 `notifications`，`capabilities.notifications.cancellation` 缺失（protocol-probe D9-9a SPEC-MISMATCH）
- **断言**：若支持取消则声明 `capabilities.notifications.cancellation`；不支持则明确不声明且不提供 timeout 语义
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` — `capabilities` 仅 `{ tools: {} }`
- **影响**：客户端无法判定取消能力，超时/取消语义不明确（契约漂移，待维护方裁决）
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：疑似历史 SPEC，待查重

## #8【P1】D10-3 中文服务意图路由准确率 21.4%（1.1.7 正式版路由覆盖不足）

- **现象**：run-eval 实测 HIT=3 MISS=11 N/A=1（准确率 21.4%，阈值≥90%）；EXP-E01/E02/E03/E04/E05/E07/E10/E11/E12/E13/E14 共 11 条中文意图未命中，返回 `Run hcloud --help`
- **断言**：中文服务意图（云主机/云服务器/弹性公网IP/云数据库/备份策略/函数/费用/云监控/HTTPS证书/权限审计/静态网站等）应命中对应 service；路由准确率 ≥90%
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817-1921` — `routeMap` 关键词表多为英文（ecs/server/rds/mysql/functiongraph/…），缺中文服务名映射；仅 voucher/sandbox 含少量中文
- **影响**：中文用户意图大面积无法路由到正确服务，D3-S 场景链与 D10 评测集受直接影响
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`（及 E02-E15）
- **状态**：1.1.7 正式版存在，待提单

## #9【P1】D3-S1/D3-S3/D3-S6/D3-S8 中文场景路由未命中

- **现象**：`service_catalog('查云服务器列表')` → `Run hcloud --help`；`service_catalog('沙箱预览')` 未命中 Sandbox/DevStation；`service_catalog('函数定时任务')` 未命中 FunctionGraph；`service_catalog('启动失败排查原因')` 未路由 explain_error
- **断言**：中文场景意图应分别命中 ECS / Sandbox+sandbox / FunctionGraph / troubleshooting·explain_error
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817-1921` — `routeMap` 缺中文「云服务器/沙箱/预览/函数/定时/排查」等关键词，且无排障/诊断分支（`serviceCatalog` 无 explain_error 路由；`explain_error` 工具存在但路由层不接）
- **影响**：场景化中文交互无法正确路由（D3-S3 沙箱预览、D3-S6 FunctionGraph、D3-S8 排障）
- **证据**：`evidence/D3-S1/stdout.log`、`evidence/directory D3-S3/stdout.log`、`evidence/D3-S6/stdout.log`、`evidence/D3-S8/stdout.log`
- **状态**：1.1.7 正式版存在，待提单

## #10【P1】D3-S7 跨服务复合意图漏召回 RDS

- **现象**：`service_catalog('部署带数据库的网站应用')` 仅返回 `Sandbox+DevStation`，未召回 RDS（Web+RDS 复合意图不完整）
- **断言**：复合意图「Web 应用 + 数据库」应同时命中 RDS 与部署目标
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817-1921` — `routeMap` RDS 关键词 rds/mysql/database/db 均为英文，中文「数据库」不命中
- **影响**：跨服务交付编排缺数据库服务
- **证据**：`evidence/D3-S7/stdout.log`
- **状态**：1.1.7 正式版存在，待提单

## #11【P2】D8-9 遥测值 sanitizeValue 未脱敏

- **现象**：`sanitizeValue('AK=ABC123XYZ')` 原样返回，未脱敏
- **断言**：`sanitizeValue` 应移除/脱敏 AK/SK/token 等敏感值
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` — `sanitizeValue` 仅裁剪空白与长度截断，未调 `redactSecrets`
- **影响**：遥测事件中的凭证明文随 value 上送
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：疑似历史问题，待查重