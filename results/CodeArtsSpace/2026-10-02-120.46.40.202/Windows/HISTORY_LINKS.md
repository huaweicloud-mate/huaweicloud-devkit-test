# HISTORY_LINKS — 历史缺陷关联清单

> **本次测试**：CodeArtsSpace Windows 2026-10-02（1.1.8-next.1）
> **查重结果**：8 项 FAIL 全部为历史缺陷，已在上游 issue 跟踪，不重复开单。

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
| 8 | EXP-E01 | P1 | serviceCatalog 中文意图路由 MISS (云主机→ECS 未命中) | #705 | 历史问题 |

## 合并单

- **#841** [测试报告] huaweicloud-devkit 1.1.8-next.1 每日测试缺陷合并单（8 项历史，CodeArtsSpace Windows 2026-10-01）
  - 昨日（2026-10-01）相同 8 项缺陷合并单，本次（2026-10-02）复核全部仍复现，已在 #841 补复核评论。

## 结论

全部 8 项 FAIL 均为历史缺陷，包版本 1.1.8-next.1 无变化，无新缺陷、无回归。通过率 94.3% 与 2026-10-01 持平。
