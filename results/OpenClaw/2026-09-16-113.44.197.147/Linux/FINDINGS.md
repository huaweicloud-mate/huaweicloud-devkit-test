# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-09-16-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-16 07:40（北京时间）
> **被测版本**：`v1.1.5`（npm latest 正式版，gitHead `e7ed6f6`，release-1.1.5）
> **工具全集**：40（`tools.mjs` TOOL_DEFINITIONS）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

## 去重结论（本轮先读）

被测版本由 v1.1.4 升至 **v1.1.5**（今日发布，含 PR #650/#688 安全修复：D4-2 HW_ 前缀、D4-16 shell 包裹、D9-2 -32601）。经上游 `huaweicloud/huaweicloud-devkit` open issue 逐条核对：

- **v1.1.5 已修复（本客户端复测转 PASS）**：`D4-2` 主干（`printenv HW_ACCESS_KEY`/`echo $HW_SECRET_KEY`/`env|grep HUAWEICLOUD_*` 均 `deny`）、`D4-16` 命令包裹（`bash -c cat`/`sudo hcloud`/`sh -c hcloud 写` 经 `stripExecutable` 解包后 `deny`）、`D9-2` 未知方法 `-32601`（`dispatch` 抛 `Method not found` 且 `error.code=-32601`）。
- **v1.1.5 修复不完整（新残留，本轮 FAIL）**：`D4-2` 残留 `env|grep HW_*`、`D4-16` 残留 `sh -c "env|grep ..."` 文本 env-dump 路径、`D9-2` 残留 `-32602`（invalid params 未区分）。
- **历史同源（不重复提单）**：`D4-6`/`D4-7`/`D4-21`/`D4-23`/`D9-4`/`D9-9`/`D10-3` 均与既有 open issue #651/#652/#673/#674/#676/#679/#681/#682/#689/#698/#699/#680 对应（同根因字段），本轮复核复现，不新开单。
- **本轮新提单**：以下残留/新增项（#1 D4-2 残留、#2 D4-16 残留、#3 D4-17、#5 D9-7）。

---

## #1【P0】D4-2 凭证 env 打印拦截残留 — `env|grep HW_*` 仍放行（v1.1.5 修复不完整）

- **现象**：v1.1.5 修复后，`printenv HW_ACCESS_KEY`→`deny`、`echo $HW_SECRET_KEY`→`deny`、`env|grep HUAWEICLOUD_ACCESS_KEY_ID`→`deny` 均已拦截；但 `env | grep HW_SECRET_KEY` 与 `env | grep HW_ACCESS_KEY` 仍返回 `allow`（本应 `deny`）。
- **断言**：`classifyTextCommand('env | grep HW_SECRET_KEY').decision` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump 判定正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 仍未覆盖 `HW_` 前缀；而 #650 新增的「凭证变量引用」规则（`safety-policy.mjs:418-419`）只命中 `$VAR`/`${VAR}`/`printenv VAR` 形态，`grep HW_SECRET_KEY` 裸词元不命中。二者间隙导致 `env|grep HW_*` 残留。
- **影响**：运行态 AK/SK 可经 `env | grep HW_*` 明文打印，凭证泄漏安全红线（I 类）未彻底关闭。
- **证据**：`evidence/d4-security-core/probe-v115-fixes.stdout.log`、`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：待提单（v1.1.5 修复不完整残留）

## #2【P0】D4-16 命令包裹穿透残留 — `sh -c "env|grep ..."` 文本路径未解包（v1.1.5 修复不完整）

- **现象**：v1.1.5 修复后，`sudo hcloud ECS CreateServers`→`deny`、`bash -c "cat ~/.config/huaweicloud/credentials.json"`→`deny`（`stripExecutable` 解包生效）；但 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY_ID"` 仍返回 `allow`。
- **断言**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY_ID"').decision` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-102` `stripExecutable()` 仅被 `classifyHcloudArgs` 路径（`safety-policy.mjs:173-181` 等）调用用于解包写命令；`classifyTextCommand` 的 env-dump 判定（`safety-policy.mjs:398`）直接对原始文本做 `(^|\s)(env|printenv...)` 词边界匹配，未递归解包 `sh -c "..."` 内层，故包裹内 `env` 前为引号未命中。
- **影响**：攻击者可用 `sh -c` 包裹绕过凭证 dump 拦截，安全盲区。
- **证据**：`evidence/d4-security-core/probe-v115-fixes.stdout.log`
- **状态**：待提单（v1.1.5 修复不完整残留）

