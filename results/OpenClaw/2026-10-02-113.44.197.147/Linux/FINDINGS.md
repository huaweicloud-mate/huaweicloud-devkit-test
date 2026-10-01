# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-10-02-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：`2026-10-02 06:20`（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1（npm next，gitHead `ffd7b47`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段。

---

## #1【P0】D4-7 / D4-21 hook_check_artifacts 宽泛 IAM 制品（Terraform HCL actions=["*"]）未拦截

- **现象**：`evaluateArtifacts/huaweicloud_hook_check_artifacts` 对宽泛 IAM Terraform/HCL 制品返回 allow。
  复现（源码级直调，1.1.8-next.1）：
  `evaluateArtifacts([{path:'iam.tf', content:'resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }'}])` → `{decision:'allow', findings:[]}`
  同类 JSON 形式 `{"Statement":[{"Effect":"Allow","Action":"*"}]}` → `deny`（hwc-iam-admin-policy 命中）。
- **断言**：`hook_check_artifacts` 对宽泛 IAM 策略制品（含 Terraform HCL `actions = ["*"]` 语法）应返回 `decision=deny` + `hwc-iam-admin-policy` finding。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196-209`（`hwc-iam-admin-policy`）——匹配正则仅覆盖 JSON 大写 `"Action":"*"` / `"Action":["*"]` / `Action=*` / `AdministratorAccess` / `FullAccess`，不识别 Terraform/HCL 小写复数 `actions = ["*"]`（无引号的 HCL attribute 语法）。
- **影响**：IaC 制品预检漏报宽泛 IAM 授权，Agent 生成的 Terraform 宽泛策略制品可能被放行；D4-7（hook 三工具有效性）、D4-21（具名回归）两用例 FAIL。
- **证据**：`evidence/D4-7/stdout.log`、`evidence/D4-21/stdout.log`（真实重跑 fail=1/fail=0）
- **状态**：待提单

## #2【P1】D4-6 adminPass 空格形式值未脱敏

- **现象**：`redactSecrets(['ECS','CreateServers','--adminPass','Secret123'])` 原样返回 `["ECS","CreateServers","--adminPass","Secret123"]`（明文未脱敏）；等号形式 `--adminPass=Secret123` 正常脱敏为 `<redacted>`。
- **断言**：`--adminPass <value>` 空格分隔形式（KooCLI 合法语法）值应被脱敏，args 不含明文 `Secret123` 且含 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` —— `redactString` 键值正则 `...\s*[:=]\s*...` 仅覆盖 `=`/`:` 分隔，空格分隔的 `--adminPass Secret123` 不命中；`plugins/huaweicloud-core/src/safety-policy.mjs:45` 的 `(AK|SK)...` 同样不含空格形式。
- **影响**：命令行明文密码进入 Agent 上下文/日志，凭证泄漏风险（P1）。
- **证据**：`evidence/D4-6/stdout.log`（probe-d4-6-adminpass 真实 fail=1）
- **状态**：待提单

## #3【P1】D4-25 Python hook 写命令遥测误分类（cli:write 恒不触发）

- **现象**：真机直调 `record_cli_event('hcloud VPC CreateSecurityGroup ...')` 产出 `cli:invoke`，预期 `cli:write`。三态实测 `['cli:read','cli:invoke','cli:invoke']`。
- **断言**：写动词（Create/Delete/Update…）命令应分类为 `cli:write`，只读为 `cli:read`，其余为 `cli:invoke`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` —— `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(Create|Delete|...)\w*")`，前缀要 `^` 或字母数字；但 `cmd` 由 `parts` 空格拼接为 `vpc CreateSecurityGroup`，写动词前是空格，永远不满足 `(^|[A-Za-z0-9])`，故 `cli:write` 恒不触发。
- **影响**：遥测事件分类失真，写操作被记录为 invoke，削弱安全审计/统计口径。
- **证据**：`evidence/D4-25/stdout.log`（真机三态实测）
- **状态**：待提单

## #4【P1】D4-27 双路径输出脱敏小写 ak=/sk= 未脱敏

- **现象**：`redactSecrets('ak=AKA123 sk=SKS456')` 原样返回（明文未脱敏）；大写 `AK=`/`SK=` 正常脱敏。
- **断言**：文本形式小写 `ak=`/`sk=` 键名值应被脱敏为 `<redacted>`，不残留明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— `/(AK|SK)\s*[:=]\s*.../g` 无 `/i` 标志，小写 `ak=`/`sk=` 不命中。
- **影响**：小写凭证键名文本输出泄漏明文，脱敏覆盖不完整。
- **证据**：`evidence/D4-27/stdout.log`（probe-d4-27-redact 真实 fail=1）
- **状态**：待提单

## #5【P2】D8-9 遥测值 sanitizeValue 未做凭证脱敏

- **现象**：`sanitizeValue('AK=ABC123XYZ')` / `sanitizeValue('token=secret123')` 原样返回（明文未脱敏）。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值与非法字符，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-196` —— `sanitizeValue` 仅 `replace(/[\r\n\t]+/g,' ')` + 截断 + `MAX_VALUE_LENGTH`，未调用 `redactSecrets`。
- **影响**：遥测值携带明文凭证上报，泄露风险（P2）。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #6【P0】D9-12 initialize 握手时序缺口：未 initialize 先 tools/list 未返回 -32600

- **现象**：未发送 `initialize` 直接 `dispatch('tools/list')` 正常返回 41 工具列表，而非 JSON-RPC -32600 错误。
- **断言**：非法时序（未 initialize 先 tools/list）应返回 JSON-RPC `-32600`（Invalid Request）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` —— `tools/list` 分支无会话初始化前置校验，直接 `return { tools: TOOL_DEFINITIONS }`；`plugins/huaweicloud-core/src/mcp-server.mjs` 的 `handleMessage` 也未维护 initialize 状态机（仅 `notifications/initialized` 直接 return）。
- **影响**：MCP 协议安全基线被破坏，客户端可跳过握手直接枚举全部工具（含凭证相关工具 schema）。
- **证据**：`evidence/D9-12/stdout.log`（probe-d9-12-handshake 真实 fail=1）
- **状态**：待提单

