# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-09-26-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-26 05:30:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7（gitHead `7456d059`）
> **本清单是统一提单脚本的解析输入**，格式严格遵循 `templates/findings.md`。

---

## #1【P0】D2-4 凭证脱敏 JSON 场景漏脱敏

- **现象**：`redactSecrets('{"ak":"AKID...","sk":"SK...","token":"TK..."}')` 原样返回 JSON 字符串，ak/sk/token 明文未脱敏。
- **断言**：JSON 字符串中的 ak/sk/token 值应被替换为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:49`（`redactSecrets`）→ `:34`（`redactString`）仅覆盖 `key=value`/`key: value`/对象键 形态，未覆盖 JSON 键值字符串（`{"ak":"...","sk":"...","token":"..."}`）。
- **影响**：日志/遥测回显 JSON 凭证时明文泄漏（安全风险，I 类）。
- **证据**：`evidence/d2-auth/probe.run.log`（`D2-4 redact-json pass=false`）、`evidence/D2-4/stdout.log`

## #2【P0】D4-2 凭证 env 打印拦截不完整（env | grep HW_SECRET_KEY 漏拦）

- **现象**：`env | grep HW_SECRET_KEY` 返回 `allow`（应 `deny`）；`env | grep HUAWEICLOUD_ACCESS_KEY_ID`、`printenv HW_ACCESS_KEY` 已拦截。
- **断言**：`env | grep HW_SECRET_KEY` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/` 未覆盖 `HW_` 裸字面；已有 `$HW_*`/`printenv HW_*` 分支不覆盖 `env | grep HW_SECRET_KEY` 无 `$` 前缀形态。
- **影响**：凭证环境变量打印可绕过拦截（安全风险，I 类）。
- **证据**：`evidence/d4-security-core/probe-p0-security.run.log`（`D4-2 env | grep HW_SECRET_KEY => allow`）、`evidence/D4-2/stdout.log`

## #3【P0】D4-16 命令包裹穿透（sh -c "printenv …" 漏拦）

- **现象**：`sh -c "env | grep HUAWEICLOUD"` 返回 `allow`（应 `deny`）；`bash -c "cat credentials"` 已拦截。
- **断言**：`sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump gate 正则要求 `env`/`printenv` 前是空白/行首，`sh -c "env …"` 的引号包裹使关键词前是 `"` 无法匹配。
- **影响**：sh -c 包裹绕过凭证打印拦截（安全风险，I 类）。
- **证据**：`evidence/d4-security-core/probe-p0-security.run.log`（`D4-16 wrap-sh => allow`）、`evidence/D4-16/stdout.log`

## #4【P0】D4-21 制品预检未检出 broad IAM

- **现象**：`evaluateArtifacts([{content:'…"Action":["*"]…'}])` 返回 `findings` 空且 `hook_check_artifacts` 对 broad IAM 决策 `allow`。
- **断言**：`Action:["*"]` 制品应返回 `findings>0` 且决策非 `allow`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs`（`evaluateArtifacts`）规则集缺 broad IAM 规则（`Action`/`actions` 含 `*` 未视为高危）。
- **影响**：IAM 策略制品过度授权未被预检拦截（安全风险，I 类）。
- **证据**：`evidence/d4-security-core/probe-p0-security.run.log`（`D4-21 broad IAM => false`）、`evidence/D4-21/stdout.log`

## #5【P0】D4-23 全局规则注入链路缺失

- **现象**：源码存在 `rules/huawei-agent-rules.mdc`，但 `package.json` 的 `files` 白名单不含 `rules/`，npm 打包不携带该文件，无法注入 11 个安装目标；`setup-cli` 亦无引用。
- **断言**：`package.json files` 应包含 `rules/`，`setup-cli` 应引用 `.mdc` 注入逻辑。
- **根因**：`package.json:8`（`files` 白名单缺 `rules/`）+ `plugins/huaweicloud-core/src/setup-cli.mjs`（无 `.mdc` 注入步骤）。
- **影响**：全局安全规则无法随包发布/注入，规则治理能力失效。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.run.log`（fail=3）、`evidence/D4-23/stdout.log`

## #6【P1】D10-3 中文意图路由准确率仅 21.4%

- **现象**：15 条中文评测意图仅 HIT=3（DCS/CCE/代金券），MISS=11，N/A=1，准确率 21.4%（设计断言≥90%）；英文控制组全命中。
- **断言**：中文意图路由准确率应 ≥90%。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817`（`serviceCatalog` routeMap）中文关键词覆盖不足（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 等中文表述未命中）。
- **影响**：中文用户意图路由大量 MISS，体验与功能达标率低。
- **证据**：`evidence/d10-routing/probe-d10-routing.run.log`（HIT=3 MISS=11 N/A=1）、`evidence/D10-3/stdout.log`（展开级 EXP-E01/02/03/04/05/07/10/11/12/13/14 同此根因）

## #7【P1】D4-6 adminPass 空格分隔值未脱敏

- **现象**：`adminPass <v>`（空格分隔）值泄漏（等号/冒号形式已脱敏）。
- **断言**：`adminPass <v>` 空格形式值应被 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34`（`redactString`）覆盖 `key[:=]value` 形态，空格分隔 `adminPass <v>` 未覆盖。
- **影响**：初始化命令回显 admin 密码明文（安全风险）。
- **证据**：`evidence/d4-security-core/probe-d4-6-adminpass.run.log`（fail=1）、`evidence/D4-6/stdout.log`

