# DSH / Linux 2026-09-13 缺陷清单（根因 + 证据）

被测版本：`huaweicloud-devkit@1.1.4-next.3`（npm @next，gitHead `3b6290bc`）

## #1【P0】凭证环境变量打印拦截不完整（D4-2）

- **现象**：`printenv HW_ACCESS_KEY`、`echo $HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均未被拦截，`classifyTextCommand` 返回 `allow`（risk=not_huaweicloud）。真实凭证环境变量名（README 定义的 `HW_ACCESS_KEY` / `HW_SECRET_KEY`）不在脱敏/拦截规则覆盖内。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:334-343` 的 env-dump 拦截规则只匹配 `(env|printenv|Get-ChildItem Env:|gci Env:|dir Env:)` 命令，且环境变量名 pattern 仅 `HUAWEICLOUD|HWC_|HCLOUD|OS_`，未覆盖本项目真实使用的 `HW_` 前缀；`echo $VAR` 形式也不在命令白名单内。
- **影响**：Agent 可打印 `HW_ACCESS_KEY/HW_SECRET_KEY` 明文，凭证泄露风险。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言 3 条）。

## #2【P0】命令包裹穿透：shell 包裹的 hcloud 写命令未拦截（D4-16）

- **现象**：`bash -c "hcloud ecs DeleteServers --server-id 1"`、`sh -c "echo x && hcloud rds CreateInstance"` 均返回 `allow`，仅附加 warn 级规则（hwc-destructive-delete-operation），未 hard-deny。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-87`（`commandOperation`/`stripExecutable`）只剥离**行首的 `hcloud` 可执行名**，shell 包裹形式（`bash -c`/`sh -c`）的 `service` 被识别为 `bash`/`sh`，写语义分类丢失，仅命中 warn 级的破坏性命令风险规则而非 `decision=deny`。
- **影响**：高危写操作可借 shell 包裹绕过审批门。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言 2 条）。

## #3【P0】全局规则 huawei-agent-rules 未注入安装目标（D4-23）

- **现象**：`install --target dsh` 成功后，`~/.dsh` 下**无** `huawei-agent-rules.*` 文件；安装包内亦无 `.mdc`/`agent-rules` 文件。全局 MUST 约束（禁直连 `hcloud csms download-secret/show-secret`、`hcloud kms decrypt`）未被注入。
- **根因**：规则文件仅存在于源码仓库 `rules/huawei-agent-rules.mdc`（注意名为 `.mdc`，测试用例写 `.md`），但 (1) 未列入 npm 发布白名单 `package.json:8-17`（`files` 数组无 `rules`）；(2) `plugins/huaweicloud-core/src/setup-cli.mjs` 中无任何规则注入逻辑。故安装包不含、安装流程也不注入该规则文件。
- **影响**：已装 Agent 无全局安全规则约束，csms/kms 直连等红线场景无法由规则层拦截。
- **证据**：`evidence/dsh-install/stdout.log`（install 完成 + `find ~/.dsh -name 'huawei-agent-rules*'` 为空）。

## #4【P1】JSON-RPC 错误码不规范（D9-2）

- **现象**：`dispatch('tools/bad', ...)` 直接抛出普通 `Error('Unsupported method: tools/bad')`，无 JSON-RPC 结构化 `-32601` 错误码。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:95` 对 unknown method 直接 `throw new Error(...)`，未封装成 MCP JSON-RPC `{code, message, data}` 结构。
- **影响**：MCP 客户端无法按规范错误码处理，与 JSON-RPC 2.0 契约漂移。
- **证据**：`evidence/d9-protocol/stdout.log`（FAIL 断言）。

> 说明：本次未提单（run-only 每日执行 + 指令禁止处理 GitHub issue）。全量缺陷汇总供维护者统一提单参考。
