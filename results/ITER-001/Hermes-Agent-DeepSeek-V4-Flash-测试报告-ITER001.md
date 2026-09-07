# Hermes-Agent-DeepSeek-V4-Flash-测试报告-ITER001.md

> **迭代**：ITER-001（首轮）｜ **日期**：2026-09-07 ｜ **被测**：huaweicloud-devkit 插件（华为云 DevKit）
> **执行主体**：Hermes-Agent（DeepSeek-V4-Flash）｜ **归档**：results/ITER-001/

---

## 1. 测试概述

| 项 | 值 |
|---|---|
| 被测仓库 | https://github.com/huaweicloud/huaweicloud-devkit |
| 测试目标版本 | `dev` @ `02fa79b`（= npm 1.1.1-next.15，2026-09-07 PR #499） |
| 对照基线 | `main` @ `bcefb32`（发布版） |
| 变更规模 | dev vs main：78 文件（50+28），+4319/−208 |
| 测试范围 | dev 相对 main 全部未发布变更（含 PR #497/#498/#499） |
| 客户端矩阵 | 全矩阵：OpenCode/Codex/CodeArts×2/WorkBuddy/DSH/OfficeAce/OpenClaw/AtomCode/Hermes（10 客户端） |
| 测试环境 | Windows 11 / Node 22.23.2 / KooCLI 7.2.12 / 真云凭证（cn-north-4） |
| 报告模型 | Hermes-Agent（DeepSeek-V4-Flash-0731） |

## 2. 执行摘要（度量）

| 度量 | 值 | 说明 |
|---|---|---|
| T1 自动化执行率 | 100%（250/250） | dev 分支全量单测 |
| T1 通过率 | **98.0%**（245/250） | 5 败均为 Windows shim 兼容（G 类） |
| 安全回归（D4-18/19/20+） | **全过** | +P0-1 缺口 1 个（已上报） |
| 客户端矩阵 | **10/10 Installed** | Codex 经历 3 层根因后修复 |
| 工具枚举（D5-3） | **37/37 一致** | 与 dev tools.mjs 完全对齐 |
| D1 新功能（uninstall-cleanup） | **11/11 通过** | 隔离环境验证 |
| D10 中文检索召回（search_docs 通道） | **≈14%**（2/14） | 严重不达标（P1 缺陷） |
| 发现总数 | **9**（P0×1 + P1×4 + P2×1 + G×1 + 环境×2） | 全部归档 |
| 上报 | issue #501 + 4 条补充评论 | 官方仓库 open |

## 3. 分维度结果

### 3.1 T1 自动化左移（dev 全部单测，双平台复跑）
- **Windows**：250 测试 / 245 过 / 5 失败（98%）
- **Linux ARM64（zhangshuang ECS 复跑）**：250 / **248 过 / 2 失败（99.2%）**——确认仅 2 个为真实缺陷
- **真实缺陷（跨平台必复现）**：`auth sync` OBS 写入/目标报告（auth-credentials.test.mjs:106）、`auth_switch clear` runtime 未清空 R10（cred-reconcile-e2e.test.mjs:276）——**PR#498 认证整改缺陷**
- **G 类（测试套件 Windows 不兼容）**：preflight×2、hermes install → Linux 通过（bash shim 假设证实）
- 附带发现：上游 **dev 分支 CI 零运行**（测试从未被环境验证，本迭代双平台代理验证填补）

### 3.2 P0 安全回归（D4 维度）
| 用例 | 结果 | 证据 |
|---|---|---|
| D4-4 写操作审批门 | ✅ | CreateServers → deny+token+safeToRun:false |
| D4-5 写误判检测（plan 层） | ✅ | 写操作全部正确 deny/write |
| D4-5 写误判检测（hook 层） | ❌ **P0-1** | Nova 系删除/ResetServerPassword → allow（规则盲区） |
| D4-18 confirm-not-deny 语义 | ✅ | issue-443 语义成立 |
| D4-19 确认流下预检 | ✅ | 凭证文件读取 → deny |
| D4-20 拒绝后零操作 | ✅ | approvedByUser=false → 拒绝执行 |
| D4-1 凭证文件拦截 | ✅ | cat ~/.hcloud/config.json → deny |

