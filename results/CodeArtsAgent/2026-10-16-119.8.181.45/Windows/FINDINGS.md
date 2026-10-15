# FINDINGS - CodeArtsAgent Windows 每日测试

> **日期**: 2026-10-16
> **客户端**: CodeArtsAgent
> **OS**: Windows
> **版本**: 1.1.9-next.0

## 缺陷清单

### #1 [SPEC-MISMATCH] D9-12 initialize 握手协议 capabilities.cancellation 未声明

- **级别**: P0
- **用例**: D9-12 (initialize 握手协议安全基线)
- **描述**: MCP initialize 响应的 capabilities 中未声明 notifications.cancellation
- **期望**: initialize.result.capabilities.notifications.cancellation = true
- **实际**: initialize.result.capabilities = (缺失)
- **根因**: hdk/plugins/huaweicloud-core/src/mcp-server.mjs
- **证据**: evidence/D9-12/stdout.log

### #2 [FAIL] D9-12 JSON-RPC 无效参数错误码

- **级别**: P0
- **用例**: D9-12 (initialize 握手协议安全基线)
- **描述**: tools/list 传入非法参数类型时未返回 -32602 错误码
- **期望**: 返回 error.code = -32602
- **实际**: 无 error 对象
- **根因**: hdk/plugins/huaweicloud-core/src/mcp-server.mjs
- **证据**: evidence/D9-12/stdout.log

## 阻塞项

| 用例ID | 标题 | 阻塞原因 |
|---|---|---|
| D2-11 | R3 STS token拒绝落盘 | 需要真云STS token |
| D4-1 | 凭证文件读取拦截 | 需要hook-capable客户端 |
| D4-2 | 凭证env打印拦截 | 需要hook-capable客户端 |
| D4-5 | 写操作误判检测 | 需要hook-capable客户端 |
| D4-9 | 公开暴露/破坏性预检 | 需要hook-capable客户端 |
| D4-15 | hook绕过尝试 | 需要hook-capable客户端 |
| D4-16 | 命令包裹穿透 | 需要hook-capable客户端 |

## 执行统计

| 状态 | 数量 |
|---|---|
| PASS | 11 |
| FAIL | 0 |
| BLOCKED | 7 |
| SPEC-MISMATCH | 1 |
| NOT_RUN | 88 |
| **合计** | **107** |

## 通过率

- **通过率**: 100% (11/11)
- **P0 用例**: 6 PASS, 7 BLOCKED, 1 SPEC-MISMATCH

