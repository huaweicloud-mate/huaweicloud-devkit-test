# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-09-25-124.70.78.131/Linux/FINDINGS.md`
> **生成时间**：`2026-09-25 05:30:00`（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.7（npm latest，gitHead 7456d059）
> **本清单是统一提单脚本的解析输入**。

## #1【P0】D9-12 initialize 握手未强制时序（非法时序 tools/list 未返回 -32600）

- **现象**：stdio MCP server 在未先发 `initialize` 的情况下直接发 `tools/list`，返回 200 + 工具列表（`result.tools` 非空），而非 JSON-RPC `-32600` 错误。
- **断言**：未 initialize 先 tools/list 应返回 `-32600` 错误。
- **根因**：`mcp-protocol.mjs:30-55`（`dispatch` 无 initialize 状态跟踪）+ `mcp-server.mjs:166-190`（`handleMessage` 直接 dispatch 任意 method，不校验初始化时序）。
- **影响**：协议时序约束缺失，未初始化客户端可枚举工具能力，偏离 MCP 握手规范。
- **证据**：`evidence/D9-12/stdout.log`（`tools/list before initialize` 返回 result.tools）

## #2【P0】D4-13 只读子账号 env 动态切换失效（最小权限凭证通过率）

- **现象**：`HW_ACCESS_KEY/HW_SECRET_KEY`（只读子账号，无 token）注入后 `resolveCredentials` 仍返回管理员凭证（ak 前缀 `HPUAN1`，期望 `HPUA3X`），动态切换失败。
- **断言**：env 注入只读 AK/SK（无 token）应优先于文件管理员凭证，实现动态切换。
- **根因**：`auth/credentials.mjs:245-250` R9 规则——`stored.configuredBySession === true` 时文件凭证无条件覆盖 env；管理员凭证文件恰为 `configuredBySession:true`。
- **影响**：最小权限子账号无法动态切换，违反「只读子账号动态切换（test001）」的预期。
- **证据**：`evidence/D4-13/stdout.log`（写拒 VPC.0010 PASS、只读 5/5 PASS，唯动态切换 FAIL）

## #3【P1】D10-3 serviceCatalog 中文意图路由命中率仅 21.4%

- **现象**：15 条中文意图经 `huaweicloud_service_catalog` 路由，仅 3/14 命中（ECS 查、DCS 建、CCE 建），其余 12 条返回兜底 `["Run hcloud --help to list available services."]`（EXP-E01~E05、E07、E08、E10~E14）。
- **断言**：路由准确率应 ≥ 90%（EXP-E 每条命中对应服务）。
- **根因**：`tools.mjs:1947`——serviceCatalog 未命中时固定返回 `['Run hcloud --help to list available services.']` 兜底，无中文意图→服务映射覆盖。
- **影响**：意图路由层基本不可用，Agent 场景下无法正确派发到目标服务。
- **证据**：`evidence/D10-3/stdout.log`、`evidence/EXP-E01~E15/stdout.log`

## #4【P0】D2-4 凭证脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets` 对对象 `access_key`/`secret_key`、文本大写 `AK=` 均脱敏，但对文本小写 `ak=AK123456 sk=SKsecret` 不透化，明文回显。
- **断言**：任意大小写的 `ak=`/`sk=` 均应脱敏为 `<redacted>`。
- **根因**：`safety-policy.mjs:31`（`isSecretKeyName` 用 `^(${pattern})$` 精确匹配，`secretKeyNamePatterns` 缺裸 `ak`/`sk`）+ `safety-policy.mjs:49`（文本脱敏未覆盖小写 `ak=`/`sk=` 键）。
- **影响**：凭证明文泄漏风险。
- **证据**：`evidence/D2-4/stdout.log`（`小写 ak=/sk= 脱敏 => ak=AK123456 sk=SKsecret`）

## #5【P0】D4-3 kms DecryptData 未列入明文 secret API 拦截

- **现象**：`classifyHcloudArgs(['DEW','DecryptData',...])` 返回 `allow`，未拦截。
- **断言**：kms/DEC `DecryptData` 等明文 secret 操作应返回 `deny`。
- **根因**：`safety-policy.mjs:232`（`blockedSecretOperations` 白名单未覆盖 `DecryptData`）。
- **影响**：明文密钥/秘密解密操作未受安全策略约束。
- **证据**：`evidence/D4-3/stdout.log`（`kms DecryptData deny => allow`）

