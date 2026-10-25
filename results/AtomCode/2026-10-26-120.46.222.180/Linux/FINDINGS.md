# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-10-26-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-10-26 05:30（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.12（hdk gitHead `4ed07801`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 按标题与「根因」字段解析。

---

## #1【P0】D2-4 凭证脱敏正确性：redactSecrets 未脱敏 JSON 短键 ak/sk

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 输出仍完整含明文 `AKID123456`/`secret789`，仅 `token` 被替换为 `<redacted>`。
- **断言**：含 AK/SK 的 JSON 对象经 `redactSecrets` 后，`ak`/`sk`/`token` 值必须全部替换为占位符，输出不得含 `AKID123456`/`secret789`。
- **根因**：`safety-policy.mjs:20-31`（`isSecretKeyName` 用 `^(${pattern})$` 全词匹配，`secretKeyNamePatterns` 未收录 `ak`/`sk` 短键名）+ `safety-policy.mjs:57`（`redactSecrets` 逐键判断，键名未命中即不脱敏），导致 JSON 短键 `ak`/`sk` 明文字段漏脱敏。
- **影响**：AK/SK 明文可经凭证脱敏路径进入 agent 上下文，安全红线（I 类）。
- **证据**：`evidence/D2-4/stdout.log`
- **状态**：待提单

## #2【P1】D4-27 双路径输出脱敏：小写 ak=/sk= 未覆盖致明文泄露

- **现象**：双路径脱敏后输出 `token=<redacted> ak=AKID456 sk=secret789`，`ak`/`sk` 值仍为明文。
- **断言**：`redactSecrets` / `redactOutput` 双路径对 `ak=...`/`sk=...`/`token=...`（不分大小写）均须替换为占位符，输出不含明文 AK/SK。
- **根因**：`safety-policy.mjs:42-45`（正则仅覆盖 `access key`/`secret key`/`security token`/`x-auth-token`/`token`/`authorization`/`password` 等及大写 `AK|SK` 冒号形式；`:45` 的 `(AK|SK)\s*[:=]` 区分大小写，小写 `ak=`/`sk=` 无空格形式未命中），故仅 `token` 被脱敏、`ak`/`sk` 泄漏。
- **影响**：多行输出中含 `ak=`/`sk=` 时凭证明文外泄（D4-27 预期双路径均脱敏）。
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单

## #3【P1】D3-S1/D3-S2/D3-S3/D3-S5/EXP-E01 serviceCatalog 路由缺失回落 help

- **现象**：以中文意图调用 `huaweicloud_service_catalog`（只读查 ECS / 删 VPC 先确认 / 沙箱预览出 URL / 复合意图分层路由 / “帮我查华北北京四云主机”）时，`recommendedServices` 回落为 `Run hcloud --help to list available services.`，未命中期望服务（ECS/VPC/sandbox/IAM 等）。
- **断言**：serviceCatalog 对上述中文意图须路由到对应服务（EXP-E01 期望 ECS查询→run_readonly），`recommendedServices` 非空且不含 help 回落文案。
- **根因**：`tools.mjs:2188`（`serviceCatalog` 的 `routeMap` 仅内置极少量服务/关键词，大量服务与中文意图未收录）+ `tools.mjs:2441-2443`（`recommendedServices` 为空时回落 `Run hcloud --help...`）。
- **影响**：D3 功能场景路由与 D10 评测集路由大面积 MISS（EXP-E01~E15 基线 21.4% MISS 的根因之一），影响 agent 场景分流正确性。
- **证据**：`evidence/D3-S1/stdout.log`、`evidence/D3-S2/stdout.log`、`evidence/D3-S3/stdout.log`、`evidence/D3-S5/stdout.log`、`evidence/EXP-E01/stdout.log`
- **状态**：待提单

## #4【P2】D4-25 Python hook 事件遥测分类：WRITE_OPERATION_RE 边界失配→cli:invoke

