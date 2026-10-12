# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash / Linux）

> **落盘路径**：`results/Hermes/2026-10-13-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：`2026-10-13 05:20:00`（北京时间）
> **被测对象**：huaweicloud-devkit **v1.1.8**（npm `latest`，gitHead `74f519dc`）
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43；含新增 5 条真云 E2E）
> **汇总**：产品缺陷 **12** 项（P0×2 / P1×4 / P2×6，其中 3 项 SPEC-MISMATCH）。经历史查重命中上游开放单则不重复开单（见 `HISTORY_LINKS.md`）。

---

## #1【P0】D2-4 凭证脱敏漏小写 ak/sk 键与 JSON 形态（明文残留）

- **现象**：`redactSecrets(JSON.stringify({ak:'AKIDTEST12345678',sk:'SKTEST1234567890abcdef1234',region:'cn-north-4'}))` 返回原文，`sk` 值 `SKTEST…` 明文残留（实测 `redact-json` 断言 false，`actual="{\"ak\":\"AKIDTEST12345678\",\"sk\":\"SKTEST1234…`）；同一用例的 `profile-mcp`（`huaweicloud_show_profile_redacted`）与 `creds-readable` 断言 PASS。
- **断言**：凭证脱敏应覆盖小写键名 `ak`/`sk` 及 JSON 形态（`"sk":"..."`），输出无明文 AK/SK 字段。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34` `redactString()` 第 :45 行 `(AK|SK)\s*[:=]` 正则**未加 `/i`**（仅匹配大写），且字段名白名单 `isSecretKeyName`(:20-31) / `policy.secretKeyNamePatterns` 不含字面 `ak`/`sk`；键名为小写或值以 JSON `"sk":"…"` 形态出现时两处规则均不命中 → 明文残留。
- **影响**：日志/回显/dump 路径若出现小写 `ak=`/`sk=` 或 JSON 凭证串，AK/SK 明文泄漏，属 I 类安全红线。
- **证据**：`evidence/D2-4/stdout.log`
- **历史关联**：与 DSH/AtomCode 客户端 2026-10-10 上报的同一 P0 一致。

## #2【P0】D9-12 initialize 握手前置状态机缺失（tools/list 未经 initialize 未返回 -32600）

- **现象**：`callTool` 未 initialize 直接 `tools/list`，服务端正常返回 **42** 个工具，未按 MCP 生命周期返回 `-32600`（Invalid Request）。实测 `非法时序拒绝=false`（`{"threw":false,"code":"listed:42"}`）；`initialize` 本身返回 protocolVersion/capabilities/serverInfo 正常。
- **断言**：未经 `initialize` 的 `tools/list` 请求，服务端应返回 `{"error":{"code":-32600}}`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57`（`dispatch` 见 :30，`initialize` 见 :32）`if (method === 'tools/list') return { tools: TOOL_DEFINITIONS };` 无「必须先 initialize」的会话状态检查，任意时序均放行。
- **影响**：MCP 生命周期安全基线缺口，客户端可跳过握手直接枚举/调用工具。
- **证据**：`evidence/D9-12/stdout.log`

## #3【P1】D3-C7 跨区域引导执行层被 region-scoped token 拒绝（设计断言 Ecs.0021/Ecs.0200 未命中）

- **现象**：目标区 `ap-southeast-3`。plan 层正确（`huaweicloud_plan_cli_command` 输出命令含 `--cli-region=ap-southeast-3`，参数级断言 PASS）；`huaweicloud_get_regional_availability(ecs, ap-southeast-3)` 返回 `available=true`。但执行层：只读 `hcloud ECS ListServersDetails --cli-region=ap-southeast-3` 返回 `{"error":{"code":"Common.0013","message":"the current region is [ap-southeast-3] and does not match with the project name [cn-north-4] in tk."}}`；`hcloud EIP CreatePublicip --cli-region=ap-southeast-3` 返回 `{"code":"VPC.0501","message":"The project name cn-north-4 carried by the token from IAM contains region information. Only token issued for setting region could pass the authentication"}`。
- **断言**：命令含目标 `--cli-region`（参数级）；区域不可用→`code=Ecs.0021` 精确命中；资源不存在→`code=Ecs.0200` 精确命中。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:222`（profile 固定 cn-north-4 project，签发 region-scoped token）——工具链跨区引导未提供 region→project/token 映射或 `--cli-project-id` 注入路径，执行层被 IAM 以非设计错误码（`Common.0013`/`VPC.0501`）拒绝；且 `get_regional_availability` 的静态服务可用性缓存与实际鉴权结果不一致（`available=true` 但不可用）。
- **影响**：跨区域资源操作引导不可用；Agent/用户按引导在非默认区操作将收到与设计契约不符的错误码，难以自愈；评测集 `Ecs.0021`/`Ecs.0200` 断言无法通过。
- **证据**：`evidence/D3-C7/stdout.log`

## #4【P1】D3-S1 中文「云主机」意图路由未命中（serviceCatalog ECS 关键词缺失）

- **现象**：`service_catalog({intent:'帮我查一下我账号有哪些云主机'})` → `recommendedServices=['Run hcloud --help to list available services.']`（回落文案），未命中 ECS；后续只读命令仍可执行（readOk=true），但路由层 MISS。
- **断言**：含「云主机」的中文意图应命中 `recommendedServices=['ECS']`、`recommendedSkills=['huawei-ecs']`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1970-1983` ECS `keywords` 数组含 `弹性云服务器`(:1978)/`云服务器`(:1979)/`服务器`/`虚拟机`/`镜像` 等，**缺「云主机」**；`serviceCatalog`(:1966) 对 CJK 关键词按 `it.includes(kw)`(:2195) 子串匹配，故「云主机」未命中 → :2215 回落 help 文案。
- **影响**：口语化中文（云主机/主机）无法路由到 ECS，Agent 需多轮纠偏。
- **证据**：`evidence/D3-S1/stdout.log`

