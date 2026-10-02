# HISTORY_LINKS — 历史缺陷关联清单

> **本次测试**：CodeArtsSpace Windows 2026-10-03（1.1.8-next.1）
> **查重结果**：19 项 FAIL 全部为历史缺陷，已在上游 issue 跟踪，不重复开单。

## 关联清单

| # | 用例 | 级别 | 描述 | 历史单号 | 状态 |
|---|---|---|---|---|---|
| 1 | D2-4 | P0 | 凭证脱敏大小写缺陷 (redactString regex 仅匹配大写) | #772 #694 | 历史问题 |
| 2 | D2-11 | P0 | STS token 获取未拦截 (sts get-token 判 allow) | #689 | 历史问题 |
| 3 | D4-2 | P0 | HW_ env-dump 未完全拦截 (env\|grep HW_ r3=allow) | #677 | 历史问题 |
| 4 | D4-3 | P0 | 明文 secret API 读取未拦截 (csms/kms 5 条全 allow) | #677 | 历史问题 |
| 5 | D2-16 | P1 | configure import --file 未拦截 (判 unknown_read allow) | #694 | 历史问题 |
| 6 | D4-4 | P1 | echo creds 未拦截 (echo $AK/$SK 判 allow) | #757 | 历史问题 |
| 7 | D4-24 | P1 | access_token 未脱敏 (access_token=accxxx 明文) | #805 | 历史问题 |
| 8 | D10-3 | P1 | serviceCatalog 路由准确率 21.4% (3 HIT/14 MISS) | #705 | 历史问题 |
| 9 | EXP-E01 | P1 | serviceCatalog 中文意图"云主机"路由未命中 | #705 | 历史问题 |
| 10 | EXP-E02 | P1 | serviceCatalog "创建云服务器"路由未命中 | #705 | 历史问题 |
| 11 | EXP-E03 | P1 | serviceCatalog "部署静态网站"路由未命中 | #705 | 历史问题 |
| 12 | EXP-E04 | P1 | serviceCatalog "绑定EIP"路由未命中 | #705 | 历史问题 |
| 13 | EXP-E05 | P1 | serviceCatalog "MySQL状态"路由未命中 | #705 | 历史问题 |
| 14 | EXP-E07 | P1 | serviceCatalog "备份策略"路由未命中 | #705 | 历史问题 |
| 15 | EXP-E10 | P1 | serviceCatalog "函数处理"路由未命中 | #705 | 历史问题 |
| 16 | EXP-E11 | P1 | serviceCatalog "费用查询"路由未命中 | #705 | 历史问题 |
| 17 | EXP-E12 | P1 | serviceCatalog "云监控告警"路由未命中 | #705 | 历史问题 |
| 18 | EXP-E13 | P1 | serviceCatalog "HTTPS证书"路由未命中 | #705 | 历史问题 |
| 19 | EXP-E14 | P1 | serviceCatalog "权限审计"路由未命中 | #705 | 历史问题 |

## 合并单

- **#841** [测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）
  - 2026-10-01 首次提交 8 项缺陷合并单
  - 2026-10-02 复核全部仍复现，已在 #841 补复核评论
  - 2026-10-03（本次）复核全部仍复现，将在 #841 补复核评论

## 结论

全部 19 项 FAIL 均为历史缺陷，包版本 1.1.8-next.1 无变化，无新缺陷、无回归。其中 8 项设计级 FAIL 与 2026-10-02 完全一致，11 项展开级 FAIL（EXP-E serviceCatalog 路由 MISS）为同一根因 #705 的展开用例。