## #3【P1】D4-17 hook 三工具畸形输入 fail-open（应 fail-closed）

- **现象**：`huaweicloud_hook_check_command`/`hook_check_artifacts`/`hook_check_deploy_plan` 对 null/空串/非数组等畸形输入均返回 `{ok:true, decision:"allow", findings:[]}`，未拒绝也未崩溃提示。
- **断言**：畸形输入（null/空/类型错误）应返回 `decision:"deny"`（fail-closed）或明确错误，而非 `allow`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:111-119` 三个 `evaluate*` 导出函数对非法入参无类型守卫，直接 `return {decision:'allow', findings:[]}`；`tools.mjs` 中 `hook_check_*` 工具透传，未在工具层 fail-closed。
- **影响**：畸形/不可解析输入被放行，攻击者可构造异常输入绕过 hook 预检。
- **证据**：`evidence/d4-security-core/probe-d4-17-hook.stdout.log`
- **状态**：待查重（历史 #564 为 risk-rule-engine 异常输入 fail-open 同族语义，#689 项6 为 hook 文件层 fail-open）

## #4【P1】D9-2 JSON-RPC 错误码残留 — -32602（invalid params）未区分

- **现象**：v1.1.5 修复后，未知方法 `-32601` 已正确返回；但非法参数（`tools/list` 传 string params）不返回 `-32602` 错误对象，而是正常返回 result（或 `tools/call` 缺 name 返回 `-32603`）。
- **断言**：`tools/list` 带非法参数类型应返回 `error.code=-32602`（Invalid params）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46-98` `dispatch()` 未对 params 类型做校验，`mcp-server.mjs:162` 直接 `dispatch(message.method, message.params || {}, ...)`；`tools/call` 缺 name/未知工具仍统一 `-32603`。
- **影响**：客户端无法区分「参数非法」与「内部错误」，JSON-RPC 2.0 错误码映射仍不完整。
- **证据**：`evidence/d9-protocol/probe-d9-2-invalid.stdout.log`
- **状态**：待查重（历史 #643/#672/#651 项4 覆盖 -32601/-32602/-32603 不区分；v1.1.5 仅修复 -32601，-32602 残留）

## #5【P2】D9-7 协议版本协商降级缺失 — protocolVersion 不校验不回显

- **现象**：`initialize` 传 `protocolVersion:"2024-10-01"`（旧）或 `"2099-01-01"`（未来）均原样回显 `protocolVersion` 并 `capabilities:{tools:{}}`，无版本协商/降级/明确报错。
- **断言**：不支持的 protocolVersion 应协商降级或明确报错，不得原样回显未来版本。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:62` `protocolVersion: params.protocolVersion || '2024-11-05'` 直接透传，无版本校验/协商逻辑。
- **影响**：标准客户端版本协商失效，跨版本互通无保障。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：待提单（本轮新增，上游未见 D9-7 protocolVersion 协商单）

## #6【P0】D4-21 hook_check_artifacts 未拦截 Terraform HCL broad IAM（actions=["*"]）

- **现象**：JSON 形态 `Action:"*"`+`Effect:"Allow"` → `deny`（1 finding）、`Action:["ecs:*"]` → `warn`；但 Terraform HCL `resource "huaweicloud_iam_policy" { statement { actions = ["*"] } }` → `allow`（0 findings），未检出 broad IAM。
- **断言**：HCL 形态 `actions = ["*"]` 制品应被拦截（deny 或 findings 非空）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:188-196` `hwc-iam-admin-policy` 规则 Action 正则仅匹配 JSON 形态，未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法。
- **影响**：IaC 制品 broad IAM 漏检，最小权限红线失效。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`、`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **状态**：历史同源 #651/#652（不重复提单）

## #7【P0】D4-23 全局规则 huawei-agent-rules.mdc 注入失效（11 安装目标）

