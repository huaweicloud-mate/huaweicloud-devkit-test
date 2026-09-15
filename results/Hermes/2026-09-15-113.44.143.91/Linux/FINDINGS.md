# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4-pro-0813）

> **落盘路径**：`results/Hermes/2026-09-15-113.44.143.91/Linux/FINDINGS.md`
> **生成时间**：2026-09-15 13:04:25（北京时间）
> **被测版本**：`v1.1.4`（npm latest，gitHead `9b67256`，release-1.1.4）
> **结论**：`FAIL`（复现确认 10 项缺陷；其中 5 项命中上游已提单不重复开单，5 项新提单 #689）
>
> 说明：`file_issue.py` 查重结果——#1(D4-2)/#2(D4-16)/#3(D2-4)/#4(D4-23)/#9(D8-1) 命中历史上游 issue（#674/#675/#677/#679/#681/#682 等），不重复提单；#5(D4-8)/#6(D4-17)/#7(D10-3)/#8(D2-11)/#10(D9-2) 5 项历史单未明确覆盖，统一提单 **#689**。详见同目录 `HISTORY_LINKS.md`。

## 格式铁律（给 agent）

每个缺陷一行标题 `## #序号【级别】标题`；每段含 `- **根因**：`（文件:行号）+ `- **断言**：`。

---

## #1【P0】凭证 env 打印拦截不完整（HW_ 前缀未覆盖）

- **现象**：`printenv HW_ACCESS_KEY` / `echo $HW_ACCESS_KEY` / `echo $HW_SECRET_KEY` / `printenv HW_SECRET_KEY` 均返回 `allow`，仅 `HUAWEICLOUD_`/`HWC_`/`HCLOUD_`/`OS_` 前缀命中 `deny`（2/6 拦截）。
- **断言**：`env/printenv/echo` 打印 `HW_*` 等凭证环境变量 → `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:336` — env-dump 判定正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 的 `HW_` 前缀。
- **影响**：凭证环境变量可被任意 Bash 命令读取回显，安全红线（凭证泄漏）失守。
- **证据**：`evidence/D4-2/stdout.log`、`evidence/security-stdout.txt`、`evidence/hook-stdout.txt`

## #2【P0】命令包裹/命令替换穿透 hcloud 写操作拦截

- **现象**：`bash -c 'hcloud ECS DeleteServers'`、`sh -c 'hcloud ecs DeleteServers'`、`eval "hcloud ecs DeleteServer"`、`$(hcloud ecs DeleteServer)`、`` `hcloud ecs DeleteServer` `` 全部返回 `allow`（0/4 拦截）。
- **断言**：命令包裹/sh -c/bash -c/eval/$()/反引号 不应绕过 hcloud 写操作拦截 → `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:345` — `/^|\s)hcloud(\.exe)?\s+/i` 仅匹配行首/空白后 `hcloud`，引号包裹/子 shell/命令替换内层命令未被递归解析。
- **影响**：写操作可通过命令包裹完全绕过审批门，破坏写操作强制审批的红线。
- **证据**：`evidence/D4-16/stdout.log`、`evidence/security-stdout.txt`

## #3【P0】小写 ak=/sk= 凭证脱敏遗漏

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文，含明文 AK123456/SKsecret（obsutilconfig 小写格式漏网）。
- **断言**：字符串级 `ak=`/`sk=`（含小写）应脱敏为 `<redacted>`，不泄露明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `.replace(/(AK|SK)\s*[:=]\s*(...)/g)` 大小写敏感、缺 `/i`，未匹配 lowercase `ak=`/`sk=`。
- **影响**：obsutil/OBS 配置文件中的 AK/SK 在小写键下不回显脱敏，凭证泄漏。
- **证据**：`evidence/D2-4/stdout.log`

## #4【P0】全局规则 huawei-agent-rules.md 未注入安装目标

- **现象**：`install --target hermes`（隔离 HOME）后 `find` 全目录无 `huawei-agent-rules.md`，规则文件孤岛（源仓库存在但零引用）。
- **断言**：安装后 11 个 Agent 目标均应注入 `huawei-agent-rules.md` 全文。
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs`（安装复制清单未含 `rules/` 目录，`rules/` 未被复制到安装产物）。
- **影响**：「禁止直连 csms/kms」等 MUST 约束在客户端不生效，Agent 可绕过安全指引。
- **证据**：`evidence/cli-stdout.txt`（D4-23 段 [缺] 未找到）

## #5【P1】Python/Node 安全钩子策略不一致

- **现象**：同一高危输入（`hcloud configure show`、`hcloud ECS DeleteServers`），Node hook 返回 `deny`，Python hook 返回空（放行）。
- **断言**：Python 与 Node 双路径对写操作/凭证检查应一致 `deny`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py` — Python hook 未实现与 Node hook（`huaweicloud-safety.mjs`）对等的拦截逻辑，直接放行。
- **影响**：使用 Python hook 的客户端（如 OpenCode 非 Hook 路径）安全拦截失效。
- **证据**：`evidence/hook-stdout.txt`

