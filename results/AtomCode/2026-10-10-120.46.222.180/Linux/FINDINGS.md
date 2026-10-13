# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-10-10-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-10-10 05:27（北京时间）
> **SUT**：`v1.1.8-next.2`（npm @next，gitHead `681895da`）
> **本清单是统一提单脚本的解析输入**：格式严格遵循 `file_issue.py`。

---

## #1【P0】D2-4 凭证脱敏 JSON 键值形态漏脱敏

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 原样返回，明文 AK/SK/token 全部残留。
- **断言**：JSON 字符串内 ak/sk/token 值应全部为 `<redacted>`，实测 `AKID123456` 明文残留 → 断言失败。
- **根因**：`safety-policy.mjs:34-48` — `redactSecrets` 对 JSON **字符串**输入不走 object 分支（不 `JSON.parse`），落入 `redactString`；`redactString` 的脱敏正则要求 `key:`/`key=` 形态（无 JSON 外层引号），无法命中 `"ak":"..."` 的带引号键，故整段 JSON 漏脱敏。
- **影响**：凭证 JSON 落入 agent 上下文时明文 AK/SK/token 外泄（I 类红线）。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单（历史查重）

## #2【P1】D3-S1 自然语言「只读查 ECS」未路由到 ECS

- **现象**：`callTool('huaweicloud_service_catalog',{intent:'列出cn-north-4的ECS，只读不改'})` 返回 `Run hcloud --help`（MISS）。
- **断言**：含「ECS + 只读不改」的意图应命中 ECS 服务，实测 `recommendedServices=['Run hcloud --help to list available services.']` → 断言失败。
- **根因**：`tools.mjs:2194-2199` — 路由分词 `it.split(/[\s,./-]+/)` 把「4的ecs」切为单个 token（`4的` 与 `ecs` 粘连），英文关键词走 `tokens.has('ecs')` 精确匹配无法命中；CJK 关键词 `云服务器` 需字面出现，本意图不含 → 无命中。
- **影响**：自然语言只读查询意图无法路由到正确服务，落到裸 `hcloud --help`。
- **证据**：`evidence/D3-S1/stdout.log`

## #3【P1】D3-S2 自然语言「删 VPC 先确认」未路由到 VPC

- **现象**：`intent:'删除测试VPC，先列命令确认'` 返回 `Run hcloud --help`（MISS）。
- **断言**：含「删 VPC + 先确认」的意图应命中 VPC 服务，实测 MISS → 断言失败。
- **根因**：`tools.mjs:2194-2199` — 与 D3-S1 同根因：英文关键词 `vpc` 走精确 token 匹配，CJK 语段「测试vpc」粘连成单 token，`tokens.has('vpc')` 不命中；`虚拟私有云` CJK 关键词需字面出现。
- **影响**：删除类高危写意图未路由到 VPC 预检/确认流。
- **证据**：`evidence/D3-S2/stdout.log`

## #4【P1】D3-S3 自然语言「沙箱预览」未路由到 Sandbox

- **现象**：`intent:'部署当前项目到沙箱给我预览链接'` 返回 `Run hcloud --help`（MISS）。
- **断言**：含「沙箱/预览」的部署意图应命中 Sandbox 服务，实测 MISS → 断言失败。
- **根因**：`tools.mjs:2149-2162`（sandbox 路由关键词）+ `2194-2199` — sandbox 关键词表仅含 `网站/网页/静态` 等 CJK，**缺「沙箱」「预览」**；英文 `sandbox/preview` 需精确 token 命中，CJK 语段粘连致 MISS。
- **影响**：沙箱预览类高频意图无法路由。
- **证据**：`evidence/D3-S3/stdout.log`

## #5【P1】D4-27 双路径输出脱敏漏小写 ak=/sk=