- **现象**：`package.json` `files` 白名单不含 `rules`；npm 包安装目录无 `rules/`；`setup-cli.mjs` 0 处引用 `rules/`、`.mdc`、`agent-rules`，安装目标无注入的规则文件。
- **断言**：`package.json` `files` 应含 `rules`，安装目标应注入 `huawei-agent-rules`。
- **根因**：`package.json:8-18`（files 白名单缺 `rules`）+ `plugins/huaweicloud-core/src/setup-cli.mjs`（无 `rules/` 引用）。
- **影响**：全局安全规则未注入任何 agent 客户端。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.stdout.log`
- **状态**：历史同源 #651/#673/#674/#676/#679（不重复提单）

## #8【P1】D4-6 adminPass 空格形式回显未脱敏（明文字段泄漏）

- **现象**：`huaweicloud_plan_cli_command` 对 `--adminPass Secret123`（空格形式）返回 `args` 含明文 `Secret123`；等号形式 `--adminPass=xxx` 可脱敏为 `<redacted>`。
- **断言**：`plan_cli_command` 对 `--adminPass Secret123` 返回 `args` 不应含明文 `Secret123`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 正则 `...\s*[:=]\s*(...)` 只覆盖 `=`/`:` 分隔，KooCLI 空格形式不命中。
- **影响**：口令参数明文回显，弱化脱敏保护。
- **证据**：`evidence/d4-security-core/probe-d4-6-plaintext.stdout.log`
- **状态**：历史同源 #651/#673/#679（不重复提单）

## #9【P1】D4-7 hook 三工具部分失效 — hook_check_artifacts broad IAM 未拦截

- **现象**：三工具中 `hook_check_command`（env dump/凭证文件）、`hook_check_deploy_plan`（公网暴露）均 `deny`；但 `hook_check_artifacts` 对 HCL `actions=["*"]` 返回 `allow`。
- **断言**：`hook_check_artifacts` 对 broad IAM 制品（HCL）应返回 `deny`。
- **根因**：同 #6，`cloud-risk-rules.json:188-196` 未覆盖 HCL 形式。
- **证据**：`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **状态**：历史同源 #651/#652（不重复提单）

## #10【P1】D10-3 中文意图路由未命中（serviceCatalog 仅英文关键词）— 展开级 EXP-E 同源

- **现象**：`serviceCatalog` 注入 15 条中文评测意图（EXP-E01~E15），仅 3 条命中期望服务（E06 DCS、E09 CCE、E15 voucher），11 条 MISS + E08 N/A，准确率 21.4%（分母 HIT+MISS=14）。
- **断言**：中文意图 `serviceCatalog(x).recommendedServices` 应含期望服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1910` `serviceCatalog()` `routeMap` 关键词表仅英文（`tokens.has(kw)` 走英文词元），中文词元无法命中任一 route。
- **影响**：中文用户意图无法正确路由到服务能力。
- **证据**：`evidence/d10-routing/probe-d10-routing.stdout.log`
- **状态**：历史同源 #689（项7）+ #680（不重复提单）

## #11【P1】D9-4 协议生命周期 — initialize 握手时序未强制

- **现象**：新连接未发 `initialize` 前直接发 `tools/list`，服务端仍返回正常 result（40 工具），未拒绝。
- **断言**：initialize 前发 `tools/call`/`tools/list` 应返回 JSON-RPC 错误（-32000/-32600，message 含 initialize）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:156-162` `handleMessage` 未维护会话初始化状态，直接 `dispatch(message.method, ...)` 处理任意方法。
- **影响**：违反 MCP 握手时序规范。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：历史同源 #699（昨日 OpenCode Windows 已提单，不重复提单）

## #12【P1】D9-9 tools/call 超时/取消语义 — capabilities.cancellation 未暴露（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities:{tools:{}}`，未声明 `notifications.cancellation`；`tools/call` 无超时 `-32000` 语义实现。
- **断言**：协议应声明取消/超时能力（超时返回 `{code:-32000, message 含 timeout}`）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:62-65` initialize 返回 capabilities 仅 `{tools:{}}`，未声明 cancellation。
- **影响**：标准客户端无法感知取消能力。
- **证据**：`eval/results/protocol-probe-20260915232009.json`
- **状态**：历史同源 #698（不重复提单）

---

## 展开级 EXP-E 与 D10-3 映射

展开级 `EXP-E01`~`EXP-E15` 是 D10-3 中文评测集（`eval/prompts/eval-set-v1.csv` 同源），执行结果按 D10-3 源码级路由断言回填：

- `EXP-E06`/`EXP-E09`/`EXP-E15` → **PASS**（命中路由）
- `EXP-E01`~`E05`/`E07`/`E10`~`E14` → **FAIL**（路由 MISS，同 #10 根因）
- `EXP-E08` → **BLOCKED**（真实 Agent 会话诊断意图层，run-eval.mjs 无法代理）