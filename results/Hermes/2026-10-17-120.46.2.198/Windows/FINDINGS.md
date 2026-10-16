# FINDINGS — 2026-10-17 Hermes Windows 每日测试

## #1【P1】EXP-E01 serviceCatalog 路由 MISS — "查云主机"意图未命中 ECS

- **现象**: serviceCatalog 路由层对中文意图"帮我查一下我账号在华北北京四有哪些云主机"未命中 ECS 服务，实际返回 "Run hcloud --help to list available services." 而非 ECS 查询路由。
- **断言**: serviceCatalog(中文意图="帮我查一下我账号在华北北京四有哪些云主机") 应命中 ECS→run_readonly，实际未命中（返回 hcloud --help 提示）。
- **根因**: `plugins/huaweicloud-core/src/tools.mjs:1984` 中 serviceCatalog 的 ECS 路由关键词列表包含"弹性云服务器"/"云服务器"/"服务器"/"虚拟机"但未覆盖"云主机"这一 ECS 同义词。
- **影响**: 用户用"云主机"查询时，Agent 无法自动路由到 ECS 只读查询，需用户改用"云服务器"或"ECS"。
- **证据**: `evidence/EXP-E01/stdout.log` — eval harness 输出 `EXP-E01 | MISS | 期望=ECS | 实际=Run hcloud --help to list available services.`
