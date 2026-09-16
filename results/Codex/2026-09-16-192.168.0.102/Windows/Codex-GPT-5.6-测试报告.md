# Codex-GPT-5.6 每日测试报告

> 生成时间：2026-09-16 09:25:00（北京时间）
> 执行归档：`results/Codex/2026-09-16-192.168.0.102/Windows/`
> 被测版本：huaweicloud-devkit 1.1.5，源码 commit `e7ed6f6`
> 结论：PARTIAL

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent | Codex |
| OS / 架构 | Windows / x64 |
| Node / npm / Python | Node v22.23.2 / npm 10.9.8 / Python 3.11.15 |
| 工具全集 | 40，schema 完整 |
| hcloud / 依赖 | hcloud 7.2.12；源码依赖已安装 |
| 真云凭证 | cn-north-4；未执行写入型真云操作 |
| 测试类型 | 源码探针、CLI、MCP 协议、源码单并发套件 |

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例 | 117 |
| 已执行 | 13 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN | 10 / 1 / 106 / 0 / 0 |
| 通过率 | 90.9%（不含 BLOCKED） |
| P0 缺陷 | 1 |
| 资源释放 | 未创建真云资源；临时探针目录已清理 |

## 三、状态汇总

| 层级 | PASS | FAIL | BLOCKED | SPEC-MISMATCH | NOT_RUN | 合计 |
|---|---:|---:|---:|---:|---:|---:|
| 设计级 | 10 | 1 | 67 | 0 | 0 | 78 |
| 展开级 | 0 | 0 | 39 | 0 | 0 | 39 |

已执行证据包括 D1 版本语义/冷却/原子写探针、MCP `initialize`/`tools/list`、doctor/status 和源码单并发测试，分别位于 `evidence/D1-27/`、`evidence/D9-1/`、`evidence/D1-3/`、`evidence/source-suite/`。

## 四、缺陷清单

详见同目录 `FINDINGS.md`。本轮发现 1 个 P0：Windows `queryDistTagsSync()` 真实调用返回 `null`，未得到 dist-tags，检测链不可判定为可用。

## 五、未执行用例与原因

其余 BLOCKED 用例均已在对应 CSV 的 `blockedReason` 逐条标注。主要分类为【补环境】：当前会话缺少 hook-capable 客户端、真实 Agent harness、审批交互、跨客户端矩阵或可安全执行的真云写入闭环。展开级 D5/C4/E 用例还需要对应客户端或评测环境，不能用源码 MCP 进程替代。

## 六、安全与红线合规

- 凭证泄漏事件：0
- 真云写操作：0
- 未修改 `test-cases/`、`Summary/` 或其他客户端目录
- PASS 用例均有今日证据路径

## 七、资源释放

未创建 ECS、OBS、VPC、沙箱等真云资源；临时 fixture 在探针结束时删除。

## 八、遗留与建议

- P0 D1-39：修复或核验 Windows npm.cmd 调用链后复测。
- 补齐 hook/审批/真实 Agent harness 和隔离真云测试环境后，继续执行 BLOCKED 的 P0/P1。
