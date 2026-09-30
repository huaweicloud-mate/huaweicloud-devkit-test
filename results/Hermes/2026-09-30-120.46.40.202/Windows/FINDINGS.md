# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> 落盘路径：results/Hermes/2026-09-30-120.46.40.202/Windows/FINDINGS.md
> 生成时间：2026-09-30 11:35:00（北京时间）

## #1【P1】EXP-E01 serviceCatalog 路由 MISS — 「云主机」意图未命中 ECS

- **现象**：输入意图「帮我查一下我账号在华北北京四有哪些云主机」时，serviceCatalog 路由未命中 ECS，返回「Run hcloud --help to list available services.」
- **断言**：serviceCatalog 应将包含「云主机」的查询意图路由到 ECS 服务（期望=ECS，实际=hcloud --help）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由层对「云主机」自然语言同义词未映射到 ECS（关键词匹配缺失）
- **影响**：用户使用「云主机」而非「ECS」描述查询意图时，无法获得正确的服务路由，影响自然语言交互体验
- **证据**：`evidence/EXP-E01/stdout.log` — eval harness 输出 EXP-E01 | MISS | 期望=ECS | 实际=Run hcloud --help
- **状态**：待提单
