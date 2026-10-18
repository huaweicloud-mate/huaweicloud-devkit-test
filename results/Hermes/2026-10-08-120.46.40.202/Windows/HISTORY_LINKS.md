# HISTORY_LINKS — 历史问题关联清单

> 本清单记录本轮测试发现的缺陷与上游已 open issue 的关联关系。
> 根据 AGENTS.md 提单纪律：命中历史问题不重复开单，仅在既有单上补复核评论。

## 关联清单

| # | 用例ID | 级别 | 缺陷描述 | 历史单号 | 历史单标题 | 关联类型 |
|---|---|---|---|---|---|---|
| 1 | D4-2 | P0 | 凭证env打印拦截不完整(env\|grep HW_SECRET + echo %HW_ACCESS_KEY%) | #845 | [daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 | 历史复现 |
| 1 | D4-2 | P0 | 凭证env打印拦截不完整 | #844 | [测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（Hermes Linux） | 历史复现 |
| 1 | D4-2 | P0 | 凭证env打印拦截不完整 | #841 | [测试报告] CodeArtsSpace Windows 2026-10-01 每日测试缺陷合并单 | 历史复现 |
| 2 | D4-26 | P1 | findings证据脱敏大小写缺陷(redactString缺i flag) | #847 | fix: #844 修复 v1.1.8-next.1 每日测试 6 项缺陷（路由+脱敏+遥测+DEBUG+region） | 修复中(PR) |
| 2 | D4-26 | P1 | findings证据脱敏大小写缺陷 | #844 | [测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（Hermes Linux） | 历史复现 |

## 复核评论

已在 #845 和 #847 上补复核评论，标注 Hermes Windows 2026-10-08 仍复现。
