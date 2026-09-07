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

### P0-2 preflight 安全组预检失效（issue-443 B1+B2 修复测试自身失败）

| 字段 | 内容 |
|---|---|
| 关联用例 | **D4-19（确认流下预检仍生效）**、D4-9（风险预检） |
| 来源 | T1 左移：`npm test` 两次运行一致失败 |
| 失败用例 | `not ok 140 - preflightSecurityGroupCheck catches dangerous SG via --server.security_groups.N.id (B1+B2 fix)` / `not ok 142 - ... --security_group_id (backward compatible)`（test/issue-443-fix.test.mjs:15,121） |
| 现象 | fake-hcloud 返回危险规则（ingress 0.0.0.0/0:22）→ `planHcloudCommand` **未产生 sg findings**（"B1+B2 fix: should have sg findings"） |
| 初判 | issue-443 双修复（B1 confirm-not-deny / B2 preflight-b1b2）的 **preflight 部分未达预期**，或 v1.1.1-next.15 引入回归；与 P0-1（hook 规则盲区）同属安全链不完整 |
| P/G/I | **P**（插件 own 测试揭示安全预检未生效） |
| 严重度 | **P0 候选**（高危安全组可被放行；需人工复核根因后定级） |
| 修复方向 | 复核 `hcloud-cli.mjs` preflightSecurityGroupCheck 对 `--server.security_groups.N.id` 与旧格式 `--security_group_id` 的解析；对照 docs/superpowers/plans/2026-09-05-credential-reconcile.md 与 fix/issue-443-preflight-b1b2 分支 |

## P1

### T1-2 auth sync 写 OBS + agent 注册目标报告失败（PR#498 新功能测试失败）

- **失败用例**：`not ok 24 - auth sync writes OBS and reports all agent registration targets`（test/auth-credentials.test.mjs:106，`false !== true`）
- **关联**：D2-3（auth sync 幂等）、D2-1、D5（agent 注册矩阵）
- **初判**：PR#498 凭证整改的新功能测试失败——sync 写 OBS 或注册目标枚举未达预期；需复核 `src/auth/service.mjs`/`credentials.mjs`（P 类候选）

### T1-3 auth_switch clear 未清空 runtime（PR#498 新功能测试失败）

- **失败用例**：`not ok 64 - 11 auth_switch clear empties runtime and lets syncAuth run again`（test/cred-reconcile-e2e.test.mjs:276，`false !== true`）
- **关联**：D2（认证切换纪律）、R10 runtime 守卫
- **初判**：clear 后 runtime 残留或 syncAuth 拒绝再跑——PR#498 R10 逻辑未达预期（P 类候选）

## P2

### T1-1 hermes install skills 数量断言失败（疑似测试漂移）

- **失败用例**：`not ok 14 - hermes install creates skills, MCP server, and safety policy`（test/agent-install.test.mjs:263，`countSkills($home/.hermes/skills) >= 6` 断言失败）
- **初判**：Hermes CN Desktop 使用 `hermes-home` 目录（非 `~/.hermes`）；本机真实 `install --target hermes` 成功——**疑似测试断言目录约定过时（G 类测试侧），待核**（真实 Hermes 安装路径已确认 hermes-home，见本机验证）

## 说明

- 退出标准：P0/P1 清零后本迭代方可关闭；P0-1 已同步 issue 稿（issues/issue-P0-1-hook-novadelete-盲区.md）