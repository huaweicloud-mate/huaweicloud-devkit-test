# FINDINGS — 缺陷发现清单（WorkBuddy-GLM-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-01-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-10-01 05:35:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

---

## #1【P1】EXP-E01 serviceCatalog 路由未识别"云主机"意图

- **现象**：`service_catalog({ intent: "帮我查一下我账号在华北北京四有哪些云主机" })` 返回 `recommendedServices: ["Run hcloud --help to list available services."]`，路由 MISS。eval harness 判定 MISS（期望 ECS，实际未命中）。
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应路由到 `ECS` 服务（recommendedServices 含 "ECS"）
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:serviceCatalog routeMap` — routeMap 使用"云服务器"关键词匹配 ECS，但"云主机"（华为云控制台/文档中对 ECS 的常用别名）未纳入路由关键词
- **影响**：用户使用"云主机"意图时无法路由到 ECS 服务，需手动指定服务名
- **证据**：`evidence/EXP-E01/stdout.log`（eval harness 结果：MISS, expected=ECS, actual=Run hcloud --help）
- **状态**：待提单