## #6【P0】D4-15 命令替换 $(...) 未拦截

- **现象**：`classifyTextCommand` 对 `$(...)` 命令替换形式（如 `echo $(cat ~/.hcloud/credentials.json)`）返回 `allow/unknown_read`。
- **断言**：命令替换读取凭证应返回 `deny`。
- **根因**：`safety-policy.mjs` `classifyTextCommand`（约 384-443 行）未识别 `$(...)`/backtick 命令替换为高危读取模式。
- **影响**：绕过 hook 读取凭证。
- **证据**：`evidence/D4-15/stdout.log`（`命令替换 $(...) deny => allow/unknown_read`）

## #7【P0】D4-16 命令包裹穿透（bash -c hcloud 未识别）

- **现象**：`classifyTextCommand('bash -c "hcloud VPC DeleteVpc ..."')` 返回 `allow/not_huaweicloud`。
- **断言**：`bash -c`包裹的 hcloud 写命令应返回 `deny`。
- **根因**：`safety-policy.mjs:67-90`（`stripExecutable` 解壳）+ `safety-policy.mjs:443`（未解出 hcloud 段时落 `not_huaweicloud` → allow）；`bash -c` 包裹形式未被解壳。
- **影响**：写操作被包裹后可绕过分类。
- **证据**：`evidence/D4-16/stdout.log`（`bash -c hcloud Delete deny => allow/not_huaweicloud`）

## #8【P0】D4-23 发布包 files 未包含 rules（全局规则未随包发布）

- **现象**：`package.json` 的 `files` 数组不含 `rules`，安装包内 `rules/huawei-agent-rules.mdc` 缺失。
- **断言**：`files` 应包含 `rules`，规则文件随包发布。
- **根因**：`package.json:8`（`files` 白名单缺 `rules` 目录）。
- **影响**：全局安全规则未随 npm 包注入到客户端。
- **证据**：`evidence/D4-23/stdout.log`（`files 含 rules => false`）

## #9【P1】D4-17 hook 模糊输入未 fail-closed

- **现象**：`evaluateArtifacts([{path:'x.json', content:'{not-valid-json!!!'}])` 返回 `allow`。
- **断言**：畸形制品应 fail-closed 返回 `deny`。
- **根因**：`risk-rule-engine.mjs:150-153`（`evaluateArtifacts` 对内容非法仅结构与类型校验，未对畸形 JSON 内容 fail-closed）。
- **影响**：畸形制品可绕过预检。
- **证据**：`evidence/D4-17/stdout.log`（`畸形制品 fail-closed(deny) => allow`）

## #10【P1】D4-24 审批令牌重复消费/过期未结构化返回

- **现象**：`consumeApprovalToken` 二次消费返回 `null`；过期令牌也返回 `null`，无法区分「已消费」与「已过期」。
- **断言**：二次消费应返回结构化 `already_processed`，过期应返回 `{code:'CONFIRM_TOKEN_EXPIRED', status:'rejected'}`。
- **根因**：`hcloud-cli.mjs:85-92`（`consumeApprovalToken` 未命中/过期统一 `return null`，无结构化错误码）。
- **影响**：审批流错误语义不明确，客户端无法区分失败原因。
- **证据**：`evidence/D4-24/stdout.log`

## #11【P1】D3-S7 跨服务复合意图未命中 RDS + 部署目标

- **现象**：跨服务交付意图路由仅命中 `RDS`，未命中部署目标服务。
- **断言**：复合意图应命中 `RDS` + 部署目标（多服务）。
- **根因**：`tools.mjs:1947`（serviceCatalog 单服务兜底，无多服务复合意图路由）。
- **影响**：跨服务场景路由不完整。
- **证据**：`evidence/D3-S7/stdout.log`（`svc=[RDS]`）

