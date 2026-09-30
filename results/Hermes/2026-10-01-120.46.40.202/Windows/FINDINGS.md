# FINDINGS — 缺陷发现清单（Hermes-GLM-5.2）

> **落盘路径**：`results/Hermes/2026-10-01-120.46.40.202/Windows/FINDINGS.md`
> **生成时间**：2026-10-01 21:58:00（北京时间）
> **本清单是统一提单脚本的解析输入**

## #1【P1】EXP-E01 serviceCatalog 中文意图"云主机"未路由到 ECS

- **现象**：`serviceCatalog(intent="帮我查一下我账号在华北北京四有哪些云主机")` 返回 `recommendedServices: ["Run hcloud --help to list available services."]`（MISS），期望命中 ECS 服务路由。
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机").recommendedServices` 必须包含 `"ECS"`。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs` `serviceCatalog()` 函数的 ECS routeMap keywords 列表缺少 `"云主机"` 关键词。当前关键词包含 `'弹性云服务器'`、`'云服务器'`、`'服务器'`、`'虚拟机'`，但不包含 `"云主机"`。`"云主机"` 是华为云文档和用户场景中指代 ECS 的常用中文术语（尤其"华北北京四有哪些云主机"这类查询意图）。CJK 关键词匹配逻辑使用 `it.includes(kw.toLowerCase())`，因此缺失关键词直接导致不匹配。
- **影响**：用户使用"云主机"术语描述 ECS 查询意图时，serviceCatalog 无法正确路由到 ECS 服务，导致 AI Agent 无法激活 `huawei-ecs` skill，用户需手动指定服务。影响所有客户端的路由准确率（基线 92.9%，此 MISS 占 1/14）。
- **证据**：`evidence/EXP-E01/stdout.log`（harness 实测结果：MISS，期望=ECS，实际="Run hcloud --help to list available services."）
- **状态**：历史问题（#705 已涵盖，#842 修复 PR 待合并），不重复开单。见 HISTORY_LINKS.md

## #2【非产品缺陷】EXP-E08 诊断意图路由为 N/A（设计预期）

- **现象**：`serviceCatalog(intent="我的ECS启动失败了 帮我分析原因")` 返回 `recommendedServices: ["Run hcloud --help to list available services."]`，标记为 N/A。
- **说明**：该意图属于诊断/troubleshooting 类，不应路由到特定服务，而应走 `huaweicloud_explain_error` 工具。serviceCatalog 的设计职责是服务路由，诊断意图不属于其路由范围。测试用例已标注 expected="(诊断)"，N/A 判定正确。不计入提单。
- **证据**：`evidence/EXP-E08/stdout.log`
