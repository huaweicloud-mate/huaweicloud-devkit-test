# HISTORY_LINKS — 历史问题关联清单

> **生成时间**：2026-09-22 05:40:00（北京时间）
> **说明**：以下缺陷已在上游仓 `huaweicloud/huaweicloud-devkit` 有历史 issue，本轮复核确认仍未修复（状态=open），不重复开单，仅在既有单上补复核评论。

## 关联清单

| # | 本轮用例ID | 缺陷摘要 | 历史单号 | 历史单标题 | 历史单状态 | 本轮复核结论 |
|---|---|---|---|---|---|---|
| 1 | D2-4 | JSON 字符串中短键名 ak/sk/token 未脱敏 | #694 | [测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（4 项，OpenCode-glm-5.2 Windows） | open | 1.1.6-next.0 仍复现，redactSecrets JSON 字符串路径短键名未脱敏 |
| 2 | D4-16 | sh -c "printenv HW_*" 命令包裹穿透 | #758 | [每日测试] Hermes Windows 2026-09-20: D4-16 命令包裹穿透 + ... | open | 1.1.6-next.0 仍复现，classifyTextCommand sh -c 包裹未拦截 |
| 3 | D4-27 | JSON 字符串短键名脱敏不完整 | #726 | [测试报告] huaweicloud-devkit v1.1.5 每日测试缺陷合并单（1 项，D4-27 裸 token 关键字未脱敏） | open | 1.1.6-next.0 仍复现，与 D2-4 同源（短键名未脱敏） |
| 4 | EXP-E01~E14 | serviceCatalog 中文意图路由 10/15 MISS | #705 | [serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT） | open | 1.1.6-next.0 仍复现，10/15 MISS（与基线一致） |

## 复核评论

已在以下历史 issue 上补复核评论：
- #694: D2-4 复核 — 1.1.6-next.0 仍复现
- #758: D4-16 复核 — 1.1.6-next.0 仍复现
- #726: D4-27 复核 — 1.1.6-next.0 仍复现
- #705: EXP-E 复核 — 1.1.6-next.0 仍复现，10/15 MISS
