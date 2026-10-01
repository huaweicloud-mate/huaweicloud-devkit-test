# FINDINGS — 缺陷发现清单（Hermes-glm-5.2）

> **落盘路径**：`results/Hermes/2026-10-02-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-10-02 22:30:00（北京时间）

## #1【非产品缺陷】EXP-E01~E14 serviceCatalog 路由准确率低 (已知基线 21.4%)

- **现象**：`huaweicloud_service_catalog` 路由层对中文自然语言意图的服务识别准确率仅 21.4% (3/14 HIT, 11 MISS, 1 N/A)。大部分中文意图被路由到 "Run hcloud --help to list available services" 而非正确的服务名。
- **断言**：`node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs` 跑 eval-set-v1.csv 15 条评测集，HIT=3 MISS=11 N/A=1，准确率=21.4%
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` 中 `huaweicloud_service_catalog` 工具的路由逻辑对中文意图匹配覆盖不足，关键词字典/正则规则缺失或过于简单
- **影响**：11 条 EXP-E 用例 FAIL (EXP-E01, E02, E03, E04, E05, E07, E10, E11, E12, E13, E14)
- **证据**：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E15/stdout.log`，`eval/results/eval-run-20261001222044.csv`
- **说明**：此为已知基线问题 (21.4% MISS → 基线文档已记录)，非本次测试新发现缺陷，每次每日测试均会复现。serviceCatalog 路由层是确定性调用、无需真实 LLM Agent，已跑 harness 得真实路由结论。
