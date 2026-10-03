# FINDINGS — 缺陷发现清单（Hermes-deepseek-v4.1-flash / Linux）

> **落盘路径**：`results/Hermes/2026-10-04-1.94.218.129/Linux/FINDINGS.md`
> **生成时间**：`2026-10-04 05:14:00`（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.8-next.1（npm `next`，gitHead `ffd7b474`）
> **测试类型**：每日测试（daily 精选：设计级 102 + 展开级 43）
> **汇总**：产品缺陷 10 项（P0×1 / P1×3 / P2×6），【测试侧】2 项不计入提单。

---

## #1【P0】D9-12 initialize 握手前置状态机缺失（tools/list 未经 initialize 未返回 -32600）

- **现象**：`callTool` 未 initialize 直接 `tools/list`，服务端正常返回 41 个工具，未按 MCP 生命周期返回 `-32600`（Invalid Request）。实测 `{"threw":false,"code":"listed:41"}`；`initialize` 本身返回 protocolVersion/capabilities/serverInfo 正常。
- **断言**：未经 `initialize` 的 `tools/list` 请求，服务端应返回 `{"error":{"code":-32600}}`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57`（`dispatch` 见 :30）`if (method === 'tools/list') return { tools: TOOL_DEFINITIONS };` 无「必须先 initialize」的会话状态检查，任意时序均放行。
- **影响**：MCP 生命周期安全基线缺口，客户端可跳过握手直接枚举/调用工具。
- **证据**：`evidence/D9-12/stdout.log`
- **历史关联**：#774 / #818（fix 未发布到 npm 正式/next 包）

## #2【P1】D3-S1 中文「云主机」意图路由未命中（serviceCatalog ECS 关键词缺失）

- **现象**：`service_catalog({intent:'帮我查一下我账号有哪些云主机'})` → `recommendedServices=['Run hcloud --help to list available services.']`（回落文案），未命中 ECS；后续只读命令仍可执行，但路由层 MISS。
- **断言**：含「云主机」的中文意图应命中 `recommendedServices=['ECS']`、`recommendedSkills=['huawei-ecs']`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1970-1983` ECS `keywords` 数组含 `服务器`/`虚拟机`/`云服务器`/`镜像` 等，**缺「云主机」**；`serviceCatalog`（:1966）对 CJK 关键词按 `it.includes(kw)`（:2195）子串匹配，故「云主机」未命中 → :2215 回落 help 文案。
- **影响**：口语化中文（云主机/主机）无法路由到 ECS，Agent 需多轮纠偏。
- **证据**：`evidence/D3-S1/stdout.log`
- **历史关联**：#844 / #842 / #705（fix 未发布）

## #3【P1】D10-3 评测集路由准确率 92.9%（1 条中文意图 MISS）

- **现象**：`node eval/harness/run-eval.mjs` 15 条中文意图，HIT=13 MISS=1 N/A=1，准确率 92.9%；`EXP-E01` harness verdict=MISS。
- **断言**：评测集 15 条中文意图 serviceCatalog 路由应全部 HIT（E08 诊断类 N/A 除外）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1966-2217` `serviceCatalog` routeMap 中文关键词覆盖不全（口语化/近义表述缺失），导致 1 条意图 MISS。
- **影响**：路由准确率未达标，复合/口语化意图易回落到 help 文案。
- **证据**：`evidence/D10-3/stdout.log`
- **历史关联**：#705 / #844

## #4【P1】EXP-E01 评测集路由未命中（harness verdict=MISS）

- **现象**：`run-eval.mjs` 对 EXP-E01「云主机」意图 verdict=MISS。
- **断言**：EXP-E01 中文意图应 HIT。
- **根因**：同 #2，`plugins/huaweicloud-core/src/tools.mjs:1966-2217` ECS keywords 缺「云主机」。
- **影响**：评测集门禁未达标。
- **证据**：`evidence/EXP-E01/stdout.log`
- **历史关联**：#705 / #805 / #846

## #5【P2】D4-25 Python hook 事件遥测分类错误 + 事件目录写偏

- **现象**：`hcloud ECS CreateServers ...`（空格分隔写动词）事件落 `cli:invoke`（应 `cli:write`）；事件写入 `plugins/telemetry` 而 Node 侧读取目录不存在（`Node 读取目录存在=false`），事件不被消费。
- **断言**：写命令→`cli:write`、只读→`cli:read`、其他→`cli:invoke`；事件须写入 Node telemetry 读取的目录。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 前置字符类 `(^|[A-Za-z0-9])` 不能匹配空格分隔的写动词（`ECS CreateServers`）；`:24` `PLUGIN_DIR = Path(__file__).resolve().parents[2]` 误指向 `plugins/`，事件落 `plugins/telemetry`，与 `src/telemetry/telemetry.mjs:21` `AGENT_TELEMETRY_DIR = join(PLUGIN_DIR,'telemetry')` 不一致。
- **影响**：Python hook 遥测分类失真、事件丢失，安全事件不可观测。
- **证据**：`evidence/D4-25/stdout.log`
- **历史关联**：#844 / #847（fix 未发布）

## #6【P2】D4-26 findings.evidence 未脱敏（明文密码/AK/SK 残留）

- **现象**：`hook_check_command('hcloud IAM CreateUser --password MyS3cret123 ...')` 返回 `decision=warn`，但 `findings[0].evidence` 原样保留明文 `--password MyS3cret123`（明文残留=true）。
- **断言**：`findings[*].evidence` 中的 password/AK/SK/token 应被替换为 `<redacted>`，无明文残留。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:97` `evidence: excerpt(context.text)` 直接取原文，未调用 `safety-policy.mjs:49 redactSecrets`。
- **影响**：安全预检回执本身泄露凭证明文，违反脱敏契约。
- **证据**：`evidence/D4-26/stdout.log`
- **历史关联**：#844 / #847（fix 未发布）

