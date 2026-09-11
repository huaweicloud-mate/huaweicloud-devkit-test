## 测试方复验：dev 分支 @0316e00（v1.1.3-next.4）——部分修复（P1 已修，P0 审批 token 仍存）

**判定：部分修复。** P0（审批 token 跨调用失效）未修，保持 open，不关单。

- 复验基线：官方仓 dev 分支最新 commit `0316e0076cbd6d1f435432d42fd5aef42d72cd23`（PR #621 合入后，GitHub API 实时态）；本地工作树源码核查。

**已修复 / 已缓解**：
- P1（0.0.0/0 无专项 finding）：`hwc-network-public-admin-port` deny 规则（deploy_plan/command/artifact 三阶段）已覆盖 0.0.0/0 + 管理/DB 端口；`huaweicloud_hook_check_deploy_plan` 已真实调用 `evaluateDeployPlan`（见 #562 复验）。
- P0 之一（BSS 询价缺 RDS/DCS 编码）：`skills/huawei-iac/references/resource-catalog.md:98` 已明确标注 RDS（CBC.6074）/DCS（CBC.6006）不可用 + 降级官网估算指引——文档层面已给出正确行为路径。

**未修复（P0）**：`src/hcloud-cli.mjs:17` `approvalStore` 仍为**模块级进程内 Map**（5min TTL），plan 与 run 落在不同进程（headless/子进程/独立 MCP 会话）时 Map 为空，`consumeApprovalToken` 返回 null → plan→approve→run 端到端仍不可达。

**建议**：P0 项（审批 token 跨进程）修复后复核关闭。