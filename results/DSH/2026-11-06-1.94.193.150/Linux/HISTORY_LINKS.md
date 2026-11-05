# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经 `file_issue.py --dry-run` 查重命中上游仓已有历史 issue，本次**不新开单、不评论、不修改任何 issue**。
> 被测版本：v1.1.13（npm latest，gitHead `8a6d8be2`）；客户端 DSH / Linux；日期 2026-11-06。
> 结论：12 项缺陷（5 P0 / 4 P1 / 3 P2）在 latest `8a6d8be2` 上仍全部复现，均为历史遗留（next.5 `4ab34ed2` → latest `8a6d8be2` 未修复）。

| # | 缺陷 | 主关联历史单（open） |
|---|---|---|
| 1 | [P0] D4-16 sh -c 命令包裹穿透 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055) v1.1.13-next.0 每日测试缺陷合并单（12 项）；另见 #896/#866/#864/#844 等 |
| 2 | [P0] D4-3 KMS DecryptData 未拦截 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 #651/#677/#683 等 |
| 3 | [P0] D4-21 HCL broad IAM 未拦截 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 [#1066](https://github.com/huaweicloud/huaweicloud-devkit/issues/1066) v2.0.0 BLOCKED 补测（4 项）；#651/#652/#672/#673/#679/#752 |
| 4 | [P0] D2-4 凭证脱敏漏小写 ak=/sk= | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 [#1090](https://github.com/huaweicloud/huaweicloud-devkit/issues/1090)、#1065、#980、#683/#676/#694 等 |
| 5 | [P0] D9-12 MCP 非法时序未拒绝 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 #844、#814 |
| 6 | [P1] D4-17 命令替换 $(...) 未 fail-closed | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 #797/#689/#683/#679/#676/#674/#673/#651 |
| 7 | [P1] D3-S7 复合意图路由丢部署目标 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 [#979](https://github.com/huaweicloud/huaweicloud-devkit/issues/979) 子任务、#976 |
| 8 | [P1] D2-10 KooCLI 报错文案违规 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 #876 |
| 9 | [P1] EXP-E01 服务目录路由 MISS | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 [#1065](https://github.com/huaweicloud/huaweicloud-devkit/issues/1065)、#896/#844/#805/#705 等 |
| 10 | [P2] D8-9 telemetry 未脱敏凭证 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 [#980](https://github.com/huaweicloud/huaweicloud-devkit/issues/980) telemetry sanitizeValue 未脱敏（连续版本复现） |
| 11 | [P2] D3-C14 沙箱无凭证文案违规 | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 #1065、#883 |
| 12 | [P2] D1-68 region 优先级契约漂移（SPEC） | [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)；另见 #844、#765 |

> 证据均已落盘于 `results/DSH/2026-11-06-1.94.193.150/Linux/evidence/<case-id>/stdout.log`，供后续复核对照。