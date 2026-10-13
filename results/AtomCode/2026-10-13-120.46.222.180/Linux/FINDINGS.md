# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-10-13-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-10-13 06:10（北京时间）
> **SUT**：`v1.1.8`（npm latest，gitHead `74f519d`）
> **本清单是统一提单脚本的解析输入**：格式严格遵循 `file_issue.py`。

---

## #1【P0】D2-4 凭证脱敏 JSON 键值形态漏脱敏

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 原样返回，明文 AK/SK/token 残留。
- **断言**：JSON 字符串内 ak/sk/token 值应全部为 `<redacted>`，实测明文残留 → 断言失败。
- **根因**：`safety-policy.mjs:34-62` — `redactSecrets` 对字符串输入走 `redactString`（不 `JSON.parse`）；`redactString` 的 `(AK|SK)\s*[:=]`（L45）不匹配 JSON 带引号键 `"ak":"..."`，整段 JSON 漏脱敏。
- **影响**：凭证 JSON 落入 agent 上下文时明文 AK/SK/token 外泄（I 类红线）。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P1】D3-S1 自然语言「只读查 ECS」未路由到 ECS

- **现象**：`service_catalog(intent='列出cn-north-4的ECS，只读不改')` 返回 `Run hcloud --help`（MISS）。
- **断言**：含「ECS + 只读不改」的意图应命中 ECS，实测 MISS → 断言失败。
- **根因**：`tools.mjs:2212-2222` — 路由分词 `it.split(/[\s,./-]+/)` 将「4的ecs」切成单词 token，英文 `ecs` 精确匹配不命中；CJK 关键词需字面出现 → 无命中。
- **影响**：自然语言只读查询意图无法路由到正确服务。
- **证据**：`evidence/D3-S1/stdout.log`

## #3【P1】D3-S2 自然语言「删 VPC 先确认」未路由到 VPC

- **现象**：`intent='删除测试VPC，先列命令确认'` 返回 `Run hcloud --help`（MISS）。
- **断言**：含「删 VPC + 先确认」的意图应命中 VPC，实测 MISS → 断言失败。
- **根因**：`tools.mjs:2212-2222` — 与 D3-S1 同根因：英文 `vpc` 精确 token 匹配，CJK 语段「测试vpc」粘连成单 token 不命中。
- **影响**：删除类高危写意图未路由到 VPC 预检/确认流。
- **证据**：`evidence/D3-S2/stdout.log`

## #4【P1】D3-S3 自然语言「沙箱预览」未路由到 Sandbox

- **现象**：`intent='部署当前项目到沙箱给我预览链接'` 返回 `Run hcloud --help`（MISS）。
- **断言**：含「沙箱/预览」的部署意图应命中 Sandbox，实测 MISS → 断言失败。
- **根因**：`tools.mjs:1986-2113`（routeMap sandbox 关键词）+ `:2212` — sandbox 关键词表缺「沙箱」「预览」；英文 `sandbox/preview` 需精确 token 命中，CJK 语段粘连致 MISS。
- **影响**：沙箱预览类高频意图无法路由。
- **证据**：`evidence/D3-S3/stdout.log`

## #5【P1】D4-27 双路径输出脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` → 小写 `ak=`/`sk=` 值明文残留。
- **断言**：`ak=`/`sk=` 值应脱敏，实测明文残留 → 断言失败。
- **根因**：`safety-policy.mjs:45` — `(AK|SK)\s*[:=]` 仅匹配大写，未覆盖小写 `ak`/`sk` 形态。
- **影响**：小写凭证键形态输出漏脱敏（I 类红线）。
- **证据**：`evidence/D4-27/stdout.log`

## #6【P1】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities: { tools: {} }`，无 `notifications.cancellation` 声明。
- **断言**：MCP 协议应声明 `capabilities.notifications.cancellation`，实测未声明 → SPEC-MISMATCH。
- **根因**：`mcp-protocol.mjs:47-49` — `capabilities` 仅含 `tools:{}`，未声明 `notifications.cancellation`。
- **影响**：客户端无法据契约发起取消通知。
- **证据**：`evidence/D9-9/stdout.log`

