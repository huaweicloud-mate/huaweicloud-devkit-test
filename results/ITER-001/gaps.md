# ITER-001 缺口表（Gaps）

> 迭代：ITER-001 ｜ 目标：huaweicloud-devkit `dev` @ fa04732 ｜ 记录：2026-09-07

## P0（安全/中断级 —— 立即停测上报）

### P0-1 hook 风险规则漏覆盖 Nova 系列删除操作（写操作被 hook 误判 allow）

| 字段 | 内容 |
|---|---|
| 关联用例 | **D4-5（写操作误判检测）/ D4-4（审批门，hook 层）/ D4-16 对照** |
| 发现方式 | NR4 安全回归（hook_check_command 探测） |
| **dev 复现** | ✅ **在 dev 分支（1.1.1-next.14 / fa04732）规则引擎直调确认复现**——证据脚本 `evidence/p01-repro-dev.mjs`（`evaluateCommandRisk` 直调，与 hook_check_command 同引擎） |
| 现象 | 以下破坏性操作经规则引擎判定 **allow（NO-RULE）**：`NovaDeleteServer`（删单台 ECS）/ `NovaDeleteKeypair`（删密钥对）/ `NovaDeleteServerGroup`（删服务器组 Nova 系）/ `ResetServerPassword`（重置密码） |
| 对照证据 | `DeleteServers`（批量）→ warn（hwc-destructive-delete-operation）；`DeleteServerGroup`（非 Nova 系）→ warn；`bash -c "DeleteServers"` → warn（能识别内层）——**规则引擎正常，Nova 前缀族+ResetServerPassword 为规则覆盖盲区** |
| Node 层对照组 | `plan_cli_command(NovaDeleteServer)` → **deny / risk: write**（Node 策略层正确，审批门兜住） |
| P/G/I | **P**（插件承诺"执行前风险预检"但 rules 覆盖不全） |
| 严重度 | **P0 候选**（破坏性删除/密码重置在 hook 预检被放行；实际风险等级取决于 hook 是否为唯一防线——Node 层已兜底，建议上报时由维护者裁定 P0/P1） |
| 复现环境 | huaweicloud-devkit dev@02fa79b（本地源码直调；Hermes 插件 1.1.1-next.15）；规则文件在 fa04732→02fa79b 间未变更，结论保持 |
| 修复方向（建议） | `cloud-risk-rules.json` 的 `hwc-destructive-delete-operation` 规则扩充操作名清单：`NovaDeleteServer / NovaDeleteKeypair / NovaDeleteServerGroup / NovaDeleteServerMetadataItem / ResetServerPassword / DeleteServerPassword` 等破坏性操作族；规则引擎增加"操作名前缀族匹配"（Nova* / Reset* / Delete*）；补规则回归用例（D4-10） |

## P1

（待发现）

## P2

（待发现）

## 说明

- 退出标准：P0/P1 清零后本迭代方可关闭；P0-1 已同步 issue 稿（issues/issue-P0-1-hook-novadelete-盲区.md）