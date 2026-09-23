# HISTORY_LINKS — 历史问题关联清单

> **生成时间**：2026-09-23 15:33:57（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.6（gitHead `46152dd`）
> **客户端**：OpenCode-GLM-5.2 / Windows

---

## 历史关联（已有 open issue，不重复开单）

| # | 本轮用例 | 历史单号 | 历史标题 | 匹配依据 |
|---|---|---|---|---|
| 1 | D4-2 | [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561) | [安全缺失][P1] 凭证环境env打印、明文secret拦截覆盖 | 用例号 D4-2 + 缺陷语义 printenv/env echo allow |
| 2 | D4-2 | [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677) | [test] Hermes Windows P0 缺陷回归: D4-2/D4-16 | 用例号 D4-2 + 缺陷语义 echo env-dump |
| 3 | D4-2 | [#694](https://github.com/huaweicloud/huaweicloud-devkit/issues/694) | [测试报告] 1.1.4 每日测试缺陷合并单 | 用例号 D4-2 + 1.1.4 复现确认 |
| 4 | EXP-E01~E14 | [#689](https://github.com/huaweicloud/huaweicloud-devkit/issues/689) | [测试报告] v1.1.4 每日测试缺陷合并单（5项）#7 serviceCatalog 英文关键词 | 缺陷语义 serviceCatalog 路由 miss |

## 复现确认

- D4-2: 1.1.6 正式版上复现（`risk-rule-engine.mjs` 规则仅匹配文件路径，不匹配 env 变量打印）
- EXP-E: 1.1.6 正式版上复现（serviceCatalog 中文自然语言路由 11/15 MISS）