## #7【P2】D8-9 SPEC-MISMATCH telemetry sanitizeValue 未做凭证脱敏

- **现象**：`sanitizeValue('ak=AK123456 sk=SKsecret token=Tok123')` 返回原文（仅 trim/截断/去控制字符，敏感值未移除）；installId 稳定持久正常。
- **断言**：`sanitizeValue` 应移除 AK/SK/token 等敏感值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189` `sanitizeValue` 未做凭证脱敏（脱敏仅在 `risk-rule-engine.mjs`/`safety-policy.mjs` `redactSecrets` 层）。
- **影响**：遥测字段若携带凭证将明文上报。
- **证据**：`evidence/D8-9/stdout.log`
- **历史关联**：#844 / #847（fix 未发布）

## #8【P2】D1-65 SPEC-MISMATCH DEBUG 开关仅认字面量 'true'

- **现象**：`HUAWEICLOUD_DEVKIT_DEBUG=true` 日志增量=1254（生效）；`=1` 增量=0（不生效）。用例契约「1/true 均可开启」。
- **断言**：`HUAWEICLOUD_DEVKIT_DEBUG` 为 `1` 或 `true` 时均应开启调试日志。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:81` `const DEBUG = process.env.HUAWEICLOUD_DEVKIT_DEBUG === 'true';` 仅接受字面量 `"true"`。
- **影响**：`DEBUG=1` 用户调试开关静默失效。
- **证据**：`evidence/D1-65/stdout.log`
- **历史关联**：#844 / #847（fix 未发布）

## #9【P2】D1-68 SPEC-MISMATCH region 环境变量优先级与契约相反

- **现象**：同时设 `HW_REGION` 与 `HUAWEICLOUD_REGION` 时，`resolveCredentials` 取 `HW_REGION`（实测 region=`cn-test-hw-wins`）。用例契约要求 `HUAWEICLOUD_REGION` 优先。
- **断言**：`HUAWEICLOUD_REGION` 应优先于 `HW_REGION` 作为默认 region。
- **根因**：`plugins/huaweicloud-core/src/auth/credentials.mjs:222` `let region = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || '';` 优先级与契约相反（另见 :171、:352 同序）。
- **影响**：region 解析契约漂移，多环境切换可能取错区域。
- **证据**：`evidence/D1-68/stdout.log`
- **历史关联**：#844 / #847（fix 未发布）

## #10【P2】D3-S5 serviceCatalog 复合中文意图仅命中单一服务

- **现象**：复合意图仅返回 `recommendedServices=['ECS']`、`recommendedSkills=['huawei-ecs']`，未按预览/生产分层拆解多个目标服务。
- **断言**：复合意图应拆解并命中多个对应 service，分层推荐按预览/生产分流。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1966-2217` `serviceCatalog` 为单关键词并集路由，无复合意图分层拆解逻辑。
- **影响**：多服务编排场景路由不完整。
- **证据**：`evidence/D3-S5/stdout.log`
- **历史关联**：#788

## #11【测试侧】D3-S6 FunctionGraph 建函数未完成（探针未按 skill 提供 required 参数）

- **现象**：`hcloud FunctionGraph CreateFunction`（探针命令）缺 `--memory_size`/`--timeout`，hcloud 返回 `[USE_ERROR]The following parameters are required: memory_size timeout`，函数未创建（归零=true）。
- **说明**：`plugins/huaweicloud-core/skills/huawei-functiongraph/references/create-function.md:22-35` 已正确文档化 `memory_size`(128-4096) 与 `timeout`(1-900) 为必填；探针命令未按 skill 构造。属**测试侧**执行方式缺陷（改用例），非产品缺陷，不提单。
- **证据**：`evidence/D3-S6/stdout.log`
- **状态**：不改提单（测试侧）

## #12【测试侧】D4-13 探针 readOk 正则误命中返回体 UUID（已修复，实测 PASS）

- **现象**：探针 `probes_stage/probe_d413.mjs:33` 原 `readOk` 判定含 `/Forbidden|401|403/i`，误命中只读返回体 `subnet_id:"...-8e18-403a-..."` 中的 `403` 子串 → 假 FAIL；实测只读 `ListServersDetails` 可用、写 `CreateVpc` 被 IAM 拒绝（`VPC.0010`）。
- **说明**：属**测试侧**探针缺陷（非产品缺陷）。已修复为按 `"count"`/`"servers"` 结构与错误码字段判定，重跑结果 D4-13=PASS。
- **证据**：`evidence/D4-13/stdout.log`
- **状态**：不改提单（测试侧）