# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-09-16-192.168.0.102/Windows/FINDINGS.md`
> **生成时间**：`2026-09-16 10:10:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.5（npm latest，gitHead e7ed6f66）

---

## #1【P0】D4-16 命令包裹穿透（sh -c 包裹凭证 env 打印未被拦截）

- **现象**：`classifyTextCommand('sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"')` → `decision=allow`（预期 `deny`）。同为包裹形式的 `powershell -Command "Get-Content ~/.config/huaweicloud/credentials.json"` 已正确拦截，`sh -c`/`bash -c` 包裹仍穿透。
- **断言**：凭证 env 打印命令经 `sh -c`/`bash -c` 包裹后，仍应判 `deny`（D4-2「凭证 env 打印拦截」的包裹变体，应同等被拦截）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-89` `stripExecutable()` 仅对 `hcloud` 写命令（`classifyHcloudArgs` args 路径）解包 shell 包裹（#650 修复），但 `classifyTextCommand()`（`safety-policy.mjs:384`）文本路径未应用同一解包逻辑，导致 `sh -c "printenv HW_*"` 被当成普通 `sh` 命令放行。
- **影响**：安全策略可被 `sh -c`/`bash -c` 包裹绕过，泄露凭证 env；属安全红线（I 类）风险。
- **证据**：`evidence/d4-security/stdout.log`（D4-16 wrap-sh 测试项，实测 `allow`）
- **状态**：待提单

## #2【P1】D10-3 / EXP-E serviceCatalog 路由层命中率仅 21.4%

- **现象**：`eval/harness/run-eval.mjs` 读 15 条中文意图逐条调 `huaweicloud_service_catalog`，确定性路由结果 HIT=3 / MISS=11 / N/A=1，准确率 21.4%（与历史基线一致）。典型 MISS：期望 RDS→返回 `Run hcloud --help...`、期望 ELB→兜底、期望 CBR→兜底等。
- **断言**：中文服务意图（如「云数据库 MySQL 实例状态」→RDS、「申请 HTTPS 证书配置域名」→ELB、「每日备份策略」→CBR）应命中期望服务，MISS 属未命中缺陷。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:350` `huaweicloud_service_catalog` 的路由字典/关键词匹配未覆盖多数服务意图（RDS/DCS/CBR/ELB/IAM/CES/FunctionGraph/BSS 等未见命中），依赖 `--help` 兜底而非服务命中。
- **影响**：评测集 EXP-E01~E14 中 11 条未命中，agent 实际使用时代客路由失败率高。
- **证据**：`eval/results/eval-run-20260916015504.csv`；`evidence/EXP-E01..E14/stdout.log`
- **状态**：待提单

## #3【P1】D9-2 JSON-RPC 错误码——invalid params 未返回 -32602

- **现象**：MCP `tools/call` 传无效参数时，未返回标准 JSON-RPC `error` 对象（`code=-32602 Invalid params`）；`unknown method` 分支能正确返回 `-32601`，`invalid params` 分支缺失 error 对象。
- **断言**：无效参数应返回 `{"error":{"code":-32602,"message":...}}`，与 JSON-RPC 2.0 规范一致。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` 对 `tools/call` 的参数校验失败分支未构造 `-32602` error（`mcp-protocol.mjs` 亦无 invalid-params 分支）。
- **影响**：客户端依赖标准错误码区分「未知方法 / 参数错误」的场景失效。
- **证据**：`eval/results/protocol-probe-20260916015543.json`（D9-2b-invalid-params 测试项 FAIL）
- **状态**：待提单

## #4【P1】D8-4 INSTALL.md 未随 npm 包发布

- **现象**：npm 包 `huaweicloud-devkit@1.1.5` 根目录有 `README.md`、`README.zh-CN.md`，缺 `INSTALL.md`（引导步骤文档未进包）。
- **断言**：引导文档 INSTALL.md 应随包发布，供 `install` 引导步骤机械执行。
- **根因**：`package.json` 的 `files` 打包白名单未包含 `INSTALL.md`。
- **影响**：用户从 npm 包安装后无引导文档，`doctor`/`install` 引导步骤文档缺失。
- **证据**：`evidence/d8-installmd/stdout.log`（`Test-Path INSTALL.md = False`）
- **状态**：待提单

## #5【P1】D9-9 tools/call 超时协议语义——未声明 cancellation 能力（SPEC-MISMATCH）

- **现象**：`initialize.result.capabilities.notifications` 未声明 `cancellation`（协议探针实测「实际缺失」），与「tools/call 超时协议语义与取消」设计契约漂移。
- **断言**：initialize 响应应声明 `capabilities.notifications.cancellation`（或按设计契约明确取消语义）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:158` 仅处理 `notifications/initialized`，initialize 响应未声明 `notifications.cancellation`。
- **影响**：客户端无法依赖标准取消通知，超时取消语义不完整。
- **证据**：`eval/results/protocol-probe-20260916015543.json`（D9-9a-capabilities.cancellation SPEC-MISMATCH）
- **状态**：待裁决（契约漂移）

## #6【非产品缺陷】D2-4 脱敏边缘项（lowercase-JSON 字符串路径）

- **现象**：`redactSecrets('{"ak":"...","sk":"..."}')` 直接传原始 JSON 字符串（未先 `JSON.parse`）时不脱敏；但实际展示路径 `show_profile_redacted`（object 路径）实测无明文 AK/SK（`accessKeyId=<redacted>`）。
- **说明**：非产品缺陷（主展示路径脱敏正确），列为低危加固建议——`redactSecrets` 对字符串入参缺少 lowercase `"ak"`/`"sk"` JSON 键的正则覆盖。
- **证据**：`evidence/D2-4/stdout.log`（show_profile_redacted 实测 leaksAk=false leaksSk=false）