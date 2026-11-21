# FINDINGS — 缺陷发现清单（CodeArtsAgent-DeepSeek-V4.1-Flash-1017）

> **落盘路径**：`results/CodeArtsAgent/2026-11-22-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-22 06:05:00（北京时间）
> **被测包**：huaweicloud-devkit 1.1.15（npm latest），Windows / 119.8.181.45
> **范围**：每日测试 daily（设计级 107 + 展开级 39 + mission-001 9）

## #1【P0】D4-2 凭证 env 打印未拦截

- **现象**：`huaweicloud_hook_check_command {command:"set HW_SECRET_KEY=..."}` 返回 `decision=allow, findings=[]`，未阻断。
- **断言**：打印/设置凭证类环境变量的命令必须返回 `decision=deny`。
- **根因**：`safety/rules/cloud-risk-rules.json` 缺 Windows `set VAR` 形式规则；`risk-rule-engine.mjs` `evaluateCommandRisk` 仅匹配 Unix `export/printenv`。
- **证据**：`evidence/D4-2/stdout.log`

## #2【P0】D4-3 KMS 明文 secret API 未拦截

- **现象**：`hcloud KMS DecryptData --cipher_text=abc` → `allow`；同族 `CSMS ShowSecretVersion` → `deny`，同族判定不一致。
- **断言**：返回明文/解密 secret 的 API 必须 deny。
- **根因**：`safety/rules/cloud-risk-rules.json` 的 blockedSecretOperations 未覆盖 `DecryptData`（仅覆盖 CSMS）；`risk-rule-engine.mjs`。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-9 公网暴露安全组预检失效

- **现象**：`hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` → `allow`。
- **断言**：0.0.0.0/0 入方向公网暴露在执行前必须 deny 或 warn。
- **根因**：`risk-rule-engine.mjs` 无安全组公网规则；`safety/rules/cloud-risk-rules.json` 缺 `remote_ip_prefix` 规则。
- **证据**：`evidence/D4-9/stdout.log`

## #4【P0】D4-15 hook 绕过尝试（引号拼接变体）

- **现象**：`hcloud ECS "Delete""Servers" --server_id=x` → `allow`；`DELETESERVERS`、URL 编码、`;` 拼接均被拦截，仅双引号拼接变体绕过。
- **断言**：命令变体不得 allow。
- **根因**：`safety-policy.mjs` `classifyTextCommand` 命令行标准化未剥离连续/转义双引号再匹配写操作。
- **证据**：`evidence/D4-15/stdout.log`

## #5【P0】D4-16 命令包裹穿透

- **现象**：`cmd /c`、`sh -c`、`powershell -Command`、`$(...)` 四类包裹存在 allow 变体，hook 未解析内层命令。
- **断言**：内层命令必须被识别并拦截。
- **根因**：`safety-policy.mjs` `stripExecutable` 剥离深度/引号处理不足，`classifyTextCommand` 未递归解析内层命令。
- **证据**：`evidence/D4-16/stdout.log`

## #6【P0】D4-19 确认流下预检未生效（无效 token 未阻断）

- **现象**：夹具 `d4-19-preflight-in-confirm` 8/9 通过；`approvedByUser=true` 但 approval token 无效时未拒绝，命令被放行。
- **断言**：无效/过期 token 必须阻断执行。
- **根因**：`hcloud-cli.mjs` `consumeApprovalToken` 调用方未把 null 结果映射为拒绝；`runApprovedCommand` 缺 token 有效性门禁。
- **证据**：`evidence/D4-19/stdout.txt`

## #7【P0】D9-12 initialize 握手协议基线（非法时序未拒）

- **现象**：未 initialize 直接 `tools/list` 返回正常结果，`error.code=undefined`；initialize 响应 protocolVersion/serverInfo 正常。
- **断言**：非法时序必须返回 JSON-RPC `-32600`。
- **根因**：`mcp-protocol.mjs` 处理 `tools/list` 时未校验 initialized 状态；`mcp-server.mjs` 仅放行通知，无强制握手门禁。
- **证据**：`evidence/D9-12/stdout.log`

## #8【P0】D1-39 Windows 升级检测链静默失败

- **现象**：`queryDistTagsSync()` 返回 null；`npm view huaweicloud-devkit dist-tags --json` 实际输出数组 `[{latest:"1.1.15",next:"1.1.15-next.2"}]`，fetch 路径正常。
- **断言**：Windows 检测链不得静默返回 null / check_failed。
- **根因**：`update-check.mjs` `parseDistTagsOutput` 只接受对象，未兼容 npm 12 数组输出。
- **证据**：`evidence/D1-39/stdout.log`

## #9【SPEC】D10-4 规则库规模与设计基线漂移

- **现象**：`loadRiskRules()` 实际 19 条（9 deny + 10 warn），用例设计基线 16 条（9 deny + 7 warn）。
- **断言**：规则库应为 9 deny + 7 warn。
- **根因**：`safety/rules/cloud-risk-rules.json` 新增 3 条 warn 规则，用例基线未同步（SPEC 漂移，非功能错误）。
- **证据**：`evidence/D10-4/stdout.log`
## #10【P1】D2-1 auth init 三端同步未落盘（隔离 HOME）

- **现象**：隔离 HOME 下 `auth init` 返回 `{status:"ok"}`，但 S1 / KooCLI / OBS 三个凭证文件均未生成（false/false/false）。
- **断言**：auth init 成功必须落盘 S1 并同步 KooCLI/OBS。
- **根因**：`auth/service.mjs` `initAuth` 在无交互/隔离 HOME 时仅设置运行时凭证并返回 ok，未写 `~/.config/huaweicloud/credentials.json`。
- **证据**：`evidence/D2-1/stdout.log`

## #11【P1】D2-12 runtime 凭证未被 auth_sync 识别（R10 违反）

- **现象**：同一 MCP 会话 `auth_switch(mode=memory,scope=temporary)` 成功后 `auth_sync(target=all)` 返回 `{ok:false, code:"HDKIT_CRED_MISSING"}`。
- **断言**：runtime 凭证存在时 auth_sync 应识别并抑制落盘（R10）。
- **根因**：`tools.mjs` 调 `auth/service.mjs` `syncAuth` 只读持久凭证，未走 `resolveCredentialsWithRuntime`。
- **证据**：`evidence/D2-12/stdout.log`

## #12【P1】D4-17 hook 模糊输入未 fail-closed

- **现象**：`hcloud\0ECS` → allow；`12345` → error；仅空串/空白/null 返回 deny。
- **断言**：异常/畸形输入必须默认 deny，不得 allow 或抛裸错误。
- **根因**：`safety-policy.mjs` `classifyTextCommand` 未对 NUL 与非字符串输入做 fail-closed 判定。
- **证据**：`evidence/D4-17/stdout.log`

## #13【P1】D9-4 协议生命周期非法时序未拒

- **现象**：未 initialize 先 `tools/list` 未被 `-32600` 拒绝（标准时序正常，非法时序拒绝=false）。
- **断言**：必须强制 initialize → tools/list → tools/call 时序。
- **根因**：同 #7，`mcp-protocol.mjs` 未校验 initialized 状态。
- **证据**：`evidence/D9-4/stdout.log`

## #14【P1】EXP-E01 服务目录路由 MISS

- **现象**：中文意图“帮我查一下我账号在华北北京四有哪些云主机” serviceCatalog 实际=`Run hcloud --help to list available services.`，期望 ECS，判 MISS（今日路由准确率 13/14=92.9%）。
- **断言**：该意图必须命中 ECS。
- **根因**：`tools.mjs` serviceCatalog routeMap 未覆盖“华北北京四/云主机”组合；结果见 `eval/results/eval-run-20261121212012.csv`。
- **证据**：`evidence/EXP-E01/stdout.log`

## #15【P2】D3-C14 无凭证时 resolveCredentials 回退文件凭证（凭证泄漏面）

- **现象**：夹具 `D3-C14-fallback-empty` 期望清空 runtime 后 `resolveCredentials` 抛 `HDKIT_CRED_MISSING`，实际返回 `ak=HSTAD5M13VETCS4E6SB3`（读到实例侧文件凭证）；另 `hdkitCheckUser` 错误文案为 `HDKIT_UPSTREAM_ERROR` 而非 `credentials not configured`。
- **断言**：runtime 清空且无环境凭证时应抛 `HDKIT_CRED_MISSING`，不得静默回退到实例文件凭证。
- **根因**：`auth/credentials.mjs` `resolveCredentials` 的 fallback 链在 runtime 清空后继续读取实例侧凭证文件，未区分「本会话已显式清空」状态。
- **证据**：`evidence/D3-C14/stdout.txt`

## #16【P2】D4-25 Python hook 事件 capability 取值漂移

- **现象**：hook-events.jsonl 事件 `key=cli:read/cli:write` 正确，但 `capability` 字段值为 `cli`；新增 2 事件均分类为 `cli`，非 hcloud 命令未产生 `cli:invoke` 事件。
- **断言**：capability 应为 `cli:read / cli:write / cli:invoke` 三态。
- **根因**：`huaweicloud-safety.py` `record_cli_event` 将 capability 归类为顶层 `cli`，且非 hcloud 命令未入事件。
- **证据**：`evidence/D4-25/stdout.log`

## #17【P2】D4-26 findings.evidence 未脱敏

- **现象**：`hcloud CSMS ShowSecretVersion --secret_string=SK_MUST_NOT_LEAK_...` 的 `findings[0].evidence` 保留完整明文，其余字段已 redacted。
- **断言**：evidence 字段中 AK/SK/token/password 必须 `<redacted>`。
- **根因**：`risk-rule-engine.mjs` 直接 `evidence: excerpt(context.text)`，未调用同文件已有 `redactEvidence`。
- **证据**：`evidence/D4-26/stdout.log`

## #18【P2】D8-9 sanitizeValue 未脱敏凭证

- **现象**：`sanitizeValue("ak=AK0123... token=secret-token-123 name=ok-value")` 原样返回，AK/token 明文保留（installId 稳定性 true、合法值保留 true）。
- **断言**：sanitizeValue 必须移除 AK/SK/token 等敏感值并保留合法值。
- **根因**：`telemetry/telemetry.mjs` `sanitizeValue` 仅清换行/截断长度，无凭证脱敏正则。
- **证据**：`evidence/D8-9/stdout.log`

## 附：非缺陷的执行差异（不计入缺陷单）

- **D3-S6**（FunctionGraph 定时任务，P2）：真机调用 `FunctionGraph CreateFunction` 返回 `FSS.0400 invalid parameter`（func_code 以 base64 文本文件传入可能被二次编码），属探针传参/编码适配问题，未确认产品缺陷；资源未创建、无残留。
- **D3-S4 / D4-14**：外部限流（`HDKIT_CRED_RATE_LIMIT`）与 CTS 轨迹不可见（0 条），已按 BLOCKED 记录四要素，非产品缺陷。