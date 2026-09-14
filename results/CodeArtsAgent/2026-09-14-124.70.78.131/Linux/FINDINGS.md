# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-14-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-14 22:47:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.4-next.6（gitHead 69ac727）

## #1【P0】凭证 env 打印拦截不完整 — HW_ACCESS_KEY/HW_SECRET_KEY 前缀未被 env-dump 规则覆盖

- **现象**：`env | grep HW_ACCESS_KEY`、`printenv HW_ACCESS_KEY HW_SECRET_KEY` 经 `huaweicloud_hook_check_command` 均判 `decision=allow`、`findings=[]`（未拦截）。
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `decision=deny`（命中 hwc-command-env-dump）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` env-dump 规则第二条件正则 `(HUAWEICLOUD|HWC_|HCLOUD|OS_)` 未覆盖华为云 Terraform 官方凭证 env 前缀 `HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN`。
- **影响**：P0 凭证 env 打印拦截被 `HW_*` 前缀绕过，AK/SK 可经 `env | grep HW_ACCESS_KEY` 泄漏进 agent 上下文。
- **证据**：`evidence/D4-2/stdout.log`
- **状态**：已提单 #673

## #2【P0】hook 命令绕过 — 破坏性操作经 shell 命令替换 + ANSI-C quoting 被放行

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 经 `huaweicloud_hook_check_command` 判 `decision=allow`（findings 空），而 shell 展开后等价 `hcloud ECS DeleteServer --id x`（破坏性删除）。
- **断言**：该命令应被判 `deny`/`warn`（命中 hwc-destructive-delete-operation）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` conditionMatches() 用纯正则 `new RegExp(condition.regex,'ims').test()` 做文本匹配，不做 shell 语法/命令替换展开；`$()` 与 `$'\x43'`(=C) 编码破坏 `hcloud <service> <op>` 匹配。
- **影响**：P0 安全 hook 可被命令替换/ANSI-C quoting 规避，破坏性删除绕过审批。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：已提单 #673

## #3【P0】全局规则 huawei-agent-rules 未注入（孤儿文件）

- **现象**：`rules/huawei-agent-rules.mdc`（78 行，含 MUST NOT `hcloud csms download-secret`/`hcloud kms decrypt` 等约束）存在，但全仓库 grep `agent-rules` 零命中（仅文档历史）；`setup-cli.mjs` 只复制 `integrations/*` 的 commands/hooks，从不注入该规则。
- **断言**：11 安装目标应注入全局规则且无孤儿文件；文件名应为 `.md`。
- **根因**：`rules/huawei-agent-rules.mdc` 未被任何 install/inject 路径引用；文件名 `.mdc` 与契约 `.md` 不符。
- **影响**：P0 全局安全约束（禁直连 CSMS/KMS）未随安装注入任何 agent 目标，约束不生效。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：已提单 #673

## #4【P1】hook 层缺失 adminPass 明文回显警告

- **现象**：`hcloud ECS CreateServers --server.1.name web --server.1.adminPass MySecret123` 经 `huaweicloud_hook_check_command` 判 `decision=allow`、`findings=[]`，无任何明文密码回显警告。
- **断言**：含 adminPass 明文密码的命令应触发告警/不回显。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 无 adminPass/明文密码回显警告规则（redactEvidence 仅在证据摘录层脱敏 adminPass，不产生命令级警告）。
- **影响**：P1 明文 adminPass 可裸出现于命令行/shell 历史，无预警。
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：已提单 #673

## #5【P1】hook 畸形输入 fail-open（非 fail-closed）

- **现象**：畸形 JSON artifact（`{not-valid-json!!!`）经 `huaweicloud_hook_check_artifacts` 判 `decision=allow`，未按 fail-closed 语义拒绝。
- **断言**：无法匹配任何规则的异常输入应默认拒绝（fail-closed）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，对无法匹配任何规则的输入直接 allow，缺 fail-closed 兜底。
- **影响**：P1 畸形/异常输入缺省放行，与「异常输入默认拒绝」契约漂移。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：已提单 #673

## #6【P1】工具协议暴露漂移 — TOOL_DEFINITIONS 40 个但 agent 框架 MCP 仅暴露 37 个

- **现象**：`plugins/huaweicloud-core/src/tools.mjs` TOOL_DEFINITIONS 共 40 个工具（含 `huaweicloud_check_update`/`huaweicloud_upgrade`/`huaweicloud_obs_set_website_config`）；`mcp-protocol.mjs` tools/list 返回全量。但当前 CodeArts CLI 框架 MCP 工具目录仅 37 个，`tool_call huaweicloud_check_update` 返回 `MCP tool not found in catalog`。
- **断言**：升级提醒工具（check_update/upgrade）应通过 MCP 可调用，D1-41 可实测其返回契约（currentVersion/latestNext/updateAvailable）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 定义 3 个工具未在 agent 框架层暴露（疑似框架 MCP 集成过滤自身升级/特定写工具），需维护者判定是否为设计意图。
- **影响**：D1-26/D1-27/D1-28/D1-31/D1-40/D1-41/D1-42/D1-45 升级提醒链无法黑盒实测；D5-3/D9-1 工具枚举出现 40 vs 37 漂移。
- **证据**：`evidence/D1-26/stdout.log`
- **状态**：已提单 #673
