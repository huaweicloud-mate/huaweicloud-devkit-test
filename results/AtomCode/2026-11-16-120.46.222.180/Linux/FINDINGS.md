# FINDINGS — 缺陷发现清单（AtomCode-deepseek-v4-pro-0813）

> **落盘路径**：`results/AtomCode/2026-11-16-120.46.222.180/Linux/FINDINGS.md`
> **生成时间**：2026-11-16 05:26（北京时间）
> **被测对象**：huaweicloud-devkit `1.1.14-next.5`（npm @next，gitHead `4fb59d76`）
> **执行归档**：`results/AtomCode/2026-11-16-120.46.222.180/Linux/`

> 本日 SUT 与昨日（11-15）同为 `1.1.14-next.5`（src/*.mjs 平铺布局），gitHead `4fb59d76`。以下缺陷均基于 src 源码真实执行复现，根因指向 `.mjs` 源文件（行号以 npm 安装包 `4fb59d76` 为准）。

---

## #1【P0】D2-4/D4-27 凭证脱敏：redactSecrets 未覆盖小写 `ak`/`sk` 键与 JSON 键名，明文泄露

- **现象**：
  - D2-4：`redactSecrets('{"ak":"AKID123456","sk":"secret789","token":"TOKEN123"}')` 返回原样，`AKID123456`/`secret789`/`TOKEN123` 全量泄露。
  - D4-27：`redactSecrets("token=abc123 ak=AKID456 sk=secret789")` 返回 `token=<redacted> ak=AKID456 sk=secret789`，`AKID456`/`secret789` 未脱敏。
- **断言**：含 `ak`/`sk`/`token`（大小写与 JSON `"key":"value"`、`key=value` 两种形态）明文凭证的输入，输出不得包含明文值。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:34-45` `redactString()` 的键名正则仅覆盖大写 `(AK|SK)\s*[:=]`（:45，区分大小写，不含小写 `ak`/`sk`）与全称键 `access[_-]?key|secret[_-]?key|security[_-]?token|token|...`（:42，要求 `\s*[:=]\s*` 紧跟冒号/等号）；①小写简写 `ak=`/`sk=` 不匹配大写 `(AK|SK)`；②JSON 键名 `"ak":"` 的键与冒号间隔 `"`，不满足 `\s*[:=]\s*` 结构（token 同理），故全量脱敏失效。
- **影响**：凭证脱敏（安全核心，P0）漏脱敏，`ak`/`sk` 明文进入 Agent 上下文，凭证泄露风险。
- **证据**：`evidence/D2-4/stdout.log`、`evidence/D2-4/probe.mjs`、`evidence/D4-27/stdout.log`、`evidence/D4-27/probe.mjs`
- **状态**：待提单

## #2【P1】D3-S1/D3-S2/D3-S3/D3-S5/EXP-E01 serviceCatalog 中文意图含英文服务名（ECS/VPC/沙箱等）时路由 miss，返回 fallback

- **现象**：意图「列出cn-north-4的ECS，只读不改」「删除测试VPC，先列命令确认」「部署当前项目到沙箱给我预览链接」「物联网+时序数据+前端托管」经 `huaweicloud_service_catalog` 后返回 `recommendedServices=["Run hcloud --help to list available services."]`（未命中路由）。
- **断言**：含 ECS/VPC/沙箱等明确服务语义的中文意图应命中对应 service/skill，不得返回 fallback。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2587` 分词 `it.split(/[\s,./-]+/)` 对「中文+英文无空格」不切分英文 token，英文关键词仅走 `tokens.has(kw)` 全等匹配（:2591，非 CJK 关键词不走 `it.includes` 子串匹配）；叠加中文关键词覆盖缺口，命中为空 → fallback `tools.mjs:2611-2613`。
- **影响**：真实场景中文意图路由准确率下降，Agent 无法路由到正确 service/skill。
- **证据**：`evidence/D3-S1/stdout.log`、`evidence/D3-S2/stdout.log`、`evidence/D3-S3/stdout.log`、`evidence/D3-S5/stdout.log`、`evidence/EXP-E01/stdout.log` 及各自 `probe.mjs`
- **状态**：待提单

## #3【P1】D3-C7 跨区域资源操作引导：目标区域写操作因 IAM token 项目绑定不匹配失败，引导未提前预警

- **现象**：`get_regional_availability(ecs,ap-southeast-3)` 返回 `available=true`、`plan` 带 `--cli-region=ap-southeast-3`，但最小 EIP 创建返回 `VPC.0501`（token 项目 cn-north-4 与目标区域不匹配）创建失败（total=5 passed=4 failed=1）。
- **断言**：跨区域写操作前，产品应识别目标区域与 token 项目不匹配并引导切换，而非直接放行失败。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2925`（`getRegionalAvailability`）仅 `sourcedFrom: 'static cache'`（:3045）静态校验服务级可用性，:3046 附 disclaimer 但 `huaweicloud_plan_cli_command`（:1348 → `planHcloudCommand`）未据此对目标区域 IAM 项目绑定做预检引导。
- **影响**：跨区域资源创建/引导场景失败，用户按 `available=true` 继续会得到 backend 报错。
- **证据**：`evidence/D3-C7/stdout.log`、`evidence/D3-C7/probe.mjs`
- **状态**：待提单

## #4【P2】D4-25 Python hook 事件遥测分类：WRITE_OPERATION_RE 边界使空格分隔写命令未命中，误判 cli:invoke

- **现象**：`hcloud ECS DeleteServers --delete-all` 的写命令经 Python hook `record_cli_event` 分类为 `cli:invoke`，而非预期的 `cli:write`。
- **断言**：写操作命令应分类为 `cli:write`（只读→`cli:read`、其他→`cli:invoke`）。
- **根因**：`plugins/huaweicloud-core/hooks/huaweicloud-safety.py:46` `WRITE_OPERATION_RE` 边界要求前缀为非空白单字符，「DeleteServers」前为空格（被边界吞掉后起始处仍为空格）故未命中 → `record_cli_event`（:111）回退 `cli:invoke`。
- **影响**：Python hook 遥测事件写/读分类失真，安全审计依赖的 capability 归类错误。
- **证据**：`evidence/D4-25/stdout.log`、`evidence/D4-25/probe.mjs`
- **状态**：待提单

## #5【P2】D8-9 安装 ID 与遥测值脱敏：`sanitizeValue` 完全不脱敏任何键值（仅截断空白/长度）

- **现象**：`sanitizeValue("AK=ABC123XYZ")` 返回 `AK=ABC123XYZ` 原样，`ABC123XYZ` 泄露。
- **断言**：遥测 sanitize 含 `AK=...`/`SK=...` 时，输出不得包含明文值。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190-197` `sanitizeValue()` 仅做控制字符→空格 与长度截断，未实现任何 `AK`/`SK`/secret 键名脱敏。
- **影响**：遥测上报路径对敏感键值不脱敏，存在凭证/安装 ID 泄露风险。
- **证据**：`evidence/D8-9/stdout.log`、`evidence/D8-9/probe.mjs`
- **状态**：待提单

## #6【P1】D9-9 tools/call 超时协议语义与取消：mcp-protocol 未声明 cancellation/notifications/cancel（SPEC-MISMATCH）

- **现象**：`mcp-protocol.mjs` 的 `initialize` capabilities 仅 `{ tools: {} }`，源码不包含 `cancellation`/`notifications`/`cancel` 任一能力声明。
- **断言**：MCP 协议实现应在协议能力面声明取消/超时语义。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs:60-62` `capabilities: { tools: {} }` 未声明取消/超时能力；`tools/call`（:80 起）亦无取消语义（SPEC-MISMATCH，契约漂移待裁决）。
- **影响**：tools/call 长时间调用无法由客户端取消，超时协议语义缺失。
- **证据**：`evidence/D9-9/stdout.log`、`evidence/D9-9/probe.mjs`
- **状态**：待提单

## #7【非产品缺陷·环境】D1-3 doctor 自检：本机 Node 版本低于产品要求，doctor 如实报 FAIL

- **现象**：`huaweicloud-devkit doctor` 报 `[FAIL] Node.js >= 22.19`、`[WARN] KooCLI version mismatch`，结果 `10 pass, 1 warn, 1 fail`。
- **说明**：被测包要求 Node ≥ 22.19；本机 `~/nodejs/bin/node` 为 v22.13.0（< 22.19）、KooCLI 版本低于配对版本，属测试机环境版本不满足，非产品缺陷——doctor 检测是准确的。不进入提单。
- **证据**：`evidence/D1-3/stdout.log`、`evidence/D1-3/probe.mjs`

## #8【测试侧】D3-C1 ECS 生命周期 E2E：`finally归零` 断言因 ECS 异步删除轮询窗（150s）短于实际删除耗时而误报未归零

- **现象**：D3-C1 CreateVpc/CreateSubnet/CreateServers(审批分类)/CreateServers(返回serverIds) 均 PASS，但 `finally归零(校验真实删除)` 返回 `ECS:提交删除 ECS轮询:仍在/未确认 subnet:OK vpc:OK`（ECS 异步删除在 150s 轮询窗内未完成）。
- **说明**：ECS 删除为异步任务，实际耗时 > 150s 轮询窗；本轮代理在探针结束后手工补删并核验，最终 ECS/VPC/子网全部归零（ECS count=0、VPC 无 `testbot3-hermes-e2e-*` 残留、子网已删）。属测试探针轮询窗过短，非产品缺陷——产品 CreateServers/DeleteServers 行为正确。
- **证据**：`evidence/D3-C1/stdout.log`、`evidence/D3-C1/probe.mjs`

## #9【测试侧】D3-C2 OBS 静态站部署 E2E：「OBS建桶」断言误判 false（建桶实际成功，后续 set/get/删桶归零均 PASS）

- **现象**：`OBS建桶` `pass=false`，但 detail 明确返回 `Create bucket [...] successfully`（request id 非空），`set静态站`/`get静态站`/`删桶归零` 均 `pass=true`，桶最终成功删除归零。
- **说明**：`scripts/realcloud_e2e.mjs`「OBS建桶」断言对返回结构/关键字匹配有误（建桶成功但含 Notice 提示即判 false），属测试脚本断言缺陷，非产品缺陷。桶已删除归零。
- **证据**：`evidence/D3-C2/stdout.log`、`evidence/D3-C2/probe.mjs`