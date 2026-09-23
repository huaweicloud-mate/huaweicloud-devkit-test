# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813 / Linux）

> **落盘路径**：`results/Hermes/2026-09-23-1.94.218.129/Linux/FINDINGS.md`
> **生成时间**：`2026-09-23 16:57`（北京时间，同日第二次执行复测）
> **被测对象**：huaweicloud-devkit v1.1.6（npm 官方 latest，gitHead `46152dd`）
> **测试类型**：每日测试（daily 精选：设计级 100 + 展开级 43）

---

## #1【P0】D4-16 命令包裹穿透（sh -c 包裹凭证 env 打印未被拦截）

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` → `decision=allow`（预期 `deny`）。同为包裹形式的 `powershell -Command` 已拦截，`sh -c`/`bash -c` 仍穿透。
- **断言**：凭证 env 打印命令经 `sh -c`/`bash -c` 包裹后仍应判 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-89` `stripExecutable()` 仅在 `classifyHcloudArgs` 路径解包；`classifyTextCommand`（`safety-policy.mjs:384`）文本路径未应用同逻辑。
- **影响**：安全策略可被 shell 包裹绕过，安全红线风险。
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 实测 allow）

## #2【P0】D2-4 凭证脱敏字符串路径漏小写 ak=/sk=（obsutilconfig 格式）

- **现象**：`redactSecrets('{"ak":"AKID...","sk":"SK..."}')` 字符串路径不脱敏；对象路径（`show_profile_redacted`）脱敏正确。
- **断言**：字符串路径中 `ak=`/`sk=`/`token=`（小写 key=value）应替换为 `<redacted>`，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45` `redactString()` 正则仅匹配 `access_key`/`secret_key`/`security_token`/大写 `AK=`/`SK=`，未覆盖小写 `ak=`/`sk=`/`token=`。
- **影响**：obsutilconfig 等含小写 `ak=`/`sk=` 的配置经 redactOutput 透出时明文泄露。
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json 实测泄露）

## #3【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入（npm 包无 rules/）

- **现象**：`rules/huawei-agent-rules.mdc` 存在于源码，但 `package.json` files 白名单不含 `rules/`，npm 安装后全局包无 `rules/`、无 `.mdc`，`setup-cli` 无注入代码。
- **断言**：install 后各 Agent 安装目标应包含并可执行全局 MUST 级规则文件 `huawei-agent-rules.mdc`。
- **根因**：`package.json:8` `files` 数组不含 `rules` + `setup-cli.mjs` 安装复制清单未含 `rules/huawei-agent-rules.mdc`。
- **影响**：全局安全规则未触达安装目标，安全契约缺口。
- **证据**：`evidence/D4-23/stdout.log`（rules-in-pkg-files=false / rules-in-installed-pkg=false）

## #4【P1】D4-27 redactSecrets 字符串路径漏小写 ak=/sk=/token=（双路径脱敏不完整）

- **现象**：`redactSecrets('ak=... sk=... token=... password=... adminPass=...')` 仅 password/adminPass 脱敏，ak=/sk=/token= 明文透传（15 项中 3 项 FAIL）；对象路径与 redactOutput 路径脱敏正确。
- **断言**：`redactSecrets` 与 `redactOutput` 双路径对 ak/sk/token/password/adminPass 均替换 `<redacted>`。
- **根因**：`safety-policy.mjs:34-45` `redactString()` 正则漏小写 `ak=`/`sk=`/`token=`（与 D2-4 同根因）。
- **证据**：`evidence/D4-27/stdout.log`（redactSecrets-ak/sk/token 实测泄露）

## #5【P1】D8-4 INSTALL.md 未随 npm 包发布

- **现象**：源码有 INSTALL.md，但 npm 全局包缺 INSTALL.md（有 README.md/README.zh-CN.md）。
- **断言**：INSTALL.md 应随包发布。
- **根因**：`package.json:8` `files` 白名单未含 `INSTALL.md`。
- **证据**：`evidence/D8-4/stdout.log`（src-has-installmd=true / pkg-has-installmd=false）

## #6【P1】D9-2 JSON-RPC 错误码——tools/list 传非法参数（params 传 string）未返回 -32602

- **现象**：MCP `tools/list` 传非法参数类型（params 传 string `'not-an-object'`）未返回标准 error（code=-32602），仍正常返回 40 工具；`unknown method` 分支正确返回 -32601。
- **断言**：无效参数应返回 `{"error":{"code":-32602,...}}`。
- **根因**：`mcp-protocol.mjs:57-59` `tools/list` 分支直接 `return { tools }` 未校验 params 类型；上游 #704（v1.1.6）仅给 `tools/call` 的 unknown tool / 缺必填参数加了 -32602，未覆盖 `tools/list` 的参数校验。
- **影响**：协议不合规，客户端无法据标准错误码区分无效参数。
- **证据**：`evidence/D9-protocol/protocol-probe.json`（D9-2b-invalid-params FAIL：无 error 对象）

## #7【P1】D9-9 tools/call 超时协议语义——未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize.result.capabilities.notifications` 缺失，未声明 `notifications.cancellation`。
- **断言**：应声明取消/超时能力 `capabilities.notifications.cancellation`。
- **根因**：`mcp-server.mjs:174` 仅处理 `notifications/initialized`，未声明 cancellation。
- **证据**：`evidence/D9-protocol/protocol-probe.json`（D9-9a SPEC-MISMATCH）

