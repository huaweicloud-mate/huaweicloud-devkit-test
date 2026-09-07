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

### P0-2 → 重分类：preflight 测试失败 = Windows shim 兼容问题（G 类）✅ 产品逻辑审查通过

| 字段 | 内容 |
|---|---|
| 关联用例 | **D4-19（确认流下预检仍生效）**、D4-9（风险预检） |
| 来源 | T1 左移：`npm test` 两次运行一致失败 |
| 根因 | 测试 fake-hcloud 为 `#!/bin/bash` shim（test/issue-443-fix.test.mjs mkShim）；`hcloud-cli.mjs:73` 用 `spawnSync(hcloudBin, {shell:false})`——**Windows 结构上无法执行非 PE 文件** → `r.status!==0` → 无 rules → 无 findings → 断言失败 |
| **产品逻辑审查** | ✅ `preflightSecurityGroupCheck`（hcloud-cli.mjs:54-93）解析/查询/判定逻辑正确（ingress+0.0.0.0/0+22 → findings）；真实 MCP plan 调用表现一致（假 SG ID 无规则 → 空 findings，合理） |
| **新发现（流程缺口）** | 上游 **dev 分支 Actions 零运行**——这些测试从未在任何环境验证；Windows 不兼容被掩盖（CI 矩阵也确实跳过 Windows） |
| 定级修正 | **G 类（测试套件跨平台缺陷）**，非产品 P0。`P0-1`（hook 规则盲区，规则引擎直调复现）**维持 P0 候选不变**——两者是不同问题 |
| 处置 | ① 建议上游：测试 shim 改为平台无关（node/tsx 包装或条件跳过 Windows）；② 建议启用 dev 分支 CI；③ Linux 环境复跑确认全绿（待组 2 Linux 机到位） |

## P1

### T1-2/T1-3 auth 测试失败 = 同因 Windows shim 兼容问题（G 类）

- **失败用例**：`not ok 24`（auth sync OBS）/ `not ok 64`（auth_switch clear）
- **根因**：`FAKE_HCLOUD`（test/fixtures/fake-hcloud.mjs 包装的 shim）经 `HCLOUD_BIN` 注入，spawnSync shell:false 在 Windows 无法执行 → 与 P0-2 同因
- **处置**：同上（测试平台化 + Linux 复跑确认）；PR#498 新功能逻辑待 Linux 环境实测（R10 runtime 守卫/clear 语义）

> **上报状态（2026-09-07）**：P0-1 + 基建缺口 A/B 合并为 **issue #501**（huaweicloud/huaweicloud-devkit，open）——https://github.com/huaweicloud/huaweicloud-devkit/issues/501 ｜ 草稿：issues/issue-测试基建缺口-合并.md

## P2

### T1-1 hermes install skills 数量断言失败（疑似测试漂移）

- **失败用例**：`not ok 14 - hermes install creates skills, MCP server, and safety policy`（test/agent-install.test.mjs:263，`countSkills($home/.hermes/skills) >= 6` 断言失败）
- **初判**：Hermes CN Desktop 使用 `hermes-home` 目录（非 `~/.hermes`）；本机真实 `install --target hermes` 成功——**疑似测试断言目录约定过时（G 类测试侧），待核**（真实 Hermes 安装路径已确认 hermes-home，见本机验证）

### C1 Codex 插件安装未生效（已解决 2026-09-07；根因三重确认）

- **C1a（环境问题，已修复）**：本机 `~/.codex/config.toml` 由 **Codex Windows App 生成**（`%userprofile%` 未展开路径 + Windows 专属键），与 **codex-cli 0.153.4（npm CLI）**解析不兼容 → codex CLI 无法启动 → 插件命令全失败
  - **修复**：备份冲突配置 → 干净重装 → 插件可用
- **C1b（✅ 产品 bug 确认，P 类，跨平台必复现）**：`installCodex()`（setup-cli.mjs:651）硬编码 `pluginName='huaweicloud-core'`，但 marketplace 插件名来自 `.codex-plugin/plugin.json` 的 `"name": "huaweicloud-devkit"` → `codex plugin add "huaweicloud-core@huaweicloud-devkit"` **必然失败**（"plugin not found in marketplace"）且**失败静默**（仅处理 Access denied）→ 无条件打印成功提示
  - **实证**：手动 `codex plugin add "huaweicloud-devkit@huaweicloud-devkit"` → **installed, enabled 1.1.1-next.15** ✅；同时 `installCodex` 的 marketplace 添加路径正确（包根），仅插件名错配
  - **修复建议**：installCodex 改用 plugin.json 实际 name（读取 PACKAGE_ROOT/.codex-plugin/plugin.json 的 name 字段）或改为遍历 marketplace 后 add 插件实际名；并对 r1/r2 失败输出真实错误
- **C1c（产品 bug 小，P 类）**：`codexStatus()`（setup-cli.mjs:709-712）用 `codex plugin list` 输出**包含 'huaweicloud-core' 字符串**判断——而 plugin 安装路径含 `plugins/huaweicloud-core`（插件未 enabled 时路径也在输出中）→ **status 误报 Installed**（装没装都成立）
  - **修复建议**：解析 `codex plugin list` 的插件名列（如 huaweicloud-devkit@…）且状态为 installed/enabled 再判定
- **处置**：C1b/C1c 已追加评论至 issue #501（2026-09-07）

## 环境事件记录

### ENV-1 Hermes 重启后插件资产目录被清空（关联 D1-9 重启语义观察）

- **时间**：2026-09-07（用户重启 Hermes 后）
- **现象**：`hermes-home/huaweicloud-plugins/`、`plugins/` 目录整体消失 → MCP 工具（huaweicloud_devkit_*）在重启后会话中不可用
- **处置**：`npx huaweicloud-devkit@next install --target hermes` 重装恢复（版本 1.1.1-next.15，29 技能确认）
- **观察**：可能为 Hermes 应用启动时清理未注册插件目录，或应用更新所致——**暂记待观测**；每次 Hermes 重启后需自查插件目录存在性（可在 check-prereqs 脚本中加此项）
- **测试关联**：D1-9（重启生效语义）——"重启后可用"承诺在本环境出现例外，建议 D1-9 用例在全矩阵中关注重启后资产完整性

## 说明

- 退出标准：P0/P1 清零后本迭代方可关闭；P0-1 已同步 issue 稿（issues/issue-P0-1-hook-novadelete-盲区.md）