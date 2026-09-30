# HISTORY_LINKS — 历史问题关联清单

> 本文件记录本轮测试发现的缺陷与上游仓库已有 issue 的关联关系。
> 根据 AGENTS.md 提单规则，命中历史问题不重复开单，仅在既有单上补复核评论。

## 关联清单

| # | 本轮用例 | 缺陷描述 | 历史单号 | 历史标题 | 历史状态 | 关联说明 |
|---|---|---|---|---|---|---|
| 1 | EXP-E01 | serviceCatalog 中文意图"云主机"未路由到 ECS | #705 | [serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足 | open | 根因相同：ECS routeMap keywords 缺少"云主机"，#705 已涵盖此问题 |
| 1 | EXP-E01 | (同上) | #842 | fix: #705 add '云主机' alias to ECS routeMap keywords | open | 修复 PR：已在 ECS routeMap 添加"云主机"关键词，待合并 |

## 结论

本轮 EXP-E01 发现的 serviceCatalog "云主机" 路由 MISS 属于历史已知问题（#705），且已有修复 PR（#842）待合并。
根据提单规则，不重复开单。本轮测试结果与历史结论一致，确认缺陷仍存在（PR #842 尚未合并到 1.1.8-next.1）。
