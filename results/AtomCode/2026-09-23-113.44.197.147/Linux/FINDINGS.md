# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-09-23-113.44.197.147/Linux/FINDINGS.md`
> **生成时间**：2026-09-23 17:15（北京时间）
> **SUT**：huaweicloud-devkit v1.1.7-next.0（gitHead 0790e92a）

## #1【P0】D2-4 凭证脱敏 JSON 场景漏脱敏

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","token":"tok123"}')` 原样返回，ak/sk/token 值全部泄漏（实测 leakAK/leakSK/leakTok=true）
- **断言**：JSON 字符串内 ak/sk/token 值应被 `<redacted>` 替换
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-42` `redactString()` 仅按 `key[:=]value` 行式正则脱敏，未覆盖 `{"ak":"..."}` 键值对 JSON 形态；`isSecretKeyName` 对象键遍历在 `redactSecrets` 仅处理入参为对象时的情景，对纯字符串走 `redactString` 分支未解析 JSON 结构
- **影响**：日志/命令回显中 JSON 形态凭证泄漏，属 I 类红线
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-2 env 管道 HW_SECRET_KEY 漏拦

- **现象**：`env | grep HW_SECRET_KEY` 的 `classifyTextCommand` 返回 `allow`（实测 actual=allow，应为 deny）
- **断言**：`env | grep HW_SECRET_KEY` 应返回 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` env-dump 门正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_` 前缀；`HW_ACCESS_KEY`/`HW_SECRET_KEY`/`HW_SECURITY_TOKEN` 是插件自身文档约定的凭证前缀（源码 408-419 行的凭证变量引用门已覆盖 `HW_*`，但 env-dump 门与之一致性缺失），`HW_SECRET_KEY` 恰落空
- **影响**：凭证环境变量管道探测可绕过安全策略
- **证据**：`evidence/D4-2/stdout.log`（复现 `env | grep HW_SECRET_KEY` → allow）
- **状态**：待提单

## #3【P0】D4-16 sh -c 命令包裹穿透漏拦

- **现象**：`sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID"` 返回 `allow`（实测 wrap-sh allow，应为 deny）
- **断言**：用 sh -c 包裹的凭证打印命令应返回 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:384` `classifyTextCommand()` 未解 `sh -c "…"` / `bash -c "…"` 等包裹层，包裹后内层命令全串未命中凭证打印/环境变量打印规则
- **影响**：命令包裹可绕过静态安全规则，属 I 类红线
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #4【P0】D4-21 制品预检未检出 broad IAM

- **现象**：`evaluateArtifacts([{path:'policy.json',content:'{"actions":["*"],"resources":["*"]}'}])` 返回 `findings=[]`（期望 findings>0）
- **断言**：actions=["*"] 的 broad IAM 策略制品应被检出并产出 findings
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:150` `evaluateArtifacts()` 缺 broad IAM（通配 actions/resources）规则，未匹配 `"actions":["*"]` 模式
- **影响**：IaC 策略制品中的越权策略（授予所有操作）无法预检发现
- **证据**：`evidence/D4-21/stdout.log`
- **状态**：待提单

## #5【P0】D4-23 全局规则注入链路缺失

- **现象**：发布包 `package.json` 的 `files` 白名单为 `['cordis.patch.yml','bin','.agents','plugins/huaweicloud-core','integrations/...']`，不含 `rules/`；预期 `rules/huawei-agent-rules.md` 随包注入 11 个安装目标
- **断言**：全局规则 `huawei-agent-rules.md` 应随 npm 包发布并被 setup 注入各安装目标
- **根因**：`package.json:8` `files` 白名单缺 `rules` 目录；`setup-cli.mjs` 未实现全局规则注入步骤
- **影响**：终端侧全局安全规则（11 安装目标）无法触达，安全干预能力不完整
- **证据**：`evidence/D4-23/stdout.log`
- **状态**：待提单

## #6【P1】D4-6 adminPass 空格形式值未脱敏

- **现象**：`redactSecrets('adminPass MySecretPassword123')` 结果仍含 `MySecretPassword123`（实测未脱敏）；`adminPass: 值` 冒号形式已脱敏
- **断言**：空格分隔的 `adminPass <值>` 应被脱敏
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` `redactString()` 正则仅匹配 `key[:=]value` 形态（`\s*[:=]\s*`），未覆盖 `adminPass ` 空格分隔参数形态
- **影响**：adminPass 空格形式密码泄漏
- **证据**：`evidence/D4-6/stdout.log`
- **状态**：待提单

## #7【P1】D4-27 裸 token= 与小写 ak=/sk= 未脱敏

- **现象**：`redactSecrets('token=abcdef1234567890')`/`redactSecrets('ak=AKID12345678')`/`redactSecrets('sk=SK1234567890')` 均原样返回（实测三例均泄漏）
- **断言**：`token=`、小写 `ak=`、`sk=` 形态的凭证值应被脱敏
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:42` 正则 `((?:access[_-]?key|secret[_-]?key|...)\s*[:=]\s*)` 未纳入裸 `token=` 与全小写 `ak`/`sk` 键名；`isSecretKeyName`（第 25 行）对 `ak`/`sk` 的匹配也未覆盖小写无下划线形态
- **影响**：文本命令回显中裸 token / 小写 ak/sk 泄漏
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #8【P1】D3-S8 排障意图路由缺失

