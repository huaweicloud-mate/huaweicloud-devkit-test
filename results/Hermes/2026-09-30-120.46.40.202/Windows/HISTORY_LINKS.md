# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## EXP-E01 serviceCatalog 路由 MISS — 「云主机」意图未命中 ECS

- 今日证据：`evidence/EXP-E01/stdout.log` — eval harness 输出 EXP-E01 | MISS | 期望=ECS | 实际=Run hcloud --help
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**[serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足**
    - 历史单内容：serviceCatalog 中文意图路由准确率基线仅 21.4%，EXP-E01「云主机」意图未命中 ECS 是已知缺陷。本次复核：准确率已从 21.4% 提升至 92.9%（13/14 HIT），EXP-E01 仍为唯一 MISS。
  - [#805](https://github.com/huaweicloud/huaweicloud-devkit/issues/805)（open）**[每日测试] Hermes-GLM-5.2 2026-09-23 测试发现：D4-23 SPEC-MISMATCH + EXP-E01~E14 路由基线**
    - 历史单内容：2026-09-23 Hermes 每日测试已报告 EXP-E01 路由 MISS，本次为持续复核。

## 复核结论

EXP-E01 serviceCatalog 路由 MISS 是已知缺陷（#705），本次复核确认：
- 路由准确率已从基线 21.4% 提升至 92.9%（13 HIT / 1 MISS / 1 N/A）
- EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」仍为唯一 MISS
- 建议在 serviceCatalog 中增加「云主机」→ ECS 的同义词映射
