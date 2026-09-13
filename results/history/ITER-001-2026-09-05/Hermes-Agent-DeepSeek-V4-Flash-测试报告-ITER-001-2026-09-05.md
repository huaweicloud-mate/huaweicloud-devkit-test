# Hermes-Agent-DeepSeek-V4-Flash-测试报告-ITER-001-2026-09-05.md

> **迭代**：ITER-001-2026-09-05（首轮·全量）｜ **日期**：2026-09-07 ｜ **被测**：huaweicloud-devkit 插件（华为云 DevKit）
> **执行主体**：Hermes-Agent（DeepSeek-V4-Flash-0731）｜ **归档**：results/ITER-001-2026-09-05/（含全部证据/脚本/metrics，推送 20+ commits）

---

## 1. 测试概述

| 项 | 值 |
|---|---|
| 被测仓库 | https://github.com/huaweicloud/huaweicloud-devkit |
| 测试目标版本 | `dev` @ `74b9642`（= npm 1.1.1-next.16，2026-09-07，PR #506）→ 本机 Hermes 插件已升级 next.16 |
| 对照基线 | `main` @ `bcefb32`（发布版）；中间基线 02fa79b（next.15） |
| 变更规模 | next.15→next.16 增量：86 commits / 40 文件 / +2978−76（PR #500~506） |
| 测试范围 | dev 全部未发布变更 + 开发方案《AK/SK 架构 v4》+ 开发手测说明《卸载/更新/版本查询》《huawei-iac 手测》 |
| 客户端矩阵 | 10 客户端：OpenCode/Codex/CodeArts×2/WorkBuddy/DSH/OfficeAce/OpenClaw/AtomCode/Hermes |
| 测试环境 | Windows 10 / Node 22.23.2 / KooCLI 7.2.12（authEncrypt）+ **Linux ARM64 真机（zhangshuang ECS）** + 真云 cn-north-4 |
| 设计级用例 | **114 条**（CSV 真源；AK/SK 方案 v4 的 D2-9~20 共 12 条已于 2026-09-08 补入矩阵，合计 221） |
| 执行覆盖 | **~75 条（~60%）**，全部集中在安全/新功能/真云等高价值区 |

## 2. 执行摘要（度量）

| 度量 | 值 | 说明 |
|---|---|---|
| T1 自动化执行率 | 100% 双平台（Win 250 + Linux ARM64 250） | dev 全量单测代理执行 |
| T1 通过率 | Win **98.0%**（245/250）｜ Linux **99.2%**（248/250） | 差集全部为测试 mock 敏感性（G 类，真云实测功能正常） |
| 安全回归（D4） | 全过 + **P0-1 缺口** | D4-1/4/5/18/19/20 全通过；hook 规则盲区 4 操作 |
| 客户端矩阵 | 10/10 Installed；**跨客户端协议 37/37×3** | atomcode/opencode/codearts MCP server 协议一致 |
| D1 新功能全链 | 25 条 ~22 执行全过 | version/uninstall/update + 卸载清理函数 11/11 |
| 认证方案 v4 | **12 用例 11 过 + 1 观察** | R2/R3/R4/R5/R7/R9/R10 全绿 + **2 个新缺陷（AK-FP-1/2）** |
| 真云 E2E | D3-C1 ECS 全生命周期 PASS | VPC→Subnet→ECS→销毁→归零（≈0.01 元，零泄漏） |
| huawei-iac 手测 | **37 PASS / 0 FAIL / 2 PARTIAL / 15 BLOCKED** | 真实 OBS+FG 部署销毁闭环 |
| D10 中文检索召回 | ≈14%（2/14） | P1 缺陷（无中文分词） |
| 发现总数 | **15**（P0×1 + P1×4 + P2×3 + G×5 + 环境×2） | 全部归档；8 条 #501 评论闭环 |
| 上报 | issue #501（open）+ **8 条评论**（3 条纠正） | 官方仓库 |

## 3. 分维度结果

### 3.1 T1 自动化左移（dev 全量单测，双平台复跑）
- Win 245/250 ｜ **Linux ARM64（zhangshuang）248/250**——跨平台差异定位
- **重要纠正（真云实测）**：T1-2（auth sync）/T1-3（auth_switch clear）**真云功能正常**——失败为 FAKE_HCLOUD mock 环境敏感性（G 类），非产品缺陷；两轮误判（先 shim、后 P 类）最终纠正
- G 类确认：preflight×2/hermes install 为 Windows 环境问题（Linux 通过）
- 附带发现：dev 分支 **CI 零运行**（上游从未验证测试）

