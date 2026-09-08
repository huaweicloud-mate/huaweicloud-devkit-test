> ✅ 已提交独立 issue #565（2026-09-09）

## 现象（1.1.2-next.4 基线实测）

MCP stdio server（`plugins/huaweicloud-core/src/mcp-server.mjs`）收到**畸形 JSON 帧后进程崩溃退出**（exit code 1），无容错：

```python
# 实测（stdio 直接喂坏帧）
stdin: {this is not json\n      ← 单条非法 JSON
→ 进程 poll = 1，已退出（exit code 1）
→ 后续任何合法请求都无法处理（server 死了）
```

- 基线：**1.1.2-next.4（608b120）**
- 代码定位：`mcp-server.mjs` L131 `if (line) void handleMessage(JSON.parse(line));` —— **`JSON.parse` 未包 try/catch**，SyntaxError 直接上抛事件循环 → 进程崩溃
- 对照：正常 initialize / tools/list / tools/call（check_cli）均正常；6 种 clientInfo（Anthropic/OpenCode/hermes/WorkBuddy/officeace/other）互通正常——**仅畸形帧场景崩溃**

## 根因

- stdio 单行解析无异常防护：任何一行非法 JSON（半帧/截断/双写/编码损坏）均可 kill 整个 server
- 无 stderr 留痕（崩溃即无错误日志）——排障困难

## 影响（中）

- **DoS/稳定性**：任一同伴向 stdio 管道写一段坏数据即终止会话；长连接客户端偶发坏帧（网络/编码/半包）时服务不可恢复（宿主需断线重连）
- 协议健壮性：MCP 规范要求对 Parse error 返回 `-32700` 并续服务，当前实现直接退出

## 修复建议

1. `JSON.parse` 包 try/catch：坏帧写 stderr 告警（含行号/摘要）+ **继续服务**；或对可识别框架返回 JSON-RPC error `-32700 Parse error`
2. 补充畸形帧单测：坏 JSON 后可正常处理后续请求（回归断言）
3. （可选）stdout 写 `-32700` 错误响应，客户端可感知而非静默丢失

## 同族关联

- #560（OfficeAce CLOSE_TIMEOUT 为宿主侧清理判定）——本报告是**插件自身 stdio 解析健壮性**（完全不同层）