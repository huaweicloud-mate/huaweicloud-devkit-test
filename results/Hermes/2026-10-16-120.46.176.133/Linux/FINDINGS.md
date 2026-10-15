# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash）

> **落盘路径**：`results/Hermes/2026-10-16-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：2026-10-16 05:22:00（北京时间）
> **被测对象**：huaweicloud-devkit `1.1.9-next.0`（npm `next`，gitHead `6302921c`）
> **执行归档**：`results/Hermes/2026-10-16-120.46.176.133/Linux/`
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

- **现象**：`huaweicloud_service_catalog` 对「只读查 ECS（不改动）」意图返回 `recommendedServices=["Run hcloud --help to list available services."]`，未命中 `ECS`；只读查询本身成功（readOk=true、零写）。
- **断言**：`serviceCatalog({intent:'只读查询 ECS 实例'}).recommendedServices` 必须包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 的 `routeMap` 中文关键词表未覆盖「只读查/查看 ECS」类短语（返回兜底 help 路由）。
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

- **现象**：harness 单条评测 `EXP-E01` verdict=MISS（非 HIT）。
- **断言**：`EXP-E01` 的期望服务必须被 `serviceCatalog` 命中（verdict=HIT）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog.routeMap` 中文关键词缺失（与 #3/#4 同源）。
- **影响**：评测集基线未达 100%，属路由表覆盖缺口。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #6【P1】D3-C7 跨区域引导的错误码与用例契约不符（Common.0013 而非 Ecs.0021）

- **现象**：`--cli-region=ap-southeast-3` 的只读查询返回 `Common.0013`（「the current region is [ap-southeast-3] and does not match with the project name [cn-north-4] in tk」），跨区创建返回 `VPC.0501`；均非用例要求的 `Ecs.0021`（区域不可用）/`Ecs.0200`（资源不存在）。plan 命令已正确带 `--cli-region=ap-southeast-3`（断言 1 通过）。
- **断言**：区域不可用 → 精确错误码 `Ecs.0021`；资源不存在 → `Ecs.0200`。
- **根因**：凭证层 region 作用域（`plugins/huaweicloud-core/src/auth/credentials.mjs:224` 解析出的 region 绑定 `cn-north-4`）先于服务层校验失败，返回 `Common.0013`/`VPC.0501`；`plugins/huaweicloud-core/src/safety-policy.mjs` 引导层未对该场景做可判定的错误码归一/前置提示。
- **影响**：跨区场景的错误码契约不可判定，用户难以区分「区域不可用 / 资源不存在 / 凭证区域不匹配」。
- **证据**：`evidence/D3-C7/stdout.log`
- **状态**：待提单

## #7【P2】D3-S5 复合意图分层路由仅命中单一服务

- **现象**：复合中文意图返回 `recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`，未拆分命中预览/沙箱等分层目标。
- **断言**：复合意图必须拆分并命中 >=2 个对应 service（含预览/沙箱层）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 的 `serviceCatalog` 仅做单服务关键词首命中，无复合意图拆分逻辑。
- **影响**：复合场景引导降级为单服务，用户需自行拆分任务。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：待提单

## #8【P2】D4-25 Python hook 写命令事件分类错误且落错目录