### 3.2 P0 安全回归（D4）
| 用例 | 结果 | 证据 |
|---|---|---|
| D4-4/5 审批门+写误判 | ✅ | 写操作全部 plan→deny+token |
| D4-5（hook 层） | ❌ **P0-1** | Nova 系删除/ResetServerPassword → allow（**next.16 复跑确认仍在**） |
| D4-18/19/20 审批语义 | ✅ | confirm-not-deny / 预检 / 拒绝零操作 |
| D4-1 凭证拦截 | ✅ | cat ~/.hcloud/config.json → deny |
| **D4-10 规则回归** | ✅ 4/4 | 15 规则清单导出；destructive/端口/凭证/成本全命中 |
| **D3-B2 plan 分类** | ✅ **20/20** | 8 服务只读→allow/写→deny 零误分类 |

### 3.3 客户端矩阵（D5）+ 跨客户端
- 10/10 安装落位；Codex 修复链 C1a/C1b/C1c（已上报）
- **跨客户端协议层 3/3**：atomcode/opencode/codearts 插件 MCP server 均 37 工具 schema 完整（d9-multi-agent-probe.mjs）
- workbuddy 存在真实审批记录（4 条=跨客户端调用证据）；atomcode mcp.json 完整注册（env 无明文密钥）
- 遗留：会话级真实调用仅 Hermes（其余需 API key/登录/桌面）

### 3.4 D1 生命周期全链（含开发说明覆盖）
- uninstall-cleanup 函数层 **11/11**；CLI 层 D1-19~22 **4/4**（flag 组合/单 agent 语义与开发说明逐字一致）
- version D1-16~18 **3/3**（含全空提示 Linux 实测）；更新检测 D1-23/25 ✅（D1-24 非阻塞实测）
- **D1-16b 观察**：Codex version 不列出（Codex Desktop 未装，按用户指示忽略，ENV-2 记录）

### 3.5 D10 评测
- search_docs 中文召回 ≈14%（P1，无中文分词）；英文/结构检索正常；D9 协议层 37 工具零缺失

### 3.6 D3-C 真云 E2E（ECS 生命周期）
- P1~P3 前置 → VPC→Subnet→ECS（c6.large.2 按需）→ 查询（BUILD）→ 销毁（--delete_publicip --delete_volume）→ 子网/VPC 删除 → **复核归零**
- 3 个真实陷阱（Ecs.0005 架构不匹配/Ecs.0044 磁盘售罄/DeleteServers 参数名）逐一命中技能预警；费用 ≈0.01 元

### 3.7 huawei-iac 手测（开发测试说明执行）
- **37 PASS / 0 FAIL / 2 PARTIAL / 15 BLOCKED**（5B/5C/6B/6C 需人工领券+保证金）
- **阻塞原因（15 BLOCKED）**：5B/5C（部署成本/账单验证）与 6B/6C（计费核对）4 小节全部因「人工领券 + 保证金」前置阻塞——测试账号现金仅 1 元，被 huawei-iac 成本关卡拦下（技能"余额不足不能续跑"）且无法真实触发计费（EIP 计费码用官网估算替代）；**属账号资金门槛，非插件缺陷**，成本关卡本身工作正常。代金券/保证金就绪后可补（ITER-003）。metrics 口径：execution.csv 记 17 = 15 BLOCKED + 2 PARTIAL 合并口径（详见 manual/huawei-iac-手测报告.md 二·B 节）
- 真实资源闭环：OBS 桶/对象 + FunctionGraph 函数（FSS.1006 修复一次）创建→验收（HTTP 200）→反序销毁→复核无残留
- 4A 安全拦截（0.0.0.0/0+22→deny）、4B 余额话术顺序、5A/6A 架构咨询（RDS+Redis 非可选件）全过

### 3.8 认证方案 v4（NR2 落地，D2-9~20）
- **12 用例：11 验证通过 / 1 观察**（D2-20 HUAWEICLOUD_HOME 需真机场景已实测但有发现）
- 规则全绿：R2（仲裁 needs_confirmation+confirm s1 闭环）/ R3（token 拒绝）/ R4（mtime 漂移）/ R5（命名档）/ R7（current 跟随）/ R9（configuredBySession）/ R10（runtime 抑制 sync）
- **2 个新缺陷（真机实证）**：**AK-FP-1**（authEncrypt 环境 S2 指纹恒假不一致，P 类）、**AK-FP-2**（HUAWEICLOUD_HOME 场景 S2 被漏检，P2）——均为方案自带待测点（T1/T2）未覆盖的真实路径

### 3.9 批量补测与弹性
- D6-4 并发 4/4、D2-5 temporary 轮换 ✅、D2-16 import 文件擦除 ✅、D2-17 非 TTY 守卫 ✅（2.3s 退出不 hang）、D4-13/D8-1 抽样 ✅