## #5【P1】D10-3 评测集路由准确率 92.9%（1 条中文意图 MISS）

- **现象**：`node eval/harness/run-eval.mjs` 15 条中文意图，HIT=13 MISS=1 N/A=1，准确率 92.9%。
- **断言**：评测集 15 条中文意图 serviceCatalog 路由应全部 HIT（诊断类 N/A 除外）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1966-2217` `serviceCatalog` routeMap 中文关键词覆盖不全（口语化/近义表述缺失），导致 1 条意图 MISS。
- **影响**：路由准确率未达标，复合/口语化意图易回落到 help 文案。
- **证据**：`evidence/D10-3/stdout.log`

## #6【P1】EXP-E01 评测集路由未命中（harness verdict=MISS）

- **现象**：`run-eval.mjs` 对 EXP-E01「云主机」意图 verdict=MISS。
- **断言**：EXP-E01 中文意图应 HIT。
- **根因**：同 #4，`plugins/huaweicloud-core/src/tools.mjs:1966-2217` ECS keywords 缺「云主机」。
- **影响**：评测集门禁未达标。
- **证据**：`evidence/EXP-E01/stdout.log`

## #7【P2】D3-S5 复合意图未分层路由（仅返回单一 ECS）

- **现象**：复合意图仅 `recommendedServices=["ECS"]`、`recommendedSkills=["huawei-ecs"]`，未拆解多服务。
- **断言**：复合意图应分层返回涉及的服务集合。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1966-2217` `serviceCatalog` 采用单关键词并集匹配，无复合意图分层拆解。
- **影响**：复合需求仅命中一个服务，引导不完整。
- **证据**：`evidence/D3-S5/stdout.log`

## #8【P2】D4-25 Python hook 写命令事件分类偏差 + 遥测目录写偏

- **现象**：`hcloud ECS CreateServers`（空格分隔写动词）事件落 `cli:invoke`（应 `cli:write`）；事件写入 `plugins/telemetry` 目录而 Node 读取目录不存在（分类读取为空）。
- **断言**：写命令（含空格分隔动词）应分类为 `cli:write`；事件目录应与读取目录一致。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` 写动词正则前置字符类 `(^|[A-Za-z0-9])` 不匹配空格分隔写动词；`:24` `PLUGIN_DIR` 误指向 `plugins/`。
- **影响**：遥测/审计分类不准，write 事件可能漏记。
- **证据**：`evidence/D4-25/stdout.log`

## #9【P2】D4-26 findings 证据未脱敏（明文 password 残留）

- **现象**：`findings[0].evidence` 保留明文 `--password MyS3cret123`。
- **断言**：findings.evidence 应经 `redactSecrets`，无明文凭证。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:97` 直接 `excerpt(context.text)` 未脱敏。
- **影响**：风险引擎证据链泄漏明文口令，I 类红线。
- **证据**：`evidence/D4-26/stdout.log`

## #10【P2】D8-9 遥测值脱敏缺失（sanitizeValue 原样返回）【SPEC-MISMATCH】

- **现象**：`sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123')` 原样返回。
- **断言**：遥测值应脱敏凭证字段。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` 未做凭证脱敏。
- **影响**：遥测上报可能携带明文凭证。
- **证据**：`evidence/D8-9/stdout.log`

## #11【P2】D1-65 调试模式仅认字面量 `'true'`【SPEC-MISMATCH】

- **现象**：`DEBUG=true` 生效（日志增量 1254），`DEBUG=1` 不生效（增量 0）。
- **断言**：`DEBUG=1` 应同样开启调试。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` `=== 'true'` 仅认字面量。
- **影响**：调试开关行为与契约漂移。
- **证据**：`evidence/D1-65/stdout.log`

## #12【P2】D1-68 区域环境变量优先级与契约相反【SPEC-MISMATCH】

- **现象**：`HW_REGION` 与 `HUAWEICLOUD_REGION` 同时设置时取 `HW_REGION`（`cn-test-hw-wins`）。
- **断言**：契约要求 `HUAWEICLOUD_REGION` 优先。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:222` 优先级反序。
- **影响**：多环境变量并存时选择非预期区域。
- **证据**：`evidence/D1-68/stdout.log`

---

## #非产品缺陷-1【测试侧】realcloud_e2e.mjs ECS 清理缺陷（首轮假成功 + 残留）

- **现象**：`scripts/realcloud_e2e.mjs --case=D3-C1` 首轮创建 ECS 成功并达 ACTIVE，但清理断言 `finally归零=false`，遗留 ECS(1)/VPC(1)/子网(1) 约 10 分钟。
- **断言**：ECS E2E 应在单轮内完成创建→ACTIVE→删除→只读验证归零，无残留。
- **根因（测试侧）**：`scripts/realcloud_e2e.mjs:108` 在实例仍处 `BUILD` 态即提交 `DeleteServers`（API 拒绝但退出码 0）；`:28` `sh()` 仅以进程退出码 `status===0` 判成败，而 KooCLI 在 API 报错时仍返回 0；`:113-117` 轮询逻辑依赖该假成功。修复：删除前轮询至 ACTIVE、以 API 返回体/列表反查判成败。
- **影响**：真云资源泄漏（按需计费）、假 FAIL 误报。
- **状态**：本轮已人工补删并验证归零（`evidence/D3-C1/stdout.log` + `harness_attempt1.json`）。**不向源码仓库提单**（测试侧缺陷，建议维护者修 `scripts/`）。
