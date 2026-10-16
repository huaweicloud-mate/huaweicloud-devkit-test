# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash）

> **落盘路径**：`results/Hermes/2026-10-15-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：2026-10-15 05:20:00（北京时间）
> **被测对象**：huaweicloud-devkit `1.1.9-next.0`（npm `next`，gitHead `6302921c`）
> **执行归档**：`results/Hermes/2026-10-15-120.46.176.133/Linux/`
> 本清单是统一提单脚本（`scripts/file_issue.py`）的解析输入，格式严格遵循 `templates/findings.md`。

---

## #1【P0】D2-4 凭证脱敏对 JSON 字符串不生效（明文 SK 残留）

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","region":"cn-north-4"}')` 原样返回，`sk` 明文未脱敏；D2-4 探针 `redact-json` 断言 FAIL（`evidence/D2-4/stdout.log`）。
- **断言**：`redactSecrets(<含 ak/sk 的 JSON 字符串>)` 的结果不得包含 `SKTEST1234567890abcdef1234`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString()` —— `:42` 的键名正则要求 `secret_key|access_key` 等长键名且分隔符两侧无引号；`:45` `/(AK|SK)\s*[:=]\s*/g` 全大写且不接受被引号包裹的 JSON 键（`"sk":`），故 JSON 形态的 `"ak"`/`"sk"` 键全部漏脱敏。
- **影响**：安全红线 I 类（明文凭证残留）——工具返回值/日志中 JSON 形式的 AK/SK 会原样外泄。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P0】D9-12 initialize 握手时序无状态机（非法时序未拒）

- **现象**：未经 `initialize` 直接发 `tools/list`，服务端正常返回 `listed:42`，未返回 JSON-RPC `-32600`；探针断言 `非法时序拒绝=false`。
- **断言**：`tools/list` 在 `initialize` 之前调用必须返回 `-32600`（Invalid Request）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57` `dispatch()` 直接按方法名路由，缺 initialize 前置状态校验（无「已初始化」标志位）。
- **影响**：MCP 协议安全基线缺失，任何未握手客户端可直接枚举/调用工具。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待提单

## #3【P1】D3-S3 expose_tunnel 返回的 publicUrl 携带 `\r\nReady`，URL 不可直接使用

- **现象**：`huaweicloud_sandbox_expose_tunnel` 返回 `ok:true`，但 `publicUrl=https://<id>-8080.devbridge-s2.hwtunnel.com\r\nReady`（尾随 CR/LF + `Ready` marker）；对该返回值直接 fetch 得 404/502、curl 得 `000`；同时插件内置可达性检查 `httpCode` 为空串。
- **断言**：`expose_tunnel().publicUrl` 必须是可直接使用的纯 URL（`/^https:\/\/[^\s]+$/`），且其内置健康检查返回 200/304 或明确 `ok:false`。
- **根因**：`plugins/huaweicloud-core/src/sandbox/session-manager.mjs:1266` `TUNNEL_URL=$(sed -n 's/.*Tunnel URL: *//p' ${hostLog} | tail -1)` 未清洗 host 日志中的 CR/marker（该日志用 `\r` 做进度刷新），`:1270` `echo "DB_TUNNEL_URL=$TUNNEL_URL"` 原样输出后被 `:1283 parseDevbridgeExposeOutput()` 解析为 `publicUrl` 返回。
- **影响**：用户拿到预览 URL 直接打开/脚本 fetch 均失败（仅手工截断 host 段后 curl 才 200）；沙箱预览功能端到端不可用。
- **证据**：`evidence/D3-S3/stdout.log`（含 4 次 fetch(404/404/404/502) + curl=000；旁证：截断后的 host 段手工 curl=200）
- **状态**：待提单

## #4【P1】D3-S1 复合/简单意图 serviceCatalog 路由未命中 ECS

- **现象**：`huaweicloud_service_catalog` 对「只读查 ECS（不改动）」意图返回 `route=["Run hcloud --help to list available services."]`，未命中 `ECS`；只读查询本身成功（readOk=true、零写）。
- **断言**：`serviceCatalog({intent:'只读查询 ECS 实例'}).recommendedServices` 必须包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog` 的 `routeMap` 中文关键词表未覆盖「只读查/查看 ECS」类短语（返回兜底 help 路由）。
- **影响**：中文自然语言意图无法路由到目标服务，引导退化为通用 help。
- **证据**：`evidence/D3-S1/stdout.log`
- **状态**：待提单

## #5【P1】D10-3 评测集路由准确率 92.9%（1 条中文意图 MISS）

- **现象**：`eval/harness/run-eval.mjs` 跑 15 条中文意图：HIT=13 MISS=1 N/A=1，准确率 92.9%。
- **断言**：15 条评测集中服务路由类意图 HIT 率 = 100%（N/A=诊断类不计）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog.routeMap` 缺命中该条中文意图的关键词（同 #4 路由表覆盖不足）。
- **影响**：中文意图路由稳定性不足，用户需多次改写意图。
- **证据**：`evidence/D10-3/stdout.log`
- **状态**：待提单

## #6【P1】EXP-E01 serviceCatalog 中文意图路由 MISS