### 3.10 D2 认证回归（真云）
- auth init 幂等/status 三端/reconcile 指纹检测/sync 真云 PASS（否决 T1 mock 失败）/脱敏/clear 回退全链正常

## 4. 发现明细（P/G/I 分类）—— 终版

| ID | 严重度 | 类别 | 描述 | 状态 |
|---|---|---|---|---|
| **P0-1** | P0 候选 | P | hook 规则盲区：Nova 系删除/Keypair/ServerGroup/ResetServerPassword → allow（**next.16 复跑确认**） | 上报 #501 |
| **C1b** | P1 | P | installCodex 硬编码插件名 `huaweicloud-core` ≠ `huaweicloud-devkit` | 上报 #501 |
| **C1c** | P1 | P | codexStatus 路径子串匹配 → status 误报 | 上报 #501 |
| **D10-1** | P1 | P | search_docs 无中文分词，召回率 ≈14% | 上报 #501 |
| **AK-FP-1** | P1 候选 | P | **authEncrypt 环境 S2 指纹恒假不一致**（文件直读密文 → 指纹必不匹配 → status 恒告警 + sync 无效循环） | 上报 #501 |
| **AK-FP-2** | P2 候选 | P | **HUAWEICLOUD_HOME 场景 S2 被漏检**（readKooCliProfiles 用 baseHome 定位，与 KooCLI 固定 ~/.hcloud 冲突；Windows/Linux 双机实证） | 上报 #501 |
| T1-1 | P2 | G | hermes install 测试断言目录漂移 | 归档 |
| T1-2/T1-3 | — | G（纠正后） | auth sync/switch clear 测试 mock 敏感性——**真云功能正常**（两轮误判已纠正） | 归档+纠正评论 |
| T1-4~5 | — | G | preflight fake-hcloud shim Windows 不兼容 | 归档 |
| C1a | — | 环境 | Codex 配置格式冲突（已修复善后） | 已解决 |
| ENV-1 | — | 环境 | Hermes 重启插件目录清空一次 | 已恢复 |
| ENV-2 | — | 环境 | Codex Desktop 未装（version 不列 Codex 观察项） | 记录 |
| 基建缺口 | — | 流程 | dev CI 零运行；npm 镜像缺海外包 | 上报 #501 |

## 5. 上报闭环

- **issue #501**（open）：[测试基建] dev CI 未运行 + 测试套件兼容性 + hook 规则盲区
  https://github.com/huaweicloud/huaweicloud-devkit/issues/501
- **评论 ×8**：C1b / C1c / D10-1 / 原始合并 / T1-2·3 纠正（Linux 复跑） / T1-2·3 最终纠正（真云 PASS，mock 敏感性） / AK-FP-1 / AK-FP-2
- 全部证据/复现脚本/评审稿归档本仓库（evidence/ eval/ issues/ tests/ results/）

## 6. 结论（终版）

**版本质量评估**：dev @ 74b9642（next.16）核心功能（uninstall/version/更新检测/认证整改 R1-R10/web-port 规则修复）**经真云与双平台实测功能正确**；但存在 **6 个确定性缺陷**（P0-1 hook 盲区、C1b、D10-1、AK-FP-1、C1c、AK-FP-2 按序）**不建议直接发布**，建议修复后走回归门禁（P0/P1 清零，AK-FP-2 可随下版）。

**跨平台结论**：T1 差集全部为测试环境/mock 问题（非产品）；上游 dev CI 零运行是根因——强烈建议启用。

## 7. 建议（后续迭代）

1. P0-1/C1b/D10-1 + AK-FP-1/2 修复后回归（ITER-002 首项）；**AK-FP 建议提交开发评审**（方案 T1/T2 待测点盲区）
2. 上游启用 dev CI（双平台跑测试）；npm 镜像补海外包
3. D5 使用维度跨客户端会话级冒烟（OpenCode 配 key / 桌面客户端人工清单已备）
4. D4-10 剩余 11 条规则补正/负样例；D10 会话级评测；obsutil 端到端（官网恢复后）
5. macOS 兼容（D7-4）；RDS 真云（预算允许）；供应链审计（D4-12）

## 8. 数据与留痕

- 度量：metrics/execution.csv（ITER-001-2026-09-05 多行：Win/Linux/手测）
- 证据：results/ITER-001-2026-09-05/ 下 baseline/change-impact/gaps/手测报告/真云E2E/AAKSK方案/跨客户端矩阵/批量补测/next16 回归 等 15 个文档
- 复现脚本：test-cases/ 下 20+ 脚本（tools-enum/d1-cleanup/d2-reconcile/d9-multi-agent-probe/webport-regression/p01-repro/remote-* 等）
- 归档仓库：huaweicloud-mate/huaweicloud-devkit-test（main @ f695dc8 及后续同步）