## #12【P1】D9-9 tools/call 未声明取消/超时协议语义（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities: {tools:{}}`，未声明 `notifications.cancellation`；tools/call 超时/取消无 `-32000` 分支。
- **断言**：`capabilities.notifications.cancellation` 应声明为 true；超时应结构化返回。
- **根因**：`mcp-protocol.mjs:47`（capabilities 仅 `{tools:{}}`）+ `mcp-server.mjs`（错误统一 `-32603` 兜底）。
- **影响**：协议契约漂移，客户端无法发起取消。
- **证据**：`evidence/D9-9/stdout.log`

## #13【P2】D1-65 调试开关仅接受 'true' 不接受 '1'

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG='1'` 不生效（仅 `=== 'true'` 生效）。
- **断言**：DEBUG 开关应接受 `1`/`true`。
- **根因**：`telemetry/telemetry.mjs:81`（`const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`）。
- **影响**：文档/契约与实现不一致（契约称支持 1/true）。
- **证据**：`evidence/D1-65/stdout.log`

## #14【P2】D3-S5 复合意图分层路由未命中多服务

- **现象**：复合意图路由未命中 DDS/GaussDB/OBS/ECS 任一服务。
- **断言**：复合意图应命中多个服务。
- **根因**：`tools.mjs:1947`（serviceCatalog 兜底未覆盖复合意图）。
- **影响**：分层路由未实现。
- **证据**：`evidence/D3-S5/stdout.log`

## #15【P2】D3-S6 FunctionGraph 定时任务路由未命中

- **现象**：FunctionGraph 定时任务意图路由返回兜底，未命中 FunctionGraph。
- **断言**：应命中 FunctionGraph。
- **根因**：`tools.mjs:1947`。
- **影响**：FunctionGraph 意图覆盖缺失。
- **证据**：`evidence/D3-S6/stdout.log`

## #16【P2】D4-25 Python hook 写命令遥测分类为 cli:invoke 而非 cli:write

- **现象**：`record_cli_event('hcloud VPC CreateVpc ...')` 产出 `cli:invoke`（期望 `cli:write`）。
- **断言**：`VPC CreateVpc` 等写操作应分类为 `cli:write`。
- **根因**：`hooks/huaweicloud-safety.py:44-46`（`write_prefixes` 未命中外层 `CreateVpc` 组合，`is_write=False` → `cli:invoke`）。
- **影响**：写操作遥测统计失真。
- **证据**：`evidence/D4-25/stdout.log`

## #17【P2】D8-1 文档声明工具数（39）与实现（40）不一致

- **现象**：hdk 文档/AGENTS 声明 `39 tools`，实现 `TOOL_DEFINITIONS` 为 40。
- **断言**：文档工具数应与实现一致（40）。
- **根因**：文档 `AGENTS.md`/README 中 `39 tools` 声明未随实现更新（`tools.mjs:188` TOOL_DEFINITIONS 实际 40）。
- **影响**：能力文档漂移。
- **证据**：`evidence/D8-1/stdout.log`（`claims39=1 docClaim=39 tools impl=40`）

## #18【P2】D8-9 sanitizeValue 未移除小写 ak=/sk= 敏感值

- **现象**：`sanitizeValue` 对小写 `ak=AK123 sk=SKsecret x-admin-token=TTT` 未脱敏（大写/合法值正常）。
- **断言**：遥测值应移除全部大小写敏感键值。
- **根因**：`telemetry/telemetry.mjs:189`（`sanitizeValue` 敏感键匹配未覆盖小写 `ak=`/`sk=`）。
- **影响**：遥测上报可能携带敏感值。
- **证据**：`evidence/D8-9/stdout.log`

## #19【P1】D9-2 tools/list 非法 params 未返回 -32602

- **现象**：`tools/list` 携带非法 `params`（字符串而非对象）返回 200 + 工具列表，无 `-32602` 错误对象。
- **断言**：非法 params 类型应返回 `-32602 (Invalid params)`。
- **根因**：`mcp-protocol.mjs:57-59`（`tools/list` 分支直接 `return { tools: TOOL_DEFINITIONS }`，未校验 `params` 类型）。
- **影响**：JSON-RPC 错误码规范不完整，客户端无法区分参数错误。
- **证据**：`evidence/D9-2/stdout.log`（protocol-probe.mjs D9-2b）