## #8【P1】D10-3 / EXP-E01~E14 serviceCatalog 路由层命中率仅 21.4%

- **现象**：`eval/harness/run-eval.mjs` 15 条中文意图，HIT=3 / MISS=11 / N/A=1，准确率 21.4%（未命中返回兜底 `Run hcloud --help ...`）。
- **断言**：中文服务意图应命中期望服务（≥90%）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1815` `serviceCatalog()` 路由表未覆盖多数服务意图（E01/02/03/04/05/07/10/11/12/13/14 共 11 条 MISS）。
- **证据**：`evidence/D10-eval/eval-run.csv`

## #9【P1】D3-S1 只读 ECS 场景 serviceCatalog 未路由命中 ecs

- **现象**：`serviceCatalog(intent='帮我查一下…华北北京四有哪些云主机')` → `recommendedServices=[]`（hit=[]），期望命中 ECS。
- **断言**：ECS 查询意图应命中 ecs 服务。
- **根因**：`tools.mjs:1815` `serviceCatalog()` 路由表未覆盖「查云主机」ECS 只读意图（与 D10-3 同根因）。
- **证据**：`evidence/d3-cloud/stdout.log`（D3-S1 route-to-ecs FAIL）

## #10【P1】D3-S3 沙箱预览 upload_project / deploy_check 返回空

- **现象**：`huaweicloud_sandbox_upload_project` 与 `huaweicloud_sandbox_deploy_check` 返回空（connect/deploy_nginx/close 正常）。
- **断言**：upload_project 上传成功、deploy_check 返回部署状态。
- **根因**：`tools.mjs:1329`（uploadProjectWithSession）与 `tools.mjs:1382`（deployCheck）结果未透出为 MCP content（probe `textOf()` 为空）。
- **证据**：`evidence/d3-sandbox/stdout.log`（sandbox-upload/sandbox-deploy-check FAIL）

## #11【P2】D3-S5 复合意图仅命中单一服务（未分层多路由）

- **现象**：`serviceCatalog(intent='我要部署一个 Web 应用，数据存到数据库，文件存到对象存储')` → 仅命中 1 服务，期望 ≥2（Web 部署 + 数据库 + 对象存储）。
- **断言**：复合意图应命中多个对应服务。
- **根因**：`tools.mjs:1815` `serviceCatalog()` 复合意图分层路由缺失，仅返回单一推荐。
- **证据**：`evidence/d3-scenario/stdout.log`（D3-S5 compound-multi-hit FAIL，hit=1）

## #12【P2】D1-68 region 解析优先级与用例预期相反（HW_REGION 优先于 HUAWEICLOUD_REGION）

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION`，`resolveCredentials().region` 取 HW_REGION 值；用例预期 HUAWEICLOUD_REGION 优先。
- **断言**：HUAWEICLOUD_REGION 应优先于 HW_REGION（或文档明确优先级）。
- **根因**：`auth/credentials.mjs:133` `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，实现取 HW_REGION 优先。
- **证据**：`evidence/d1-extend/stdout.log`（D1-68 region-priority FAIL）

## #13【P2】D4-25 写命令分类误判为 cli:invoke（未归 cli:write）

- **现象**：Python hook 遥测中 `hcloud ECS CreateServers`（写）被归类 cli:invoke（观测 `{"cli:read":1,"cli:invoke":2}`，无 cli:write）。
- **断言**：写操作应归类 cli:write，只读 cli:read，其他 cli:invoke。
- **根因**：`hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 边界 `(^|[A-Za-z0-9])` 无法匹配前缀前为空格（"ECS CreateServers"），同缺陷见于 `safety-policy.mjs:122`。
- **证据**：`evidence/d4-hooks/stdout.log`（D4-25 cli-write-classified FAIL）

## #14【P2】D4-26 findings.evidence 小写 ak=/sk=/token= 未脱敏

- **现象**：`evaluateCommandRisk('cat ... ak=ACCNO sk=SECNO token=TOKNO')` 的 findings[].evidence 仍含明文 ACCNO/SECNO/TOKNO。
- **断言**：findings.evidence 中 ak=/sk=/token= 应替换 `<redacted>`，无明文。
- **根因**：`risk-rule-engine.mjs:19-25` `redactEvidence()` 正则仅覆盖 access_key/secret_key/security_token 及大写 `AK=`/`SK=`，未覆盖小写 `ak=`/`sk=`/`token=`。
- **证据**：`evidence/d4-extend/stdout.log`（D4-26 evidence-lowercase-aksk FAIL）

## #15【P2】D8-9 sanitizeValue 未剥离 AK/SK/token 敏感值

- **现象**：`sanitizeValue('AK=SECRETAK sk=SECRETSK token=SECRETTOK')` 保留明文敏感值。
- **断言**：sanitize 应剥离/脱敏 AK/SK/token 敏感值。
- **根因**：`telemetry/telemetry.mjs:189-196` `sanitizeValue()` 仅做空白归一与截断，无凭证剥离逻辑。
- **证据**：`evidence/d8-extend/stdout.log`（D8-9 sanitize-credential-strip FAIL）