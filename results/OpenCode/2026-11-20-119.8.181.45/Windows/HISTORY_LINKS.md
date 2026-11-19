# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经 `file_issue.py` 历史查重命中上游仓（`huaweicloud/huaweicloud-devkit`）已有 open issue，本次**不新开单**，仅作每日复核。
> 今日证据：`results/OpenCode/2026-11-20-119.8.181.45/Windows/evidence/<case-id>/stdout.log`

| 用例 | 级别 | 关联历史单（open） | 说明 |
|---|---|---|---|
| D1-39 | P0 | [#1063](https://github.com/huaweicloud/huaweicloud-devkit/issues/1063)、[#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677)、[#653](https://github.com/huaweicloud/huaweicloud-devkit/issues/653) | Windows 升级检测链 dist-tags 解析失败，今日 1.1.14 复现（distTags=null） |
| D4-19 | P0 | [#1133](https://github.com/huaweicloud/huaweicloud-devkit/issues/1133) | plan 未合并风险裁定，今日 safety_group findngs=[] 复现 |
| D2-10 | P1 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)、[#876](https://github.com/huaweicloud/huaweicloud-devkit/issues/876) | `--cli-profile default` 空格形式，KooCLI USE_ERROR 复现 |
| D4-8 | P1 | [#1065](https://github.com/huaweicloud/huaweicloud-devkit/issues/1065)、[#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689) | hook 双路径判定不一致（deny vs warn）复现 |
| D10-3 / EXP-E01 / EXP-E08 | P1 | [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)、[#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)、[#826](https://github.com/huaweicloud/huaweicloud-devkit/issues/826) | serviceCatalog 中文路由 13/15=86.7% < 90% |
| D9-9 | P1（SPEC-MISMATCH） | [#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774)、[#698](https://github.com/huaweicloud/huaweicloud-devkit/issues/698) | capabilities 未声明 cancellation |
| D1-68 | P2 | [#765](https://github.com/huaweicloud/huaweicloud-devkit/issues/765)、[#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) | HW_REGION 抢先于 HUAWEICLOUD_REGION |
| D8-9 | P2 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)、[#938](https://github.com/huaweicloud/huaweicloud-devkit/issues/938)、[#809](https://github.com/huaweicloud/huaweicloud-devkit/issues/809) | sanitizeValue 未做 pattern 级脱敏 |

## 非产品缺陷（不关联提单）
- D3-C7：只读凭证认证失败（APIGW.0301），错误码断言无法验证 → BLOCKED 环境阻塞。
- D10-4：规则库 9 deny + 10 warn 与用例契约 9+7 漂移 → 契约对齐，非功能缺陷。
- EXP-E01 / EXP-E08：并入 D10-3 跟踪。

## 结论
今日 9 条 FAIL + 2 条 SPEC-MISMATCH **全部命中历史单**，无新增产品缺陷，不新开合并缺陷单。