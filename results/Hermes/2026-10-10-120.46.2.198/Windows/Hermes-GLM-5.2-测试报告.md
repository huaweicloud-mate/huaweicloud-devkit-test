# Hermes 每日测试报告 — huaweicloud-devkit-test

- 测试日期: 2026-10-10
- 客户端: Hermes (Agent)
- 模型: GLM-5.2
- OS: Windows
- 插件版本: huaweicloud-devkit v1.1.7 (hdk commit 7456d05)
- KooCLI 版本: 7.2.12
- Node.js: v22.23.1
- 测试仓库: ~/devkit-test/testbot5-win-hermes/huaweicloud-devkit-test
- 源码仓库: ~/devkit-test/testbot5-win-hermes/hdk

---

## 一、测试概述

每日测试执行，覆盖 P0→P1→P2 全量用例（设计级 102 + 展开级 43 = 145 条），证据落盘 `evidence/<case-id>/`，回填执行状态后跑双门禁验证通过。

---

## 二、执行摘要

| 指标 | 数值 |
|------|------|
| 总用例数 | 145 |
| PASS | 132 |
| FAIL | 13 |
| BLOCKED | 0 |
| NOT_RUN | 0 |
| 通过率 | 91.0% |
| 证据覆盖 | 145/145 (100%) |

---

## 三、状态汇总

### 设计级 (102 条)

| 优先级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN |
|--------|------|------|------|---------|---------|
| P0 | 21 | 20 | 1 | 0 | 0 |
| P1 | 51 | 51 | 0 | 0 | 0 |
| P2 | 30 | 30 | 0 | 0 | 0 |

### 展开级 (43 条)

| 优先级 | 总数 | PASS | FAIL | BLOCKED | NOT_RUN |
|--------|------|------|------|---------|---------|
| P0 | 1 | 0 | 1 | 0 | 0 |
| P1 | 42 | 41 | 11 | 0 | 0 |

> 展开级 P1 的 11 条 FAIL 均为 EXP-E01~E15 中 serviceCatalog 路由未命中（21.4% MISS 基线）。

---

## 四、缺陷清单

### 缺陷 1: Windows spawnSync('npm.cmd') EINVAL — 升级检测链静默失败 (P0)

- **关联用例**: D1-39, EXP-NR3-09
- **级别**: P0
- **现象**: Windows 下 `spawnSync('npm.cmd', [...])` 不加 `shell:true` 时返回 `error.code === 'EINVAL'`，导致升级检测链静默失败。加 `shell:true` 后正常工作。
- **唯一断言**: `spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'])` 返回 `error.code === 'EINVAL'`（无 shell:true）；加 `shell:true` 后 `status === 0` 且返回有效 JSON `{"latest":"1.1.7","next":"1.1.8-next.2"}`。
- **根因**: `plugins/huaweicloud-core/src/update-check.mjs` — `queryDistTagsSync` 调用 `spawnSync('npm.cmd')` 时未传 `shell: true`。Windows 上 `npm.cmd` 是批处理文件，Node.js 无法直接 spawn 批处理文件。
- **证据**: `evidence/D1-39/stdout.log`, `evidence/EXP-NR3-09/stdout.log`

### 缺陷 2: serviceCatalog 中文意图路由未命中 (P1)

- **关联用例**: EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **级别**: P1
- **现象**: `serviceCatalog(intent)` 对 11/15 条中文意图返回通用帮助消息（`Run hcloud --help to list available services.`）或错误服务，路由准确率仅 21.4%（HIT=3, MISS=11, N/A=1）。
- **唯一断言**: `serviceCatalog('帮我查一下我账号在华北北京四有哪些云主机')` 返回 `recommendedServices` 不含 `ECS`；期望应包含。
- **根因**: `plugins/huaweicloud-core/src/tools.mjs:1815` — `serviceCatalog` 函数对中文意图的关键词匹配覆盖不足，多数意图未命中服务关键词。
- **证据**: `evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log` (eval harness 全量结果)
- **基线**: 此为已知基线（21.4% 准确率），通过 `node eval/harness/run-eval.mjs` 复现确认。

---

## 五、未执行用例与原因

无未执行用例。所有 145 条用例均已执行并回填。

---

## 六、安全/红线审计

- 写操作被误判 read-only 的实例: 无
- 凭证泄露事件: 无
- 红线违规 (I 类): 无
- PASS 门禁: 通过（所有 PASS 用例均有 evidencePath 且证据存在）
- 覆盖率门禁: 通过（P0 无 NOT_RUN/空，NOT_RUN+空占比 0.0%）

---

## 七、资源释放

- 创建: 无（本次测试为源码级探针+eval harness，未创建云端资源）
- 删除: 无需删除
- 验证: 无需验证

---

## 八、遗留建议

1. **D1-39 EINVAL 修复**: 在 `queryDistTagsSync` 的 `spawnSync` 调用中添加 `shell: true` 参数，与已有 `queryDistTags`（async 版本）保持一致。
2. **serviceCatalog 路由优化**: 扩展中文关键词匹配字典，增加常用云服务别名（如"云主机"→ECS、"弹性公网IP"→EIP、"云数据库"→RDS 等），提升路由准确率。
3. **eval harness 基线跟踪**: 持续跟踪 serviceCatalog 路由准确率变化，目标从 21.4% 提升至 ≥90%。

---

## 逐步指引来源记录

| 步骤 | 来源 | 细节 |
|------|------|------|
| 仓库地址/专属目录 | P (AGENTS.md) | 测试仓库 GitHub + 源码仓库 GitCode 镜像 |
| 自我识别 | P (AGENTS.md) | 客户端=Hermes, OS=Windows |
| 建包 (init_day) | P (脚本) | `python scripts/init_day.py Hermes Windows` |
| P0 安全分类 | P (skill probe patterns) | 源码级探针: classifyHcloudArgs/evaluateCommandRisk/classifyTextCommand |
| P0 版本检测 | P (skill probe patterns) | 源码级探针: judgeUpdate/spawnSync EINVAL |
| P0 协议安全 | P (skill probe patterns) | 源码级探针: _decorateResult/审批令牌单次性 |
| P1 D1 安装 | P (skill probe patterns) | judgeUpdate 四态/dismiss 冷却/缓存行为 |
| P1 D2 认证 | P (skill probe patterns) | auth credentials/reconcile/service 模块加载验证 |
| P1 D3 功能 | P (skill probe patterns) | tool definitions/serviceCatalog/planHcloudCommand |
| P1 D4 安全 | P (skill probe patterns) | 审批门/脱敏/风险规则/hook 三工具 |
| P1 D5-D10 | P (skill probe patterns) | 工具枚举/协议层/eval harness |
| EXP-C4 服务矩阵 | P (skill probe patterns) | 22 服务 list_operations+plan 只读冒烟 |
| EXP-E 评测集 | P (eval harness) | `node eval/harness/run-eval.mjs` 路由准确率基线 |
| 回填 | P (脚本) | `python scripts/backfill_daily.py Hermes Windows --write` |
| 门禁 | P (脚本) | verify_no_fake_pass.py + verify_coverage.py 双门禁通过 |
| 报告 | G (agent 生成) | 基于回填 CSV + 证据汇总 |
