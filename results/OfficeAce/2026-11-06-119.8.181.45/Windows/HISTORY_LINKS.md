# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。本轮 3 项 FAIL 均为历史问题连续复现（与 2026-11-05、2026-11-04 相同根因）。

## D2-4 凭证脱敏不完整：小写 ak=/sk= 明文泄漏
- 今日证据：`evidence/D2-4/stdout.log`（`akLeak=true skLeak=true`）
- 根因：`safety-policy.mjs:45` AK/SK 正则未加 `i` 忽略大小写
- **关联历史单**：
  - [#1065](https://github.com/huaweicloud/huaweicloud-devkit/issues/1065)（open）测试报告缺陷合并单
  - [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)（open）测试报告缺陷合并单
  - [#980](https://github.com/huaweicloud/huaweicloud-devkit/issues/980)（open）telemetry sanitizeValue AK/SK 未脱敏

## D4-3 KMS DecryptData 返回 allow（明文 secret API 未拦截）
- 今日证据：`evidence/D4-3/stdout.log`（`decision=allow`）
- 根因：`safety/policy.json` `blockedSecretOperations` 未含 `DecryptData`
- **关联历史单**：
  - [#1065](https://github.com/huaweicloud/huaweicloud-devkit/issues/1065)（open）测试报告缺陷合并单
  - [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)（open）测试报告缺陷合并单

## EXP-E01 serviceCatalog 中文「云主机」未命中 ECS
- 今日证据：`evidence/EXP-E01/stdout.log`（`verdict=MISS expect=[ECS]`）
- 根因：`tools.mjs:2287` ECS 路由关键词缺「云主机」
- **关联历史单**：
  - [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)（open）测试报告缺陷合并单