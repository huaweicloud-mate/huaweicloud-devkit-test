# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-26-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-26（北京时间）
> **被测对象**：huaweicloud-devkit npm latest `v1.1.7`（gitHead `7456d059`）
> **本轮结论**：设计级 FAIL 14 + SPEC-MISMATCH 1，展开级 FAIL 12（EXP-E 与 D10-3 同源路由 MISS）。全部为历史 issue 复现/延续（1.1.7 未修复；D9-12 同源缺陷已由历史 #699/#774 跟踪）。真云 OBS 用例 D3-C13 首轮因 obsutil 凭证过期失败，已重新同步凭证后复测转 PASS。

---

## #1【P0】D4-3 kms DecryptData 明文 secret API 未拦截

- **现象**：`hcloud csms ShowSecretVersion` 判 deny；但 `hcloud kms DecryptData --ciphertext x` 判 allow。
- **断言**：返回明文/二进制 secret 的 API 均应被拦截（deny）。
- **根因**：`plugins/huaweicloud-core/safety/policy.json:26` blockedSecretOperations 仅含 ShowSecretVersion/DownloadSecret/GetSecretValue，kms DecryptData 未列入。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：历史（已提，v1.1.7 未修复）

## #2【P0】D4-15 hook ANSI-C 编码绕过

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 命令替换变体判 allow（ANSI-C 引号编码绕过写操作风险规则）。
- **断言**：编码/命令替换变体不得绕过写操作风险规则，应 deny。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码与命令替换内层命令。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：历史 #673（复现，v1.1.7 未修复）

## #3【P0】D4-16 命令包裹穿透

- **现象**：`bash -c "hcloud ecs DeleteServers --server-id 1"` 判 allow；shell 包裹内层命令未穿透拦截。
- **断言**：shell 包裹内的写/敏感命令应穿透并 deny。
- **根因**：`plugins/huaweicloud-core/src/data/cloud-risk-rules.json` env-dump 规则词边界不匹配 shell 包裹内层。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：历史 #673（复现，v1.1.7 未修复）

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入

- **现象**：`rules/huawei-agent-rules.mdc` 全仓无安装/加载代码引用（孤儿文件），`package.json` files 不含 `rules`。
- **断言**：安装目标均应注入全局规则，无孤儿文件。
- **根因**：`package.json` files 缺 `rules`；`rules/huawei-agent-rules.mdc` 无安装/加载代码引用。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：历史 #673/#770/#758/#761（复现）

## #5【P0】D9-12 initialize 时序未强制（未 initialize 先 tools/list 未返回 -32600）

- **现象**：spawn mcp-server 后不发 initialize，直接发 `tools/list`，服务端正常返回 40 工具列表（未拒绝），未按 JSON-RPC 时序返回 -32600。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒并返回 -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:166` handleMessage 不维护 initialize 状态机；`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` tools/list 无条件返回，无 initialize 时序校验。
- **影响**：协议客户端可跳过握手直接枚举工具，破坏 MCP 初始化时序契约。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：历史 #699/#774 复现（D9-12 P0 用例首测同源缺陷）

## #6【P1】D4-17 hook 畸形输入 fail-open

- **现象**：畸形制品 `{not-valid-json!!!` 判 allow；空参数 `classifyHcloudArgs([])` 已修复为 deny。
- **断言**：畸形/空输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 allow，评估畸形制品未实现 fail-closed 兜底。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：历史 #673（复现，空参数分支已修复，畸形制品仍 fail-open）

## #7【P1】D4-24 确认令牌无结构化返回

- **现象**：重复确认返回 null（缺 `{outcome:'already_processed'}`）；过期令牌消费返回 entry（缺 `{code:'CONFIRM_TOKEN_EXPIRED'}`）。
- **断言**：过期令牌返回 `{code:'CONFIRM_TOKEN_EXPIRED'}`；重复确认返回 `{outcome:'already_processed'}`。
- **根因**：`plugins/huaweicloud-core/src/hcloud-cli.mjs:85` consumeApprovalToken 未做过期校验、未返回结构化 code/outcome。
- **证据**：`evidence/D4-24/stdout.log`
- **状态**：历史（#745/#747 相关，v1.1.7 未落地）

## #8【P1】D10-3 / D3-S5 / D3-S6 / D3-S7 / EXP-E01~E14 serviceCatalog 中文意图路由 MISS

- **现象**：中文/复合意图路由大量 MISS，准确率 21.4%（3/14）远低于 90%（「云主机」「定时函数」「部署 Web+RDS」均返回 fallback）。
- **断言**：中文/复合意图命中对应服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817` routeMap 仅 sandbox/voucher 含 CJK 关键词，其余 20+ 服务仅英文关键词。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`、`evidence/D3-S6/stdout.log`
- **状态**：历史 #11（复现）

## #9【P1】D9-9 tools/call 取消语义未声明（SPEC）

- **现象**：initialize capabilities 仅 `{tools:{}}`，未声明 `notifications.cancellation`。
- **断言**：tools/call 应声明取消语义（capabilities.notifications.cancellation）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（延续，历史 #774/#698）

## #10【P2】D4-25 Python hook 写操作遥测分类失效

- **现象**：独立写动词前为空格时遥测事件 key 判 `cli:invoke` 而非 `cli:write`（写→cli:write 分类正则未用词边界）。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` 写分类正则用 `(^|[A-Za-z0-9])` 而非 `\b` 词边界。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：历史 #13（复现）

## #11【P2】D8-1 文档与能力漂移（声明 39 tools，实现 40）

- **现象**：源码仓库 AGENTS.md 声明「39 tools」，实现 tools.mjs TOOL_DEFINITIONS=40。
- **断言**：文档声明的工具数应与实现一致。
- **根因**：`AGENTS.md` 硬编码 39，未随 tools.mjs 增至 40 同步。
- **证据**：`evidence/D8-1/stdout.log`
- **状态**：历史（已提，v1.1.7 未修复）

## #12【P2】D8-9 sanitizeValue 不脱敏敏感值

- **现象**：`sanitizeValue('ak=AK123 sk=SKsecret x-admin-token=TTT')` 返回原样，AK/SK/token 明文残留。
- **断言**：sanitizeValue 应移除 AK/SK/token 等敏感值，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏逻辑。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：历史 #797（复现，v1.1.7 未修复）
