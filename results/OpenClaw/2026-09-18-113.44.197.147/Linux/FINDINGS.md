# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-09-18-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-18 05:37（北京时间）
> **被测版本**：`v1.1.5`（npm latest 正式版，gitHead `e7ed6f6`，release-1.1.5）
> **工具全集**：40（`tools.mjs` TOOL_DEFINITIONS）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

## 去重结论（本轮先读）

本轮按「每日测试」强制完整重跑：**40 个探针 + 2 个新增用例专项探针全部 fresh 执行**，证据全新落盘 `evidence/<case-id>/`。被测版本仍为 v1.1.5（gitHead `e7ed6f6`，与昨日及 NP 已发布版本一致），13 项 FAIL/SPEC 根因逐条与上游 open issue 核对，**全部命中历史同源源单，本轮不新开单**。详见 `HISTORY_LINKS.md`。

新增 2 条 daily 用例（2026-09-18 精选集纳入）：
- `D2-26`（凭证备份/恢复 backupGlobalCredentials/restoreGlobalCredentialsBackup）→ **PASS**（隔离 HOME 探针全部通过），新增探针 `evidence/d2-auth/probe-d2-26-backup-restore.mjs`。
- `D4-27`（redactSecrets/redactOutput 双路径脱敏完整性）→ **FAIL**：裸 `token=` 关键字与小写 `ak=`/`sk=` 未脱敏，命中 Hermes #726（裸 `token=`，今日已提单）+ #683（小写 ak/sk），**不重复提单**。

其余 11 项 FAIL + 1 项 SPEC 均历史同源（与昨日一致），无新增缺陷。

---

## #1【P0】D4-2 凭证 env 打印拦截残留 — `env|grep HW_*` 仍放行（v1.1.5 修复不完整）

- **现象**：`printenv HW_ACCESS_KEY`→`deny`、`env|grep HUAWEICLOUD_ACCESS_KEY_ID`→`deny` 均已拦截；但 `env | grep HW_SECRET_KEY` 仍返回 `allow`（本应 `deny`）。
- **断言**：`classifyTextCommand('env | grep HW_SECRET_KEY').decision` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:399` env-dump 判定正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；`:418-419` 新增「凭证变量引用」规则只命中 `printenv HW_ACCESS_KEY`/`$HW_*` 形态，`grep HW_SECRET_KEY` 裸词元不命中。
- **影响**：运行态 AK/SK 可经 `env | grep HW_*` 明文打印，凭证泄漏安全红线（I 类）未彻底关闭。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：历史同源 #651/#652/#673/#674/#676/#679/#681/#682/#690/#694 等（v1.1.5 修复不完整残留，不重复提单）

## #2【P0】D4-16 命令包裹穿透残留 — `sh -c "env|grep ..."` 文本路径未解包

- **现象**：`bash -c "cat ~/.config/huaweicloud/credentials.json"`→`deny`（`stripExecutable` 解包生效）；但 `sh -c "env | grep HUAWEICLOUD_ACCESS_KEY_ID"` 仍返回 `allow`。
- **断言**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY_ID"').decision` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:67-102` `stripExecutable()` 仅被 `classifyHcloudArgs` 路径调用解包写命令；`classifyTextCommand` 的 env-dump 判定（`:399`）直接对原始文本做词边界匹配，未递归解包 `sh -c "..."` 内层。
- **影响**：攻击者可用 `sh -c` 包裹绕过凭证 dump 拦截，安全盲区。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：历史同源 #651/#652/#673/#674/#676/#679（v1.1.5 修复不完整残留，不重复提单）

## #3【P1】D4-17 hook 三工具畸形输入 fail-open（应 fail-closed）

- **现象**：`huaweicloud_hook_check_command`/`hook_check_artifacts`/`hook_check_deploy_plan` 对 null/空串/非数组等畸形输入均返回 `{ok:true, decision:"allow", findings:[]}`。
- **断言**：畸形输入（null/空/类型错误）应返回 `decision:"deny"`（fail-closed）或明确错误，而非 `allow`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:111-119` 三个 `evaluate*` 导出函数对非法入参无类型守卫，`evaluateArtifacts`（`:115-116`）用 `Array.isArray(artifacts) ? artifacts : []` 把非数组归一为空数组后返回 `allow`。
- **影响**：畸形/不可解析输入被放行，攻击者可构造异常输入绕过 hook 预检。
- **证据**：`evidence/d4-security-core/probe-d4-17-hook.stdout.log`
- **状态**：历史同源 #564/#689（不重复提单）

