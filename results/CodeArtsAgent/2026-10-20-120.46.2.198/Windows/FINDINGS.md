# FINDINGS — CodeArtsAgent-GLM-5.2 每日测试

> **测试日期**：2026-10-20
> **客户端**：CodeArtsAgent（GLM-5.2）
> **OS**：Windows
> **执行归档**：`results/CodeArtsAgent/2026-10-20-120.46.2.198/Windows/`
> **被测版本**：huaweicloud-devkit v1.1.9（gitHead 05a67b64）
> **FINDINGS 数量**：1

---

## F-001：EXP-E01 路由 MISS — 中文意图"查看ECS"未命中 ECS 服务

| 项 | 值 |
|---|---|
| 用例 ID | EXP-E01 |
| 优先级 | P1 |
| 类别 | 路由 / 意图识别 |
| 严重度 | Minor（功能可用，路由精度不足） |
| 现象 | eval harness 路由测试：中文意图"查看一下不信号在卡片写的有啥服务"（含关键词"ECS"）被 `serviceCatalog` 路由到通用 `Run hcloud --help`，而非 ECS 服务 |
| 期望 | `serviceCatalog(intent="查看ECS")` 应命中 ECS 服务，返回 ECS 相关操作建议 |
| 实际 | 路由 fallback 到通用 help，未识别"ECS"关键词 |
| 根因 | `serviceCatalog` 路由层对中文服务名简称（如"ECS"、"OBS"、"RDS"）的匹配逻辑不足，未将英文服务简称作为路由关键词 |
| 证据 | `evidence/EXP-E01/stdout.log`（eval harness 输出：MISS） |
| 影响范围 | 路由准确率 92.9%（13 HIT / 1 MISS / 1 N/A），仅此 1 条 MISS |
| 修复建议 | 在 `serviceCatalog` 路由规则中增加英文服务简称匹配（ECS→ecs, OBS→obs, RDS→rds, VPC→vpc 等），或在意图预处理阶段提取英文服务简称作为路由 hint |
| 关联源码 | `hdk/plugins/huaweicloud-core/src/tools.mjs`（serviceCatalog 工具实现） |
