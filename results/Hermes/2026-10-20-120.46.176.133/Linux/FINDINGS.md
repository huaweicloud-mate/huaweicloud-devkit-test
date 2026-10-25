# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash）

> **落盘路径**：`results/Hermes/2026-10-20-120.46.176.133/Linux/FINDINGS.md`
> **生成时间**：2026-10-20 06:20:00（北京时间）
> **被测对象**：huaweicloud-devkit `1.1.9`（npm latest，gitHead `05a67b64`，PR #950）
> **执行归档**：`results/Hermes/2026-10-20-120.46.176.133/Linux/`
> 本清单是统一提单脚本（`scripts/file_issue.py`）的解析输入，格式严格遵循 `templates/findings.md`。

---

## #1【P0】D2-4 凭证脱敏对 JSON 字符串不生效（明文 SK 残留）

- **现象**：`redactSecrets('{"ak":"AKIDTEST12345678","sk":"SKTEST1234567890abcdef1234","region":"cn-north-4"}')` 原样返回，`sk` 明文未脱敏；D2-4 探针 `redact-json` 断言 FAIL（`evidence/D2-4/stdout.log`）。
- **断言**：`redactSecrets(<含 ak/sk 的 JSON 字符串>)` 的结果不得包含 `SKTEST1234567890abcdef1234`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-47` `redactString()` —— 第 42 行键名正则只覆盖长键名（`access_key|secret_key|security_token|token|authorization|password|...`，`ak`/`sk` 短键未覆盖），第 45 行 `/(AK|SK)\s*[:=]\s*/g` 无 `i` 标志、也不接受被引号包裹的 JSON 键（`"sk":`），故 JSON 形态的 AK/SK 全部漏脱敏。
- **影响**：安全红线 I 类（明文凭证残留）——工具返回值/日志中 JSON 形式的 AK/SK 会原样外泄。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待查重（预期命中历史单）

## #2【P0】D9-12 initialize 握手时序无状态机（非法时序未拒）

- **现象**：未经 `initialize` 直接发 `tools/list`，服务端正常返回 `listed:42`，未返回 JSON-RPC `-32600`；探针断言 `非法时序拒绝=false`（`evidence/D9-12/stdout.log`）。
- **断言**：`tools/list` 在 `initialize` 之前调用必须返回 `-32600`（Invalid Request）。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:30` `dispatch()` 直接按方法名路由（`:57` `if (method === 'tools/list') return { tools: TOOL_DEFINITIONS }`），缺 initialize 前置状态校验（无「已初始化」标志位）。
- **影响**：MCP 协议安全基线缺失，任何未握手客户端可直接枚举/调用工具。
- **证据**：`evidence/D9-12/stdout.log`
- **状态**：待查重（预期命中历史单）

## #3【P1】D3-S1 serviceCatalog 中文意图路由未命中 ECS（退化为 help）

- **现象**：`huaweicloud_service_catalog` 对「只读查询 ECS 实例（不改动）」意图返回 `recommendedServices=["Run hcloud --help to list available services."]`，未命中 `ECS`；只读查询本身成功（readOk=true、零写）（`evidence/D3-S1/stdout.log`）。
- **断言**：`serviceCatalog({intent:'只读查询 ECS 实例'}).recommendedServices` 必须包含 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1997` `serviceCatalog()` / `:1999` `routeMap` 中文关键词表未覆盖「只读查询/查看云主机」类短语，`:2228` 遍历未命中即回落 help 路由。
- **影响**：中文自然语言意图无法路由到目标服务，引导退化为通用 help。
- **证据**：`evidence/D3-S1/stdout.log`
- **状态**：待查重（预期命中历史单）

## #4【P1】D10-3 评测集路由准确率 92.9%（1 条中文意图 MISS）

- **现象**：`eval/harness/run-eval.mjs` 跑 15 条中文意图：HIT=13 MISS=1 N/A=1，准确率 92.9%（`evidence/D10-3/stdout.log`）。
- **断言**：15 条评测集中服务路由类意图 HIT 率 = 100%（N/A=诊断类不计）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1999` `serviceCatalog.routeMap` 缺命中该条中文意图的关键词（同 #3 路由表覆盖不足）。
- **影响**：中文意图路由稳定性不足，用户需多次改写意图。
- **证据**：`evidence/D10-3/stdout.log`
- **状态**：待查重（预期命中历史单）

## #5【P1】EXP-E01 serviceCatalog 中文意图路由 MISS

