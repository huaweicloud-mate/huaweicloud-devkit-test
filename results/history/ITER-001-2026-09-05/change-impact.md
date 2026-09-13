# ITER-001-2026-09-05 变更影响分析（T0.5）

> 输入：`git diff main dev`（50 文件 +1698/−143）
> 输出：受影响用例集 + 本轮执行范围

## 变更点 → 用例映射

| # | 变更点 | 源码位置 | 影响用例（受影响集） | 新增用例 |
|---|---|---|---|---|
| 1 | 🆕 卸载全局清理（removeKooCli/removeObsConfig + --clean-kocli/--clean-obs/--clean-global） | `uninstall-cleanup.mjs`(新+50)、`setup-cli.mjs` | **D1-5**（禁止剪枝集）、D1-1 | D1-10/11/12/13 |
| 2 | 🔧 安装加固（copyFileVerified/checkForUpdate/next-latest） | `setup-cli.mjs`(+236) | D1-1、D1-4、D1-6、D7-4 | D1-14、D1-15 |
| 3 | 🛡️ issue-443 安全修复（confirm-not-deny + preflight） | `test/issue-443-fix.test.mjs`(新+171)、`tools.mjs` | **D4-4、D4-5（P0 基线）**、D4-9 | D4-18/19/20 |
| 4 | 📦 工具定义更新（voucher 描述、+105） | `tools.mjs` | **D5-3（枚举 diff）**、D9-1、D9-3、D3-A2 | —（既有用例回归） |
| 5 | 🔑 认证/凭证变更 | `credentials.mjs`(+29)、`agent-registration.mjs`(+4) | D2-1、D2-4、D2-6 | D2-8 |
| 6 | 📚 SKILL 更新（sandbox −8/voucher +15/core −49 重写/RDS +4/framework-commands +20/nginx-templates ±3） | `skills/` | **D3-A1**、D8-1、D8-4、**D10-2**、D10-3 | —（D10-2 激活率必测） |
| 7 | ⚙️ KooCLI 交互变更 | `hcloud-cli.mjs`(+89) | D3-B1、D3-B3 | — |
| 8 | 🧪 新增单测（uninstall-cleanup/cross-platform-install/dsh-adaptation/issue-443，+428） | `test/` | T1 自动化左移：跑通新增单测 | — |
| 9 | 低影响：session-manager(+4)/detect-framework(+2)/bump·pack·validate 脚本 | 多处 | D6-4、D3-B5、D4-12 | — |

## 本轮执行范围（NR4）

```
受影响集（上表映射的全部既有用例）+ 新增用例 10 条（D1-10~15/D2-8/D4-18~20）
+ 固定安全回归基线：P0 全量（11 条，含新 D4-18/19）
+ 冒烟 D3-C5
```

## 执行分层（§2.6，客户端=全矩阵）

| 层 | 执行策略 |
|---|---|
| 安装/适配层（D1 精简集 + D5-1~7 + 新 D1-10~13） | **全矩阵 10+ 客户端**：OpenCode/Codex/CodeArts×2/WorkBuddy/DSH/OfficeAce/Hermes/OpenClaw/AtomCode/通用MCP |
| 功能/安全/协议层（D2-8、D4-18~20、D3 受影响、D9） | 代表客户端（Hermes）+ hook-capable 与 非 hook 各 1 |
| Windows 专项（D1-13、D5-6、D7-3） | 本机（Windows 11） |
| D10 激活率/路由（SKILL 重写） | 评测集 15 条 × 代表 3 个 agent |

## 基线增量更新（2026-09-07 拉取 dev@02fa79b）

> 新增 PR #498「凭证一致化整改」（fa04732 → 02fa79b，28 文件 +2621/−65）：

| 变更点 | 源码位置 | 影响用例 | 处置 |
|---|---|---|---|
| 凭证一致化（reconcile / R7 current档 / R9 会话优先 / R10 runtime 守卫） | `src/auth/reconcile.mjs`(新)、`credentials.mjs`、`service.mjs`、`setup-cli.mjs`(+71)、`hcloud-cli.mjs` | **D2-1 auth init、D2-4 脱敏、D2-6 OBS、D2-8（新增回归）** | 本轮 D2 回归优先级 ↑；R10 runtime 守卫与凭证环境变量注入直接相关 |
| tools.mjs 再变更（+170） | `src/tools.mjs` | **D5-3 工具枚举（本轮需在 next.15 上重跑）**、D9-1 schema | 纳入 T2 客户端矩阵 |
| cli-and-auth SKILL 更新 | `skills/huaweicloud-cli-and-auth/SKILL.md` | D3-A1、D8-1、**D10-2 激活率** | D10 评测集补 cli-and-auth 任务 |
| 新增测试（reconcile.test +158 / cred-reconcile-e2e.test +449 / cross-platform +13） | `test/` | T1 左移：npm test 全量跑 | 与既有 428 行新测试合并执行 |
| 设计文档 | `docs/superpowers/plans/2026-09-05-credential-reconcile.md` | D8-1 文档一致性（计划 vs 实现） | 评审时对照 |

> ⚠️ 规则文件未变 → P0-1（hook 规则盲区）在本基线仍然成立，缺口等级维持。

## 已知阻塞/风险

- obsutil 未安装 → D2-6 相关回归延后至 T4（本轮受影响集含 D2-6 但以凭证/配置链路优先，obsutil 部分 BLOCKED 标注）
- KooCLI profile projectId/domainId 为空 → D3-B2 类命令完整性断言受影响（T0 补 profile）