## #7【P1】D9-2 tools/list 传非法 params 未返回 -32602

- **现象**：`tools/list` 传 `params:'not-an-object'`（string）未返回 -32602，实际返回完整工具列表（200 风格）。
- **断言**：JSON-RPC 非法 params 应返回 `-32602`（Invalid params）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` —— `tools/list` 分支未校验 `params` 类型；`mcp-server.mjs` 的 `dispatch(message.method, message.params || {}, ...)` 将 string params 直接透传为 `{}` 拼接对象属性结果。注：`tools/call` 缺 name/未知工具已正确返回 -32602（`mcp-protocol.mjs:67,77`）。
- **影响**：JSON-RPC 错误码不规范，客户端无法机器断言参数错误。
- **证据**：`evidence/D9-2/stdout.log`（protocol-probe D9-2b invalid-params FAIL）
- **状态**：待提单

## #8【P1】D9-9 capabilities.cancellation 未声明（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities:{tools:{}}`，无 `notifications.cancellation` 声明。
- **断言**：按 MCP spec，支持取消能力应声明 `capabilities.notifications.cancellation`；未声明则客户端无法获知可取消。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:32-49` —— `initialize` 返回固定 `capabilities:{ tools:{} }`，未声明 cancellation 通知能力。
- **影响**：协议契约漂移，客户端无法依赖取消能力（待维护方裁决是否 SPEC 或实现缺失）。
- **证据**：`evidence/D9-9/stdout.log`（protocol-probe D9-9a SPEC-MISMATCH）
- **状态**：待提单（SPEC 待裁决）

## #9【P1】D10-3 中文意图路由 EXP-E01「云主机」未命中 ECS

- **现象**：`run-eval.mjs` 实测 HIT=13 MISS=1 N/A=1（准确率 92.9%），唯一 MISS 为 EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」→ 返回 `Run hcloud --help`，未命中 ECS。
- **断言**：中文意图「云主机」应命中 ECS 路由；准确率 ≥90% 已达标但该单条中文等价词缺失。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1970-1987` —— ECS routeMap 关键词含「弹性云服务器/云服务器/服务器/虚拟机/镜像」，缺中文等价词「云主机」（英文 `vm/instance/server` 命中但中文「云主机」不命中）。
- **影响**：中文服务意图覆盖不完全，1/15 评测集 MISS。
- **证据**：`evidence/EXP-E01/stdout.log`、`eval/results/eval-run-*.csv`
- **状态**：待提单

## #10【P2】D3-S5 复合中文意图（物联网+时序数据+前端托管）路由未命中

- **现象**：`service_catalog('物联网+时序数据+前端托管')` 返回 `Run hcloud --help`，未命中任何服务。
- **断言**：复合中文意图应拆分并命中存储（DDS/GaussDB）+ 托管（OBS/沙箱）多服务。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1968-2192` routeMap 关键词缺「物联网/时序数据」等，且 `serviceCatalog` 分词按 `[\s,./-]+` 不拆分 `+`/全角逗号 `、`，CJK 复合意图无法命中（真机直调实测空返回）。
- **影响**：复合中文意图路由覆盖不足（P2）。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：待提单

## #12【测试侧】D5-3 工具数从 40 → 41（新增 sandbox_expose_tunnel，非缺陷）

- **现象**：`TOOL_DEFINITIONS` 现为 41 个工具（新增 `huaweicloud_sandbox_expose_tunnel`），旧探针硬编码断言 40。
- **说明**：`tools.mjs` 注册源数量已是 41，与 manifest 一致，属产品新增能力而非缺陷，旧探针断言需更新为「=注册源数量」。
- **证据**：`evidence/D5-3/stdout.log`（probe-d3-d5 41=41 PASS，probe-obs-tool 硬编码 40 FAIL）

## #13【测试侧】D6-4 并发探针硬编码 40 → 41，实际并发调度正常

- **现象**：旧探针断言 30 并发 tools/list 返回 40 工具 → FAIL；实际返回 41 工具数组，无死锁无错乱。
- **说明**：`mcp-protocol.mjs` tools/list 返回 41 工具（新增工具），30 并发实测 lens=[41] 全一致，并发调度正确，非产品缺陷。
- **证据**：`evidence/D6-4/stdout.log`（真机 30 并发无错乱）

## #14【测试侧】D4-20/D4-24 探针按旧「throw」语义断言，1.1.8 #745 已改结构化 JSON 契约

- **现象**：旧探针期望 `run_approved_command` 对伪造/过期/重复 token 抛异常，1.1.8-next.1 已按 #745 改为结构化返回。
- **说明**：`run_approved_command` 现返回 `{status:'rejected',code:'CONFIRM_TOKEN_NOT_FOUND'}` / `{code:'CONFIRM_TOKEN_EXPIRED'}` / `{outcome:'already_processed'}`，D4-20/D4-24 预期结果已更新为结构化断言，实测全 PASS，非产品缺陷。
- **证据**：`evidence/D4-20/stdout.log`、`evidence/D4-24/stdout.log`（真机直调核实）