- **现象**：写命令（`ECS CreateServers`）事件被记为 `cli:invoke`（keys=["cli:read","cli:invoke","cli:invoke"]），未记为 `cli:write`；事件写入 `plugins/telemetry`，而 Node 侧读取目录存在=false（Node `telemetry.mjs` 读 `plugins/huaweicloud-core/telemetry`）→ 事件不被消费。
- **断言**：只读命令→`cli:read`、写命令→`cli:write`、其他→`cli:invoke`；事件必须写入 Node 读取的 telemetry 目录。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:41` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前置字符类，使空格分隔的写动词（`ECS CreateServers`）不匹配；`:24` `PLUGIN_DIR = parents[2]` 误指向 `plugins/`（应为 `plugins/huaweicloud-core`）。
- **影响**：Py/Node 遥测事件分类与落盘位置不一致，写操作审计缺 `cli:write` 记录。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：待提单

## #9【P2】D4-26 findings.evidence 明文密码残留

- **现象**：风险引擎 `decision=warn findings=1` 的 `evidence` 字段含明文密码：`hcloud IAM CreateUser --password MyS3cret123 --cli-region=cn-north-4`。
- **断言**：`findings[].evidence` 中 AK/SK/token/password 必须被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 构造 finding 时未对 evidence 走 `redactString()`（脱敏只在 safety-policy 的输出层，未覆盖 risk-rule-engine 的 evidence 组装）。
- **影响**：安全红线 I 类（明文凭证残留）——告警/评审视图中泄露明文口令。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：待提单

## #10【P2】D8-9 telemetry sanitizeValue 未做敏感值脱敏（SPEC-MISMATCH）

- **现象**：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回，未移除敏感值。
- **断言**：`sanitizeValue()` 必须移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue()` 仅做 trim/截断/去控制字符，未调用 `redactSecrets()`。
- **影响**：遥测上报可能携带凭证明文。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #11【P2】D1-65 调试开关仅接受字面量 "true"（SPEC-MISMATCH）

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 时调试日志增量为 0；`=true` 时增量 1254。
- **断言**：`HUAWEICLOUD_DEVKIT_DEBUG` 取 `1` 或 `true` 均应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` 判定为 `process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`，未兼容 `1`。
- **影响**：按用例契约用 `1` 开启调试的用户观测不到日志。
- **证据**：`evidence/D1-65/stdout.log`
- **状态**：待提单

## #12【P2】D1-68 region 环境变量优先级与契约相反（SPEC-MISMATCH）

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时 `HW_REGION` 胜出（`region=cn-test-hw-wins`）。
- **断言**：`HUAWEICLOUD_REGION` 必须优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:224` 写作 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，优先级与契约相反。
- **影响**：多变量共存时区域解析与文档不一致。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：待提单

## #13【P2】D3-S4 领券状态闭环前后不一致（status=true → claim 已领取过 → status=false）

- **现象**：连续调用 `huaweicloud_voucher_status` → `huaweicloud_voucher_claim` → `huaweicloud_voucher_status`，返回 `claimed=true → {"claimed":true,"voucherId":null,"amount":0,"message":"已领取过"} → claimed=false`；同一次会话内状态从 true 翻转为 false，与用例「领取后状态翻转 claimed=true」的契约矛盾（`evidence/D3-S4/stdout.log`）。
- **断言**：`claim()` 之后立即调用 `status()` 必须返回 `claimed=true`（不因已领取过而翻转为 false）。
- **根因**：`plugins/huaweicloud-core/src/sandbox/hdkitservice-api.mjs:127-134` `hdkitVoucherStatus()` 的 catch 分支把任何上游异常兜底为 `{claimed:false}`，无法区分「未领取」与「上游状态查询失败」；`plugins/huaweicloud-core/src/tools.mjs:1584` `huaweicloud_voucher_status` 直接透传该字段，故上游瞬态失败会表现为 claimed 翻转。
- **影响**：用户/Agent 会误判「未领取」而重复提示领取，代金券状态引导不可信。
- **证据**：`evidence/D3-S4/stdout.log`
- **状态**：待提单

## #14【非产品缺陷】D3-C1 / D3-S2 / D4-13 账户 VPC 路由器配额耗尽导致真云用例阻塞（环境阻塞）