- **现象**：`redactSecrets('token=abc123 ak=AKID456 sk=secret789')` → `token=<redacted> ak=AKID456 sk=secret789`，小写 `ak=`/`sk=` 值明文残留。
- **断言**：`ak=`/`sk=` 值应脱敏，实测 `AKID456`/`secret789` 明文残留 → 断言失败。
- **根因**：`safety-policy.mjs:48` — `(AK|SK)\s*[:=]` 仅匹配大写 `AK`/`SK`（大小写敏感），未覆盖小写 `ak`/`sk` 形态；首个分支 `access[_-]?key` 等不含 `ak`/`sk` 短缩写。
- **影响**：小写凭证键形态输出漏脱敏（I 类红线）。
- **证据**：`evidence/D4-27/stdout.log`

## #6【P1】D9-9 capabilities 未声明 cancellation（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities: { tools: {} }`，无 `notifications.cancellation` 声明。
- **断言**：MCP 协议应声明 `capabilities.notifications.cancellation`，实测未声明 → SPEC-MISMATCH。
- **根因**：`mcp-protocol.mjs:47-49` — `dispatch('initialize')` 的 `capabilities` 仅含 `tools:{}`，未声明 `notifications.cancellation`。
- **影响**：客户端无法据契约发起取消通知，超时/挂起无法协作中断。
- **证据**：`evidence/D9-9/stdout.log`

## #7【P1】EXP-E01 中文「云主机」未路由到 ECS

- **现象**：`intent:'帮我查一下我账号在华北北京四有哪些云主机'` 返回 `Run hcloud --help`（MISS）。
- **断言**：含「云主机」的查询意图应命中 ECS，实测 MISS → 断言失败。
- **根因**：`tools.mjs:2194-2199` — 「云主机」被分词粘连（`些云主机`），英文 `ecs` 关键词精确 token 不命中；`云服务器`/`服务器` CJK 关键词需字面出现，本意图用「云主机」同义表述 → 无命中。
- **影响**：中文同义表述（云主机）无法路由到 ECS。
- **证据**：`evidence/EXP-E01/stdout.log`

## #8【P2】D3-S5 复合意图分层路由未命中多服务

- **现象**：`intent:'物联网+时序数据+前端托管'` 返回 `Run hcloud --help`（MISS），未命中任何服务。
- **断言**：复合意图应命中 1+ 服务（如 OBS/IoT/托管），实测 MISS → 断言失败。
- **根因**：`tools.mjs:2194-2199` — 复合意图多关键词跨路由，但「物联网/时序数据/前端托管」均无对应关键词，分词后无命中。
- **影响**：复合/分层意图无法多服务路由。
- **证据**：`evidence/D3-S5/stdout.log`

## #9【P2】D4-25 Python hook 写命令未分类 cli:write

- **现象**：写命令 `hcloud ECS DeleteServers --delete-all` 经 Python hook 分类为 `cli:invoke`（非 `cli:write`）。
- **断言**：写命令事件键应为 `cli:write`，实测 `cli:invoke` → 断言失败。
- **根因**：`hooks/huaweicloud-safety.py:46` — `WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(...)\w*")` 使用 `(^|[A-Za-z0-9])` 左边界，无法匹配空格分隔的 `Service Operation`（`ECS DeleteServers` 中 `DeleteServers` 前为空格）。
- **影响**：遥测事件三键分类失真，写操作被记为 invoke。
- **证据**：`evidence/D4-25/stdout.log`

## #10【P2】D8-9 安装 ID 与遥测值脱敏缺位

- **现象**：`sanitizeValue('AK=ABC123XYZ')` 返回 `AK=ABC123XYZ`，明文残留。
- **断言**：遥测 value 含 AK/SK/token 应脱敏，实测明文残留 → 断言失败。
- **根因**：`telemetry/telemetry.mjs:189-195` — `sanitizeValue` 仅做空白规范+长度截断，无敏感值脱敏逻辑。
- **影响**：遥测上报含明文凭证值。
- **证据**：`evidence/D8-9/stdout.log`