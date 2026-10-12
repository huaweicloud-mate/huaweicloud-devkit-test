# HISTORY_LINKS — 历史问题关联清单

> 生成时间: 2026-10-13
> 客户端: Hermes (glm-5.2) / Windows
> 被测版本: 1.1.8

## 历史问题关联

| 缺陷 | 历史单号 | 标题 | 状态 | 关联说明 |
|---|---|---|---|---|
| FINDING-001: serviceCatalog 中文意图"云主机"路由未命中 | [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852) | [每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05 | open | 强关联：相同问题（serviceCatalog 中文路由未命中）、相同客户端（Hermes Windows）、相同根因（tools.mjs routeMap 缺少中文关键词）。v1.1.8 已大幅改善（21.4%→92.9%），仅剩"云主机"一词未命中。已在 #852 追加复核评论（comment id=6132880285）。不重复开单。 |

## 复核评论

已向 #852 追加复核评论，确认该问题在 v1.1.8 (stable) 版本大幅改善但仍存在（仅"云主机"未命中）：
- eval harness 准确率从 21.4% (v1.1.7) 提升到 92.9% (v1.1.8)
- 仅 EXP-E01 ("云主机"→ECS) MISS，其余 13 条全部 HIT
- 根因: `tools.mjs` routeMap ECS keywords 缺少"云主机"
- #850 修复 PR 已提及"云主机 routing"，合并后应可解决
- 影响用例: D3-S1(FAIL), EXP-E01(FAIL)
