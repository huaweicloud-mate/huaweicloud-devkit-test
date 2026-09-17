# FINDINGS - Codex Windows 每日测试

> 生成时间：2026-09-16 09:25:00（北京时间）
> 被测版本：huaweicloud-devkit 1.1.5，源码 commit `e7ed6f6`

## #1【P0】D1-39 Windows 升级检测链返回空结果

- **现象**：Windows Node v22.23.2 下真实直调 `queryDistTagsSync()` 返回 `null`，未获得 npm dist-tags；探针未观察到可用的 latest 结果。
- **断言**：Windows 升级检测链应真实返回可解析的 dist-tags，且不得因 `npm.cmd` 调用失败静默返回 `null`。
- **根因**：`plugins/huaweicloud-core/src/update-check.mjs:236-251` 使用 Windows `npm.cmd` 调用 `spawnSync`，当前调用链返回失败后在 catch/非零状态路径折叠为 `null`。
- **影响**：Windows 存量用户可能收不到升级提醒，且失败原因对调用方不可见。
- **证据**：`evidence/D1-39/stdout.log`
- **状态**：待提单

## #2【P1】D4-16 命令包裹穿透未拦截

- **现象**：安全策略探针对 `cmd /c hcloud ECS DeleteServer --server_id=x` 返回 `allow`。
- **断言**：发现 shell 包裹内层的 hcloud 删除命令并返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:384-443` 的 `classifyTextCommand()` 仅在文本以 hcloud 命令形式匹配时进入参数分类，`cmd /c` 前缀导致内层命令未进入 hcloud 分析。
- **证据**：`evidence/D4-security-rerun/stdout.json`

## #3【P0】D4-9 高危公网部署仅告警未拦截

- **现象**：`evaluateDeployPlan({action:"deploy", public:true, service:"FunctionGraph"})` 返回 `warn`。
- **断言**：公网暴露 FunctionGraph 的高危部署计划在执行前必须返回 `deny`。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:111-121` 的部署计划评估结果保留为 warn，未升级该高危组合为 deny。
- **证据**：`evidence/D4-security-rerun/stdout.json`

## #4【P1】D9-2 非法 tools/list 参数缺少 JSON-RPC 错误

- **现象**：向 `tools/list` 传入字符串参数时没有返回 `-32602` error 对象。
- **断言**：非法参数必须返回 JSON-RPC `-32602 Invalid params`。
- **根因**：`plugins/huaweicloud-core/src/mcp-protocol.mjs` 的请求分发未对 tools/list 参数类型执行协议层校验。
- **证据**：`evidence/D9-protocol-rerun/stdout.log`

## #5【SPEC-MISMATCH】D9-9 cancellation capability 未声明

- **现象**：initialize 返回的 capabilities 缺少 `notifications.cancellation=true`。
- **断言**：若用例要求取消语义，initialize capabilities 应声明 notifications.cancellation。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` initialize capabilities 未声明 cancellation capability。
- **证据**：`evidence/D9-protocol-rerun/stdout.log`

## #6【P1】EXP-E01~E05 路由评测 MISS

- **现象**：源码评测中 ECS 查询/创建、OBS 静态站、EIP、RDS 意图未命中期望服务。
- **断言**：对应自然语言意图应至少命中期望服务 ECS/OBS/EIP/RDS。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1900` 的 serviceCatalog 关键词匹配仅按空格分词，中文自然语言未命中英文关键词。
- **证据**：`evidence/D10-eval-rerun/stdout.log`

## #7【P1】EXP-E07~E08、EXP-E10~E14 路由评测 MISS

- **现象**：CBR、FunctionGraph、BSS、CES、ELB、IAM 等中文意图未命中期望服务；E08 诊断意图不进入 explain_error 路径。
- **断言**：每个评测意图应命中其期望服务或专用诊断工具路径。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1776-1900` 的 routeMap 依赖英文 token/关键词，中文意图覆盖不足且无诊断工具路由。
- **证据**：`evidence/D10-eval-rerun/stdout.log`