- **现象**：`hcloud ECS DeleteServers --delete-all --project-id x` 经 `huaweicloud-safety.py` 分类，key 判为 `cli:invoke`（而非 `cli:write`），`hook-events.jsonl` 未按写命令归入 `cli:write`。
- **断言**：`DeleteServers` 等写动词（含空格分隔参数）必须命中 `cli:write`，不得降级为 `cli:invoke`。
- **根因**：`hooks/huaweicloud-safety.py:46`（`WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])" + "<write_prefixes>" + r"\w*", re.I)`，前置边界 `(^|[A-Za-z0-9])` 在空格分隔的 `prefix --arg` 形式下失配）+ `:112`（`is_write` 为 False 落入 `cli:invoke`）。
- **影响**：写命令遥测分类错误，安全遥测/审计维度失真。
- **证据**：`evidence/D4-25/stdout.log`
- **状态**：待提单

## #5【P2】D8-9 安装 ID 与遥测值脱敏：sanitizeValue 不脱敏凭证

- **现象**：`sanitizeValue("AK=ABC123XYZ")` 原样返回 `AK=ABC123XYZ`，敏感值未脱敏即进入遥测事件 value。
- **断言**：`sanitizeValue` 对含 `AK=`/`SK=`/`token=` 等凭证形态的值必须替换为占位符，输出不得含明文 `ABC123XYZ`。
- **根因**：`telemetry/telemetry.mjs:189-197`（`sanitizeValue` 仅去换行/截断，无凭证脱敏逻辑）。
- **影响**：遥测事件 value 携带明文 AK/SK，存在敏感信息上报泄漏风险。
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #6【P1】D9-9 tools/call 超时协议语义与取消：mcp-protocol 未声明 cancellation

- **现象**：`mcp-protocol.mjs` 不含 `cancellation`/`notifications`/`cancel` 相关能力声明。
- **断言**：MCP 协议实现（`initialize` 的 `capabilities`）应声明 `cancellation`/`notifications` 通知能力，支持 `tools/call` 取消/超时语义。
- **根因**：`mcp-protocol.mjs:47`（`capabilities` 仅声明基础能力，缺少 `cancellation`/`notifications` 字段）——SPEC-MISMATCH（实现与 MCP 协议契约漂移）。
- **影响**：`tools/call` 超时后无法向客户端发送取消/进度通知，长任务超时语义不完整。
- **证据**：`evidence/D9-9/stdout.log`
- **状态**：待提单

## #7【非产品缺陷】D3-C1 ECS生命周期E2E 环境阻塞：VPC 配额超限

- **现象**：真机 `CreateVpc` 返回 `VPC.0114 Quota exceeded for resources`，随后 `CreateSubnet` 因 VPC 无效失败；`finally` 反查归零确认无本批资源残留。
- **说明**：已真机执行（建 VPC 被云侧配额阻断 + 归零验证通过），属环境配额阻塞，不计入产品缺陷提单。

## #8【非产品缺陷】D3-C7 跨区域资源操作 环境阻塞：IAM token 区域绑定

- **现象**：`ap-southeast-3` 只读查询 + plan（`--cli-region`）通过，最小 EIP 建删返回 `VPC.0501`（token 携带 cn-north-4 区域信息，与 ap-southeast-3 不匹配）；`EIP归零 total_count=0` 已验证。
- **说明**：已真机执行，跨 region 写操作被 IAM token 区域绑定阻断，属环境/凭证区域限制，不计入产品缺陷提单。

## #9【非产品缺陷】D1-39 Windows 升级检测链 非本 OS 覆盖

- **现象**：D1-39 为 Windows 专属用例（OS 列标注「专属」），Linux 无法执行其 EINVAL 语义。
- **说明**：NOT_RUN（OS 专属用例在非对应 OS），由 Linux 侧 d1-upgrade 代表覆盖，不计入产品缺陷提单。