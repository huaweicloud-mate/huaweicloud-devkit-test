# FINDINGS — 缺陷发现清单（OfficeAce-glm-5.2）

> **落盘路径**：`results/OfficeAce/2026-09-30-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-30 11:55:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.8-next.1
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式必须严格遵循。

## #1【P1】EXP-E01 serviceCatalog路由未命中ECS(查云主机)

- **现象**：输入「帮我查一下我账号在华北北京四有哪些云主机」，serviceCatalog 中文意图路由未命中 ECS 查询，实际返回 hcloud 帮助提示（`Run hcloud --help`），verdict=MISS。
- **断言**：serviceCatalog 应把该中文意图路由到 ECS查询→run_readonly（命中 ECS 服务）。
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs` serviceCatalog 路由层未匹配「云主机」关键词到 ECS（中文关键词覆盖不足，harness 基线 21.4% MISS）。
- **影响**：中文自然语言云资源查询意图无法正确路由，回退到 hcloud 帮助，无 E2E 触发能力。
- **证据**：`evidence/EXP-E01/stdout.log`
- **状态**：历史复现（关联 #705 / #828 / #826 等，见 HISTORY_LINKS.md），不重复提单

## #2【非产品缺陷】D3-S3 沙箱预览无法真跑(Sandbox需MCP上下文)

- **现象**：沙箱代码路径（skill + tools + session-manager + API module）全部存在，但无 MCP server 上下文时无法真跑 sandbox check-user/connect。
- **断言**：沙箱预览出 URL 需真实 MCP 上下文 + 有效 sandbox 服务配额，本机直调无法完成。
- **说明**：非产品缺陷，属环境/上下文阻塞，本轮如实记 BLOCKED，不计入提单。
- **证据**：`evidence/D3-S3/stdout.log`
- **状态**：BLOCKED（环境阻塞，不提单）