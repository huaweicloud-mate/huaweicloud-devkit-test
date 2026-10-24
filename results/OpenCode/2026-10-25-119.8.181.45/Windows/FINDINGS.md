# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-10-25-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-25（北京时间）
> **被测版本**：huaweicloud-devkit 1.1.12

---

## #1【P0】D4-3 hook_check_command 未拦截 CLI 命令中的明文 adminPass

- **现象**：`huaweicloud_hook_check_command("hcloud ECS CreateServers --cli-region=cn-north-4 --Server.adminPass=MyPassword123! --Server.name=test")` 返回 `decision=allow, findings=[]`，未检测到明文密码。
- **断言**：hook_check_command 对含 `--Server.adminPass=<明文密码>` 的 hcloud CLI 命令应返回 `decision=warn` 或 `decision=deny`，规则 `hwc-command-adminpass-exposure` 应在命令级触发。
- **根因**：`plugins/huaweicloud-core/src/risk-rule-engine.mjs` 的 `evaluateCommandRisk()` 未扫描 CLI 参数值中的 `adminPass` 明文。`hwc-command-adminpass-exposure` 规则仅在 `evaluateArtifacts()`（IaC/制品级）中触发，未在命令级触发。
- **影响**：用户通过 hcloud CLI 传递明文 adminPass 不会收到安全警告，可能导致密码在日志/上下文中泄露。
- **证据**：`evidence/D4-3/stdout.log`
- **状态**：待提单

## #2【P1】EXP-E01 serviceCatalog 未命中 ECS 查询意图

- **现象**：eval harness 测试 `serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 返回 `"Run hcloud --help to list available services."` 而非 ECS 查询路由。期望路由=ECS查询→read。
- **断言**：serviceCatalog 对中文意图"帮我查一下我账号在华北北京四有哪些云主机"应命中 ECS 查询路由（`huawei-ecs` skill），返回 `ECS` 服务。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` 的 `serviceCatalog()` 路由逻辑对"查一下"+"云主机"组合意图未命中 ECS 路由。可能是关键词匹配未覆盖"查一下"+"云主机"的组合模式。
- **影响**：用户用自然语言查询 ECS 实例时，serviceCatalog 无法正确路由到 ECS 服务，用户体验下降。
- **证据**：`evidence/EXP-E01/stdout.log`，eval harness 结果 `eval/results/eval-run-20261024210657.csv`
- **状态**：待提单
