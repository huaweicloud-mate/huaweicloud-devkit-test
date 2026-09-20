# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro）

> **落盘路径**：`results/AtomCode/2026-09-21-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-21 05:14（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.5（gitHead `e7ed6f6`）
> **本清单是统一提单脚本的解析输入**，格式严格遵循（`## #序号【级别】标题` + `根因` 含 文件:行号）。

---

## #1【P0】D4-2 凭证 env 打印拦截（`env | grep HW_SECRET_KEY` 漏拦）

- **现象**：`classifyTextCommand("env | grep HW_SECRET_KEY")` 返回 `allow`（预期 `deny`）；而 `printenv HW_ACCESS_KEY`、`env | grep HUAWEICLOUD_ACCESS_KEY_ID` 均被正确 `deny`。
- **断言**：`env | grep <HW_ 前缀凭证名>` 决策应为 `deny`（精确断言 `decision === 'deny'`）。
- **根因**：`src/safety-policy.mjs:398-419` — 凭证 env 检测规则只匹配 `printenv HW_*` / `env` 后直接跟 `HUAWEICLOUD/HWC/HW/OS_` 的前缀，`env | grep HW_SECRET_KEY` 这类经 grep 管道的形式未被正则覆盖，落入 allow。
- **影响**：凭证 env 打印存在绕过面，安全 hook 未兜住；属高危凭证泄露拦截缺口。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：待提单

## #2【P0】D4-16 命令包裹穿透（`sh -c "env | grep HUAWEICLOUD"` 漏拦）

- **现象**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD"')` 返回 `allow`（预期 `deny`）；同类 `bash -c "cat ~/.config/huaweicloud/credentials.json"` 却能正确 `deny`。
- **断言**：`sh -c "<凭证 env 相关命令>"` 决策应为 `deny`。
- **根因**：`src/safety-policy.mjs:384`（`classifyTextCommand`）— 文本命令分类未对 `sh -c "..."` 的引号内片段做与 `stripExecutable`（`:67-101`）等价的解包裹识别，仅对部分包装形态生效。
- **影响**：命令包裹穿透绕过安全预检，写/凭证命令可借 `sh -c "…"` 逃逸。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：待提单

## #3【P0】D4-21 制品预检未检出 broad IAM（`actions=["*"]`）

- **现象**：`evaluateArtifacts` 对含 `actions:["*"]` 的 IAM 策略制品返回 `findings=[]`（预期应检出过分授权风险）。
- **断言**：broad IAM policy（`actions=["*"]`）应被 artifacts 预检检出（`findings.length > 0`）。
- **根因**：`src/risk-rule-engine.mjs:115`（`evaluateArtifacts`）— 规则库无 broad-IAM（通配 action / `Resource:"*"`）匹配规则，`evaluate('artifact', …)` 未覆盖该风险类别。
- **影响**：IaC/策略制品预检漏报过分授权，hook 门形同虚设。
- **证据**：`evidence/d4-security-core/probe-p0-security.stdout.log`
- **状态**：待提单

## #4【P0】D4-23 全局规则 huawei-agent-rules.mdc 注入链路缺失

- **现象**：`rules/huawei-agent-rules.mdc` 源码存在，但 `package.json` 的 `files` 白名单不含 `rules/`；`setup-cli` 未引用 `rules/` 或 `.mdc` 注入；安装目标未生成 agent-rules 文件（3 项断言均 false）。
- **断言**：安装产物应注入全局规则文件，`files` 白名单与安装写入链路均包含 `rules/`。
- **根因**：`package.json:8`（`files` 白名单缺 `rules/`）+ `src/setup-cli.mjs`（安装文件清单未写 `rules/`）— 规则注入链路未接线。
- **影响**：11 个安装目标均未落地全局安全规则，设计承诺的「注入生效性」空转。
- **证据**：`evidence/d4-security-core/probe-d4-23-rules.stdout.log`
- **状态**：待提单

## #5【P1】D4-6 adminPass 空格形式值未脱敏