- **现象**：`serviceCatalog` 对故障诊断类意图（如"ECS 启动失败帮我分析"）返回服务目录而非路由到 `explain_error`（supplement 探针 D3-S8 实测 false）
- **断言**：故障诊断类意图应路由到 `huaweicloud_explain_error`（disgnostic 类），非服务目录
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817` `serviceCatalog()` 的 `routeMap` 缺 troubleshooting/诊断 分支，未指向 `explain_error` 路由
- **影响**：排障类意图误入服务目录，无法触发诊断工具
- **证据**：`evidence/D3-S8/stdout.log`
- **状态**：待提单

## #9【P1】D9-2 JSON-RPC 错误码不规范

- **现象**：`tools/call` 传非法 params（字符串 `"NOT_OBJECT"` 代替对象）仍返回正常 `result`，未返回 `-32602`
- **断言**：非法 params 应返回 JSON-RPC 错误码 `-32602 Invalid params`
- **根因**：`mcp-protocol.mjs` dispatch 未对 `method` 对应入参做类型校验，非法 params 直接透传产生业务响应
- **影响**：协议客户端无法区分参数错误与正常响应，可观察性受损
- **证据**：`evidence/D9-2/stdout.log`
- **状态**：待提单

## #10【P1】D9-4 协议生命周期未强制

- **现象**：未先 `initialize` 就先 `tools/list` 仍返回正常 tool 列表（实测 PRE_INIT tools/list 返回 result）
- **断言**：未完成 `initialize` 握手前调用 `tools/list` 应被拒绝（返回错误或空）
- **根因**：`mcp-protocol.mjs` dispatch 无会话状态守卫，未跟踪 initialize 是否完成即响应任意方法
- **影响**：违反 MCP 生命周期规范，未初始化即可探测工具能力
- **证据**：`evidence/D9-4/stdout.log`
- **状态**：待提单

## #11【P1】D10-3 路由准确率仅 21.4%

- **现象**：D10 评测集 15 条中文意图，路由 verdict HIT=3 MISS=11 N/A=1，分母=HIT+MISS=14，准确率 21.4%；未命中的意图（ECS 查询/创建、RDS、CBR、FunctionGraph、BSS、CES、ELB、IAM 等）大多回退 `Run hcloud --help to list available services.`
- **断言**：路由准确率应显著高于基线（期望按 serviceCatalog 关键词覆盖命中对应服务）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1817-1946` `serviceCatalog()` 的 `routeMap` 关键词矩阵对中文意图覆盖不足（ECS/RDS/CBR/FG/BSS/CES/ELB/IAM 等常见服务意图未命中）
- **影响**：排障/规划类意图大批量错误的 fallback，影响路由体验
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01~E15/stdout.log`
- **状态**：待提单

## #12【P2】D4-25 Python hook 写命令未分类 cli:write

- **现象**：Python hook 事件遥测中 `cli:write` 事件键缺失（supplement2 探针 D4-25 实测 cli:read PASS、cli:write false、cli:invoke PASS）
- **断言**：写类 CLI 命令应产生 `cli:write` 事件键，与 read/invoke 对称覆盖
- **根因**：`plugins/huaweicloud-core/src/` Python hook 事件分类正则未命中空格前置的写 verb（如 ` CreateServers`）
- **影响**：写操作遥测事件分类缺失，影响审计/监控统计
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：待提单

## #13【P2】D8-9 sanitizeValue 未脱敏敏感值

- **现象**：遥测 `sanitizeValue()` 仅做换行去重+截断，不调用 `redactSecrets`，安装 ID 等敏感遥测值原样上报
- **断言**：遥测值须经脱敏后方可上报
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue()` 未调用 `redactSecrets`
- **影响**：遥测事件可能携带未脱敏敏感值
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #14【P2】D9-7 协议版本协商降级未实现

- **现象**：`initialize` 直接透传 `protocolVersion`（`params.protocolVersion || '2024-11-05'`），无旧版本降级协商逻辑
- **断言**：应支持协议版本协商/降级，而非单版本透传
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46` 仅取默认或透传，无版本协商降级实现
- **影响**：与旧版协议客户端互通时无法协商降级
- **证据**：`evidence/D9-7/stdout.log`
- **状态**：待提单

## #15【非产品缺陷】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH，待裁决）

- **现象**：`initialize` 返回 `capabilities={tools:{}}`，未声明 `cancellation`，无 `-32000` 超时取消语义
- **说明**：属实现与设计契约漂移（SPEC-MISMATCH），字段契约待维护方裁决是否纳入产品范围；不计入缺陷提单
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:46`，`capabilities` 未声明 `cancellation`
- **证据**：`evidence/D9-9/stdout.log`

## #16【非产品缺陷】BLOCKED 环境阻塞汇总

- **D1-67**：需真实 DSH 插件安装/跳过验证（破坏性全局安装，run-only 不执行）
- **D3-S7**：需真实 RDS+沙箱多服务编排会话自动化（本客户端无 dsh/CDP agent 会话 harness）
- **D9-6**：需官方 MCP Inspector + ≥2 客户端互通冒烟环境
- **D1-39**：Windows 专属升级检测链（Linux 结构化不适用，标 NOT_RUN）