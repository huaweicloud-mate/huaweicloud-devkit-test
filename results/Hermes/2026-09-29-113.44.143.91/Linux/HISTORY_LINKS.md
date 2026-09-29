# 历史问题关联清单（不重复提单）

> **生成说明**：2026-09-29 每日测试（v1.1.7，gitHead `7456d05`）与上一轮 2026-09-28 完全一致、无代码变更，36+ 支探针全量重跑后 23 FAIL + 2 SPEC-MISMATCH 全部**按根因原样复现**，均命中上游仓已有 open issue，本轮**不新开单**。

## 缺陷 → 历史单映射（按根因语义去重）

| 用例ID | 级别 | 根因主题 | 关联历史单（open） |
|---|---|---|---|
| D9-12 | P0 | initialize 时序未强制 | #814 |
| D4-5 | P0 | Change* 写操作漏拦截 | #671（Change* 写操作漏拦截 + 提示注入绕过） |
| D4-16 | P0 | 命令包裹/子shell 穿透 | #797 / #758 / #677 |
| D4-27 / D2-4 | P1 | 小写 ak=/sk= 漏脱敏 | #770 / #683 / #676 |
| D1-70 | P1 | 代理 no_proxy 无 CIDR | #671 相关 |
| D3-S1 / D3-S5 / D3-S3 | P1/P2 | serviceCatalog 中文意图路由 miss / 沙箱 URL | #758 / #797 相关 |
| D4-25 / D4-26 / D8-9 | P2 | Python hook 遥测 / findings 脱敏 / sanitizeValue | #752 / #733 相关 |
| EXP-E01~E14 / D10-3 | P1 | 中文意图路由准确率 21.4% | #758 / #774 相关 |
| EXP-C4-14 / EXP-C4-18 / D3-C4 | P1 | DMS/DEW 服务创建类回归未支持 | 09-26 专项分析「无单号跟踪」待维护者裁决 |
| D1-68 | P2(SPEC) | HW_REGION 优先于 HUAWEICLOUD_REGION | 历史契约漂移（Hermes 多轮复现） |

> 本轮证据均落 `evidence/<case-id>/stdout.log`，根因详情见 FINDINGS.md 与测试报告 §四。