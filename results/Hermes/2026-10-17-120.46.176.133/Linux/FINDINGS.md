# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash）

> **落盘路径**：`results/Hermes/2026-10-17-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：2026-10-17 05:25:00（北京时间）
> **被测对象**：huaweicloud-devkit `1.1.9-next.0`（npm `next`，gitHead `6302921c`）
> **执行归档**：`results/Hermes/2026-10-17-120.46.176.133/Linux/`
> 本清单是统一提单脚本（`scripts/file_issue.py`）的解析输入，格式严格遵循 `templates/findings.md`。

---

## #1【P0】D2-4 凭证脱敏对 JSON 字符串不生效（明文 SK 残留）

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","region":"cn-north-4"}')` 原样返回，`sk` 明文未脱敏；D2-4 探针 `redact-json` 断言 FAIL（`evidence/D2-4/stdout.log`）。
- **断言**：`redactSecrets(<含 ak/sk 的 JSON 字符串>)` 的结果不得包含 `SKTEST1234567890abcdef1234`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:35-48` `redactString()` —— 键名正则要求 `access_key|secret_key` 等长键名（`sk`/`ak` 短键未覆盖），且第 47 行 `/(AK|SK)\s*[:=]\s*/g` 只匹配全大写、不接受被引号包裹的 JSON 键（`"sk":`），故 JSON 形态的 AK/SK 全部漏脱敏。
- **影响**：安全红线 I 类（明文凭证残留）——工具返回值/日志中 JSON 形式的 AK/SK 会原样外泄。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D9-12 initialize 握手时序无状态机（非法时序未拒）

- **现象**：未经 `initialize` 直接发 `tools/list`，服务端正常返回 `listed:42`，未返回 JSON-RPC `-32600`；探针断言 `非法时序拒绝=false`。
- **断言**：`tools/list` 在 `initialize` 之前调用必须返回 `-32600`（Invalid Request）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` `dispatch()` 直接按方法名路由（`if (method === 'tools/list') return { tools: TOOL_DEFINITIONS }`），缺 initialize 前置状态校验（无「已初始化」标志位）。
- **影响**：MCP 协议安全基线缺失，任何未握手客户端可直接枚举/调用工具。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #3【P1】D3-S1 serviceCatalog 中文意图路由未命中 ECS（退化为 help）

- **现象**：`huaweicloud_service_catalog` 对「只读查询 ECS 实例（不改动）」意图返回 `recommendedServices=["Run hcloud --help to list available services."]`，未命中 `ECS`；只读查询本身成功（readOk=true、零写）。
- **断言**：`serviceCatalog({intent:'只读查询 ECS 实例'}).recommendedServices` 必须包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 的 `routeMap` 中文关键词表未覆盖「只读查询/查看 ECS」类短语（返回兜底 help 路由）。
- **影响**：中文自然语言意图无法路由到目标服务，引导退化为通用 help。
- **证据**：`evidence/D3-S1/stdout.log`
- **状态**：待提单

## #4【P1】D10-3 评测集路由准确率 92.9%（1 条中文意图 MISS）

- **现象**：`eval/harness/run-eval.mjs` 跑 15 条中文意图：HIT=13 MISS=1 N/A=1，准确率 92.9%。
- **断言**：15 条评测集中服务路由类意图 HIT 率 = 100%（N/A=诊断类不计）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog.routeMap` 缺命中该条中文意图的关键词（同 #3 路由表覆盖不足）。
- **影响**：中文意图路由稳定性不足，用户需多次改写意图。
- **证据**：`evidence/D10-3/stdout.log`
- **状态**：待提单

## #5【P1】EXP-E01 serviceCatalog 中文意图路由 MISS

- **现象**：harness 单条评测 `EXP-E01`（「帮我查一下我账号在华北北京四有哪些云主机」）verdict=MISS（非 HIT）。
- **断言**：`EXP-E01` 的期望服务必须被 `serviceCatalog` 命中（verdict=HIT）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog.routeMap` 中文关键词缺失（与 #3/#4 同源）。
- **影响**：评测集基线未达 100%，属路由表覆盖缺口。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #6【P1】D3-C7 跨区域引导的错误码与用例契约不符（Common.0013 而非 Ecs.0021）

