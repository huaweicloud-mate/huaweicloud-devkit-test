# 历史问题关联清单（不重复提单）

> 以下缺陷经查重命中上游仓已有开放 issue，本次**不新开单**，仅关联登记。

## D9-12 D9-12 initialize 握手前置状态机缺失（tools/list 未经 initialize 未返回 -32600）
- 今日证据：`evidence/D9-12/stdout.log`
- 今日根因：`plugins/huaweicloud-core/src/mcp-protocol.mjs:57`（`dispatch` 见 :30）`if (method === 'tools/list') return { tools: TOOL_DEFINITIONS };` 无「必须先 initialize」的会话状态检查，任意时序均放行。
- 关联历史单：[#774](https://github.com/huaweicloud/huaweicloud-devkit/issues/774) **[每日测试] Hermes Windows 2026-09-21: D9-4 MCP未强制initialize前置 + D9-9 取消能力未声明**

## D10-3 D10-3 / EXP-E01 评测集路由准确率 92.9%（1 条中文意图 MISS）
- 今日证据：`evidence/D10-3/stdout.log`、`evidence/EXP-E01/stdout.log`
- 今日根因：同 #2，`plugins/huaweicloud-core/src/tools.mjs:1966-2217` `serviceCatalog` routeMap 中文关键词覆盖不全（口语化/近义表述缺失），导致 1 条意图 MISS。
- 关联历史单：[#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705) **[serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足**

## D3-S5 D3-S5 serviceCatalog 复合中文意图仅命中单一服务
- 今日证据：`evidence/D3-S5/stdout.log`
- 今日根因：`plugins/huaweicloud-core/src/tools.mjs:1966-2217` `serviceCatalog` 为单关键词并集路由，无复合意图分层拆解逻辑。
- 关联历史单：[#788](https://github.com/huaweicloud/huaweicloud-devkit/issues/788) **[P2] D3-S5 复合意图分层路由未拆分命中（拆分自 #786）**
