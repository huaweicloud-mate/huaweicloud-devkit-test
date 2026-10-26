# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-10-27-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-27 05:20:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

## #1【P1】EXP-E01 serviceCatalog 路由未命中"云主机"意图

- **现象**：输入中文意图"帮我查一下我账号在华北北京四有哪些云主机"时，`huaweicloud_service_catalog` 返回 "Run hcloud --help to list available services."（未命中任何服务路由），期望命中 ECS。
- **断言**：`serviceCatalog("帮我查一下我账号在华北北京四有哪些云主机")` 应返回 `recommendedServices` 含 `ECS`，实际返回默认提示（空路由）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2193-2204` — ECS routeMap 的 keywords 数组缺少 "云主机" 这一常见中文同义词。当前仅包含 "弹性云服务器"、"云服务器"、"服务器"、"虚拟机"，但 "云主机" 是华为云控制台和用户习惯中的常用称呼（如 `NovaListServersDetails` 对应 "云主机" ），导致 `it.includes(kw)` 对所有 CJK 关键词均不命中。
- **影响**：用户用"云主机"提问时无法路由到 ECS 服务，得到无用的默认提示，影响用户体验和路由准确率（eval 基线 92.9%，此 MISS 拖低准确率）。
- **证据**：`evidence/EXP-E01/stdout.log`，eval harness `eval/results/eval-run-20261026211325.csv` 行 EXP-E01 MISS
- **状态**：待提单

## #2【非产品缺陷】EXP-E08 诊断意图需真实 LLM Agent 会话

- **现象**：输入"我的ECS启动失败了, 帮我分析原因"时，`serviceCatalog` 返回默认提示（未命中路由）。
- **说明**：该意图属于诊断/排障类，需要真实 LLM Agent 会话进行意图理解和 `explain_error` 调用，`serviceCatalog` 路由层是确定性调用、不依赖 LLM，此为预期行为（N/A），非产品缺陷。需 `run-agent-eval.mjs` 驱动真实 Agent 评测，非 DSH 客户端标 BLOCKED。
