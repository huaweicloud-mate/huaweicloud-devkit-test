# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813 / Linux）

> **落盘路径**：`results/Hermes/2026-09-18-1.94.218.129/Linux/FINDINGS.md`
> **生成时间**：`2026-09-18 05:30:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.5（npm latest，gitHead `e7ed6f66`）
> **测试类型**：每日测试（daily 精选：设计级 80 + 展开级 48）

---

## #1【P0】D4-16 命令包裹穿透（sh -c 包裹凭证 env 打印未被拦截）

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` → `decision=allow`（预期 `deny`）。同为包裹形式的 `powershell -Command` 已拦截，`sh -c`/`bash -c` 仍穿透。
- **断言**：凭证 env 打印命令经 `sh -c`/`bash -c` 包裹后仍应判 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-89` `stripExecutable()` 仅在 `classifyHcloudArgs`（第 104、173 行路径）解包；`classifyTextCommand`（`safety-policy.mjs:384`）文本路径未应用同逻辑，导致 `sh -c`/`bash -c` 内层命令未二次展开。
- **影响**：安全策略可被 shell 包裹绕过，属安全红线风险。
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 测试项，实测 allow）

## #2【P0】D2-4 凭证脱敏字符串路径漏小写 ak=/sk=（obsutilconfig 格式）

- **现象**：`redactSecrets('{"ak":"AKID...","sk":"SK..."}')` 与 `redactSecrets('ak=AK... sk=SK... token=...')` 字符串路径不脱敏；对象路径（`show_profile_redacted` 主展示路径）脱敏正确。
- **断言**：字符串路径中 `ak=`/`sk=`/`token=`（小写 key=value，obsutilconfig 格式）应被替换为 `<redacted>`，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:41-45` `redactString()` 的第二/三正则仅匹配 `access_key`/`secret_key`/`security_token`/`authorization`/`password`/`adminPass` 及大写 `AK=`/`SK=`，未覆盖小写短形 `ak=`/`sk=`/`token=`。
- **影响**：obsutilconfig 等含小写 `ak=`/`sk=` 的配置文件经 redactOutput 透出时明文泄露。
- **证据**：`evidence/d2-auth/stdout.log`（D2-4 redact-json 测试项）

## #3【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入（11 安装目标全缺失）

- **现象**：`rules/huawei-agent-rules.mdc` 存在于源码仓库，但 `package.json` `files` 白名单不含 `rules/`，npm 安装后全局包无 `rules/` 目录、无 `.mdc` 文件，`setup-cli` 无注入代码 → 规则未注入任何安装目标。
- **断言**：`install` 后 11 个 Agent 安装目标应包含并可执行全局 MUST 级规则文件 `huawei-agent-rules.mdc`，无孤儿文件。
- **根因**：`package.json:8` `files` 数组不含 `rules` + `setup-cli.mjs` 安装复制清单未含 `rules/huawei-agent-rules.mdc`（源码仅 `integrations/`、`plugins/`、`bin/` 等被发布）。
- **影响**：全局安全规则（禁直连 csms/kms 等 MUST 约束）未触达安装目标，安全契约缺口。
- **证据**：`evidence/D4-23/stdout.log`（rules-in-pkg-files=false / rules-in-installed-pkg=false / injection-code-missing=true）

## #4【P1】D4-27 redactSecrets 字符串路径漏小写 ak=/sk=/token=（双路径脱敏不完整）

- **现象**：`redactSecrets('ak=AK... sk=SK... token=... password=... adminPass=...')` 仅 `password`/`adminPass` 被脱敏，`ak=`/`sk=`/`token=` 明文透传（15 项断言 3 项 FAIL）；对象路径与 `redactOutput` 路径脱敏正确。
- **断言**：`redactSecrets` 与 `redactOutput` 双路径对 `ak`/`sk`/`token`/`password`/`adminPass` 均替换为 `<redacted>`，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:41-45` `redactString()` 正则漏小写短形 `ak=`/`sk=`/`token=`（与 D2-4 同一根因）。
- **证据**：`evidence/D4-27/stdout.log`（redactSecrets-ak/sk/token 三项实测泄露）

## #5【P1】D8-4 INSTALL.md 未随 npm 包发布

- **现象**：源码仓库有 `INSTALL.md`，但 npm 全局包 `huaweicloud-devkit@1.1.5` 缺 `INSTALL.md`（有 README.md/README.zh-CN.md）。
- **断言**：`INSTALL.md` 应随包发布（引导步骤可机械执行）。
- **根因**：`package.json:8` `files` 白名单未包含 `INSTALL.md`。
- **证据**：`evidence/D8-4/stdout.log`（src-has-installmd=true / pkg-has-installmd=false）

## #6【P0】D9-2 JSON-RPC 错误码——invalid params 未返回 -32602

- **现象**：MCP `tools/list` 传非法参数（params 传 string 而非 object）未返回标准 `error` 对象（`code=-32602`）；`unknown method` 分支能正确返回 `-32601`。
- **断言**：无效参数应返回 `{"error":{"code":-32602,"message":...}}`，客户端可处理。
- **根因**：`mcp-server.mjs` / `mcp-protocol.mjs` 参数校验失败分支未构造 `-32602` error 对象（JSON-RPC 2.0 标准）。
- **证据**：`evidence/D9-protocol/protocol-probe.json`（D9-2b-invalid-params FAIL：无 error 对象）

## #7【P1】D9-9 tools/call 超时协议语义——未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize.result.capabilities.notifications` 缺失，未声明 `notifications.cancellation`。
- **断言**：应声明取消/超时能力 `capabilities.notifications.cancellation`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:158` 仅处理 `notifications/initialized`，未声明 cancellation。
- **证据**：`evidence/D9-protocol/protocol-probe.json`（D9-9a SPEC-MISMATCH）

## #8【P1】D10-3 serviceCatalog 路由层命中率仅 21.4%（EXP-E01~E14）

- **现象**：`eval/harness/run-eval.mjs` 15 条中文意图逐条调 `huaweicloud_service_catalog`，HIT=3 / MISS=11 / N/A=1，准确率 21.4%（未命中返回兜底 `Run hcloud --help to list available services.`）。
- **断言**：中文服务意图应命中期望服务（≥90%），错路由可定位。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:350` `huaweicloud_service_catalog` 路由表未覆盖多数服务意图（EXP-E01/02/03/04/05/07/10/11/12/13/14 共 11 条 MISS）。
- **影响**：真实 Agent 会话按中文意图路由到正确服务成功率低。
- **证据**：`evidence/D10-eval/eval-run.csv`；`evidence/D9-protocol/protocol-probe.json`