# HISTORY_LINKS — 历史缺陷关联清单

> 本次测试 8 项 FAIL 全部为历史缺陷，已在源码仓库 `huaweicloud/huaweicloud-devkit` 提单，不重复开单。

| # | 用例 | 历史单号 | 描述 |
|---|---|---|---|
| 1 | D2-4 | #772 #694 | 小写 ak=/sk= 凭证未被脱敏 |
| 2 | D2-11 | #689 | STS get-token 未被安全规则拦截 |
| 3 | D2-16 | #694 | configure import --file 未被拦截 |
| 4 | D4-2 | #677 | 非华为云前缀凭证 env 打印未拦截 |
| 5 | D4-3 | #677 | CSMS/KMS 密钥操作未拦截 |
| 6 | D4-4 | #757 | echo $ACCESS_KEY 通用凭证变量名未拦截 |
| 7 | D4-24 | #805 | access_token 字段未被脱敏 |
| 8 | EXP-E01 | #705 | "云主机"→ECS 未命中（serviceCatalog 路由 MISS） |

> 包版本 1.1.8-next.1 无变化，无新缺陷、无回归。建议持续跟踪上游修复进度。
