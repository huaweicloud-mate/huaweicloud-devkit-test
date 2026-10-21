# FINDINGS — 缺陷发现清单（Hermes-glm-5.2）

> **落盘路径**：`results/Hermes/2026-10-22-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-22 05:30:00（北京时间）

## #1【P1】EXP-E01 serviceCatalog 路由未命中 ECS 查询意图

- **现象**：意图"帮我查一下我账号在华北北京四有哪些云主机"经 serviceCatalog 路由，未命中 ECS 服务，返回 "Run hcloud --help to list available services"
- **断言**：serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") 应返回 services 包含 "ECS"
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2023` serviceCatalog routeMap ECS keywords 列表缺少"云主机"（华为云 ECS 常见中文别称）。当前 keywords 含"弹性云服务器"、"云服务器"、"服务器"、"虚拟机"、"镜像"等，但不含"云主机"
- **影响**：用户用"云主机"描述 ECS 查询意图时，serviceCatalog 无法路由到 ECS 服务，给出无效的 hcloud --help 提示，用户体验下降
- **证据**：`evidence/EXP-E01/stdout.log`，eval/harness/run-eval.mjs 实测 MISS
- **状态**：待提单
