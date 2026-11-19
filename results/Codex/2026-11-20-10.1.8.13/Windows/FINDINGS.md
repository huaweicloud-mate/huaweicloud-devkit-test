# FINDINGS — 缺陷发现清单（Codex-GPT-5）

> 生成时间：2026-11-20 05:15:00（北京时间）

## #1【测试侧】D3-B1/EXP-C4-01~22 v1 MCP helper 与 v2 stdio 契约不兼容

- **现象**：批量执行器调用 v2 MCP 服务时未取得 tools/call 响应，服务矩阵统一回报 opsCount=0。
- **断言**：测试 helper 必须按 v2 stdio 帧完成 initialize、tools/list、tools/call 后才可判定产品结果。
- **根因**：`scripts/mcp_helper.mjs:9` 硬编码另一客户端的 v1 mcp-server.mjs 路径，且 `scripts/mcp_helper.mjs:13` 使用旧 Content-Length 帧；当前 SUT 为 v2 dist/mcp-server.js。
- **影响**：D1-41、D1-45、D3-B1、D3-C1、D3-C4、D4-18、D9-1/2/12/13、D10-3、EXP-C4-01~22、EXP-E01~15 的 FAIL 不具备产品归因条件。
- **证据**：`evidence/EXP-C4-01/stdout.log`

## #2【测试侧】D2-5/D8-7 v1 模块与技能数量断言未适配 v2

- **现象**：执行器查找已不存在的 auth/guidance.mjs，并将 v2 顶层 skills 目录数量直接与 v1 固定值比较。
- **断言**：测试断言必须改为 v2 的 auth/error-table.ts 与 pack 化技能清单契约。
- **根因**：`plugins/huaweicloud-core/src/auth/error-table.ts:4` 已成为 onboarding guidance 单一真源；`plugins/huaweicloud-core/src/tool-schemas.ts:149` 明确六个 meta-skills 不进入 pack 列表。
- **影响**：D2-5、D8-7 结果属于测试规格漂移，不能提产品 issue。
- **证据**：`evidence/D2-5/stdout.log`

## #3【测试侧】D4-15 URL 编码变体断言需按 v2 安全规范复核

- **现象**：三个绕过变体返回 deny、deny、allow；第三项为 URL 编码命令文本。
- **断言**：只有 v2 规范明确要求对 URL 编码的整条 shell 命令先解码，才能把第三项判为产品缺陷。
- **根因**：`plugins/huaweicloud-core/src/safety/classify-text.ts:743` 的 classifyTextCommand 处理 shell/ANSI-C 编码，当前用例未证明 URL 百分号编码属于受支持输入契约。
- **影响**：D4-15 暂记测试规格待裁决，不处理既有 issue。
- **证据**：`evidence/D4-15/stdout.log`