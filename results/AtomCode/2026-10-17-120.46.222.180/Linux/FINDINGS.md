# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-10-17-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-10-17 05:20:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D2-4 凭证脱敏正确性（JSON 键值形态漏脱敏）

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 原样返回，未脱敏。
- **断言**：JSON 字符串中的凭证值应被 `<redacted>` 替换，输出不得含明文 `AKID123456`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-62` —— `redactString()` 不做 `JSON.parse`，第 45 行 `/(AK|SK)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/g` 只匹配 `AK:`/`AK=` 等无引号键形态，带引号的 JSON 键（`"ak":"..."`）不命中。
- **影响**：I 类红线违规，凭证明文可能进入对话/日志外泄。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P1】D3-S1 场景-只读查 ECS（中文意图未路由）

- **现象**：「查我账号在北京四有哪些云主机」→ `huaweicloud_service_catalog` 返回 `Run hcloud --help to list available services.`（MISS）。
- **断言**：中文只读 ECS 意图应路由到 `ECS`，不得回落 help。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1984-2239` —— `serviceCatalog()` 中文分词粘连成单 token，英文 `ecs` 关键字无同义词命中，回落第 2239 行 `Run hcloud --help`。
- **证据**：`evidence/D3-S1/stdout.log`

## #3【P1】D3-S2 场景-删 VPC 先确认（中文意图未路由）

- **现象**：「删 VPC 先确认」意图路由 MISS，返回 `Run hcloud --help`。
- **断言**：删除 VPC 意图应路由到 `VPC` 并触发确认审批语义。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1984-2239` —— 同 #2，CJK 语段粘连未命中英文 `vpc` token。
- **证据**：`evidence/D3-S2/stdout.log`

## #4【P1】D3-S3 场景-沙箱预览出 URL（中文意图未路由）

- **现象**：沙箱预览类中文意图路由 MISS，返回 `Run hcloud --help`。
- **断言**：沙箱预览意图应路由到 `Sandbox`/`DevStation`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1984-2239` —— 同 #2，`sandbox` 中文同义词缺失。
- **证据**：`evidence/D3-S3/stdout.log`

## #5【P2】D3-S5 场景-复合意图分层路由（中文意图未路由）

- **现象**：复合中文意图（含 ECS/RDS 等多服务）路由 MISS，回落 help。
- **断言**：复合意图应分层返回主要服务集合。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1984-2239` —— 同 #2，CJK 语段粘连未命中英文服务 token。
- **证据**：`evidence/D3-S5/stdout.log`

## #6【P2】D4-25 Python hook 事件遥测分类（空格分隔写命令误分类）

- **现象**：空格分隔的写命令被分类为 `cli:invoke` 而非 `cli:write`。
- **断言**：写命令应命中 WRITE_OPERATION_RE 并分类为 `cli:write`。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46,111-112` —— `WRITE_OPERATION_RE = (^|[A-Za-z0-9])(write前缀)\w*` 边界要求前导字母/数字，空格分隔命令首词边界未命中，第 112 行回落 `cli:invoke`。
- **证据**：`evidence/D4-25/stdout.log`

## #7【P1】D4-27 双路径输出脱敏（小写 ak=/sk= 未脱敏）

- **现象**：`token=<redacted> ak=AKID456 sk=secret789` 中小写 `ak`/`sk` 值明文残留。
- **断言**：大小写不敏感的 `ak=`/`sk=` 值应全部 `<redacted>`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:45` —— `/(AK|SK)/` 仅匹配大写，小写 `ak`/`sk` 键不命中。
- **影响**：I 类红线违规，小写形态凭证明文残留。
- **证据**：`evidence/D4-27/stdout.log`

## #8【P2】D8-9 安装 ID 与遥测值脱敏（sanitizeValue 未过滤）

- **现象**：`sanitizeValue('AK=ABC123XYZ')` 明文残留。
- **断言**：遥测上报中的敏感值应脱敏，不得含明文 `AK=` 值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:189-195` —— `sanitizeValue()` 缺敏感键名/值过滤。
- **证据**：`evidence/D8-9/stdout.log`

## #9【P1】D9-9 tools/call 超时协议语义与取消（SPEC-MISMATCH）

- **现象**：`initialize` 返回 `capabilities: { tools: {} }`，未声明 `notifications.cancellation`。
- **断言**：协议应按规范声明取消能力，否则标注 SPEC-MISMATCH。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:47-49` —— capabilities 结构只声明 `tools`，未声明取消通知/超时取消语义。
- **证据**：`evidence/D9-9/stdout.log`

## #10【P1】EXP-E01 中文「云主机」未路由

- **现象**：中文「云主机」意图 → service_catalog 返回 `Run hcloud --help`（MISS）。
- **断言**：「云主机」应路由到 `ECS`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1984-2239` —— 同 #2，`云主机→ECS` 同义词缺失。
- **证据**：`evidence/EXP-E01/stdout.log`

## #11【非产品缺陷】D3-C1 ECS 生命周期 E2E（账户 VPC 配额耗尽）

- **现象**：真云实机执行中 `CreateVpc` 命中 `VPC.0114 Quota exceeded`，无法建 VPC/子网/ECS。
- **说明**：账户级 cn-north-4 VPC 配额耗尽（环境阻塞），非 devkit 产品缺陷；finally 归零 0 资源无泄漏。不计入提单。

## #12【非产品缺陷】D3-C7 跨区域资源操作（账户 region/project 绑定）

- **现象**：只读规划/引导 4/5 通过；最小 EIP 创建命中 `VPC.0501`（token 项目 cn-north-4 与 ap-southeast-3 不匹配）。
- **说明**：账户级 region/project 绑定阻断（环境阻塞），非 devkit 产品缺陷；EIP 归零 total_count=0。不计入提单。