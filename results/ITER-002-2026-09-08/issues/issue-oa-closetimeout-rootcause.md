# OfficeAce 客户端 MCP 连接器连接失败——根因在 OfficeAce 框架侧（CLOSE_TIMEOUT）

> ✅ 已提交：https://github.com/huaweicloud/huaweicloud-devkit/issues/560（2026-09-08）

## 归属声明

> **本问题根因在 OfficeAce（华为云 AgentArts 桌面客户端）连接器框架侧，非 huaweicloud-devkit 插件缺陷**。提交至本仓库便于华为云侧排查联动；如需修复请流转 OfficeAce/AgentArts 产品团队。

## 现象

OfficeAce 5.5.x（Windows，CEF）中，huaweicloud-devkit 自定义连接器（stdio）**始终连接失败**：
- UI 连接器面板显示「已断开」，点连接后状态回到 `connection_failed`
- `status_message: 连接清理失败`
- 会话内 MCP 工具不可见 → agent 走技能 + 本地 CLI 回退链

## 决定性证据（三次 probe 日志完全一致）

`%LOCALAPPDATA%\Programs\OfficeAce\data\logs\api\api.YYYY-MM-DD.1.log`，12:26 / 12:46 / 15:42 三次：

```json
{
  "connectorId": "81f02f61-...",
  "connectorType": "custom",
  "transport": "stdio",
  "operation": "probe",
  "result": "failure",
  "durationMs": 1955,
  "errorCode": "CLOSE_TIMEOUT",
  "toolCount": 37,
  "probeTool": "huaweicloud_list_regions",
  "probeOutcome": "ok",
  "statusMessage": "连接清理失败"
}
```

关键字段解读：
- **`toolCount: 37`** —— MCP server 的 37 个工具全部注册成功
- **`probeOutcome: "ok"`** —— 探测工具 `huaweicloud_list_regions` 实际调用成功
- **`errorCode: "CLOSE_TIMEOUT"`** —— 失败发生在 probe **之后**的清理阶段：OfficeAce 连接器框架要求子进程关闭 stdin/stdout 以确认生命周期收敛，~2 秒等不到即判失败

## 为什么不是插件问题

1. **插件功能完全正常**：手动 spawn mcp-server.mjs（node v22.23.2 与 OfficeAce 内置 node v24.14.1 均验证），STDIO initialize 返回 `serverInfo: huaweicloud-devkit 1.1.1-next.15`；probe 工具调用 ok；37 工具全部注册
2. **符合 MCP stdio 协议**：MCP server 是 long-running 常驻进程，生命周期由 host 管理（host 关闭 stdin 或 kill）。「probe 后不自动退出」是符合规范的行为，OfficeAce 要求 probe 后子进程必须退出收敛的判定在 MCP 协议中没有依据
3. **跨客户端对照**：同一插件在 Hermes / DSH / WorkBuddy / CodeArtsSpace / OpenClaw / OpenCode 全部正常工作，仅 OfficeAce 失败——若是插件缺陷会普遍暴露

## 修复建议（OfficeAce/AgentArts 侧）

1. **probe 后清理不强制子进程退出**：长驻 MCP server 是合法形态，「探活成功（toolCount>0 且 probeTool 调用 ok）即认为连接可用」
2. 或在 probe 成功后由框架主动 `kill` 子进程完成收敛（而不是等待对方自行退出）

## 复现环境

- OfficeAce 1.0.9（Windows 10，CEF/Electron）
- huaweicloud-devkit 插件 1.1.1（`Programs\OfficeAce\.office-claw\huaweicloud-plugins`）
- 连接器配置：stdio / node / mcp-server.mjs，`timeout_ms: 60000`

## 测试侧说明

- 本机 OfficeAce 连接器记录创建于 09-08 22:06（曾安装后卸载残留，连接器手动重建），三次 probe 均 CLOSE_TIMEOUT
- 已归档于 huaweicloud-devkit-test 私有归档仓库（results/ITER-002-2026-09-08/manual/OfficeAce-CD P会话级自动化.md 连接失败根因诊断节）