## #6【P1】hook 畸形输入 fail-open（应 fail-closed）

- **现象**：畸形 JSON（`not-json-at-all`）、空 `tool_input` 输入 Node/Python hook 均静默放行（返回空）。
- **断言**：不能解析/畸形的 hook 输入应默认拒绝（fail-closed），不得放行。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs:45-48`（解析失败静默 `return`，未走拒绝分支）。
- **影响**：攻击者可用畸形输入绕过 hook 拦截。
- **证据**：`evidence/hook-stdout.txt`

## #7【P1】中文意图路由未命中（serviceCatalog 英文关键词）

- **现象**：15 条中文自然语言评测意图仅 3 条命中期望服务（EXP-E06 DCS、E09 CCE、E15 voucher），12 条 miss（ECS/EIP/OBS/RDS/CBR/FunctionGraph/CES/ELB/IAM 等）。
- **断言**：中文意图路由到的服务（recommendedServices）应包含期望服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1892` — `serviceCatalog()` 关键词表仅英文，无中文关键词→服务映射。
- **影响**：中文用户意图无法正确路由到服务能力，评测集激活率/准确率不达标。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01~E15/stdout.log`

## #8【P2】R2 冲突门先于 R3 STS 检查

- **现象**：带 `securityToken` 的 persist（STS 临时凭证）在存在既有凭证时返回 `needs_confirmation`（R2），而非 `status:error/scope:rejected`（R3），STS token 拒绝落盘检查被 R2 冲突门拦截在前。
- **断言**：`auth_switch persist + securityToken` → `{status:error, scope:rejected}`，token 永不落盘。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1214` — persist 分支 `conflict = prev?.ak && prev.ak !== ak` 返回 `needs_confirmation`，先于内部 `persistCredentials`（R3 检查，tools.mjs:1013）执行。
- **影响**：STS 凭证路径下 R3 拒绝语义被前置冲突门遮蔽，返回契约与设计(R3)漂移。
- **证据**：`evidence/D2-11/stdout.log`（actual: status=needs_confirmation）

## #9【P2】文档宣称 39 工具 vs 实现 40

- **现象**：实现 `tools.mjs TOOL_DEFINITIONS = 40`（含 `huaweicloud_obs_set_website_config` #347），但 `AGENTS.md:27`、`AGENTS.md:45` 仍写「39 tools / 39 MCP tool definitions」。
- **断言**：文档工具数应与实现一致（40）。
- **根因**：`AGENTS.md:27,45` — 新增工具未同步文档（文档漂移）。
- **影响**：文档能力声明与实现不符，误导测试/审计。
- **证据**：`evidence/D8-1/stdout.log`、`evidence/docs-stdout.txt`

## #10【SPEC-MISMATCH】JSON-RPC 未知方法错误码 -32603 vs 规范 -32601

- **现象**：`initialize` 后调用未知方法 `unknown/method`，返回 JSON-RPC error `{code:-32603, message:"Unsupported method: ..."}`，规范应为 `-32601 Method not found`。
- **断言**：未知方法 → JSON-RPC error `code === -32601`。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:169` — 统一 catch 映射为 `code: -32603`（Internal error），未区分 -32601（Method not found）。
- **影响**：协议客户端无法区分「方法不存在」与「内部错误」，错误语义漂移（待维护者裁决）。
- **证据**：`evidence/protocol-stdout.txt`

---

### 汇总

| 级别 | 数量 | 用例 |
|---|---|---|
| P0 | 4 | D4-2 / D4-16 / D2-4 / D4-23 |
| P1 | 3 | D4-8 / D4-17 / D10-3(+EXP-E×12) |
| P2 | 2 | D2-11 / D8-1 |
| SPEC-MISMATCH | 1 | D9-2 |

> 全部 10 项均在 v1.1.4 稳定版（gitHead 9b67256）复现。其中 5 项（D4-2/D4-16/D2-4/D4-23/D8-1）命中上游已有 open issue（#674/#675/#677/#679/#681/#682），本轮不重复提单；5 项（D4-8/D4-17/D10-3/D2-11/D9-2）历史单未明确覆盖，本轮统一提单 **#689**。