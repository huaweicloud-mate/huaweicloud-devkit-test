# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-11-03-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-03 05:17:00（北京时间）

---

## #1【P1】EXP-E01 serviceCatalog 路由 MISS — 中文意图"查云主机"未命中 ECS

- **现象**：用户意图"帮我查一下我账号在华北北京四有哪些云主机"（中文自然语言，明确包含"云主机"=ECS），serviceCatalog 返回默认兜底 `["Run hcloud --help to list available services."]`，未命中 ECS 服务路由。复现命令：调用 `huaweicloud_service_catalog` MCP 工具，参数 `intent="帮我查一下我账号在华北北京四有哪些云主机"`
- **断言**：`serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机").recommendedServices` 应包含 `"ECS"`；实际返回 `["Run hcloud --help to list available services."]`，不包含 ECS
- **根因**：`plugins/huaweicloud-core/src/capability-discovery.mjs` 中 `serviceCatalog()` 的意图匹配逻辑未覆盖"云主机"这一中文 ECS 同义词。匹配规则可能仅匹配 "ECS"/"弹性云服务器"/"云服务器" 等关键词，缺少"云主机"别名
- **影响**：用户用"云主机"查询时无法被正确路由到 ECS 服务，导致工具发现失败、用户体验下降。评测基线 MISS 率 21.4%→6.7%（15 条中 1 条 MISS），该条为唯一 MISS
- **证据**：`evidence/EXP-E01/stdout.log` — `expectedServices: ["ECS"], actualServices: ["Run hcloud --help to list available services."], hit: false`
- **状态**：待提单
