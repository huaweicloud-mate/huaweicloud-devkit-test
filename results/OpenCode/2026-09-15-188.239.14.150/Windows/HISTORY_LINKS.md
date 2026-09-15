# HISTORY_LINKS — 历史问题关联清单

> **生成时间**：2026-09-15 19:46:14（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.4（gitHead `9b67256`）
> **客户端**：OpenCode-glm-5.2 / Windows

---

## 历史关联（已有 open issue，不重复开单）

| # | 本轮用例 | 历史单号 | 历史标题 | 匹配依据 |
|---|---|---|---|---|
| 1 | D4-2 | [#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561) | [安全缺失][P1] 凭证环境env打印、明文secret拦截覆盖：echo /--adminPass=/--password= 均 allow NO-RULE | 用例号 D4-2 + 缺陷语义 echo $HW_ACCESS_KEY allow |
| 2 | D4-2 | [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677) | [test] Hermes Windows P0 缺陷回归 (v1.1.4-next.6): D1-39/D4-2/D4-3/D4-15/D4-16 | 用例号 D4-2 + 缺陷语义 echo env-dump |
| 3 | D4-16 | [#677](https://github.com/huaweicloud/huaweicloud-devkit/issues/677) | 同上 | 用例号 D4-16 + 缺陷语义 sh -c 命令包裹穿透 |

## 新发现（无历史匹配，需提单）

| # | 用例 | 级别 | 缺陷描述 |
|---|---|---|---|
| 3 | D2-4 | P0 | redactSecrets 不脱敏 JSON 中小写 ak/sk 字段 |
| 4 | D8-4 | P1 | INSTALL.md 未包含在 npm 发布包中 |

> D4-2/D4-16 在 1.1.4 正式版（9b67256）上复现，与 #561/#677 描述一致，已在既有单上补复核评论。