- **现象**：`--cli-region=ap-southeast-3` 的只读查询返回 `Common.0013`（「the current region is [ap-southeast-3] and does not match with the project name [cn-north-4] in tk」），跨区创建 EIP 返回 `VPC.0501`；均非用例要求的 `Ecs.0021`（区域不可用）/`Ecs.0200`（资源不存在）。plan 命令已正确带 `--cli-region=ap-southeast-3`（断言 1 通过）、`get_regional_availability(ecs,ap-southeast-3)` 返回 available=true（断言 2 通过）；5 项断言 3 通过 / 2 失败。
- **断言**：区域不可用 → 精确错误码 `Ecs.0021`；资源不存在 → `Ecs.0200`。
- **根因**：凭证层 region 作用域（`plugins/huaweicloud-core/src/auth/credentials.mjs:224` 解析出的 region 绑定 `cn-north-4`）先于服务层校验失败，返回 `Common.0013`/`VPC.0501`；`plugins/huaweicloud-core/src/safety-policy.mjs` 引导层未对该场景做可判定的错误码归一/前置提示。
- **影响**：跨区场景的错误码契约不可判定，用户难以区分「区域不可用 / 资源不存在 / 凭证区域不匹配」。
- **证据**：`evidence/D3-C7/stdout.log`
- **状态**：待提单

## #7【P1】D3-S3 沙箱预览出 URL：公网 URL 已生成但不可达（404）

- **现象**：沙箱 `deploy_nginx` 成功（nginx_serving=PASS）、`expose` 返回 `ok=true` 且 `publicUrl=https://k6wctl7l-8080.devbridge-s2.hwtunnel.com`，但对 `publicUrl` 连续 4 次 HTTP 探测全部 404（`curl=000`），且 `expose.warnings` 自述「Tunnel reachable check returned HTTP (expected 200/304). The URL may not be serving yet.」；`httpCode` 为空。同一会话内 `deploy_check` 通过、隧道建立成功，唯独公网可达性未达成。
- **断言**：`expose` 返回 `publicUrl` 后，对 `publicUrl` 的 HTTP GET 必须返回 200/304。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:1113` `publicUrl` 仅由 `TUNNEL_URL_PATTERN`（`:35`）从 devbridge 输出正则解析后返回，未做可达性校验即返回 `ok=true`；`:1096-1097` 的就绪判定未把 `tunnel_url_accessible` 失败上抛为 `ok=false`/`nextStep`，故调用方（Agent）无法从返回值区分「已出链但不可达」与「出链成功」。
- **影响**：沙箱预览链接对用户不可用（404），但工具返回 ok=true，引导误判为成功；预览→交付链路的公网验证缺位。
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：待提单

## #8【P2】D3-S5 复合意图分层路由仅命中单一服务

- **现象**：复合中文意图返回 `recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`，未拆分命中预览/沙箱等分层目标。
- **断言**：复合意图必须拆分并命中 >=2 个对应 service（含预览/沙箱层）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 的 `serviceCatalog` 仅做单服务关键词首命中，无复合意图拆分逻辑。
- **影响**：复合场景引导降级为单服务，用户需自行拆分任务。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：待提单

## #9【P2】D4-25 Python hook 写命令事件分类错误且落错目录

- **现象**：写命令（`ECS CreateServers`）事件被记为 `cli:invoke`（keys=["cli:read","cli:invoke","cli:invoke"]），未记为 `cli:write`；事件写入 `plugins/telemetry`，而 Node 侧读取目录存在=false（Node `telemetry.mjs` 读 `plugins/huaweicloud-core/telemetry`）→ 事件不被消费。
- **断言**：只读命令→`cli:read`、写命令→`cli:write`、其他→`cli:invoke`；事件必须写入 Node 读取的 telemetry 目录。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前置字符类，使空格分隔的写动词（`ECS CreateServers`）不匹配；`:24` `PLUGIN_DIR = parents[2]` 误指向 `plugins/`（应为 `plugins/huaweicloud-core`）。
- **影响**：Py/Node 遥测事件分类与落盘位置不一致，写操作审计缺 `cli:write` 记录。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：待提单

## #10【P2】D4-26 findings.evidence 明文密码残留

- **现象**：风险引擎 `decision=warn findings=1` 的 `evidence` 字段含明文密码：`hcloud IAM CreateUser --password MyS3cret123 --cli-region=cn-north-4`。
- **断言**：`findings[].evidence` 中 AK/SK/token/password 必须被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 构造 finding 时未对 evidence 走 `redactString()`（脱敏只在 safety-policy 的输出层，未覆盖 risk-rule-engine 的 evidence 组装）。
- **影响**：安全红线 I 类（明文凭证残留）——告警/评审视图中泄露明文口令。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：待提单

## #11【P2】D8-9 telemetry sanitizeValue 未做敏感值脱敏（SPEC-MISMATCH）

- **现象**：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回，未移除敏感值。
- **断言**：`sanitizeValue()` 必须移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue()` 仅做 trim/截断/去控制字符，未调用 `redactSecrets()`。
- **影响**：遥测上报可能携带凭证明文。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #12【P2】D1-65 调试开关仅接受字面量 "true"（SPEC-MISMATCH）

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 时调试日志增量为 0；`=true` 时增量 1254。
- **断言**：`HUAWEICLOUD_DEVKIT_DEBUG` 取 `1` 或 `true` 均应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` 判定为 `process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`，未兼容 `1`。
- **影响**：按用例契约用 `1` 开启调试的用户观测不到日志。
- **证据**：`evidence/D1-65/stdout.log`
- **状态**：待提单

## #13【P2】D1-68 region 环境变量优先级与契约相反（SPEC-MISMATCH）

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时 `HW_REGION` 胜出（`region=cn-test-hw-wins`）。
- **断言**：`HUAWEICLOUD_REGION` 必须优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:224` 写作 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，优先级与契约相反。
- **影响**：多变量共存时区域解析与文档不一致。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：待提单