## #4【P0】D9-2 JSON-RPC 错误码残留 — -32602（invalid params）未区分

- **现象**：非法参数（`tools/list` 传 string params）不返回 `-32602` 错误对象，而是正常返回 result；`tools/call` 缺 name/未知工具返回 `-32603` 而非规范的 `-32602`。
- **断言**：`tools/list` 带非法参数类型应返回 `error.code=-32602`（Invalid params）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46-98` `dispatch()` 未对 params 类型做校验，`mcp-server.mjs:156-162` 直接 `dispatch(message.method, message.params || {}, ...)`。
- **影响**：客户端无法区分「参数非法」与「内部错误」，JSON-RPC 2.0 错误码映射仍不完整。
- **证据**：`evidence/d9-protocol/probe-d9-2-invalid.stdout.log`、`eval/results/protocol-probe-*.json`（D9-2b-invalid-params FAIL）
- **状态**：历史同源 #704（其他客户端已提单）+#643/#672（不重复提单）

## #5【P2】D9-7 协议版本协商降级缺失 — protocolVersion 不校验不回显

- **现象**：`initialize` 传 `protocolVersion:"2024-10-01"`（旧）或 `"2099-01-01"`（未来）均原样回显并 `capabilities:{tools:{}}`，无版本协商/降级/明确报错。
- **断言**：不支持的 protocolVersion 应协商降级或明确报错，不得原样回显未来版本。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:62` `protocolVersion: params.protocolVersion || '2024-11-05'` 直接透传，无版本校验/协商逻辑。
- **影响**：标准客户端版本协商失效，跨版本互通无保障。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：历史同源 #702（前日本客户端提单，不重复提单）

## #6【P0】D4-21 hook_check_artifacts 未拦截 Terraform HCL broad IAM（actions=["*"]）

- **现象**：JSON 形态 `Action:"*"`+`Effect:"Allow"` → `deny`；但 Terraform HCL `resource "huaweicloud_iam_policy" { statement { actions = ["*"] } }` → `allow`（0 findings）。
- **断言**：HCL 形态 `actions = ["*"]` 制品应被拦截（deny 或 findings 非空）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:189` 规则 Action 正则 `"Action"\s*:\s*...` 仅匹配 JSON 形态（`Action` 大写+冒号），未覆盖 Terraform HCL 小写 `actions = ["*"]` 块语法。
- **影响**：IaC 制品 broad IAM 漏检，最小权限红线失效。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：历史同源 #651/#652（不重复提单）

## #7【P0】D4-23 全局规则 huawei-agent-rules.mdc 注入失效（11 安装目标）

- **现象**：`package.json` `files` 白名单不含 `rules`；`setup-cli.mjs` 0 处引用 `rules/`/`.mdc`/`agent-rules`，安装目标无注入规则文件。
- **断言**：`package.json` `files` 应含 `rules`，安装目标应注入 `huawei-agent-rules`。
- **根因**：`package.json:8-18`（files 白名单缺 `rules`）+ `plugins/huaweicloud-core/src/setup-cli.mjs`（无 `rules/` 引用）。
- **影响**：全局安全规则未注入任何 agent 客户端。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.stdout.log`
- **状态**：历史同源 #651/#673/#674/#676/#679（不重复提单）

## #8【P1】D4-6 adminPass 空格形式回显未脱敏（明文字段泄漏）

- **现象**：`huaweicloud_plan_cli_command` 对 `--adminPass Secret123`（空格形式）返回 `args` 含明文 `Secret123`；等号形式可脱敏。
- **断言**：`plan_cli_command` 对 `--adminPass Secret123` 返回 `args` 不应含明文 `Secret123`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 正则 `...\s*[:=]\s*(...)` 只覆盖 `=`/`:` 分隔，KooCLI 空格形式不命中。
- **影响**：口令参数明文回显，弱化脱敏保护。
- **证据**：`evidence/d4-security-core/probe-d4-6-adminpass.stdout.log`
- **状态**：历史同源 #712（CodeArtsWork 已提单）+#651/#673/#679（不重复提单）

## #9【P1】D4-7 hook 三工具部分失效 — hook_check_artifacts broad IAM 未拦截

