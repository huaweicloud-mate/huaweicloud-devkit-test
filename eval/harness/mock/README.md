# eval/harness/mock — Issue #16 Track A mock 层

测试 mock 层，为夹具提供可独立启停的桩服务，消除对真实基础设施的依赖。

## 清单

| mock | 文件 | 用途 | 依赖 |
|---|---|---|---|
| hwlink WebSocket mock | `hwlink-ws-mock.mjs` | 模拟 hwlink WebSocket 隧道端点（connect/auth/heartbeat/disconnect/reconnect 全生命周期），纯 Node.js `http`+`crypto` 实现 | 无外部 npm 包 |
| MCP 客户端桩 | `mcp-client-stub.mjs` | 模拟 MCP JSON-RPC 2.0 over stdio 客户端（initialize/tools/list/call/resources/ping），支持多实例并发 | 无外部 npm 包 |
| sandbox 凭证 mock | `sandbox-cred-mock.mjs` | 模拟 HDKit 服务参数响应（mock fetch 拦截 + 凭证注入 + 端点覆盖 + HOME 隔离） | 无外部 npm 包 |

## 用法

```javascript
// hwlink WebSocket mock
import { HwlinkMockServer } from '../mock/hwlink-ws-mock.mjs';
const srv = new HwlinkMockServer();
await srv.start();
// srv.url → ws://127.0.0.1:PORT
await srv.close();

// MCP 客户端桩
import { McpClientStub } from '../mock/mcp-client-stub.mjs';
const client = new McpClientStub({ name: 'Hermes', version: '1.0' });
await client.connect(serverPath);
await client.initialize();
await client.disconnect();

// sandbox 凭证 mock
import { SandboxCredMock } from '../mock/sandbox-cred-mock.mjs';
const mock = new SandboxCredMock();
mock.install();   // 覆盖 globalThis.fetch + 注入凭证 + 设置端点
mock.uninstall(); // 恢复
```

## 设计原则

1. **零外部依赖**：所有 mock 层使用纯 Node.js 标准库（`http`/`crypto`/`child_process`/`fs`），不依赖 `ws` 等 npm 包
2. **独立启停**：每个 mock 提供 `start()`/`close()` 或 `install()`/`uninstall()` 接口，可独立启动/关闭
3. **环境隔离**：sandbox 凭证 mock 隔离 HOME + 清空凭证 env，卸载后恢复原始环境
4. **请求日志**：所有 mock 记录收发帧/请求日志，供夹具断言使用
