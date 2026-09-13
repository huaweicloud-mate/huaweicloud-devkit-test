# ITER-001-2026-09-05 安全审计（D4 安全回归 · dev@02fa79b / next.15）

> 执行：2026-09-07 ｜ 客户端：Hermes（MCP 工具 = huaweicloud-devkit 1.1.1-next.15）｜ 结论：**PASS（带 1 个已上报 P0 缺口）**

## 审计项结果

| 核查项 | 用例 | 结果 | 证据 |
|---|---|---|---|
| 写操作审批门 | D4-4 | ✅ | CreateServers → deny + approvalToken + safeToRun:false |
| 写操作误判检测（plan 层） | D4-5 | ✅ | NovaDeleteServer/DeleteServers/CreateServers 全部正确 deny/write |
| 写操作误判检测（hook 层） | D4-5 | ❌ **P0-1** | NovaDeleteServer/Keypair/ServerGroup/ResetServerPassword → allow（已上报 issue #501） |
| confirm-not-deny 审批语义 | D4-18 | ✅ | plan → deny + token；issue-443 语义（确认而非直接拒绝/放行）成立 |
| 确认流下预检仍生效 | D4-19 | ✅ | 凭证文件读取（cat ~/.hcloud/config.json）→ deny（hwc-command-credential-file） |
| 拒绝后零操作 | D4-20 | ✅ | run_approved_command approvedByUser=false → 拒绝（"must be true after explicit user approval"） |
| 凭证文件读取拦截 | D4-1 | ✅ | deny |
| 规则覆盖对照 | D4-10 | ⚠️ | destructive 规则漏 Nova*/ResetServerPassword（P0-1）；credential 规则覆盖完好 |

## 结论

- **P0 事件数**：1（P0-1 hook 规则盲区——已提 issue #501，Node 层兜底有效）
- **误杀判定**：只读命令（NovaListServers）正确 allow——无误杀
- **斜坡项**：hook 层 destructive 规则覆盖待上游修复后重测（D4-5 续号回归）
- **审计记录**：本报告 + evidence/p01-repro-dev.mjs（复现脚本）