## #8【P1】D4-27 文本裸 token=/小写 ak=/sk= 未脱敏

- **现象**：文本含小写 `ak=...`/`sk=...` 时未脱敏；大写 `AK=`/`SK=`、`password=`、`adminPass=` 已覆盖。
- **断言**：小写 `ak=`/`sk=`（及裸 `token=`）值应被 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34`（`redactString`）正则缺大小写不敏感的小写 `ak=`/`sk=` 分支。
- **影响**：日志文本中 token/小写凭证明文泄漏（安全风险）。
- **证据**：`evidence/d4-security-core/probe-d4-27-redact.run.log`（fail=1）、`evidence/D4-27/stdout.log`

## #9【P1】D3-S8 排障意图路由缺失

- **现象**：`serviceCatalog(诊断类意图)` 未路由到 `explain_error`/诊断，落入服务目录兜底。
- **断言**：故障/排障类意图应命中 `troubleshooting`/`diagnostic`（`huaweicloud_explain_error`）关键词。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817`（`serviceCatalog` routeMap）缺排障/诊断分支。
- **影响**：故障诊断意图无法自动路由到排障工具。
- **证据**：`evidence/supplement/probe-supplement.run.log`（`D3-S8 => false`）、`evidence/D3-S8/stdout.log`

## #10【P1】D9-2 JSON-RPC 非法入参未返回 -32602

- **现象**：`tools/list` 传非法 `params` 返回正常 `result`（未返回 `-32602`）；`tools/call` 缺参/未知工具返回 -32602 正常。
- **断言**：非法 `params`（非对象）应返回 `error.code===-32602`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57`（`tools/list` 分支无入参类型校验）。
- **影响**：协议不符合 JSON-RPC 2.0 规范，客户端错误不可诊断。
- **证据**：`evidence/d9-protocol/probe-d9-2-invalid.run.log`（`tools/list params=string => result`）、`evidence/D9-2/stdout.log`

## #11【P1】D9-4 协议生命周期未强制（含 D9-12 时序守卫缺失）

- **现象**：未 `initialize` 先 `tools/list` 仍正常返回工具列表（`code=null`），未按设计契约返回 -32600。
- **断言**：非法时序（未 initialize 先 tools/list）应被拒绝（返回 JSON-RPC 错误）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57`（`tools/list` 分支无 initialize 时序守卫/会话状态检查）。
- **影响**：协议生命周期语义不完整，握手时序安全基线不满足，客户端误用不报错。
- **证据**：`evidence/d9-12-13-p0/probe-d9-12-13-p0.run.log`（`D9-12 未 initialize 先 tools/list => code:null`）、`evidence/D9-4/stdout.log`

## #12【P1】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities={tools:{}}`，无 `notifications`/`cancellation` 声明；无 `-32000` timeout 语义。
- **断言**：应声明 `capabilities` 中的 cancellation/notifications 能力（或实现超时 -32000）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49`（`capabilities` 仅 `{tools:{}}`）。
- **影响**：取消/超时能力未声明，属实现与设计契约漂移，待维护者裁决。
- **证据**：`evidence/d9-protocol/probe-d9-6-9-crossclient.run.log`（spec=1）、`evidence/D9-9/stdout.log`

## #13【P2】D4-25 Python hook 写命令未分类 cli:write

- **现象**：Python hook 对 `hcloud ECS CreateServers` 未产出 `cli:write` 事件键（`cli:read`/`cli:invoke` 正常）。
- **断言**：写命令应产生 `cli:write` 遥测事件键。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:95-96`（`is_write` 判定事件键），写 verb 正则未命中 `CreateServers`。
- **影响**：写操作遥测分类缺失，安全干预数据不完整。
- **证据**：`evidence/supplement/probe-supplement2.run.log`（`D4-25 cli:write => false`）、`evidence/D4-25/stdout.log`

## #14【P2】D8-9 遥测 sanitizeValue 未脱敏

- **现象**：`sanitizeValue('AK=ABC123DEF456GHI')` 原样返回，未移除敏感值。
- **断言**：遥测值中的敏感值（AK/凭证）应被脱敏移除。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189`（`sanitizeValue`）仅去换行/折叠空白/截断，未调用 `redactSecrets`。
- **影响**：遥测上报可能携带明文凭证。
- **证据**：`evidence/supplement/probe-supplement.run.log`（`D8-9 sanitizeValue => AK=ABC123...`）、`evidence/D8-9/stdout.log`

## #15【P2】D9-7 协议版本协商降级未实现

- **现象**：`initialize` 传 `protocolVersion=2099-01-01` 被原样透传返回，无降级/协商。
- **断言**：应支持版本协商降级（未知高版本回退到支持版本）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46`（`protocolVersion: params.protocolVersion || '2024-11-05'` 直接透传，无降级逻辑）。
- **影响**：协议版本协商缺失，向后兼容性风险。
- **证据**：`evidence/d9-protocol/probe-d9-edge.run.log`（`D9-7 protocolVersion=2099-01-01 透传`）、`evidence/D9-7/stdout.log`