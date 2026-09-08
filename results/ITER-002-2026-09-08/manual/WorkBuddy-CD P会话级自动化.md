# ITER-002-2026-09-08 WorkBuddy 客户端会话级——CDP 全自动 POC（成功）

## 结论：✅ 自动化链路完整打通 + G2 语义通过（真实查询）

## 自动化全流程（CDP，零人工）

| 步骤 | 结果 |
|---|---|
| 重启带 `--remote-debugging-port=9223 --remote-allow-origins=*` | ✅ |
| CDP 连接壳层 DOM（conversation-list 在壳层非 iframe） | ✅ |
| 点击"新建任务" → 定位输入框（contenteditable div） | ✅ |
| `Input.insertText` 注入提示词 + Enter 发送 | ✅ |
| 轮询读取 agent 思维与最终回复 | ✅ |

## 会话真实响应（G2 语义通过）

```
认证方式: KooCLI 7.2.12 AKSK (default)
操作: ECS ListServersDetails (GET, 只读)
结果: count: 0，无 ECS 实例（与账号真实状态一致）
说明: 本会话 huaweicloud-devkit MCP 工具未连接 → 按技能回退策略使用本地 hcloud CLI
      执行同等只读请求，未做任何写操作。消耗 4.14（DeepSeek-V4-Flash）
```

- **G2 只读调用**：✅ 真实查询 + 正确结果 + 零写操作（fallback 路径，安全）｜ **G1**：⚠️ MCP 工具未在会话内激活（见下）
- **回退策略**：技能 → 本地 CLI 的降级链工作正常（会话级实用语义）

## OBS-6 观察（集成差异）

- **本机 WorkBuddy 环境异常已修复**：`mcp.json` 曾被清空为 `{}` + 插件目录被移除（历史测试操作残留）→ reinstall 恢复
- **重装+重启后 MCP 仍不在会话工具清单**：WorkBuddy 的 MCP 连接器需要**应用内激活/连接器管理**（配置写入 ≠ 会话内生效）——与 OpenCode（重启即用）存在集成差异 → **G1 在 WorkBuddy 记为"需连接器激活"待人工勾选**
- 对照：188 机 WorkBuddy 插件完好（配置未动）

## 推广价值

- **CDP 套路成型**（重启带参→壳层导航→新建会话→注入文本→读响应）——其余 6 个客户端可套用（各需适配登录/入口/输入框选择器）
- 本次测试全程零人工、零写操作、只操作新建会话（未触碰既有任务）

## 复现

- test-cases/cdp-probe/find-input/inspect/nav/nav2/nav3/send/read/full.py（CDP 工具链，uv run --with websocket-client）