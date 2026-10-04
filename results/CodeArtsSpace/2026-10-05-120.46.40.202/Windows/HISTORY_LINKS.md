# HISTORY_LINKS — 历史问题关联清单（CodeArtsSpace-GLM-5.2）

> **落盘路径**：`results/CodeArtsSpace/2026-10-05-120.46.40.202/Windows/HISTORY_LINKS.md`
> **生成时间**：2026-10-05 05:25:00（北京时间）
> **说明**：本次 FINDINGS.md 中 8 项缺陷全部命中历史 open issue，按 AGENTS.md「提单前必须历史查重」规则，不重复开单，仅生成本关联清单。

---

## 历史问题映射

| # | 用例 | 优先级 | 描述 | 历史单号 | 上游状态 | 上游标题 |
|---|---|---|---|---|---|---|
| 1 | D2-4 | P0 | 小写 ak=/sk= 凭证未被脱敏 | #772 #694 | open | fix: #694 D2-4 redactSecrets 正则加 i 标志 + D8-4 files 追加 INSTALL |
| 2 | D2-11 | P0 | STS get-token 未被安全规则拦截 | #689 | open | [测试报告] huaweicloud-devkit v1.1.4 每日测试缺陷合并单（5 项） |
| 3 | D2-16 | P1 | configure import --file 未被拦截 | #694 | open | [测试报告] huaweicloud-devkit 1.1.4 每日测试缺陷合并单（4 项，OpenCode-glm-5 |
| 4 | D4-2 | P0 | 非华为云前缀凭证 env 打印未拦截 | #677 | open | [test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D |
| 5 | D4-3 | P0 | CSMS/KMS 密钥操作未拦截 | #677 | open | [test] Hermes Windows P0 缺陷汇总 (v1.1.4-next.6, 2026-09-14): D |
| 6 | D4-4 | P1 | echo $ACCESS_KEY 通用凭证变量名未拦截 | #757 | open | fix: #752 remediate 9 defects (2xP0 + 4xP1 + 3xP2) across 6 |
| 7 | D4-24 | P1 | access_token 字段未被脱敏 | #805 | open | [每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + |
| 8 | EXP-E01 | P1 | serviceCatalog 路由 MISS：查云主机意图未命中 ECS | #705 | open | [serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足 |

---

## 结论

- 8 项 FINDINGS 全部命中历史 open issue，**不重复开单**。
- 包版本 `1.1.8-next.1` 无新缺陷、无回归。
- eval harness 基线提升：serviceCatalog 路由准确率从 21.4% 提升至 92.9%（D10-3 由 FAIL 转为 PASS）。
- 剩余 EXP-E01 MISS 为「查云主机」意图未命中 ECS 路由，关联历史单 #705。