- **现象**：`CreateVpc` 三个用例均返回 `VPC.0114 OverQuota: Quota exceeded for resources: ['router']`（`VPC ShowQuota` 返回 `vpc=-1` 但 neutron router 配额已达上限）；账户内残留他人 VPC `tctest-diag2` / `devkit-bench-*` / `testbot1-hermes-*`。D3-C1（ECS 全生命周期）、D3-S2（私有网络场景）无法建资源取证；D4-13「写被 IAM 拒绝」断言因配额错误先于策略拒绝返回（期望 `VPC.0010 disallowed by policy`）而无法判定。
- **说明**：属环境/配额阻塞，非 SUT 缺陷，本轮标 BLOCKED + blockedReason，不计入提单。解除条件：清理账户残留 VPC / 提升 router 配额。
- **证据**：`evidence/D3-C1/stdout.log`、`evidence/D3-S2/stdout.log`、`evidence/D4-13/stdout.log`

## #15【非产品缺陷】D3-C3 / D3-C6 / D3-S3 / D3-S7 沙箱编排上游 502（环境阻塞）

- **现象**：`GET /open-api-public/v1/agreements`、`GET /open-api-public/v2/devenvs` 返回 502（trace `5bd279466d974ad79c84d93ad440f028` 等），`huaweicloud_sandbox_check_user/connect` 全部失败，05:15 重试仍 502；沙箱部署 E2E、7 隐式工具冒烟、预览 URL 出链路、跨服务复合编排均无法执行。
- **说明**：属上游服务不可用，非 SUT 缺陷，本轮标 BLOCKED + blockedReason（其中 D3-S3 因此无法复测 10-15 轮记录的 `expose_tunnel publicUrl` 缺陷，不判 PASS/FAIL）。不计入提单。解除条件：沙箱编排服务恢复。
- **证据**：`evidence/D3-C3/stdout.log`、`evidence/D3-C6/stdout.log`、`evidence/D3-S3/stdout.log`、`evidence/D3-S7/stdout.log`

## #16【测试侧】D3-C2 以 KooCLI 退出码判 OBS 建桶成败导致误报 FAIL（非产品缺陷）

- **现象**：`scripts/realcloud_e2e.mjs` `log('OBS建桶', mb.ok && /success/i.test(mb.text))` 中 `mb.ok` = 退出码===0；本轮 `hcloud OBS mb` 建桶**成功**（输出 `Create bucket [...] successfully`）却返回退出码 **6** → 该项 pass=false、整案 FAIL。
- **说明**：属测试脚本判定缺陷（禁止以 KooCLI 退出码判成败），非 SUT 缺陷。本轮已用本地修正探针（改以输出文本判定、保留原始退出码）复测：**D3-C2 4/4 PASS**（建桶成功 → set/get 站点 200 含 `index.html` → 删桶成功归零），归档 `evidence/D3-C2/probe.mjs` + `stdout.log`。不计入提单。
- **证据**：`evidence/D3-C2/stdout.log`

## #17【测试侧】probe_cloud2 D3-S6 缺 FunctionGraph required 参数导致误报 FAIL（非产品缺陷）

- **现象**：`probes_stage/probe_cloud2.mjs:71` 的 `CreateFunction` 未传 `--memory_size` / `--timeout`（FunctionGraph 必填），导致创建失败 → 该项判 FAIL；同期专用探针 `probe_s6.mjs`（已修复该缺陷）实测创建成功 + TIMER 触发器绑定 + 删除归零 → D3-S6 **PASS**。
- **说明**：属旧探针缺陷，非 SUT 缺陷；D3-S6 采用专用探针结论（`evidence/D3-S6/stdout.log`，probe=`probe_s6.mjs`）。不计入提单。
- **证据**：`evidence/D3-S6/stdout.log`

## #18【非产品缺陷】D1-39 Windows 专属 P0 在 Linux 标 NOT_RUN

- **现象**：D1-39（Windows 升级检测链）为 OS 专属 P0 用例，当前 OS=Linux 不适用，标 NOT_RUN。
- **说明**：属归属列正确 + OS 不适用（P0 不得 NOT_RUN 的唯一例外），Linux 侧升级链路由 EXP-NR3-10 代表覆盖且已 PASS。不计入提单。
- **证据**：`evidence/D1-39/stdout.log`