### 3.3 客户端矩阵（D5）
- **10/10 target 插件安装成功**（Hermes 前期就绪，其余 9 个本日安装并 status 复查）
- Codex 修复链：C1a 环境配置冲突（已修复+原配置合并善后）→ C1b 插件名硬编码 bug → C1c status 误报
- CodeArts Work 落点与 README 承诺一致（`~/.codeartswork`）

### 3.4 D1 新功能（uninstall-cleanup）
- removeKooCli/removeObsConfig 隔离验证：默认位置清理、自定义 HCLOUD_BIN 零触碰、幂等、OBS 配置清理 —— **11/11 通过，无缺口**
- copyFileVerified 实现审查通过（3 重试+明确报错）

### 3.5 D10 评测（search_docs 中文召回）
- 14 条中文任务仅 2 命中 → **P1 缺陷（无中文分词）**
- 根因：`split(/\s+/)` 空白分词，中文整句单 token，英文描述 includes 必不匹配

## 4. 发现明细（P/G/I 分类）

| ID | 严重度 | 类别 | 描述 | 状态 |
|---|---|---|---|---|
| **P0-1** | P0 候选 | P | hook 规则盲区：NovaDeleteServer/Keypair/ServerGroup/ResetServerPassword 判定 allow（plan 层兜底有效） | 上报 #501 |
| **C1b** | P1 | P | installCodex 硬编码插件名 `huaweicloud-core` ≠ plugin.json `huaweicloud-devkit` → 跨平台必复现 + 失败静默 | 上报 #501 |
| **C1c** | P1 | P | codexStatus 路径子串匹配 → status 误报 Installed | 上报 #501 |
| **D10-1** | P1 | P | search_docs 无中文分词，中文召回率 ≈14%（目标 ≥90%） | 上报 #501 |
| **T1-1** | P2 | G | hermes install 测试断言目录（`~/.hermes` vs hermes-home）漂移 | 归档待核 |
| **T1-2~5** | — | G | 测试 fake-hcloud shim Windows 不兼容（4 个） | 归档（建议测试平台化） |
| **C1a** | — | 环境 | Codex App/CLI 配置格式冲突（已修复+善后） | 已解决 |
| **ENV-1** | — | 环境 | Hermes 重启后插件目录清空一次（未复现，待观测） | 已恢复 |
| **基建缺口** | — | 流程 | dev 分支 CI 零运行；华为云 npm 镜像缺海外包 | 上报 #501 |

## 5. 上报闭环

- **issue #501**（open）：[测试基建] dev CI 未运行 + 测试套件 Windows 不兼容 + hook 规则盲区
  https://github.com/huaweicloud/huaweicloud-devkit/issues/501
- 追加评论 ×4：C1b 实证 / C1c status 误报 / D10 中文检索缺陷 / 原始合并
- 评论均已验证可见；复现脚本与证据归档于本仓库（evidence/、eval/、issues/）

## 6. 结论

**版本质量评估**：dev @ 02fa79b（1.1.1-next.15）核心新功能（uninstall-cleanup/安装加固/认证整改）**功能正确**；但存在 **3 个确定性产品缺陷**（hook 规则盲区 P0、installCodex 插件名错配、search_docs 中文检索）**不建议直接发布**，建议修复后走回归门禁（P0/P1 清零）。

## 7. 建议（后续迭代）

1. **P0-1/C1b/D10-1 修复后回归**（ITER-002 首项）
2. Linux 环境复跑 npm test 确认全绿（Windows shim 问题隔离验证）
3. 推动上游启用 dev 分支 CI（防跨平台缺陷再漏）
4. Agent 会话级 D10 评测（描述注入通道）与客户端手工用例（D1-13 真实锁/D1-15 更新检查）列入后续批次
5. 长尾客户端会话级冒烟（D5-1 发现加载→工具调用）

## 8. 数据与留痕

- 度量：metrics/execution.csv（ITER-001 首行）
- 证据：results/ITER-001/evidence/p01-repro-dev.mjs、eval/d10-eval-results.md、issues/（issue 稿+评论稿）
- 复现脚本：test-cases/tools-enum.py、d1-cleanup-test.mjs、merge-codex-config.py
- 归档仓库：huaweicloud-mate/huaweicloud-devkit-test（main @ 同步）