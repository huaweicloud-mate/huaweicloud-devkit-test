# FINDINGS — 缺陷发现清单（OfficeAce-glm-5.2）

> **落盘路径**：`results/OfficeAce/2026-10-14-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-14 09:45:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

---

## #1【P0】D2-4 凭证脱敏正确性

- **现象**：对包含 SK 的 JSON 凭证字符串调用 redactSecrets 后，SK 明文仍存在于输出中
- **断言**：redactSecrets('{"ak":"AKID...","sk":"SKTEST..."}') 输出不含原始 SK 字符串
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:redactSecrets` + JSON 字符串中 SK 未被正则匹配覆盖
- **影响**：凭证泄漏风险，日志/错误输出中可能暴露 SK 明文
- **证据**：`evidence/d2-auth/stdout.log（D2-4 redact-json 测试项）`
- **状态**：待提单

## #2【P0】D4-16 命令包裹穿透

- **现象**：MCP wrap 调用未被安全策略阻止，命令穿透到底层执行
- **断言**：callTool('wrap-mcp', ...) 返回 blocked/rejected 而非执行结果
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:classifyTextCommand` + wrap 类命令未列入拦截规则
- **影响**：安全绕过风险，攻击者可通过 MCP wrap 穿透命令执行限制
- **证据**：`evidence/mcp-tools/stdout.log（D4-16 wrap-mcp 测试项）`
- **状态**：待提单

## #3【P1】D4-27 双路径输出脱敏

- **现象**：命令输出经双路径（stdout+stderr 或双重管道）时，脱敏仅覆盖单路径，另一路径残留敏感信息
- **断言**：双路径输出均不含原始凭证/密钥字符串
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:redactSecrets` + 仅对 stdout 脱敏，stderr 路径未覆盖
- **证据**：`evidence/d2-auth/stdout.log（D4-27 redact-dual 测试项）`
- **状态**：待提单

## #4【P2】D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证

- **现象**：沙箱 HDKit 服务参数传递时 hwlink 凭证字段处理异常
- **断言**：沙箱连接返回有效 session_id 且 hwlink 凭证正确传递
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:callTool` + sandbox_connect 工具参数校验缺失
- **证据**：`evidence/D3-C14/stdout.log`
- **状态**：待提单

## #5【P2】D8-9 安装 ID 与遥测值脱敏

- **现象**：安装 ID 和遥测数据中包含未脱敏的敏感值
- **断言**：遥测输出中 installId/metrics 字段均经过脱敏处理
- **根因**：`plugins/huaweicloud-core/src/telemetry.mjs` + 安装 ID 生成/上报未经过 redactSecrets
- **证据**：`evidence/D8-9/stdout.log`
- **状态**：待提单

## #6【P1】EXP-E01~E05,E07,E10~E14 serviceCatalog 路由 MISS

- **现象**：huaweicloud_service_catalog 对 11 条中文意图评测集路由未命中（MISS），基线 21.4% MISS
- **断言**：serviceCatalog 对评测集 EXP-E01~E15 的路由命中率应 ≥ 80%
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:serviceCatalog` + 中文意图→服务映射表覆盖不全，11/15 条意图未路由到正确华为云服务
- **影响**：用户中文自然语言意图无法正确路由到对应华为云服务，影响 Agent 交互体验
- **证据**：`evidence/c4-service-matrix/stdout.log（EXP-E01~E15 eval-route 测试项）`
- **状态**：待提单
