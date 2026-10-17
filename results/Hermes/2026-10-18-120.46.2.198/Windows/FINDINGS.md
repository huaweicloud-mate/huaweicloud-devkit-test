# FINDINGS

## FINDING-1: serviceCatalog 中文意图路由准确率低 (21.4% MISS)

- **级别**: P1
- **用例**: EXP-E01, EXP-E02, EXP-E03, EXP-E04, EXP-E05, EXP-E07, EXP-E10, EXP-E11, EXP-E12, EXP-E13, EXP-E14
- **描述**: D10-3 路由评测集 15 条中文意图中，11 条未命中期望服务。serviceCatalog 对中文自然语言意图的匹配覆盖不足，大量意图返回通用兜底消息 "Run hcloud --help to list available services." 而非具体服务名。
- **断言**: serviceCatalog(中文意图) 应命中期望服务 (harness 实测基线 21.4% MISS，未命中即判 FAIL)
- **根因**: `plugins/huaweicloud-core/src/tools.mjs` 中 `huaweicloud_service_catalog` 工具的 serviceCatalog 路由逻辑对中文意图的关键词匹配/语义理解覆盖不足
- **证据**: 
  - eval/harness/run-eval.mjs 实测结果: HIT=3, MISS=11, N/A=1, 准确率=21.4%
  - 证据目录: evidence/EXP-E01/ ~ evidence/EXP-E15/
  - 评测结果CSV: eval/results/eval-run-20261018054000.csv
