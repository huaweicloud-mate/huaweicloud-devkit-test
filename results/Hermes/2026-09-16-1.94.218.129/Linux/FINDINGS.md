# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro / Linux）

> **落盘路径**：`results/Hermes/2026-09-16-1.94.218.129/Linux/FINDINGS.md`
> **生成时间**：`2026-09-16 11:40:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.5（npm latest，gitHead e7ed6f66）

---

## #1【P0】D4-16 命令包裹穿透（sh -c 包裹凭证 env 打印未被拦截）

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` → `decision=allow`（预期 `deny`）。同为包裹形式的 `powershell -Command` 已拦截，`sh -c`/`bash -c` 仍穿透。
- **断言**：凭证 env 打印命令经 `sh -c`/`bash -c` 包裹后仍应判 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-89` `stripExecutable()` 仅对 `classifyHcloudArgs`（hcloud 写命令）解包，`classifyTextCommand()`（safety-policy.mjs:384）文本路径未应用同逻辑。
- **影响**：安全策略可被 shell 包裹绕过，属安全红线风险。
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 测试项，实测 allow）

## #2【P1】D10-3 / EXP-E serviceCatalog 路由层命中率仅 21.4%

- **现象**：`eval/harness/run-eval.mjs` 15 条中文意图逐条调 `huaweicloud_service_catalog`，HIT=3 / MISS=11 / N/A=1，准确率 21.4%。
- **断言**：中文服务意图（RDS/ELB/CBR 等）应命中期望服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:350` `huaweicloud_service_catalog` 路由表未覆盖多数服务意图。
- **证据**：`eval/results/eval-run-*.csv`；`evidence/EXP-E01..E14/stdout.log`

## #3【P1】D9-2 JSON-RPC 错误码——invalid params 未返回 -32602

- **现象**：MCP `tools/call` 传无效参数未返回标准 `error` 对象（`code=-32602`）；`unknown method` 分支能正确返回 `-32601`。
- **断言**：无效参数应返回 `{"error":{"code":-32602,...}}`。
- **根因**：`mcp-server.mjs`/`mcp-protocol.mjs` 参数校验失败分支未构造 -32602。
- **证据**：`eval/results/protocol-probe-*.json`（D9-2b-invalid-params FAIL）

## #4【P1】D8-4 INSTALL.md 未随 npm 包发布

- **现象**：npm 包 `huaweicloud-devkit@1.1.5` 有 README.md/README.zh-CN.md，缺 INSTALL.md。
- **断言**：INSTALL.md 应随包发布。
- **根因**：`package.json` files 白名单未包含 INSTALL.md。
- **证据**：`evidence/d8-installmd/stdout.log`（Test-Path INSTALL.md = False）

## #5【P1】D9-9 tools/call 超时协议语义——未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize.result` 未声明 `capabilities.notifications.cancellation`。
- **断言**：应声明 cancellation 能力。
- **根因**：`mcp-server.mjs:158` 仅处理 notifications/initialized，未声明 cancellation。
- **证据**：`eval/results/protocol-probe-*.json`（D9-9a SPEC-MISMATCH）

## #6【非产品缺陷】D2-4 脱敏边缘项（lowercase-JSON 字符串路径）

- **现象**：`redactSecrets('{"ak":"...","sk":"..."}')` 直接传原始 JSON 字符串不脱敏；主展示路径 `show_profile_redacted` 实测无明文 AK/SK。
- **说明**：非产品缺陷（主路径脱敏正确），低危加固建议。
- **证据**：`evidence/d2-realcloud-sts/stdout.log`（D2-4 no-leak-ak/sk = ok）