## #7【P1】EXP-E01 中文「云主机」未路由到 ECS

- **现象**：`intent='帮我查一下我账号在华北北京四有哪些云主机'` 返回 `Run hcloud --help`（MISS）。
- **断言**：含「云主机」的查询意图应命中 ECS，实测 MISS → 断言失败。
- **根因**：`tools.mjs:2212` — 「云主机」分词粘连（「些云主机」），英文 `ecs` 精确 token 不命中；「云主机」同义表述无对应关键词。
- **影响**：中文同义表述无法路由到 ECS。
- **证据**：`evidence/EXP-E01/stdout.log`

## #8【P2】D3-S5 复合意图分层路由未命中多服务

- **现象**：`intent='物联网+时序数据+前端托管'` 返回 `Run hcloud --help`（MISS）。
- **断言**：复合意图应命中 1+ 服务，实测 MISS → 断言失败。
- **根因**：`tools.mjs:2212-2222` — 复合意图多关键词跨路由，但「物联网/时序数据/前端托管」无对应关键词，分词后无命中。
- **影响**：复合/分层意图无法多服务路由。
- **证据**：`evidence/D3-S5/stdout.log`

## #9【P2】D4-25 Python hook 写命令未分类 cli:write

- **现象**：写命令 `hcloud ECS DeleteServers --delete-all` 分类为 `cli:invoke`（非 `cli:write`）。
- **断言**：写命令事件键应为 `cli:write`，实测 `cli:invoke` → 断言失败。
- **根因**：`hooks/huaweicloud-safety.py:46` — `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + ... + r")\w*")` 左边界无法匹配空格分隔的 `Service Operation`。
- **影响**：遥测三键分类失真，写操作被记为 invoke。
- **证据**：`evidence/D4-25/stdout.log`

## #10【P2】D8-9 安装 ID 与遥测值脱敏缺位

- **现象**：`sanitizeValue('AK=ABC123XYZ')` 返回明文，未脱敏。
- **断言**：遥测 value 含 AK/SK/token 应脱敏，实测明文残留 → 断言失败。
- **根因**：`telemetry/telemetry.mjs:189-195` — `sanitizeValue` 仅空白规范+长度截断，无敏感值脱敏逻辑。
- **影响**：遥测上报含明文凭证值。
- **证据**：`evidence/D8-9/stdout.log`

## #11【测试侧】D3-C1 ECS 生命周期 E2E 真机清理未在窗口内归零（harness 缺陷，非产品缺陷）

- **现象**：`realcloud_e2e.mjs` D3-C1 真机建 VPC/子网/ECS(2C4G)→删除流程中，ECS 异步删除 >150s 未确认归零；且 harness 在 ECS 仍 ACTIVE 时先删子网/VPC（hcloud 返回 exit 0 但资源未真删）。
- **说明**：属测试仓库 `scripts/realcloud_e2e.mjs` 清理逻辑缺陷（150s 轮询不足 + 依赖资源删除顺序错误），**非 devkit 产品缺陷**（devkit plan/approve 建链 CreateVpc/CreateSubnet/CreateServers 判定与执行均 PASS）。本机已手动补删 ECS→子网→VPC，归零验证 count=0 / vpcs=[] 通过，不计入提单。
- **证据**：`evidence/D3-C1/stdout.log`

## #12【非产品缺陷】D3-C7 跨区域真实创建被账户级 region/project 绑定阻断（VPC.0501，非产品缺陷）

- **现象**：`get_regional_availability(ecs,ap-southeast-3)=available:true`、`plan` 已注入 `--cli-region=ap-southeast-3`（两项 devkit 断言 PASS）；但真实只读查询与建 EIP 返回 VPC.0501「The project name cn-north-4 carried by the token from IAM contains region information」。
- **说明**：账户 IAM project 绑定 cn-north-4，ap-southeast-3 未开通/未绑定，属**账户级 region 权限边界**；devkit `get_regional_availability` 已 disclaimer「不保证 IAM 用户在目标 region 有权限、APIGW.0802 可能阻断」，故非 devkit 产品缺陷，不计入提单。
- **证据**：`evidence/D3-C7/stdout.log`