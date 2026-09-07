# ITER-001 缺口表（Gaps）

> 迭代：ITER-001 ｜ 目标：huaweicloud-devkit `dev` @ fa04732 ｜ 记录：2026-09-07

## P0（安全/中断级 —— 立即停测上报）

### P0-1 hook 风险规则漏覆盖 Nova 系列删除操作（写操作被 hook 误判 allow）

| 字段 | 内容 |
|---|---|
| 关联用例 | **D4-5（写操作误判检测）/ D4-4（审批门，hook 层）/ D4-16 对照** |
| 发现方式 | NR4 安全回归（hook_check_command 探测） |
| 现象 | `hcloud ECS NovaDeleteServer --server_id=x` 与 `NovaDeleteKeypair` 经 **hook_check_command** 判定 **allow（"No Huawei Cloud hook risk rule matched"）** |
| 对照证据 | `DeleteServers`（批量）→ warn（hwc-destructive-delete-operation）；`CreateServers` → warn（cost）；`bash -c "DeleteServers"` → warn（能识别内层）——**证明是规则覆盖盲区，非包裹绕过** |
| Node 层对照组 | `plan_cli_command(NovaDeleteServer)` → **deny / risk: write**（Node 策略层正确，审批门兜住） |
| P/G/I | **P**（插件承诺"执行前风险预检"但 hook 规则集不全） |
| 严重度 | **P0 候选**（破坏性删除操作在 hook 预检被放行；实际风险等级取决于 hook 是否为唯一防线——Node 层已兜底，建议上报时由维护者裁定 P0/P1） |
| 复现环境 | huaweicloud-devkit dev@fa04732；MCP hook_check_command；hcloud 7.2.12 |
| 修复方向（建议） | `cloud-risk-rules.json` 的 `hwc-destructive-delete-operation` 规则扩充操作名清单：`NovaDeleteServer / NovaDeleteKeypair / NovaDeleteServerGroup / NovaDeleteServerMetadataItem / DeleteServerPassword / ResetServerPassword` 等同族破坏性操作；并补规则回归用例（D4-10） |

## P1

（待发现）

## P2

（待发现）

## 说明

- 退出标准：P0/P1 清零后本迭代方可关闭；P0-1 已同步 issue 稿（issues/issue-P0-1-hook-novadelete-盲区.md）