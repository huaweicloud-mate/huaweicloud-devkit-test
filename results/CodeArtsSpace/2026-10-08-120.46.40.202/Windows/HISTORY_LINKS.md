# HISTORY_LINKS — 历史问题关联清单

> **本次测试**：CodeArtsSpace / Windows / 2026-10-08 / 1.1.8-next.1
> **FINDINGS**：8 条缺陷（P0×4 + P1×4）
> **查重结论**：全部命中历史 open issue，**不重复开单**，仅在既有单上补复核评论。

---

## 关联历史单

| 历史单号 | 标题 | 状态 | 匹配本次缺陷 |
|---|---|---|---|
| [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845) | [daily-test] safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失 (8 FAIL: P0x4 P1x4) | open | **全部 8 条**（D2-4, D2-11, D2-16, D4-2, D4-3, D4-4, D4-24, EXP-E01） |
| [#772](https://github.com/huaweicloud/huaweicloud-devkit/issues/772) | fix: #694 D2-4 redactSecrets 正则加 i 标志 + D8-4 files 追加 INSTALL.md | open | D2-4（小写 ak/sk 脱敏） |
| [#805](https://github.com/huaweicloud/huaweicloud-devkit/issues/805) | [每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + EXP-E01~E14 路由基线 | open | EXP-E01（serviceCatalog 路由） |
| [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705) | [serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足 | open | EXP-E01（路由覆盖） |

---

## 复核结论

本次 2026-10-08 测试在 huaweicloud-devkit@1.1.8-next.1 上复测，**8 条缺陷全部复现**（与 #845 完全一致）：

| # | 用例ID | 级别 | 缺陷 | 复现状态 |
|---|---|---|---|---|
| 1 | D2-4 | P0 | 凭证脱敏正则未覆盖小写 ak/sk | 仍 FAIL |
| 2 | D2-11 | P0 | STS get-token 未拦截 | 仍 FAIL |
| 3 | D4-2 | P0 | 凭证env打印拦截未覆盖非华为云前缀 | 仍 FAIL |
| 4 | D4-3 | P0 | 密钥服务操作未拦截 CLI 小写命令 | 仍 FAIL |
| 5 | D2-16 | P1 | configure import --file 未拦截 | 仍 FAIL |
| 6 | D4-4 | P1 | 通用凭证变量名 ACCESS_KEY/SECRET_KEY 未拦截 | 仍 FAIL |
| 7 | D4-24 | P1 | access_token 字段未被 redactSecrets 脱敏 | 仍 FAIL |
| 8 | EXP-E01 | P1 | serviceCatalog 中文意图"查云主机"未命中 ECS | 仍 FAIL |

> 已在 #845 补复核评论，确认 1..8-next.1 版本缺陷仍存在。