- **现象**：harness 单条评测 `EXP-E01` verdict=MISS（非 HIT）。
- **断言**：`EXP-E01` 的期望服务必须被 `serviceCatalog` 命中（verdict=HIT）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog.routeMap` 中文关键词缺失（与 #4/#5 同源）。
- **影响**：评测集基线未达 100%，属路由表覆盖缺口。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #7【P1】D3-C7 跨区域资源操作引导未达预期（区域不可用/资源不存在的错误码不符）

- **现象**：`--cli-region=ap-southeast-3` 的只读查询返回 `Common.0013`（region-scoped token 项目名不匹配），跨区创建 EIP 返回 `VPC.0501`；均非用例要求的 `Ecs.0021`（区域不可用）/`Ecs.0200`（资源不存在）。plan 命令已正确带 `--cli-region=ap-southeast-3`（断言 1 通过）。
- **断言**：区域不可用 → 精确错误码 `Ecs.0021`；资源不存在 → `Ecs.0200`。
- **根因**：凭证层 region 作用域（`~/.config/huaweicloud/credentials.json` 的 token 绑定 `cn-north-4`）先于服务层校验失败，返回 `Common.0013`/`VPC.0501`；`plugins/huaweicloud-core/src/safety-policy.mjs` 引导层未对该场景做可判定的错误码归一/前置提示。
- **影响**：跨区场景的错误码契约不可判定，用户难以区分「区域不可用 / 资源不存在 / 凭证区域不匹配」。
- **证据**：`evidence/D3-C7/stdout.log`
- **状态**：待提单

## #8【P2】D3-S5 复合意图分层路由仅命中单一服务

- **现象**：复合中文意图返回 `recommendedServices=["ECS"] recommendedSkills=["huawei-ecs"]`，未拆分命中预览/沙箱等分层目标。
- **断言**：复合意图必须拆分并命中 >=2 个对应 service（含预览/沙箱层）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 的 `serviceCatalog` 仅做单服务关键词首命中，无复合意图拆分逻辑。
- **影响**：复合场景引导降级为单服务，用户需自行拆分任务。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：待提单

## #9【P2】D4-25 Python hook 写命令事件分类错误且落错目录

- **现象**：写命令（`ECS CreateServers`）事件被记为 `cli:invoke`（keys=["cli:read","cli:invoke","cli:invoke"]），未记为 `cli:write`；事件写入 `plugins/telemetry`，而 Node 侧读取目录存在=false（Node `telemetry.mjs:21` 读 `plugins/huaweicloud-core/telemetry`）→ 事件不被消费。
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
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:222` 写作 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，优先级与契约相反。
- **影响**：多变量共存时区域解析与文档不一致。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：待提单

## #14【测试侧】D3-C1 清理轮询窗口过短导致 finally 归零误判（非产品缺陷）

- **现象**：`scripts/realcloud_e2e.mjs` `--case=D3-C1` 创建 VPC/子网/ECS 全部成功（plan=allow、serverIds 返回、ACTIVE），但 `finally` 中 `DeleteServers` 提交后 150s 轮询仍未确认归零 → 脚本判 `finally归零=false`，原始 status=FAIL。
- **说明**：ECS 异步删除慢于脚本轮询窗口，属测试脚本缺陷（轮询窗口/判定方式），非 SUT 缺陷；本轮已人工 `DeleteServers` 并删除 subnet/VPC，`ListServersDetails`/`ListVpcs` 只读验证 testbot3-hermes-* 前缀归零。原始输出存档 `evidence/D3-C1/harness_attempt1.json`。不计入提单。
- **证据**：`evidence/D3-C1/stdout.log`、`evidence/D3-C1/harness_attempt1.json`

## #15【测试侧】D3-C2 以退出码判 OBS 建桶成败导致误报 FAIL（非产品缺陷）

- **现象**：`scripts/realcloud_e2e.mjs` `log('OBS建桶', mb.ok && /success/i.test(mb.text))` 中 `mb.ok` = 退出码===0；`hcloud OBS mb` 建桶**成功**却返回退出码 6 → 该项 pass=false、整案 FAIL。产品侧 4/4 行为真实通过（建桶成功、set/get 站点 200 含 `index.html`、删桶成功）。
- **说明**：属测试脚本判定缺陷（禁止以 KooCLI 退出码判成败），非 SUT 缺陷。原始输出存档 `evidence/D3-C2/harness_attempt1.json`。不计入提单。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C2/harness_attempt1.json`

## #16【测试侧】D3-S7 / D1-39 NOT_RUN（非产品缺陷）

- **现象**：D1-39（Windows 专属 P0）在 Linux 标 NOT_RUN（OS 专属例外，Linux 侧由 EXP-NR3-10 代表覆盖，已 PASS）；D3-S7 跨服务复合编排（RDS+沙箱+连接串注入+归零）超出每日单服务真云探针范围与单条预算，标 NOT_RUN。
- **说明**：D1-39 属归属列正确、OS 不适用；D3-S7 建议改用例（拆分为专项 harness 用例）。均不计入提单。
- **证据**：`evidence/D1-39/stdout.log`、`evidence/D3-S7/stdout.log`
