# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2）

> **落盘路径**：`results/WorkBuddy/2026-10-09-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-10-09 05:10:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

## #1【P1】EXP-E01 serviceCatalog 路由未命中"云主机"意图

- **现象**：`huaweicloud_service_catalog` 工具对意图"帮我查一下我账号在华北北京四有哪些云主机"返回 `recommendedServices: ["Run hcloud --help to list available services."]`（兜底），未路由到 ECS。
- **断言**：意图含"云主机"时，`recommendedServices` 应包含 `"ECS"`
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1978-1981` — `serviceCatalog()` 函数 ECS 路由的 keywords 列表含 `'弹性云服务器'`、`'云服务器'`、`'服务器'`，但缺少 `'云主机'`（华为云控制台及用户常用同义词）
- **影响**：用户使用"云主机"一词时无法正确路由到 ECS 服务，降级为兜底提示，影响路由准确率（当前 92.9%，本条 MISS 占比 7.1%）
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
