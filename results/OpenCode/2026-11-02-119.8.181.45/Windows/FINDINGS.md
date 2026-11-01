# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **归档路径**：`results/OpenCode/2026-11-02-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-11-02 05:30:00（北京时间）
> **此清单统一提单脚本解析入口**：`scripts/file_issue.py` 硬解析以下字段，**格式必须严格遵循**，否则自动提单会失败/漏缺陷。

---

## #1【P1】【EXP-E01】serviceCatalog 路由未命中中文自然语言查询"查云主机"

- **描述**：用户输入"帮我查一下我账号在华北北京四有哪些云主机"，期望路由到 ECS 服务，实际返回 fallback "Run hcloud --help to list available services."
- **断言**：serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机") 的 recommendedServices 应包含 "ECS"，实际 recommendedServices 为空数组，返回 fallback
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2450` — recommendedServices 数组为空时返回 fallback。上游关键词匹配逻辑（serviceCatalog 函数 line 2195~2440）未将"云主机"识别为 ECS 关键词
- **影响**：中文自然语言查询中包含"云主机"但不含"ECS"/"服务器"等关键词时，路由失败，用户无法通过自然语言直达 ECS 操作
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：待提单