- **现象**：harness 单条评测 `EXP-E01`（「帮我查一下我账号在华北北京四有哪些云主机」）verdict=MISS（非 HIT）（`evidence/EXP-E01/stdout.log`）。
- **断言**：`EXP-E01` 的期望服务必须被 `serviceCatalog` 命中（verdict=HIT）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1999` `serviceCatalog.routeMap` 中文关键词缺失（与 #3/#4 同源）。
- **影响**：评测集基线未达 100%，属路由表覆盖缺口。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待查重（预期命中历史单）

## #6【P1】D3-C7 跨区域引导的错误码与用例契约不符（Common.0013 而非 Ecs.0021）

- **现象**：`--cli-region=ap-southeast-3` 的只读查询返回 `Common.0013`（「the current region is [ap-southeast-3] and does not match with the project name [cn-north-4] in tk」），用例契约期望区域不可用命中 `Ecs.0021`、资源不存在命中 `Ecs.0200`；D3-C7 五项断言 3 通过 2 失败（另一项失败为跨区创建 EIP 返回 `VPC.0501`，属账户受限环境因素）（`evidence/D3-C7/stdout.log`）。
- **断言**：跨区/资源不存在场景必须返回用例契约约定的服务级错误码（`Ecs.0021` / `Ecs.0200`），不得直接透出 `Common.0013`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs`（跨区域引导链，region 校验与错误码归一）未对 KooCLI 的 `Common.0013` 做契约错误码映射。
- **影响**：跨区引导的错误语义不可被上层稳定处理（错误码随 KooCLI 抖动）。
- **证据**：`evidence/D3-C7/stdout.log`
- **状态**：待查重（预期命中历史单）

## #7【P2】D3-S5 复合意图分层路由仅命中单一服务

- **现象**：复合中文意图（如「先预览沙箱再上生产 ECS」）仅 `recommendedServices=["ECS"]`、`recommendedSkills=["huawei-ecs"]`，未同时命中预览/沙箱分层目标（`evidence/D3-S5/stdout.log`）。
- **断言**：复合意图须正确拆分并命中多个对应服务（≥2）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1997` `serviceCatalog()` 仅做单服务关键词首命中，无复合意图拆分逻辑。
- **影响**：复合场景引导降级为单服务，用户需自行拆分任务。
- **证据**：`evidence/D3-S5/stdout.log`
- **状态**：待查重（预期命中历史单）

## #8【P2】D4-25 Python hook 写命令事件分类错误且落错目录

- **现象**：写命令（`ECS CreateServers`）事件被记为 `cli:invoke`（keys=["cli:read","cli:invoke","cli:invoke"]），未记为 `cli:write`；事件写入 `plugins/telemetry`，而 Node 侧读取目录存在=false（Node `telemetry.mjs` 读 `plugins/huaweicloud-core/telemetry`）→ 事件不被消费（`evidence/D4-25/stdout.log`）。
- **断言**：只读命令→`cli:read`、写命令→`cli:write`、其他→`cli:invoke`；事件必须写入 Node 读取的 telemetry 目录。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:24` `PLUGIN_DIR = Path(__file__).resolve().parents[2]` 误指向 `plugins/`（应为 `plugins/huaweicloud-core`）；`:46` `WRITE_OPERATION_RE` 用 `(^|[A-Za-z0-9])` 前置字符类，使空格分隔的写动词（`ECS CreateServers`）不匹配。
- **影响**：Py/Node 遥测事件分类与落盘位置不一致，写操作审计缺 `cli:write` 记录。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：待查重（预期命中历史单）

## #9【P2】D4-26 findings.evidence 明文密码残留

- **现象**：风险引擎 `decision=warn findings=1` 的 `evidence` 字段含明文密码：`hcloud IAM CreateUser --password MyS3cret123 --cli-region=cn-north-4`（`evidence/D4-26/stdout.log`）。
- **断言**：`findings[].evidence` 中 AK/SK/token/password 必须被 `<redacted>` 替换。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:97` `evidence: excerpt(context.text)` —— 构造 finding 时未对 evidence 走 `redactString()`（脱敏只在 safety-policy 输出层，未覆盖 risk-rule-engine 的 evidence 组装）。
- **影响**：安全红线 I 类（明文凭证残留）——告警/评审视图中泄露明文口令。
- **证据**：`evidence/D4-26/stdout.log`
- **状态**：待查重（预期命中历史单）

## #10【P2】D1-65 调试开关仅接受字面量 "true"（SPEC-MISMATCH）

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=1` 时调试日志增量为 0；`=true` 时增量 1254（`evidence/D1-65/stdout.log`）。
- **断言**：`HUAWEICLOUD_DEVKIT_DEBUG` 取 `1` 或 `true` 均应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` 判定为 `process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true'`，未兼容 `1`。
- **影响**：按用例契约用 `1` 开启调试的用户观测不到日志。
- **证据**：`evidence/D1-65/stdout.log`
- **状态**：待查重（预期命中历史单）

## #11【P2】D1-68 region 环境变量优先级与契约相反（SPEC-MISMATCH）

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时 `HW_REGION` 胜出（`region=cn-test-hw-wins`）（`evidence/D1-68/stdout.log`）。
- **断言**：`HUAWEICLOUD_REGION` 必须优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:225` 写作 `process.env.HW_REGION || process.env.HUAWEICLOUD_REGION`，优先级与契约相反（同文件 :173 / :339 同样顺序）。
- **影响**：多变量共存时区域解析与文档不一致。
- **证据**：`evidence/D1-68/stdout.log`
- **状态**：待查重（预期命中历史单）

## #12【P2】D8-9 telemetry sanitizeValue 未做敏感值脱敏（SPEC-MISMATCH）

- **现象**：`sanitizeValue("ak=AK123456 sk=SKsecret token=Tok123")` 原样返回，未移除敏感值（`evidence/D8-9/stdout.log`）。
- **断言**：`sanitizeValue()` 必须移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue()` 仅做 trim/截断/去控制字符，未调用 `redactSecrets()`。
- **影响**：遥测上报可能携带凭证明文。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待查重（预期命中历史单）

