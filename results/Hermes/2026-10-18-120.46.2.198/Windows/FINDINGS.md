# FINDINGS

## #1【P1】serviceCatalog 中文意图路由准确率低 (21.4% MISS)

- **现象**: D10-3 路由评测集 15 条中文意图中，11 条未命中期望服务。serviceCatalog 对中文自然语言意图的匹配覆盖不足，大量意图返回通用兜底消息 "Run hcloud --help to list available services." 而非具体服务名。
- **断言**: serviceCatalog(中文意图) 应命中期望服务 (harness 实测基线 21.4% MISS，未命中即判 FAIL)
- **根因**: plugins/huaweicloud-core/src/tools.mjs 中 huaweicloud_service_catalog 工具的 serviceCatalog 路由逻辑对中文意图的关键词匹配/语义理解覆盖不足
- **影响**: 11 条 FAIL 用例 (EXP-E01~E05/E07/E10~E14)，涉及 ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM 共 10 个服务的中文意图路由
- **证据**: 
  - eval/harness/run-eval.mjs 实测结果: HIT=3, MISS=11, N/A=1, 准确率=21.4%
  - 证据目录: evidence/EXP-E01/ ~ evidence/EXP-E15/
  - 评测结果CSV: eval/results/eval-run-20261018054000.csv
