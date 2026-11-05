# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-11-06-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-06 05:20（北京时间）
> **被测对象**：huaweicloud-devkit v1.1.13（hdk gitHead `8a6d8be2`）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 按标题与「根因」字段解析。

---

## #1【P0】D2-4 凭证脱敏正确性：redactSecrets 未脱敏 JSON 字符串形态 ak/sk/token

- **现象**：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 输出原样含明文 `AKID123456`/`secret789`/`TOKEN123`，三字段均未替换为占位符。
- **断言**：含 AK/SK/token 的 JSON 字符串经 `redactSecrets` 后，`ak`/`sk`/`token` 值必须全部替换为 `<redacted>`，输出不得含 `AKID123456`/`secret789`/`TOKEN123`。
- **根因**：`src/safety-policy.mjs:42-45`（`redactString` 的凭证正则要求键名后紧跟 `\s*[:=]`，而 JSON 形态为 `"ak":"..."`，`"ak"`/`"sk"` 短键未被 `access[_-]?key|secret[_-]?key|…` 收录，且 `(AK|SK)` 区分大小写并因双引号阻隔无法命中），导致 JSON 字符串形态三类凭证全部漏脱敏。
- **影响**：AK/SK/token 明文可经凭证脱敏路径进入 agent 上下文，安全红线（I 类）。
- **证据**：`evidence/D2-4/stdout.log`

## #2【P1】D4-27 双路径输出脱敏：小写 ak=/sk= 未覆盖致明文泄露

- **现象**：双路径脱敏后输出 `token=<redacted> ak=AKID456 sk=secret789`，`ak`/`sk` 值仍为明文。
- **断言**：`redactSecrets`/`redactOutput` 双路径对 `ak=...`/`sk=...`/`token=...`（不分大小写）均须替换为占位符，输出不含明文 AK/SK。
- **根因**：`src/safety-policy.mjs:42`（`redactString` 正则覆盖 `token` 但未收录 `ak`/`sk` 短键）+ `src/safety-policy.mjs:45`（`(AK|SK)\s*[:=]` 区分大小写，小写 `ak=`/`sk=` 未命中），故仅 `token` 被脱敏、`ak`/`sk` 泄漏。
- **影响**：多行输出中含 `ak=`/`sk=` 时凭证明文外泄。
- **证据**：`evidence/D4-27/stdout.log`

## #3【P1】D3-S1/D3-S2/D3-S3/D3-S5/EXP-E01 serviceCatalog 路由缺失回落 help

- **现象**：以中文意图调用 `huaweicloud_service_catalog`（只读查 ECS / 删 VPC 先确认 / 沙箱预览出 URL / 复合意图分层路由 / “帮我查华北北京四云主机”）时，`recommendedServices` 回落为 `Run hcloud --help to list available services.`，未命中期望服务（ECS/VPC/sandbox/IAM 等）。
- **断言**：serviceCatalog 对上述中文意图须路由到对应服务（EXP-E01 期望 ECS 查询 → run_readonly），`recommendedServices` 非空且不含 help 回落文案。
- **根因**：`src/tools.mjs:2300`（`serviceCatalog` 的 `routeMap` 仅内置部分服务/关键词，多类中文场景意图未收录）+ `src/tools.mjs:2551-2553`（`recommendedServices` 为空时回落 `Run hcloud --help...`）。
- **影响**：D3 功能场景路由与 D10 评测集路由大面积 MISS，影响 agent 场景分流正确性。
- **证据**：`evidence/D3-S1/stdout.log`、`evidence/D3-S2/stdout.log`、`evidence/D3-S3/stdout.log`、`evidence/D3-S5/stdout.log`、`evidence/EXP-E01/stdout.log`

## #4【P2】D4-25 Python hook 事件遥测分类：WRITE_OPERATION_RE 边界失配→cli:invoke

- **现象**：写命令经 `huaweicloud-safety.py` 分类，key 判为 `cli:invoke`（而非 `cli:write`），未按写命令归入写类。
- **断言**：`DeleteServers` 等写动词（含空格分隔参数）必须命中 `cli:write`，不得降级为 `cli:invoke`。
- **根因**：`hooks/huaweicloud-safety.py:46`（`WRITE_OPERATION_RE = re.compile(r"(^|[A-Za-z0-9])(" + "|".join(write_prefixes) + r")\w*", re.I)`，前置边界 `(^|[A-Za-z0-9])` 在空格分隔的 `prefix --arg` 形式下失配）+ `hooks/huaweicloud-safety.py:111-112`（`is_write` 为 False 落入 `cli:invoke`）。
- **影响**：写命令遥测分类错误，安全遥测/审计维度失真。
- **证据**：`evidence/D4-25/stdout.log`