- **现象**：`adminPass` 以等号形式（`--adminPass=xxx`）可正确脱敏，但空格形式（`--adminPass xxx`）下 `args` 未出现 `<redacted>`（实测 `true`，预期 `false` 即应已脱敏）。
- **断言**：空格形式 `--adminPass <值>` 的密码值应被脱敏为 `<redacted>`。
- **根因**：`src/safety-policy.mjs:49`（`redactSecrets`/`redactString`）— 密码明文脱敏仅覆盖等号/键值对象路径，空格分隔的单独参数值未命中脱敏分支。
- **影响**：敏感 password 明文可能进入输出/日志，泄露风险。
- **证据**：`evidence/d4-security-core/probe-d4-6-adminpass.stdout.log`
- **状态**：待提单

## #6【P1】D4-7 hook_check_artifacts broad IAM 未拦截

- **现象**：`hook_check_artifacts` 对 broad IAM 策略返回 `allow`（预期 `deny`），与 D4-21 同根因。
- **断言**：`hook_check_artifacts` 对 `actions=["*"]` 制品决策应为 `deny`。
- **根因**：`src/risk-rule-engine.mjs:115`（`evaluateArtifacts`）— 同 D4-21，缺少 broad-IAM 规则。
- **影响**：hook 三工具中的制品预检漏报，与 D4-21 一致。
- **证据**：`evidence/d4-security-core/probe-d4-7-hooks.stdout.log`
- **状态**：待提单

## #7【P1】D4-27 文本裸 token=/小写 ak/sk 未脱敏

- **现象**：对象键（ak/sk/token/password/adminPass）均正确脱敏，但纯文本 `token=xxx`、小写 `ak=xxx`/`sk=xxx` 未脱敏（仍含明文）。
- **断言**：文本模式 `token=`、`ak=`、`sk=` 关键字后的值应被 `<redacted>` 替换、无明文。
- **根因**：`src/safety-policy.mjs:61-63`（`redactSecrets`→`redactString`）— 文本脱敏正则未覆盖裸 `token=` 与小写 `ak=`/`sk=` 形态。
- **影响**：日志/输出文本中的凭证关键字值可能明文泄露。
- **证据**：`evidence/d4-security-core/probe-d4-27-redact.stdout.log`
- **状态**：待提单

## #8【P1】D3-S8 排障意图路由缺失（serviceCatalog 未路由到 explain_error）

- **现象**：`serviceCatalog("我的ECS启动失败帮我分析原因")` 未命中 troubleshooting/explain 路径，返回通用帮助而非 `huaweicloud_explain_error` 分类指引。
- **断言**：排障意图应路由到 troubleshooting 分类并给出可执行下一步。
- **根因**：`src/tools.mjs:1776`（`serviceCatalog` 路由层）— 诊断/排障意图无对应 routeMap 项，未落到 `huaweicloud_explain_error`（`:1928`）。
- **影响**：失败排障场景无法触发分类引导，与 D10-3 路由缺失同源。
- **证据**：`evidence/supplement/probe-supplement.stdout.log`
- **状态**：待提单

## #9【P1】D9-2 JSON-RPC 错误码不规范

- **现象**：①`tools/list` 传非法参数（字符串 params）仍返回完整工具列表、未返回 `-32602`；②`tools/call` 缺 `name` 返回 `-32603 "Unknown tool: undefined"`（应为 `-32602` invalid params）。
- **断言**：非法参数应返回 `-32602`；错误对象含规范 `code/message`。
- **根因**：`src/mcp-server.mjs:158-162`（`dispatch` 入参校验缺失）— 未对 `params` 做类型/必填字段校验，未区分 `-32602`（invalid params）与 `-32603`（application error）。
- **影响**：客户端无法依赖标准错误码做降级/重试，互操作性受损。
- **证据**：`evidence/d9-protocol/probe-d9-2-invalid.stdout.log`
- **状态**：待提单

## #10【P1】D9-4 协议生命周期未强制（未 initialize 先 tools/list 仍返回）

- **现象**：未先 `initialize` 直接 `tools/list`，服务端仍返回完整工具列表，未拒绝。
- **断言**：MCP 强制时序——`tools/list` 应先 `initialize`，否则拒绝。
- **根因**：`src/mcp-server.mjs:158-162`（`dispatch`）— 未维护/校验初始化状态，所有方法无时序守卫。
- **影响**：协议时序约束未遵守，状态机不严谨。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：待提单