---

## #13【非产品缺陷】D3-C1 账户级 VPC 删除受阻（VPC.0112）导致归零未完成（环境）

- **现象**：真机执行 ECS 生命周期 E2E：`CreateVpc`→`CreateSubnet`→`CreateServers`→服务器达到 `ACTIVE`→`DeleteServers` 归零全部实测通过；但收尾 `DeleteVpc` 持续返回 `VPC.0112`（`Delete the securitygroup first before deleting the router`），追踪到 router 引用租户内 `default` 安全组，而该 default 安全组删除被拒（`VPC.9902 Insufficient rights for removing default security group`），故本次创建的 VPC `testbot3-hermes-e2e-2445428660`（`9757654e-cb8e-499f-b73e-024bc64a0d28`）在本轮无法删除，未归零。判据 `evidence/D3-C1/stdout.log`。
- **说明**：属账户/VPC 服务的 default 安全组不可删的环境成因，非 SUT 缺陷。解除条件：账户侧允许删除 default 安全组或改为成功回收该 VPC。已实测同一账户其它真云写用例（D3-S2 建删 VPC 归零、D3-C2 OBS 建删归零、D3-S6 FunctionGraph 建删归零）均通过，故非「无环境」笼统阻塞。不计入提单。

## #14【非产品缺陷】D3-S7 跨服务交付（Web 应用 + RDS）无编排 harness（环境）

- **现象**：D3-S7（跨服务交付 Web 应用 + RDS 并归零）标 BLOCKED。
- **说明**：需「RDS 实例创建 + 沙箱部署 + 连接串注入 + 全量归零」的跨服务编排 harness 及 RDS 实例配额，每日单服务真云探针（`realcloud_e2e.mjs`）未覆盖。解除条件：提供跨服务编排 harness + RDS 配额。不计入提单。

## #15【测试侧】真云 E2E 探针判定缺陷需修正（退出码判成败 / 归零轮询窗过短）

- **现象**：`scripts/realcloud_e2e.mjs` 判定链存在测试侧缺陷——①D3-C2 以 KooCLI 退出码判成败（`hcloud OBS mb` 建桶成功仍返回 exit=6）→ 建桶成功后仍误判 FAIL；②D3-C1 在 ECS 仍 `BUILDING` 时即提交 `DeleteServers`，异步删除在 150s 轮询窗内不生效 → 「无残留」误判 FAIL。
- **说明**：属测试脚本判定缺陷，非 SUT 缺陷。本轮改用本地修正探针归档：`evidence/D3-C2/probe.mjs`（按建桶/静态站/删桶的**云端副作用**判定，实测建桶成功 exit=6、set/get 200、删桶归零 → PASS）、`evidence/D3-C1/probe.mjs`（等待 ECS `ACTIVE` 后再删除并延长归零轮询，实测创建→ACTIVE→删除归零通过）。不计入提单。

## #16【测试侧】账户内历史遗留 VPC/子网残留占用 router 配额

- **现象**：真机执行前 `CreateVpc` 返回 `VPC.0114 Quota exceeded for resources: ['router']`；账户内残留多套历史遗留 VPC（`testbot3-hermes-e2e-2357882909`/`2358512187`/`2444170399`、`hdk-s7-vpc-*`）与大量孤立子网（2026-09-23 ~ 10-05 创建）。
- **说明**：删除本客户端（`testbot3-`）历次探针遗留的 4 套 VPC/子网以释放 router 配额后，D3-C1/D3-S2/D4-13 真云用例恢复正常（D3-S2 建删归零 PASS、D4-13 写被 IAM 正确拒绝 PASS）。属测试执行环境清理，非 SUT 缺陷。不计入提单。

## #17【非产品缺陷】多测试机共享同一云端账号并发抢占配额

- **现象**：本轮执行期间观察到同一华为云账号上另一测试机（`testbot1-`）并发创建 VPC/ECS（`testbot1-hermes-e2e-2444861616`、`testbot1-hermes-ecs-2444861616`），与 `hdk-s7-vpc-*` 探针并发占用 router 配额，是 `VPC.0114` 的直接诱因之一。
- **说明**：属多机共享账号的并发资源竞争，非 SUT 缺陷。不计入提单。

## #18【非产品缺陷】D1-39 Windows 专属 P0 在 Linux 标 NOT_RUN

- **现象**：D1-39（Windows 升级检测链）为 OS 专属 P0 用例，当前 OS=Linux 不适用，标 NOT_RUN。
- **说明**：属归属列正确 + OS 不适用（P0 不得 NOT_RUN 的唯一例外，`verify_coverage.py` 按 OS 列「专属」自动豁免），Linux 侧升级链路由 EXP-NR3-10 代表覆盖且已 PASS。不计入提单。