## #14【测试侧】D3-C1 realcloud_e2e.mjs 归零判定缺陷导致误报 FAIL（非产品缺陷）

- **现象**：`scripts/realcloud_e2e.mjs` `caseD3C1` 的 finally 以 `hcloud` 退出码判删除成败，并以 `!ListServersDetails.text.includes(serverId)` 判 ECS 已归零；本轮实测该判定**误报**——报告 `subnet:OK vpc:OK`、`ECS轮询:已归零`，但云端实际遗留 VPC/子网/ECS 各 2 套（`testbot3-hermes-e2e-2184718594/2184849770`）。
- **说明**：属测试脚本判定缺陷（KooCLI 报错仍返退出码 0；列表 API 被限流/报错时文本为空被误判为「已归零」），非 SUT 缺陷。本轮已改用本地修正探针（解析 List* 响应 JSON 的集合结构后判缺席 + 周期性重发删除）：**D3-C1 5/5 PASS**，且已手工核对云端归零（ECS/VPC/子网/OBS 均为 0）。归档 `evidence/D3-C1/probe.mjs` + `stdout.log`。不计入提单。

## #15【测试侧】D3-C2 realcloud_e2e.mjs 以 KooCLI 退出码判 OBS 建桶成败导致误报 FAIL（非产品缺陷）

- **现象**：`scripts/realcloud_e2e.mjs` `log('OBS建桶', mb.ok && /success/i.test(mb.text))` 中 `mb.ok` = 退出码===0；本轮 `hcloud OBS mb` 建桶**成功**（输出 `Create bucket [...] successfully`）却返回退出码 **6** → 该项 pass=false、整案 FAIL。
- **说明**：属测试脚本判定缺陷（禁止以 KooCLI 退出码判成败），非 SUT 缺陷。本轮已用本地修正探针（改以输出文本判定、并以 ListBuckets 确证删桶归零、保留原始退出码）复测：**D3-C2 4/4 PASS**（建桶成功 exit=6 → set/get 站点 200 含 index.html → 删桶成功，ListBuckets 无该桶）。归档 `evidence/D3-C2/probe.mjs` + `stdout.log`。不计入提单。

## #16【非产品缺陷】D1-39 Windows 专属 P0 在 Linux 标 NOT_RUN

- **现象**：D1-39（Windows 升级检测链）为 OS 专属 P0 用例，当前 OS=Linux 不适用，标 NOT_RUN。
- **说明**：属归属列正确 + OS 不适用（P0 不得 NOT_RUN 的唯一例外，`verify_coverage.py` 按 OS 列「专属」自动豁免），Linux 侧升级链路由 EXP-NR3-10 代表覆盖且已 PASS。不计入提单。

## #17【非产品缺陷】D3-S7 跨服务交付（Web 应用 + RDS）无编排 harness（环境阻塞）

- **现象**：D3-S7（跨服务交付 Web 应用 + RDS 并归零）本日标 BLOCKED。
- **说明**：需「RDS 实例创建 + 沙箱部署 + 连接串注入 + 全量归零」的跨服务编排 harness 及 RDS 实例配额，每日单服务真云探针（`realcloud_e2e.mjs`）未覆盖。**非沙箱阻塞**——本日沙箱编排服务已恢复（D3-C3 沙箱部署 5/5 PASS、D3-C6 沙箱 7 隐式工具 5/5 PASS）。解除条件：提供跨服务编排 harness + 账户开通 RDS 最低规格实例配额。不计入提单。

## #18【非产品缺陷】账户存在本机历史遗留孤儿子网（非本次创建）

- **现象**：核查云端归零时发现账户内残留两条 `testbot3-hermes-e2e-0543499948-subnet` / `testbot3-hermes-e2e-0543344318-subnet`（`created_at` 2026-09-27），其所属 VPC 已不存在（孤儿子网）。
- **说明**：属历史（09-27）遗留、非本次执行创建，按「只删本次创建」红线未删除；本日执行创建的 ECS/VPC/子网/OBS 已全部核对归零（ECS=0、VPC=0、OBS=0、本日无新建 EIP）。不计入提单。