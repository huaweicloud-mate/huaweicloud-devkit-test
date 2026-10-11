# HISTORY_LINKS — 历史问题关联清单

> 生成时间: 2026-10-12
> 客户端: Hermes (glm-5.2) / Windows
> 被测版本: 1.1.7

## 历史问题关联

| 缺陷 | 历史单号 | 标题 | 状态 | 关联说明 |
|---|---|---|---|---|
| FINDING-001: serviceCatalog 中文意图路由大面积未命中 | [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852) | [每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05 | open | 强关联：相同问题（serviceCatalog 中文路由 21.4% HIT）、相同客户端（Hermes Windows）、相同根因（tools.mjs routeMap 缺少中文关键词）。已在 #852 追加复核评论（comment id=6114242433）。不重复开单。 |

## 复核评论

已向 #852 追加复核评论，确认该问题在 v1.1.7 (stable) 版本仍存在：
- eval harness 准确率仍为 21.4% (3 HIT / 11 MISS / 1 N/A)
- 根因不变: `tools.mjs:1815` routeMap 中文关键词缺失
- 影响用例: 13 FAIL (D3-S1, D10-3, EXP-E01~E14)
