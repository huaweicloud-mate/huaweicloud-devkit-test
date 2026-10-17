# HISTORY_LINKS — 历史问题关联清单

本文件列出与本次测试 FINDINGS.md 中缺陷匹配的既有历史 issue，不再重复开单。

## #1 D4-2 凭证环境变量检测盲区

### 关联历史 issue

| 编号 | 标题 | 状态 |
|---|---|---|
| #845 | [daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4) | open |
| #850 | fix: #845 safety-policy detection coverage + serviceCatalog 云主机 routing | open |
| #858 | [daily-test] CodeArtsSpace Windows 2026-10-07: 8 缺陷 (4 P0 + 4 P1) huaweicloud-devkit@1.1.8-next.1 | open |

**说明**: D4-2 的 `env | grep HW_SECRET` 和 `echo %HW_ACCESS_KEY%` 绕过问题在 #845/#850 中已被记录，
本次测试复现确认仍未修复（safety-policy.mjs:399/418 正则未变）。

## #2 EXP-E 评测集 serviceCatalog 路由 MISS (21.4% 准确率)

### 关联历史 issue

| 编号 | 标题 | 状态 |
|---|---|---|
| #852 | [每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05 | open |
| #805 | [每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + EXP-E01~E14 路由基线 | open |
| #705 | [serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足 | open |
| #860 | fix: #857 JSON credential redaction + service catalog Chinese routing (2 P1) | open |

**说明**: serviceCatalog 中文意图路由 21.4% 准确率是已知基线问题，
在 #705/#805/#852 中多次记录，本次测试确认仍为 21.4%（3 HIT / 14 HIT+MISS）。
