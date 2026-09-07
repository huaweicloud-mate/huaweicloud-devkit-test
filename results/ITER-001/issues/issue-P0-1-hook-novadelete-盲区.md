# [P0] hook 风险规则漏覆盖 Nova 系列删除操作（hook 预检放行单台 ECS 删除）

## 环境

- 客户端：MCP 工具 `huaweicloud_hook_check_command`
- OS / Node：Windows 11 / Node 22
- 插件版本：huaweicloud-devkit `dev` 分支 @ `fa04732`（2026-09-05 PR #497）
- hcloud (KooCLI)：7.2.12

## 复现步骤

1. 调用 `hook_check_command`，命令：`hcloud ECS NovaDeleteServer --server_id=x`
2. 观察判定结果

**实际输出**：

```json
{"ok": true, "decision": "allow", "findings": [], "nextStep": "No Huawei Cloud hook risk rule matched."}
```

同族命令复现：

```json
// hcloud ECS NovaDeleteKeypair --keypair_name=test
{"ok": true, "decision": "allow", "findings": []}
```

**dev 分支（1.1.1-next.14 / fa04732）规则引擎直调确认复现**（`evidence/p01-repro-dev.mjs`，与 hook_check_command 同引擎）：

```
--- ALLOW --- | 删除单台ECS(Nova)        hcloud ECS NovaDeleteServer --server_id=x        -> decision=allow rules=[NO-RULE]
--- ALLOW --- | 删除密钥对(Nova)          hcloud ECS NovaDeleteKeypair --keypair_name=test  -> decision=allow rules=[NO-RULE]
--- ALLOW --- | 删除云服务器组(Nova)      hcloud ECS NovaDeleteServerGroup --server_group_id=g -> decision=allow rules=[NO-RULE]
--- ALLOW --- | 重置密码                  hcloud ECS ResetServerPassword --server_id=x ...   -> decision=allow rules=[NO-RULE]
PASS(拦截)    | 删除云服务器组            hcloud ECS DeleteServerGroup ...                   -> decision=warn rules=[hwc-destructive-delete-operation]
PASS(拦截)    | 批量删除(对照组)          hcloud ECS DeleteServers --server_ids=test1        -> decision=warn rules=[hwc-destructive-delete-operation]
PASS          | 只读查询(对照组)          hcloud ECS NovaListServers --limit=1               -> decision=allow（正确不拦截）
```

## 期望结果

删除/密码重置类（破坏性）操作的 hook 预检应命中风险规则并返回 warn/deny。对照组（证明规则存在但未覆盖 Nova 系与 ResetServerPassword）：

```json
// hcloud ECS DeleteServers --server_ids=test1  →  warn（hwc-destructive-delete-operation）
// hcloud ECS DeleteServerGroup ...             →  warn（同规则）
// hcloud ECS DeleteServers（bash -c 包裹）     →  warn（能识别内层命令）
// hcloud ECS CreateServers ...                 →  warn（hwc-cost-unbounded-scale）
```

## 实际结果

`NovaDeleteServer` / `NovaDeleteKeypair` 在 hook 预检返回 **allow**——**删除单台 ECS 的破坏性操作在 hook 层被当作无风险放行**。对照可见 `hwc-destructive-delete-operation` 规则漏匹配 Nova 系列操作名（非包裹绕过，裸命令即复现）。

补充：**Node 策略层（plan_cli_command）对该命令正确返回 deny/write+审批门**——第一道防线有效，缺口在 L4 Python hook 规则集（hook-capable 客户端上"执行前拦截"失效）。

## P/G/I 标注

- [x] **P**：插件承诺"执行前风险预检/拦截破坏性操作"，但规则集覆盖不全

## 严重度

- [x] **P0 候选**：破坏性删除操作在 hook 预检被放行（若 hook 为唯一防线则 P0；Node 层已兜底，建议维护者裁定，最低 P1）

## 建议修复方向

1. `cloud-risk-rules.json` 的 `hwc-destructive-delete-operation` 规则扩充操作名：`NovaDeleteServer`、`NovaDeleteKeypair`、`NovaDeleteServerGroup`、`NovaDeleteServerMetadataItem`、`DeleteServerPassword`、`ResetServerPassword` 等
2. 补规则回归用例（测试体系 D4-10）：扩规则后重跑本复现组（Nova 系删除 × 裸命令/包裹变体）
3. 建议 rules 引擎增加"操作名变体归一化"（Nova*/ 前缀族）防止同类盲区

## 发现者

ITER-001 安全回归（测试体系 §D4-5/D4-16 用例，2026-09-07）