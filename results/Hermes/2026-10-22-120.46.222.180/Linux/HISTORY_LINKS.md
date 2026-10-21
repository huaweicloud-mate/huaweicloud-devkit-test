# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。全部 15 项产品缺陷均为既有单（连续多版本复现，版本 v1.1.10 gitHead b0e9f026 与 2026-10-21 完全相同）；另 1 项 D3-C1 为 VPC router 配额非产品缺陷，不计入提单。

| # | 用例 | 级别 | 关联历史单（首要） | 其他相关单 |
|---|---|---|---|---|
| 1 | D2-4 凭证脱敏（小写 ak/sk） | P0 | [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845) safety-policy 覆盖不足 | #809 redactSecrets 脱敏不完整、#791 redact 重构 |
| 2 | D9-12 initialize 握手非法时序未拒绝 | P0 | [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844) Hermes Linux 6 项 | #814 |
| 3 | D4-4 写操作审批门 Change* 漏拦截 | P1 | [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845) | #864 |
| 4 | D3-C7 跨区错误码与契约不符 | P1 | [#977](https://github.com/huaweicloud/huaweicloud-devkit/issues/977) 1.1.10 缺陷合并单 | — |
| 5 | D3-S1 serviceCatalog「云主机」MISS | P1 | [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845) | #844 |
| 6 | D10-3 路由准确率 92.9%（1 MISS） | P1 | [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852) serviceCatalog 中文路由覆盖不足 | #705 |
| 7 | EXP-E01『云主机』路由 MISS | P1 | [#805](https://github.com/huaweicloud/huaweicloud-devkit/issues/805) EXP-E01~E14 路由基线 | #852 |
| 8 | D3-C3 sandbox deploy_nginx 假失败 | P1 | [#981](https://github.com/huaweicloud/huaweicloud-devkit/issues/981) 1.1.10 新回归 | #951 端口耗尽 |
| 9 | D3-S5 复合意图单向路由 | P2 | [#788](https://github.com/huaweicloud/huaweicloud-devkit/issues/788) D3-S5 复合意图分层路由 | #844 |
| 10 | D4-25 Python hook 写操作落 cli:invoke | P2 | [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844) | — |
| 11 | D4-26 findings 证据脱敏不完整 | P2 | [#809](https://github.com/huaweicloud/huaweicloud-devkit/issues/809) redactSecrets 脱敏不完整 | #980、#791 |
| 12 | D1-65 DEBUG 仅认字面量 'true' | P2 | [#994](https://github.com/huaweicloud/huaweicloud-devkit/issues/994) 1.1.10 合并单（第 3 项） | #844、#754 |
| 13 | D1-66 遥测开关/端点 env 不生效 | P2 | [#994](https://github.com/huaweicloud/huaweicloud-devkit/issues/994) 1.1.10 合并单（第 4 项） | 已补复核评论（精确根因 telemetry.mjs:176-180） |
| 14 | D8-9 sanitizeValue 未脱敏（SPEC） | P2 | [#980](https://github.com/huaweicloud/huaweicloud-devkit/issues/980) telemetry sanitizeValue 未脱敏 | #809、#791 |
| 15 | D1-68 region 优先级与契约相反（SPEC） | P2 | [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844) | #765 |

## 本次处理动作

- **D1-66**：机械查重因 #994 正文未写入「D1-66」用例号而漏匹配，已人工识别 #994（1.1.10 合并单第 4 项「遥测开关与端点环境变量」）为既有单，并追加复核评论（含精确根因 `telemetry/telemetry.mjs:176-180` + 今日证据），**未重复开单**。
- 其余 14 项经 file_issue.py 强关联命中既有 open issue，均不重复开单。

## 非产品缺陷（不计入提单）

- **D3-C1**（P1）：真云 ECS 生命周期 E2E 被 `VPC.0114 Quota exceeded for resources: ['router']` 阻断，属共享账号多机并发配额边缘耗尽，非产品代码缺陷。资源泄漏缺陷（昨日 #4）因配额未复现。解除条件=清理历史泄漏 VPC / 扩容 router 配额。