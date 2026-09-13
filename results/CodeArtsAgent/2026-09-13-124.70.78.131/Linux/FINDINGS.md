# FINDINGS — 缺陷发现清单（CodeArtsAgent-deepseek-v4-pro-0813）

> **落盘路径**：`results/CodeArtsAgent/2026-09-13-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-13 17:00:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.4-next.3（gitHead 3b6290b）

## #1【P0】hook 命令绕过 — 破坏性操作经 shell 命令替换 + ANSI-C quoting 被放行

- **现象**：`hcloud $(echo $'E\x43S DeleteServer') --id x` 经 `huaweicloud_hook_check_command` 判为 `decision=allow`（findings 空），而该命令 shell 展开后等价 `hcloud ECS DeleteServer --id x`（破坏性删除）。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:50-54` `conditionMatches()` 用纯正则 `new RegExp(condition.regex,'ims').test(...)` 做文本匹配，不做 shell 语法解析/命令替换展开；`safety/rules/cloud-risk-rules.json` 中 `hwc-destructive-delete-operation` 正则为严格三段式 `hcloud\s+\w+\s+(\w*Delete\w*)`，`$()` 与 `$'\x43'`(=C) 编码破坏了 `hcloud <service> <op>` 匹配。
- **影响**：P0 安全 hook 可被命令替换/ANSI-C quoting 规避，破坏性删除操作绕过审批。
- **证据**：`evidence/D4-15/stdout.log`
- **状态**：待提单

## #2【P0】全局规则 huawei-agent-rules 未注入（孤儿文件）

- **现象**：`rules/huawei-agent-rules.mdc`（78 行，含 MUST NOT `hcloud csms download-secret`/`hcloud kms decrypt` 直连等约束）存在，但全仓库（mjs/js/json/ts/mdc/md）grep `agent-rules` 零命中；`integrations/*` 与 `setup-cli.mjs` 均无复制/注入该规则的逻辑。
- **根因**：`rules/huawei-agent-rules.mdc` 未被任何 install/inject 路径引用，为孤儿文件；契约预期「11 安装目标注入且无孤儿文件」，且文件名 `.mdc` 与契约 `.md` 不符。
- **影响**：P0 全局安全约束（禁直连 CSMS/KMS）未随安装注入到任何 agent 目标，约束不生效。
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：待提单

## #3【P1】hook 层缺失 adminPass 明文回显警告

- **现象**：`hcloud ECS CreateServers --server.1.adminPass MySecret123 ...` 经 `huaweicloud_hook_check_command` 判 `decision=allow`、`findings=[]`，无任何明文密码回显警告。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 16 条规则无 adminPass/明文密码回显警告规则（`redactEvidence` 仅在证据摘录层脱敏 adminPass，不产生命令级警告）。
- **影响**：P1 明文 adminPass 可裸出现于命令行/shell 历史，无预警。
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：待提单

## #4【P1】hook 畸形输入 fail-open（非 fail-closed）

- **现象**：畸形 JSON artifact（`{not-valid-json!!!`）与畸形 deploy_plan（嵌套 `{{{{`）分别经 `hook_check_artifacts`/`hook_check_deploy_plan` 判 `decision=allow`，未按 fail-closed 语义拒绝。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:79-108` `evaluate()` 末行 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，对无法匹配任何规则的输入直接 allow，缺 fail-closed 兜底。
- **影响**：P1 畸形/异常输入缺省放行，与「异常输入默认拒绝」契约漂移。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单