- **现象**：三工具中 `hook_check_command`（env dump/凭证文件）、`hook_check_deploy_plan`（公网暴露）均 `deny`；但 `hook_check_artifacts` 对 HCL `actions=["*"]` 返回 `allow`。
- **断言**：`hook_check_artifacts` 对 broad IAM 制品（HCL）应返回 `deny`。
- **根因**：同 #6，`cloud-risk-rules.json:189` 未覆盖 HCL 形式。
- **证据**：`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **状态**：历史同源 #651/#652（不重复提单）

## #10【P1】D10-3 中文意图路由未命中（serviceCatalog 仅英文关键词）— 展开级 EXP-E 同源

- **现象**：`serviceCatalog` 注入 15 条中文评测意图（EXP-E01~E15），仅 3 条命中（E06 DCS、E09 CCE、E15 voucher），11 条 MISS + E08 N/A，准确率 21.4%（分母 HIT+MISS=14）。
- **断言**：中文意图 `serviceCatalog(x).recommendedServices` 应含期望服务，准确率 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1910` `serviceCatalog()` `routeMap` 关键词表仅英文词元，中文词元无法命中任一 route。
- **影响**：中文用户意图无法正确路由到服务能力。
- **证据**：`evidence/d10-routing/probe-d10-routing.stdout.log`、`evidence/d10-routing/run-eval.stdout.log`
- **状态**：历史同源 #705 + #706 + #714 + #689 + #680（不重复提单）

## #11【P1】D9-4 协议生命周期 — initialize 握手时序未强制

- **现象**：新连接未发 `initialize` 前直接发 `tools/list`，服务端仍返回正常 result（40 工具），未拒绝。
- **断言**：initialize 前发 `tools/list` 应返回 JSON-RPC 错误（-32000/-32600，message 含 initialize）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:156-162` `handleMessage` 未维护会话初始化状态，直接 `dispatch(message.method, ...)` 处理任意方法。
- **影响**：违反 MCP 握手时序规范。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：历史同源 #699（不重复提单）

## #12【P1】D9-9 tools/call 超时/取消语义 — capabilities.cancellation 未暴露（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities:{tools:{}}`，未声明 `notifications.cancellation`。
- **断言**：协议应声明取消/超时能力。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:62-65` initialize 返回 capabilities 仅 `{tools:{}}`，未声明 cancellation。
- **影响**：标准客户端无法感知取消能力。
- **证据**：`evidence/d9-protocol/probe-d9-6-9-crossclient.stdout.log`
- **状态**：历史同源 #698（不重复提单）

## #13【P1】D4-27 redactSecrets/redactOutput 双路径脱敏缺裸 `token` 关键字与小写 `ak=/sk=`（新增 daily 用例）

- **现象**：`redactSecrets('token=TokenValue…')` 返回原文（裸 `token=` 未脱敏）；`redactSecrets('ak=AKA123 sk=SKS456')` 返回原文（小写 `ak=`/`sk=` 未脱敏）。同输入对象键 `{token}`、`{ak}`、`{sk}` 与 `password=`/`adminPass=` 均正常替换为 `<redacted>`。
- **断言**：裸 `token=` 关键字后跟的值应替换为 `<redacted>`；小写 `ak=`/`sk=` 后跟的值应替换为 `<redacted>`（与 `security_token`/`password`/`adminPass` 一致脱敏语义）。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 第二条 replace 的 secret 关键字列表未含裸 `token`；`:45` 第三条 replace `(AK|SK)` 无 `/i` 标志，小写 `ak=`/`sk=` 不命中。`hcloud-cli.mjs:587` `redactOutput` 文本路径复用 `redactSecrets`，双路径同步缺口。
- **影响**：`token=` 形式访问令牌与小写 `ak=`/`sk=` 可经日志/对话输出明文泄漏，D4-27「双路径脱敏完整性」P1 用例实测 FAIL（13 断言中 2 FAIL）。
- **证据**：`evidence/d4-security-core/probe-d4-27-redact.stdout.log`
- **状态**：历史同源 #726（裸 `token=`，Hermes 今日已提单）+ #683（小写 ak/sk，不重复提单）

---

## 展开级 EXP-E 与 D10-3 映射

展开级 `EXP-E01`~`EXP-E15` 是 D10-3 中文评测集（`eval/prompts/eval-set-v1.csv` 同源），执行结果按 D10-3 源码级路由断言回填：

- `EXP-E06`/`EXP-E09`/`EXP-E15` → **PASS**（命中路由）
- `EXP-E01`~`E05`/`E07`/`E10`~`E14` → **FAIL**（路由 MISS，同 #10 根因）
- `EXP-E08` → **BLOCKED**（真实 Agent 会话诊断意图层，run-eval.mjs 无法代理）