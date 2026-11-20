# FINDINGS — 缺陷发现清单（CodeArtsAgent-DeepSeek-V4.1-Flash-1017）

> **落盘路径**：`results/CodeArtsAgent/2026-11-21-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-21 05:40:00（北京时间）
> **被测包**：huaweicloud-devkit 1.1.15（npm latest），Windows

## #1【P0】D4-2 凭证 env 打印未拦截

- **现象**：`huaweicloud_hook_check_command {command:"set HW_SECRET_KEY"}` 返回 `decision=allow, findings=[]`，未阻断。
- **断言**：打印/设置凭证类环境变量的命令应返回 `decision=deny`。
- **根因**：`safety/rules/cloud-risk-rules.json` 缺少 Windows `set VAR` 形式规则；`risk-rule-engine.mjs:143 evaluateCommandRisk` 仅匹配 Unix `export/printenv`。
- **证据**：`evidence/D4-2/stdout.log`

## #2【P0】D4-3 KMS 明文 secret API 未拦截

- **现象**：`hcloud KMS DecryptData --cipher_text=abc` → allow；`CSMS ShowSecretVersion` → deny。同族命令判定不一致。
- **断言**：返回明文/解密 secret 的 API 必须 deny。
- **根因**：`safety/rules/cloud-risk-rules.json` 的 `blockedSecretOperations` 未覆盖 `DecryptData`（仅覆盖 CSMS），`risk-rule-engine.mjs:143`。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-9 公网暴露安全组预检失效

- **现象**：`hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0` → allow；deploy plan 公网 FunctionGraph → warn。
- **断言**：公网暴露（0.0.0.0/0 ingress）执行前应 deny 或 warn 拦截。
- **根因**：`risk-rule-engine.mjs:143 evaluateCommandRisk` 无安全组公网规则；`safety/rules/cloud-risk-rules.json` 缺 `remote_ip_prefix` 规则。
- **证据**：`evidence/D4-9/stdout.log`

## #4【P0】D4-15 hook 绕过尝试（引号变体）

- **现象**：`hcloud ECS "Delete""Servers" --server_id=x` → allow；`DELETESERVERS`、URL 编码、`;` 拼接均被拦截，仅双引号拼接变体绕过。
- **断言**：命令变体不得 allow。
- **根因**：`safety-policy.mjs:524 classifyTextCommand` 命令行标准化未剥离连续双引号/转义引号后再匹配写操作。
- **证据**：`evidence/D4-15/stdout.log`

## #5【P0】D4-16 命令包裹穿透

- **现象**：`cmd /c`、`sh -c`、`powershell -Command`、`$(...)` 四类包裹下，hook 未检查内层命令（存在 allow 变体）。
- **断言**：内层命令必须被识别并拦截。
- **根因**：`safety-policy.mjs` `stripExecutable` 包装剥离深度/引号处理不足，`classifyTextCommand:524` 未递归解析内层命令。
- **证据**：`evidence/D4-16/stdout.log`

## #6【P0】D4-17 hook 模糊输入未 fail-closed

- **现象**：`hcloud\0ECS` → allow；`12345` → error；仅空串/空白/null 返回 deny。
- **断言**：异常/畸形输入应默认 deny，不得 allow 或抛裸错误。
- **根因**：`safety-policy.mjs:524 classifyTextCommand` 未对 NUL 与非字符串输入做 fail-closed 判定。
- **证据**：`evidence/D4-17/stdout.log`

## #7【P0】D4-19 无效 approval token 未拦截

- **现象**：夹具 `d4-19-preflight-in-confirm` 8/9 通过；`approvedByUser=true` 且 token 无效时未抛 `Invalid or expired approval token`，命令被放行。
- **断言**：无效/过期 token 必须阻断执行。
- **根因**：`hcloud-cli.mjs:113 consumeApprovalToken` 的调用方未把 null 结果映射为拒绝，`runApprovedCommand` 缺 token 有效性门禁。
- **证据**：`evidence/D4-19/stdout.txt`

## #8【P0】D1-39 Windows 升级检测链静默失败

- **现象**：`queryDistTagsSync()` 返回 null；`npm view ... dist-tags --json` 实际输出 JSON 数组 `[{latest,next}]`，fetch 路径正常返回 1.1.15。
- **断言**：Windows 检测链不得静默返回 null。
- **根因**：`update-check.mjs:81 parseDistTagsOutput` 只接受对象，未兼容 npm 12 数组输出，导致 `check_update` 回退 check_failed。
- **证据**：`evidence/D1-39/stdout.log`

## #9【P0】D9-12 initialize 握手基线（非法时序未拒）

- **现象**：未 initialize 直接 `tools/list` 返回正常结果，`error.code=undefined`；initialize 本身的 protocolVersion/capabilities/serverInfo 正常。
- **断言**：非法时序应返回 JSON-RPC `-32600`。
- **根因**：`mcp-protocol.mjs:70` 处理 `tools/list` 时未校验 `initialized` 状态；`mcp-server.mjs:195` 仅放行通知，无强制握手门禁。
- **证据**：`evidence/D9-12/stdout.log`

## #10【P1】D4-26 findings.evidence 未脱敏

- **现象**：`hcloud CSMS ShowSecretVersion --secret_string=SK_MUST_NOT_LEAK_...` 的 `findings[0].evidence` 保留完整明文，同时 findings 其它字段有 redacted。
- **断言**：evidence 中 AK/SK/token/password 必须 `<redacted>`。
- **根因**：`risk-rule-engine.mjs:97` 直接 `evidence: excerpt(context.text)`，未调用 `redactEvidence`（同文件 :19 已有函数）。
- **证据**：`evidence/D4-26/stdout.log`

## #11【P1】D9-4 协议生命周期非法时序未拒

- **现象**：未 initialize 先 tools/list 未被 `-32600` 拒绝。
- **断言**：强制 initialize→tools/list→tools/call 时序。
- **根因**：同 #9，`mcp-protocol.mjs:70`。
- **证据**：`evidence/D9-4/stdout.log`

## #12【P1】D2-1 auth init 隔离 HOME 未落盘

- **现象**：隔离 HOME 下 `auth init` 返回 `{status:"ok"}`，但 S1/KooCLI/OBS 三个凭证文件均未生成（S1=false, KooCLI=false, OBS=false）。
- **断言**：auth init 成功必须落盘 S1 且同步 KooCLI/OBS。
- **根因**：`auth/service.mjs initAuth` 在无交互/隔离 HOME 时只设置运行时凭证并返回 ok，未写 `~/.config/huaweicloud/credentials.json`。
- **证据**：`evidence/D2-1/stdout.log`

## #13【P1】D2-12 runtime 凭证未被 auth_sync 识别

- **现象**：同一 MCP 会话内 `auth_switch(mode=memory,temporary)` 成功后 `auth_sync(target=all)` 返回 `HDKIT_CRED_MISSING`（未配置华为云凭证）。
- **断言**：runtime 凭证存在时 auth_sync 应识别并抑制落盘（R10）。
- **根因**：`tools.mjs:1486` 调 `auth/service.mjs syncAuth` 只读持久凭证，未走 `resolveCredentialsWithRuntime`。
- **证据**：`evidence/D2-12/stdout.log`

## #14【P1】D3-S4 领券闭环凭证不匹配

- **现象**：`voucher_status` claimed=false；`voucher_claim` 返回 `{claimed:false,code:"HDKIT_CRED_INVALID",message:"AK/SK 无效或不匹配"}`，但同机 hcloud 只读/写资源均成功。
- **断言**：领券应 status→claim→status 闭环，claim 成功且 claimed 翻转为 true。
- **根因**：`tools.mjs:2036 hdkitVoucherClaim` 使用的 HDKit 凭证解析链路与 hcloud CLI 凭证不一致（`auth/credentials.mjs` 解析结果未透传）。
- **证据**：`evidence/D3-S4/stdout.log`

## #15【P1】D4-13 只读子账号隔离失效（越权写成功）

- **现象**：以 `run-as-readonly.py` 注入只读子账号后，`hcloud VPC CreateVpc` 实际创建成功（tctest-ro-deny，id 70b05649…，已立即删除归零），写操作未被 IAM 拒绝；只读 ECS 查询正常。
- **断言**：只读凭证下写操作必须被 IAM 拒绝。
- **根因**：`scripts/run-as-readonly.py:31-36` 仅注入 `HW_ACCESS_KEY/HW_SECRET_KEY` env，hcloud CLI 仍读取 `~/.hcloud/config.json` 管理员凭证，env 未覆盖 CLI 配置。
- **证据**：`evidence/D4-13/stdout.log`；资源已归零。

## #16【P2】D8-9 sanitizeValue 未脱敏凭证

- **现象**：`sanitizeValue("ak=AK0123... token=secret-token-123 name=ok-value")` 原样返回，AK/token 明文保留。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值并保留合法值。
- **根因**：`telemetry/telemetry.mjs:190 sanitizeValue` 仅清换行/截断长度，无凭证脱敏正则。
- **证据**：`evidence/D8-9/stdout.log`

## #17【P1】EXP-E01 路由 MISS

- **现象**：中文意图“帮我查一下我账号在华北北京四有哪些云主机” serviceCatalog 实际=`Run hcloud --help to list available services.`，期望 ECS，判 MISS。
- **断言**：该意图应命中 ECS。
- **根因**：`tools.mjs` serviceCatalog routeMap 未覆盖“华北北京四/云主机”组合；详见 `eval/results/eval-run-20261120212617.csv`。
- **证据**：`evidence/EXP-E01/stdout.log`

## #18【P1】D10-4 规则库规模与设计基线漂移

- **现象**：`loadRiskRules()` 实际 19 条（9 deny + 10 warn），设计预期 16 条（9 deny + 7 warn）。
- **断言**：规则库应为 9 deny + 7 warn（设计基线）。
- **根因**：`safety/rules/cloud-risk-rules.json` 新增 3 条 warn 规则，用例基线未同步（SPEC 漂移，非功能错误）。
- **证据**：`evidence/D10-4/stdout.log`

## #19【P1】D4-24 确认令牌错误码命名漂移

- **现象**：跨会话/无效令牌返回 `CONFIRM_TOKEN_NOT_FOUND`，用例预期 `CONFIRM_TOKEN_EXPIRED`；重复确认与无效令牌均被拒绝（安全语义成立）。
- **断言**：过期令牌应返回精确 `{code:"CONFIRM_TOKEN_EXPIRED"}`。
- **根因**：`hcloud-cli.mjs:113 consumeApprovalToken` 统一返回 NOT_FOUND，未区分过期与不存在。
- **证据**：`evidence/D4-24/stdout.log`

## #20【P2】D4-25 遥测 capability 取值漂移

- **现象**：hook-events.jsonl 事件 `key=cli:read/cli:write` 正确，但 `capability` 字段值为 `cli`；非 hcloud 命令未产生 `cli:invoke` 事件。
- **断言**：capability 应为 `cli:read/cli:write/cli:invoke` 三态。
- **根因**：`huaweicloud-safety.py:416 record_cli_event` 将 capability 归类为顶层 `cli`，且非 hcloud 命令未入事件。
- **证据**：`evidence/D4-25/stdout.log`
