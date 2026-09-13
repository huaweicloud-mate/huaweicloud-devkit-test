# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-09-13-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：2026-09-13 21:5x:xx（北京时间）
> **被测版本**：`huaweicloud-devkit@1.1.4-next.3`（npm @next，gitHead `3b6290bc`）
> **本清单是统一提单脚本 file_issue.py 的解析输入**，格式严格遵循 templates/findings.md。

## #1【P0】凭证环境变量打印拦截不完整（D4-2）

- **现象**：`printenv HW_ACCESS_KEY`、`echo $HW_ACCESS_KEY`、`echo $HW_SECRET_KEY` 均返回 `{"decision":"allow","risk":"not_huaweicloud"}`；而 `printenv HUAWEICLOUD_SK`、`env|grep HWC_` 被正确 deny。真实凭证环境变量名（README 定义的 `HW_ACCESS_KEY` / `HW_SECRET_KEY`）不在拦截规则覆盖内。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335-336` 的 env-dump 拦截规则环境变量名 pattern 仅为 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i`，未覆盖 `HW_` 前缀；且 `echo $VAR` 形式不在命令白名单内。
- **影响**：Agent 可打印 `HW_ACCESS_KEY/HW_SECRET_KEY` 明文，凭证泄露风险（P0）。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言 3 条：printenv HW_ACCESS_KEY / echo $HW_ACCESS_KEY / echo $HW_SECRET_KEY）。
- **状态**：待提单

## #2【P0】命令包裹穿透：shell 包裹的 hcloud 写命令未 hard-deny（D4-16）

- **现象**：`bash -c "hcloud ecs DeleteServers --server-id 1"` 返回 `allow`（仅附 warn 级 `hwc-destructive-delete-operation`）；`sh -c "echo x && hcloud rds CreateInstance"` 返回 `allow`（risk=unknown_read，service=sh）。均未 `decision=deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-77`（`stripExecutable`/`commandOperation`）只剥离**行首**的 `hcloud` 可执行名；shell 包裹形式（`bash -c`/`sh -c`）的 service 被识别为 `bash`/`sh`，写语义分类丢失，仅命中 warn 级破坏性命令风险规则而非 `decision=deny`。
- **影响**：高危写操作可借 shell 包裹绕过审批门（P0）。
- **证据**：`evidence/d4-security/stdout.log`（FAIL 断言 2 条）。
- **状态**：待提单

## #3【P0】全局规则 huawei-agent-rules 未注入安装目标（D4-23）

- **现象**：`install --target dsh` 成功后 `find ~/.dsh -name 'huawei-agent-rules*'` 为空（0 文件）；安装包内亦无 `.mdc`/agent-rules 文件。
- **根因**：规则文件 `rules/huawei-agent-rules.mdc` 仅存在于源码仓库，但 (1) 未列入 npm 发布白名单 `package.json` `files` 数组（无 `rules`）；(2) `plugins/huaweicloud-core/src/setup-cli.mjs` 无任何规则注入逻辑。故安装包不含、安装流程也不注入该规则文件。
- **影响**：已装 Agent 无全局安全规则约束（csms/kms 直连红线场景无法由规则层拦截）（P0）。
- **证据**：`evidence/dsh-install/stdout.log`（install 完成 + `huawei-agent-rules found under ~/.dsh: 0`）。
- **状态**：待提单

## #4【P1】JSON-RPC 错误码不规范（D9-2）

- **现象**：`dispatch('tools/bad', ...)` 直接抛出普通 `Error('Unsupported method: tools/bad')`，无 JSON-RPC 结构化 `-32601` 错误码。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:95` 对 unknown method 直接 `throw new Error(...)`，未封装成 MCP JSON-RPC `{code, message, data}` 结构。
- **影响**：MCP 客户端无法按规范错误码处理，与 JSON-RPC 2.0 契约漂移（P1）。
- **证据**：`evidence/d9-protocol/stdout.log`（FAIL 断言：`errMsg.includes('-32601')` 为 false）。
- **状态**：待提单