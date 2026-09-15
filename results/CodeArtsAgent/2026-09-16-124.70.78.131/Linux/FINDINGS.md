# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-16-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-16 07:40:00（北京时间）
> **被测对象**：huaweicloud-devkit npm latest v1.1.5（gitHead e7ed6f6）
> **本轮结论**：全部缺陷为历史 issue 复现或延续，无本轮新增缺陷。

---

## #1【P0】D4-5 framework Apply* 写误判 unknown_read（框架运行时 policy 漂移）

- **现象**：`huaweicloud_plan_cli_command args=["EIP","ApplyEip","--eip_id","test"]` 返回 `{decision:allow, risk:unknown_read, safeToRun:true}`；源码 spawn 已正确 `deny/write`。
- **断言**：`EIP ApplyEip` 属写操作，应返回 `decision=deny, risk=write`。
- **根因**：`~/.codeartsdoer/huaweicloud-plugins/safety/policy.json` `writeOperationPrefixes` 仅 32 项缺 `Apply`；源码 `plugins/huaweicloud-core/safety/policy.json` 已含 `Apply`（33 项）。框架运行时策略版本滞后于源码。
- **影响**：Apply 系列云写操作可绕过审批被误判只读放行。
- **证据**：`evidence/D4-5/stdout.txt`
- **状态**：复现（历史 #685）

## #2【P0】D4-2 凭证 env 打印拦截不完整

- **现象**：`hook_check_command "printenv HW_ACCESS_KEY"` 返回 `{ok:true, decision:allow}`。源码 safety-policy.mjs 的 classifyTextCommand 已加 HW_ 前缀拦截（#650），但 hook 层走 cloud-risk-rules.json 未覆盖 HW_。
- **断言**：`printenv HW_ACCESS_KEY` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:39` 的 env-dump 规则 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀；#650 修复仅落在 safety-policy.mjs 的 classifyTextCommand 层，未同步 risk-rule-engine 的规则文件。
- **影响**：凭证环境变量可被打印进入 agent 上下文。
- **证据**：`evidence/D4-2/stdout.txt`
- **状态**：复现（历史 #673，分层修复不完整）

## #3【P0】D4-15 hook ANSI-C 编码绕过

- **现象**：`hook_check_command` 对 ANSI-C 编码 `$'hcloud E\x43S DeleteServers'` 返回 `allow`。
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

- **现象**：`retrieve_skill huaweicloud-core` 的会话启动节指引调用 `huaweicloud_check_update`/`huaweicloud_upgrade`，框架层未暴露该 2 工具。
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

- **现象**：`hook_check_command "hcloud ecs CreateServers --adminPass xxx"` 返回 `allow`，无明文密码告警。源码 redactString 含 adminPass 脱敏规则。
- **断言**：含 adminPass 命令应告警/脱敏。
- **根因**：`cloud-risk-rules.json` 无明文密码类风险规则（安全策略层有脱敏、hook 层无告警）。
- **证据**：`evidence/D4-6/stdout.txt`
- **状态**：复现（历史 #673）

## #8【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`hook_check_command ""` 返回 `allow`。
- **断言**：畸形输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` 无 finding 即 `allow`。
- **证据**：`evidence/D4-17/stdout.txt`
- **状态**：复现（历史 #673）

## #9【P1】D9-2 JSON-RPC unknown tool 未区分 -32602

- **现象**：源码 spawn 后 unknown method 已返回 `-32601`（#650 修复），但 unknown tool 仍返回 `-32603`，标准应为 `-32602`。
- **断言**：unknown method → -32601；unknown tool → -32602。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` 与 `mcp-protocol.mjs` 仅修复 method 未修复 tool 参数错误 -32602。
- **证据**：`evidence/D9-2/stdout.txt`
- **状态**：部分修复（延续上一轮 D9-2）

## #10【P1】D10-3 serviceCatalog 中文意图路由大面积 MISS

- **现象**：`run-eval.mjs` 15 条中文评测 HIT=3 MISS=11 N/A=1，准确率 21.4%（<90%）。
- **断言**：中文意图命中对应服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 仅 sandbox/voucher 含 CJK 关键词；`tools.mjs` token 分词对中文不切分。
- **证据**：`evidence/D10-3/stdout.txt`、`eval/results/eval-run-20260915232254.csv`
- **状态**：上一轮 #11 延续
