# FINDINGS — 缺陷分析清单（OpenCode-glm-5.2）

> **交付路径**：`results/OpenCode/2026-10-24-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-24 05:30:00（北京时间）
> **清单是统一提单脚本解析输入**：`scripts/file_issue.py` 硬解析以下字段，**格式必须严格遵循**，否则自动提单会漏报/漏缺陷。

---

## #1【P1】EXP-E01 serviceCatalog 路由 MISS — "查云主机"未命中 ECS

- **现象**：执行 `node eval/harness/run-eval.mjs` 评测 serviceCatalog 路由层，输入中文意图「帮我查一下我账号在华北北京四有哪些云主机」，期望路由到 ECS 查询（run_readonly），实际返回 "Run hcloud --help to list available services"（未命中任何服务）。
- **断言**：输入「帮我查一下我账号在华北北京四有哪些云主机」→ serviceCatalog 应返回包含 `ECS` 的服务路由（ECS查询→run_readonly）；实际返回 `Run hcloud --help to list available services`（未命中）→ MISS/FAIL
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:serviceCatalog` — serviceCatalog 意图匹配器有"云服务器"关键词但缺少"云主机"同义词映射。其他包含"云服务器"的意图（EXP-E02）能正确命中 ECS，说明匹配器缺少"云主机"→ECS 同义词。
- **影响**：用户使用"云主机"而非"云服务器"描述 ECS 查询意图时，serviceCatalog 无法正确路由，返回通用帮助文本而非 ECS 服务。影响用户体验和路由准确率（基线 21.4% MISS）。
- **证据**：`evidence/EXP-E01/stdout.log`；评测结果 `eval/results/eval-run-20261023211118.csv`；汇总 HIT=13 MISS=1 N/A=1 准确率=92.9%
- **状态**：待提单