## #5【P2】D8-9 安装 ID 与遥测值脱敏：sanitizeValue 不脱敏凭证

- **现象**：`sanitizeValue("AK=ABC123XYZ")` 原样返回 `AK=ABC123XYZ`，敏感值未脱敏即进入遥测事件 value。
- **断言**：`sanitizeValue` 对含 `AK=`/`SK=`/`token=` 等凭证形态的值必须替换为占位符，输出不得含明文 `ABC123XYZ`。
- **根因**：`src/telemetry/telemetry.mjs:190-197`（`sanitizeValue` 仅去换行/截断，无凭证脱敏逻辑）。
- **影响**：遥测事件 value 携带明文 AK/SK，存在敏感信息上报泄漏风险。
- **证据**：`evidence/D8-9/stdout.log`

## #6【P1】D9-9 tools/call 超时协议语义与取消：mcp-protocol 未声明 cancellation

- **现象**：`mcp-protocol.mjs` 的 `initialize` capabilities 不含 `cancellation`/`notifications`/`cancel` 相关能力声明。
- **断言**：MCP 协议实现（`initialize` 的 `capabilities`）应声明 `cancellation`/`notifications` 通知能力，支持 `tools/call` 取消/超时语义。
- **根因**：`src/mcp-protocol.mjs:51-53`（`capabilities` 仅声明 `tools: {}`，缺少 `cancellation`/`notifications` 字段）——SPEC-MISMATCH（实现与 MCP 协议契约漂移）。
- **影响**：`tools/call` 超时后无法向客户端发送取消/进度通知，长任务超时语义不完整。
- **证据**：`evidence/D9-9/stdout.log`

## #7【测试侧】D3-C1 ECS生命周期E2E：ECS 异步删除轮询窗口不足，归零校验误报

- **现象**：真云 E2E（最低配置 c6.large.2 + GPSSD 40G）真实建 VPC/子网/ECS 成功（`serverIds` 返回），ECS 删除已提交（`job_id` 返回），但 150s 轮询窗口内 `ListServersDetails` 未确认归零，`finally归零` 判 FAIL；随后补删并复核，本次创建 ECS `13124247-2547-4ebc-bd61-e6796494f145` 已从云上列表消失、归零。
- **说明**：ECS 为异步删除，删除耗时超过探针内置 150s 轮询上限，属测试侧轮询窗口问题；资源已于本次补删后归零，非产品功能缺陷，不计入缺陷单。
- **证据**：`evidence/D3-C1/stdout.log`

## #8【测试侧】D3-C2 OBS静态站部署E2E：obsutil mb 退出码非零但建桶实际成功

- **现象**：`hcloud OBS mb` 输出含 `Create bucket [testbot3-hermes-obs-*] successfully`（建桶实际成功），但命令退出码非零，探针 `mb.ok && /success/i` 判 `OBS建桶 pass=false`；后续 set/get 静态站与删桶归零均 PASS。
- **说明**：建桶/配置静态站/删除全链路真实成功且删桶归零，FAIL 源于 obsutil `mb` 在成功建桶时仍返回非零退出码的测试侧判定问题，非产品功能缺陷。
- **证据**：`evidence/D3-C2/stdout.log`

## #9【测试侧】D3-C7 跨区域资源操作引导：IAM token 项目绑定 cn-north-4，跨区域建 EIP 被拒

- **现象**：跨区域 `ap-southeast-3` 只读可用性查询/规划均 PASS；但在 `ap-southeast-3` 创建最小 EIP 返回 `VPC.0501`（The project name cn-north-4 carried by the token ... does not match region ap-southeast-3），属 IAM token 项目作用域绑定 cn-north-4 的凭证约束。
- **说明**：`get_regional_availability` 区域可用性引导与 `plan 含 --cli-region` 均正常，资源创建失败源于统一账号 token 项目与区域绑定的环境/凭证约束，非产品引导逻辑缺陷。
- **证据**：`evidence/D3-C7/stdout.log`