## #11【P1】D10-3 路由准确率仅 21.4%（中文意图大面积 MISS）

- **现象**：15 条中文意图经 serviceCatalog 仅 HIT=3（E06/DCS、E09/CCE、E15/代金券），MISS=11，N/A=1（诊断），准确率 21.4%（设计断言 ≥90%）。
- **断言**：中文意图路由准确率应 ≥90%（精确断言 `HIT/(HIT+MISS) >= 0.9`）。
- **根因**：`src/tools.mjs:1776`（`serviceCatalog` 关键词路由层）— 中文意图（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 等）关键词/语义覆盖严重不足，仅少量命中。
- **影响**：真实 Agent 任务大量路由错判，核心服务分发能力不达标。
- **证据**：`evidence/d10-routing/probe-d10-routing.stdout.log`
- **状态**：待提单

## #12【P2】D4-25 Python hook 写命令未分类 cli:write

- **现象**：`record_cli_event('hcloud ECS CreateServers …')` 事件键为 `cli:invoke`（预期 `cli:write`）；只读 `NovaListServers`→`cli:read`、非写非读 `FooBarUnknownAction`→`cli:invoke` 均正确。
- **断言**：写命令（CreateServers 等 Create/Delete 前缀）事件键应为 `cli:write`。
- **根因**：`hooks/huaweicloud-safety.py:46`（`WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + "|".join(write_prefixes) + r")\w*")`）— 前缀字符组 `(^|[A-Za-z0-9])` 要求写动词前不能是空格，但 `"ECS CreateServers"` 中 `Create` 被空格前置，正则不命中，`is_write`（`:95`）为 False，落入 `cli:invoke`（`:96`）。
- **影响**：Python hook 遥测把写操作错误归类为通用调用，遥测分类失准。
- **证据**：`evidence/supplement/probe-supplement2.stdout.log`
- **状态**：待提单

## #13【P2】D8-9 sanitizeValue 未移除敏感值

- **现象**：`sanitizeValue('AK=ABC123DEF456GHI')` 原样返回 `AK=ABC123DEF456GHI`，未脱敏（设计预期移除 AK/SK/token 敏感值）。
- **断言**：`sanitizeValue` 应将 AK/SK/token 敏感值替换为 `<redacted>`/掩码。
- **根因**：`src/telemetry/telemetry.mjs:189`（`sanitizeValue`）— 仅折叠空白并在超长时截断，无敏感值脱敏逻辑（未调用 `redactSecrets`）。
- **影响**：敏感值可能进入遥测事件值（契约漂移，SPEC-MISMATCH）。
- **证据**：`evidence/supplement/probe-supplement.stdout.log`
- **状态**：待提单

## #14【P2】D9-7 协议版本协商降级未实现

- **现象**：`initialize(protocolVersion='2099-01-01')`（不支持的未来版本）服务端直接回显 `protocolVersion:'2099-01-01'`，未降级、未报错。
- **断言**：不支持的 protocolVersion 应协商降级到受支持版本或明确报错。
- **根因**：`src/mcp-server.mjs`（initialize 处理，经 `src/mcp-protocol.mjs:46` `dispatch`）— 无版本协商/校验逻辑，直接透传请求版本。
- **影响**：版本协商缺失，未来版本客户端兼容性风险。
- **证据**：`evidence/d9-protocol/probe-d9-edge.stdout.log`
- **状态**：待提单

## #15【P1】D9-9 tools/call 超时与取消能力缺失（SPEC-MISMATCH）

- **现象**：initialize 返回的 `capabilities` 仅 `{"tools":{}}`，未声明 `cancellation`；无 `-32000 timeout` 精确语义。
- **断言**：按设计应声明 `capabilities.cancellation`（或明确不支持），超时返回 `{code:-32000, message 含 'timeout'}`。
- **根因**：`src/mcp-server.mjs`（initialize 的 capabilities 组装）— 未声明取消能力；`dispatch` 无超时语义。
- **影响**：实现与设计契约漂移（design 承诺取消/超时语义，实现未落地）。
- **证据**：`evidence/d9-protocol/probe-d9-mcp-protocol.stdout.log`
- **状态**：待提单